import { describe, expect, it } from "vitest";
import type { SweepRamp } from "./data/color/sweep.js";
import {
  clampedCount,
  duplicateCount,
  findings,
  isClamped,
  shadeHex,
} from "./ramp.js";

/** Ten grays from white to black, packed the way the provider packs them. */
const grays = Array.from({ length: 10 }, (_, i) => {
  const v = Math.round(255 - (i * 255) / 9)
    .toString(16)
    .padStart(2, "0");
  return `${v}${v}${v}`;
});

const ramp = (extra: Partial<SweepRamp> = {}): SweepRamp => ({
  hex: grays.join(""),
  mask: 0,
  ask: [],
  ...extra,
});

describe("reading a packed ramp", () => {
  it("addresses shades by index", () => {
    expect(shadeHex(ramp(), 0)).toBe("#ffffff");
    expect(shadeHex(ramp(), 9)).toBe("#000000");
  });

  it("reads the clamped bits", () => {
    const clamped = ramp({ mask: 0b1000000001 });
    expect(isClamped(clamped, 0)).toBe(true);
    expect(isClamped(clamped, 1)).toBe(false);
    expect(isClamped(clamped, 9)).toBe(true);
    expect(clampedCount(clamped)).toBe(2);
  });

  it("counts shades that resolve to the same color", () => {
    const twins = ramp({
      hex: `ffffff${grays.slice(1).join("")}`.replace(
        /^ffffff.{6}/,
        "ffffffffffff",
      ),
    });
    expect(duplicateCount(twins)).toBe(1);
  });
});

describe("findings", () => {
  it("leads with the AA record", () => {
    expect(findings(ramp())[0]).toEqual({
      text: "all 5 AA pairs pass",
      ok: true,
    });

    // Ten grays between 200 and 100: nothing five apart reaches 4.5:1.
    const narrow = Array.from({ length: 10 }, (_, i) => {
      const v = Math.round(200 - (i * 100) / 9)
        .toString(16)
        .padStart(2, "0");
      return `${v}${v}${v}`;
    });
    expect(findings(ramp({ hex: narrow.join("") }))[0]).toEqual({
      text: "5 of 5 AA pairs fail",
      ok: false,
    });
  });

  it("reports a clean ramp as clean", () => {
    // Black-and-white alternation: every pair five apart is 21:1.
    const stark = ramp({
      hex: Array.from({ length: 10 }, (_, i) =>
        i < 5 ? "ffffff" : "000000",
      ).join(""),
    });
    // Five identical whites are duplicates, so only the AA line and the duplicate line show.
    expect(findings(stark).map((f) => f.text)).toEqual([
      "all 5 AA pairs pass",
      "8 duplicates",
    ]);
  });

  it("names clamping and duplicates when there are any, and sRGB when there are none", () => {
    expect(findings(ramp()).map((f) => f.text)).toContain("all 10 inside sRGB");
    expect(findings(ramp({ mask: 0b11 })).map((f) => f.text)).toContain(
      "2 shades clamped",
    );
  });
});
