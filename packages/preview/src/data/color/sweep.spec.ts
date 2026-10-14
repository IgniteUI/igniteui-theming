/**
 * The claims the color section makes, asserted rather than displayed. A scoreboard on a
 * page only catches a regression when somebody opens the page.
 */
import { describe, expect, it } from "vitest";
import { AA, contrast, PAIR_DISTANCE } from "../../color.js";
import { clampedCount, rampRgb } from "../../ramp.js";
import { resolve } from "../cache.js";
import { sweepData } from "./sweep.js";

// The real cache, for the same reason as `scales.spec.ts`.
const data = await resolve(sweepData);

describe("the fitted generator, across every seed in the sweep", () => {
  it("covers the whole hue circle at more than one saturation", () => {
    expect(data.rows.length).toBeGreaterThan(1);
    expect(data.totals.seeds).toBe(data.rows.length * (360 / data.hueStep));
  });

  it("clears AA for every pair five shades apart", () => {
    expect(data.totals.fittedFails).toBe(0);
    expect(data.totals.fittedClean).toBe(data.totals.seeds);
  });

  it("never asks for a color outside sRGB", () => {
    expect(data.totals.fittedOog).toBe(0);
  });

  it("never resolves two shades to the same color", () => {
    expect(data.totals.fittedDup).toBe(0);
  });

  it("holds at every saturation, not only the vivid one", () => {
    for (const row of data.rows) {
      for (const ramp of row.fitted) {
        expect(clampedCount(ramp)).toBe(0);
        const rgb = rampRgb(ramp);
        for (let i = 0; i + PAIR_DISTANCE < rgb.length; i++) {
          expect(
            contrast(rgb[i], rgb[i + PAIR_DISTANCE]),
          ).toBeGreaterThanOrEqual(AA);
        }
      }
    }
  });
});

describe("the legacy generator, for comparison", () => {
  it("fails AA pairs at every seed in the grid", () => {
    expect(data.totals.legacyClean).toBe(0);
    expect(data.totals.legacyFails).toBeGreaterThan(data.totals.pairs * 0.9);
  });

  it("emits shades outside sRGB, but only at high saturation", () => {
    expect(data.totals.legacyOog).toBeGreaterThan(0);

    const bySaturation = data.rows.map((row) => ({
      saturation: row.saturation,
      oog: row.legacy.reduce((sum, ramp) => sum + clampedCount(ramp), 0),
    }));
    const worst = bySaturation.reduce((a, b) => (a.oog > b.oog ? a : b));

    // The out-of-gamut problem belongs to saturated seeds. Reporting it as a property of
    // every legacy ramp would overstate it, which is why the grid has a saturation axis.
    expect(worst.saturation).toBe(Math.max(...data.saturations));
    expect(bySaturation.filter((r) => r.oog === 0).length).toBeGreaterThan(0);
  });

  it("records where a clamped shade asked to be", () => {
    const withAsk = data.rows
      .flatMap((row) => row.legacy)
      .filter((ramp) => ramp.mask !== 0);
    expect(withAsk.length).toBeGreaterThan(0);
    for (const ramp of withAsk) {
      expect(ramp.ask.length).toBe(clampedCount(ramp) * 3);
    }
  });
});

describe("the grid's own limits", () => {
  it("does not claim to cover extreme lightness", () => {
    // Every seed sits at 50% lightness, so near-white and near-black seeds — where
    // duplicate shades come from — are the comparison demo's job, not the sweep's.
    expect(data.totals.legacyDup).toBe(0);
  });
});
