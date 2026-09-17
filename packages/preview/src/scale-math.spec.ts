import { describe, expect, it } from "vitest";
import {
  ease,
  IDENTITY_CURVE,
  lookup,
  rampFromTable,
  SCALE_PRESETS,
  type ScaleTable,
  sameScale,
  targets,
} from "./scale-math.js";

describe("ease", () => {
  it("is the identity without a curve, and with the identity curve", () => {
    for (const x of [0, 0.25, 0.5, 0.75, 1]) {
      expect(ease(x, null)).toBe(x);
      expect(ease(x, IDENTITY_CURVE)).toBeCloseTo(x, 6);
    }
  });

  it("pins both ends whatever the curve", () => {
    for (const { curve } of SCALE_PRESETS) {
      expect(ease(0, curve)).toBeCloseTo(0, 6);
      expect(ease(1, curve)).toBeCloseTo(1, 6);
    }
  });

  it("bunches the light end under the material curve", () => {
    const material = SCALE_PRESETS.find((p) => p.name === "material")?.curve;
    // A slow start: the first third of the positions covers well under a third of the range.
    expect(ease(1 / 3, material ?? null)).toBeLessThan(0.15);
  });
});

describe("targets", () => {
  it("runs from the low end of the range to the high end", () => {
    const [first, ...rest] = targets({ range: [1.2, 18], curve: null });
    expect(first).toBeCloseTo(1.2, 6);
    expect(rest.at(-1)).toBeCloseTo(18, 6);
    expect(rest).toHaveLength(9);
  });

  it("spaces a straight line geometrically", () => {
    const t = targets({ range: [1, 16], curve: null });
    const ratios = t.slice(1).map((v, i) => v / t[i]);
    for (const r of ratios) expect(r).toBeCloseTo(ratios[0], 6);
  });
});

describe("lookup", () => {
  // Three samples per row, each a distinct hex, so the index chosen is visible.
  const table: ScaleTable = {
    samples: 3,
    span: [1, 4],
    rows: ["aaaaaabbbbbbcccccc", "111111222222333333"],
  };

  it("picks the sample nearest the requested contrast", () => {
    expect(lookup(table, 0, 1)).toBe("aaaaaa");
    expect(lookup(table, 0, 2)).toBe("bbbbbb");
    expect(lookup(table, 0, 4)).toBe("cccccc");
    expect(lookup(table, 1, 2.1)).toBe("222222");
  });

  it("clamps a request outside the span to the nearest end", () => {
    expect(lookup(table, 0, 0.5)).toBe("aaaaaa");
    expect(lookup(table, 0, 40)).toBe("cccccc");
  });

  it("reads one hex per shade position", () => {
    expect(
      rampFromTable(
        { ...table, rows: Array(10).fill(table.rows[0]) },
        {
          range: [1, 4],
          curve: null,
        },
      ),
    ).toHaveLength(10);
  });
});

describe("sameScale", () => {
  it("compares the range and the curve by value", () => {
    const [even, material] = SCALE_PRESETS;
    expect(sameScale(even, { range: [1.182, 18.232], curve: null })).toBe(true);
    expect(
      sameScale(material, {
        ...material,
        curve: [...(material.curve ?? [0, 0, 0, 0])],
      }),
    ).toBe(true);
    expect(sameScale(even, material)).toBe(false);
  });
});
