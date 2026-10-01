import { describe, expect, it } from "vitest";
import { fitScale } from "../../utils/scale-fit.js";

/** Pure sRGB relative luminance, so the fitter can be tested without a Sass round-trip. */
const luminance = (hex: string): number => {
  const c = [1, 3, 5].map(
    (i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const f = (v: number) =>
    v < 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};

const TAILWIND_SLATE = [
  "#f8fafc",
  "#f1f5f9",
  "#e2e8f0",
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
  "#0f172a",
];

const CARBON_GRAY = [
  "#f4f4f4",
  "#e0e0e0",
  "#c6c6c6",
  "#a8a8a8",
  "#8d8d8d",
  "#6f6f6f",
  "#525252",
  "#393939",
  "#262626",
  "#161616",
];

describe("fitScale", () => {
  it("recovers the range from the ladder's endpoints", () => {
    const fitted = fitScale(TAILWIND_SLATE.map(luminance));

    // The committed `tailwind` preset is range 1.04 17.76, fitted from this same ladder.
    expect(fitted.range[0]).toBeCloseTo(1.04, 1);
    expect(fitted.range[1]).toBeCloseTo(17.8, 0);
  });

  it("reproduces the committed presets it was fitted from", () => {
    for (const ladder of [TAILWIND_SLATE, CARBON_GRAY]) {
      const fitted = fitScale(ladder.map(luminance));

      expect(fitted.curve).not.toBeNull();
      // Every rung the fit predicts should land on the ladder it came from.
      for (const rung of fitted.rungs) {
        expect(Math.abs(rung.fitted - rung.actual) / rung.actual).toBeLessThan(
          0.05,
        );
      }
      expect(fitted.rms).toBeLessThan(0.02);
    }
  });

  it("returns a null curve for a ladder that is already evenly spread", () => {
    // Geometric steps in contrast are exactly what "even" means.
    const contrasts = Array.from(
      { length: 10 },
      (_, i) => 1.1 * (18 / 1.1) ** (i / 9),
    );
    const luminances = contrasts.map((c) => 1.05 / c - 0.05);

    expect(fitScale(luminances).curve).toBeNull();
  });

  it("rejects a ladder that does not run lightest to darkest", () => {
    expect(() =>
      fitScale([...TAILWIND_SLATE].reverse().map(luminance)),
    ).toThrow(/lightest to darkest/);
  });

  it("rejects a ladder too short to fit a curve", () => {
    expect(() => fitScale([0.9, 0.1])).toThrow(/at least 3 rungs/);
  });
});
