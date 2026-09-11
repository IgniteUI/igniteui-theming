/** Color math shared by the build. Pure functions over sRGB tuples. */

export type Rgb = [number, number, number];
export type Rgba = [number, number, number, number];

const clamp = (v: number) => Math.min(255, Math.max(0, v));

const alpha = (value: string | undefined) =>
  value === undefined ? 1 : Number(value);

/**
 * CSS Color 4 hsl-to-rgb. Saturation and lightness are used as given, including the
 * out-of-range values the legacy generator produces (`calc(s * 1.26)`), so the channels
 * can land outside sRGB and get clipped exactly where a browser clips them.
 */
const hslToRgb = (h: number, s: number, l: number): Rgb => {
  const k = (n: number) => (((n + h / 30) % 12) + 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));

  return [f(0), f(8), f(4)].map((v) => Math.round(clamp(v * 255))) as Rgb;
};

/** Resolves a Sass-emitted color literal to clipped sRGB. */
export const parse = (value: string): Rgba => {
  const hsl = value.match(
    /^hsla?\(\s*([-\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%\s*(?:[,/]\s*([\d.]+))?/,
  );

  if (hsl) {
    const [h, s, l] = hsl.slice(1, 4).map(Number);
    return [...hslToRgb(h, s / 100, l / 100), alpha(hsl[4])];
  }

  const rgb = value.match(
    /^rgba?\(\s*([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)\s*(?:[,/]\s*([\d.]+))?/,
  );

  if (rgb) {
    const [r, g, b] = rgb.slice(1, 4).map(Number);
    return [clamp(r), clamp(g), clamp(b), alpha(rgb[4])];
  }

  const hex = value.trim().match(/^#([0-9a-f]{3,8})$/i);

  if (hex) {
    const d =
      hex[1].length < 6 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    const n = [0, 2, 4, 6].map((i) =>
      Number.parseInt(d.slice(i, i + 2) || "ff", 16),
    );
    return [n[0], n[1], n[2], n[3] / 255];
  }

  throw new Error(`unsupported color literal: ${value}`);
};

/** Flattens a translucent color onto the background it is painted over. */
export const composite = ([r, g, b, a]: Rgba, over: Rgba): Rgb =>
  [r, g, b].map((c, i) => Math.round(a * c + (1 - a) * over[i])) as Rgb;

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = ([r, g, b]: Rgb) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** WCAG 2.x contrast ratio. */
export const contrast = (a: Rgb, b: Rgb) => {
  const x = luminance(a) + 0.05;
  const y = luminance(b) + 0.05;
  return Math.max(x, y) / Math.min(x, y);
};

export const hex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
