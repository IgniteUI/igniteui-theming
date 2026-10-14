import { describe, expect, it } from "vitest";
import {
  composite,
  contrast,
  displayable,
  failingPairs,
  gamutCusp,
  hex,
  inSrgb,
  maxChroma,
  oklchToLinear,
  parse,
  parseRaw,
  type Rgb,
  readableOn,
  rgbToOklch,
  shadePairs,
  toRgb,
} from "./color.js";

describe("parse", () => {
  it("reads the literals Sass emits", () => {
    expect(parse("#0099ff")).toEqual([0, 153, 255, 1]);
    expect(parse("#fff")).toEqual([255, 255, 255, 1]);
    expect(parse("rgb(226, 237, 251)")).toEqual([226, 237, 251, 1]);
    expect(parse("rgba(255, 255, 255, 0.03)")).toEqual([255, 255, 255, 0.03]);
    expect(parse("hsl(0, 0%, 98%)")).toEqual([250, 250, 250, 1]);
  });

  it("clips out-of-range saturation at the channel, not at the input", () => {
    // The legacy generator emits calc(s * 1.26) against a fully saturated seed. A browser
    // computes with s = 126% and clips the resulting channels; clamping s to 100% first
    // would yield rgb(0, 136, 227) and overstate the contrast.
    expect(parse("hsl(204, 126%, 44.5%)")).toEqual([0, 142, 255, 1]);
  });

  it("resolves lightness above 100% to white, the way color(srgb 1.78 ...) paints", () => {
    expect(parse("hsl(0, 0%, 174%)")).toEqual([255, 255, 255, 1]);
  });

  it("rejects anything it cannot resolve", () => {
    expect(() => parse("var(--ig-primary-500)")).toThrow(/unsupported/);
  });

  it("drops alpha for callers that only measure", () => {
    expect(toRgb("rgba(1, 2, 3, 0.5)")).toEqual([1, 2, 3]);
  });
});

describe("parseRaw", () => {
  it("keeps a request the display cannot satisfy", () => {
    // The legacy generator asks for this when it multiplies a near-white seed.
    const [r, g, b] = parseRaw("hsl(0, 0%, 174%)");
    expect(r).toBeGreaterThan(255);
    expect(g).toBeGreaterThan(255);
    expect(b).toBeGreaterThan(255);
    expect(displayable([r, g, b])).toBe(false);
  });

  it("agrees with parse when the color is reachable", () => {
    expect(parseRaw("rgb(226, 237, 251)")).toEqual(parse("rgb(226, 237, 251)"));
  });
});

describe("composite", () => {
  it("flattens a translucent color onto its background", () => {
    expect(composite([255, 255, 255, 0.03], [26, 26, 36])).toEqual([
      33, 33, 43,
    ]);
  });

  it("leaves an opaque color alone", () => {
    expect(composite([12, 34, 56, 1], [255, 255, 255])).toEqual([12, 34, 56]);
  });
});

describe("contrast", () => {
  it("matches the WCAG reference ratios", () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrast([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5);
    expect(contrast([0, 153, 255], [255, 255, 255])).toBeCloseTo(3.0, 2);
  });

  it("is symmetric", () => {
    expect(contrast([12, 34, 56], [200, 210, 220])).toBeCloseTo(
      contrast([200, 210, 220], [12, 34, 56]),
      10,
    );
  });
});

describe("shade pairs", () => {
  const gray = (v: number): Rgb => [v, v, v];
  /** White to black in ten even steps: every pair five apart clears AA comfortably. */
  const wide = Array.from({ length: 10 }, (_, i) =>
    gray(Math.round(255 - (i * 255) / 9)),
  );
  /** Ten grays between 200 and 100: nothing five apart reaches 4.5:1. */
  const narrow = Array.from({ length: 10 }, (_, i) =>
    gray(Math.round(200 - (i * 100) / 9)),
  );

  it("pairs each shade with the one five steps darker", () => {
    expect(shadePairs(wide).map((p) => [p.i, p.j])).toEqual([
      [0, 5],
      [1, 6],
      [2, 7],
      [3, 8],
      [4, 9],
    ]);
  });

  it("counts the pairs under AA", () => {
    expect(failingPairs(wide)).toBe(0);
    expect(failingPairs(narrow)).toBe(5);
    // Five whites over three blacks and two light grays: only the last two pairs fail.
    const mixed = [
      ...Array(5).fill(gray(255)),
      ...Array(3).fill(gray(0)),
      gray(200),
      gray(200),
    ];
    expect(failingPairs(mixed)).toBe(2);
  });
});

describe("readableOn", () => {
  it("picks the ink that contrasts more with the color itself", () => {
    expect(readableOn([255, 255, 255])).toBe("#111");
    expect(readableOn([0, 0, 0])).toBe("#fff");
    expect(readableOn([0, 153, 255])).toBe("#111");
  });
});

describe("hex", () => {
  it("pads single-digit channels", () => {
    expect(hex([0, 9, 255])).toBe("#0009ff");
  });
});

describe("OKLCH", () => {
  it("round-trips a mid-tone", () => {
    const [L, C, h] = rgbToOklch([9, 109, 183]);
    const linear = oklchToLinear(L, C, h);
    const back = linear.map((v) =>
      Math.round(
        255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055),
      ),
    );
    expect(back).toEqual([9, 109, 183]);
  });

  it("reports black and white as achromatic", () => {
    expect(rgbToOklch([0, 0, 0])[1]).toBeCloseTo(0, 6);
    expect(rgbToOklch([255, 255, 255])[1]).toBeCloseTo(0, 6);
    expect(rgbToOklch([255, 255, 255])[0]).toBeCloseTo(1, 3);
  });

  it("places sRGB blue near its documented position", () => {
    const [L, C] = rgbToOklch([0, 0, 255]);
    expect(L).toBeCloseTo(0.452, 2);
    expect(C).toBeCloseTo(0.313, 2);
  });
});

describe("maxChroma", () => {
  it("collapses to near zero at white", () => {
    expect(maxChroma(1, 250)).toBeLessThan(0.005);
  });

  it("stays inside the gamut and is maximal there", () => {
    const hue = 250;
    const L = 0.6;
    const c = maxChroma(L, hue);
    expect(c).toBeGreaterThan(0.1);
    expect(inSrgb(oklchToLinear(L, c, hue))).toBe(true);
    expect(inSrgb(oklchToLinear(L, c + 0.01, hue))).toBe(false);
  });

  it("does not bulge at the dark end", () => {
    // A tolerance applied to linear channels rather than encoded ones admits chroma
    // around 0.12 at near-black, which would widen the bottom of the gamut solid.
    expect(maxChroma(0.001, 250)).toBeLessThan(0.06);
  });
});

describe("the gamut cusp across hue", () => {
  const peaks = Array.from({ length: 72 }, (_, i) => gamutCusp(i * 5));
  const span = (values: number[]) => Math.max(...values) / Math.min(...values);

  it("varies more than twofold in chroma, which is why one multiplier table cannot serve every hue", () => {
    expect(span(peaks.map((p) => p.C))).toBeGreaterThan(2);
  });

  it("varies about twofold in lightness", () => {
    expect(span(peaks.map((p) => p.L))).toBeGreaterThan(1.9);
  });

  it("never peaks at an extreme of the lightness axis", () => {
    for (const peak of peaks) {
      expect(peak.L).toBeGreaterThan(0.3);
      expect(peak.L).toBeLessThan(0.99);
    }
  });
});
