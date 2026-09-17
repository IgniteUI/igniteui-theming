/** Color math shared by the build and the views. Pure functions over sRGB tuples. */

export type Rgb = [number, number, number];
export type Rgba = [number, number, number, number];

/** WCAG AA for normal text. Every "pair" claim in the app is measured against it. */
export const AA = 4.5;

/** Shades this far apart in a ten-step ramp are the pairs the generator guarantees. */
export const PAIR_DISTANCE = 5;

const clamp = (v: number) => Math.min(255, Math.max(0, v));

const alpha = (value: string | undefined) =>
  value === undefined ? 1 : Number(value);

/**
 * CSS Color 4 hsl-to-rgb. Saturation and lightness are used as given, including the
 * out-of-range values the legacy generator produces (`calc(s * 1.26)`), so the channels
 * can land outside sRGB and get clipped exactly where a browser clips them.
 */
const hslToRgb = (h: number, s: number, l: number, clip = true): Rgb => {
  const k = (n: number) => (((n + h / 30) % 12) + 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));

  return [f(0), f(8), f(4)].map((v) =>
    clip ? Math.round(clamp(v * 255)) : v * 255,
  ) as Rgb;
};

const read = (value: string, clip: boolean): Rgba => {
  const hsl = value.match(
    /^hsla?\(\s*([-\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%\s*(?:[,/]\s*([\d.]+))?/,
  );

  if (hsl) {
    const [h, s, l] = hsl.slice(1, 4).map(Number);
    return [...hslToRgb(h, s / 100, l / 100, clip), alpha(hsl[4])];
  }

  const rgb = value.match(
    /^rgba?\(\s*([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)\s*(?:[,/]\s*([\d.]+))?/,
  );

  if (rgb) {
    const [r, g, b] = rgb.slice(1, 4).map(Number);
    return clip
      ? [clamp(r), clamp(g), clamp(b), alpha(rgb[4])]
      : [r, g, b, alpha(rgb[4])];
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

/** Resolves a Sass-emitted color literal to clipped sRGB. */
export const parse = (value: string): Rgba => read(value, true);

/**
 * Resolves a literal without clipping, so a request the display cannot satisfy keeps
 * the position it asked for. The legacy generator emits these routinely.
 */
export const parseRaw = (value: string): Rgba => read(value, false);

/** The opaque channels of a literal. Most measurements do not care about alpha. */
export const toRgb = (value: string): Rgb => {
  const [r, g, b] = parse(value);
  return [r, g, b];
};

/** Flattens a translucent color onto the background it is painted over. */
export const composite = ([r, g, b, a]: Rgba, over: Rgb): Rgb =>
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

export interface ShadePair {
  /** Index of the lighter shade in the ramp. */
  i: number;
  /** Index of the darker shade, `PAIR_DISTANCE` steps on. */
  j: number;
  contrast: number;
}

/** Every pair of shades `PAIR_DISTANCE` apart, with the contrast between them. */
export const shadePairs = (ramp: Rgb[]): ShadePair[] => {
  const pairs: ShadePair[] = [];

  for (let i = 0; i + PAIR_DISTANCE < ramp.length; i++) {
    const j = i + PAIR_DISTANCE;
    pairs.push({ i, j, contrast: contrast(ramp[i], ramp[j]) });
  }

  return pairs;
};

/** How many of a ramp's pairs fall short of AA. */
export const failingPairs = (ramp: Rgb[]) =>
  shadePairs(ramp).filter((pair) => pair.contrast < AA).length;

/**
 * Black or white, whichever reads better *on this color*. Choosing it from the color's
 * contrast with some other anchor gets it backwards as soon as the anchor is dark.
 */
export const readableOn = (color: Rgb) =>
  contrast(color, [255, 255, 255]) >= contrast(color, [0, 0, 0])
    ? "#fff"
    : "#111";

export const hex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

/** Sign-preserving sRGB transfer, defined outside [0,1] so an unreachable request stays measurable. */
const toLinear = (v: number) => {
  const s = Math.abs(v) / 255;
  const lin = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  return Math.sign(v) * lin;
};

/** Linear sRGB channel to its 0–255 encoding, clipped. */
export const encode = (v: number) => {
  const c = v <= 0 ? 0 : v >= 1 ? 1 : v;
  return (
    (255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)) | 0
  );
};

/** sRGB to OKLCH, after Ottosson. Hue is degrees. */
export const rgbToOklch = ([R, G, B]: Rgb): [number, number, number] => {
  const r = toLinear(R);
  const g = toLinear(G);
  const b = toLinear(B);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return [
    L,
    Math.hypot(A, Bb),
    ((Math.atan2(Bb, A) * 180) / Math.PI + 360) % 360,
  ];
};

/**
 * OKLab (a, b) to linear sRGB. Split out from `oklchToLinear` so a caller that holds
 * the hue fixed — the gamut plot paints thousands of pixels at one hue — can convert
 * the angle once instead of per pixel.
 */
export const oklabToLinear = (
  L: number,
  a: number,
  b: number,
): [number, number, number] => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

/** OKLCH to linear sRGB. Channels outside [0,1] mean the color is outside the gamut. */
export const oklchToLinear = (
  L: number,
  C: number,
  hDeg: number,
): [number, number, number] => {
  const h = (hDeg * Math.PI) / 180;
  return oklabToLinear(L, C * Math.cos(h), C * Math.sin(h));
};

/**
 * The linear values that encode to -0.001 and 1.001.
 *
 * The tolerance belongs on the *encoded* channels: near black every linear channel is
 * close to zero, so a slack of 0.001 applied there would admit colors far outside the
 * gamut and bulge the dark end of the solid. Converting the two bounds once, rather than
 * encoding every channel of every sample, makes the test three `pow` calls cheaper —
 * which matters because the gamut plot runs it per pixel.
 */
export const GAMUT_LOW = -0.001 / 12.92;
export const GAMUT_HIGH = ((1.001 + 0.055) / 1.055) ** 2.4;

/**
 * Whether an unclipped 0–255 triple is displayable, to the same one-part-in-a-thousand
 * tolerance `GAMUT_LOW`/`GAMUT_HIGH` use. `parseRaw` keeps the position a legacy shade
 * asked for, and this is what says the display cannot honour it.
 */
export const displayable = ([r, g, b]: Rgb) =>
  r >= -0.255 &&
  r <= 255.255 &&
  g >= -0.255 &&
  g <= 255.255 &&
  b >= -0.255 &&
  b <= 255.255;

/** Whether a linear triple is displayable. */
export const inSrgb = ([r, g, b]: [number, number, number]) =>
  r >= GAMUT_LOW &&
  r <= GAMUT_HIGH &&
  g >= GAMUT_LOW &&
  g <= GAMUT_HIGH &&
  b >= GAMUT_LOW &&
  b <= GAMUT_HIGH;

/** Chroma past which no sRGB color exists at any hue. Bounds the searches below. */
export const CHROMA_CEILING = 0.37;

/** Largest chroma this hue can hold at this lightness, by bisection. */
export const maxChroma = (L: number, hue: number, ceiling = CHROMA_CEILING) => {
  let lo = 0;
  let hi = ceiling;

  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (inSrgb(oklchToLinear(L, mid, hue))) lo = mid;
    else hi = mid;
  }

  return lo;
};

export interface Cusp {
  hue: number;
  L: number;
  C: number;
}

/** The most saturated color a hue can reach in sRGB, and the lightness it sits at. */
export const gamutCusp = (hue: number): Cusp => {
  let best: Cusp = { hue, L: 0, C: 0 };

  for (let i = 1; i < 100; i++) {
    const L = i / 100;
    const C = maxChroma(L, hue);
    if (C > best.C) best = { hue, L, C };
  }

  return best;
};
