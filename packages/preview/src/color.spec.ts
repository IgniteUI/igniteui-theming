import { describe, expect, it } from "vitest";
import { composite, contrast, hex, parse } from "./color.js";

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
});

describe("composite", () => {
  it("flattens a translucent color onto its background", () => {
    expect(composite([255, 255, 255, 0.03], [26, 26, 36, 1])).toEqual([
      33, 33, 43,
    ]);
  });

  it("leaves an opaque color alone", () => {
    expect(composite([12, 34, 56, 1], [255, 255, 255, 1])).toEqual([
      12, 34, 56,
    ]);
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

describe("hex", () => {
  it("pads single-digit channels", () => {
    expect(hex([0, 9, 255])).toBe("#0009ff");
  });
});
