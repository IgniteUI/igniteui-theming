/**
 * How a scale places ten shades between two contrast targets. This is the arithmetic
 * `_generator.scss` performs, kept in one place so the editor, the lookup table and the
 * tests that check the table against Sass all agree on it.
 */

import { luminance, toRgb } from "./color.js";
import type { ScaleSubject } from "./data/color/scales.js";

/** Cubic bezier control points, `(x1, y1, x2, y2)`, as the Sass `curve` option takes them. */
export type Curve = [number, number, number, number];

/** What `gray` measures a range against: the background (the default), or white. */
export type Anchor = "surface" | "white";

export interface Scale {
  /** Contrast of shade 50 and shade 900 against the anchor. */
  range: [number, number];
  /** How positions are eased between them. `null` is a straight line. */
  curve: Curve | null;
  /** Only `gray` reads it; every other family is measured against white. */
  anchor?: Anchor;
}

export interface ScalePreset extends Scale {
  name: string;
  /** What the preset is for, in one line. */
  why: string;
}

/** The scales the library ships, with the figures `_scales.scss` documents. */
export const SCALE_PRESETS: ScalePreset[] = [
  {
    name: "even",
    range: [1.182, 18.232],
    curve: null,
    why: "Spread as evenly as possible. The default.",
  },
  {
    name: "material",
    range: [1.04, 16.1],
    curve: [0.53, 0, 0.825, 0.785],
    why: "The grayscale we have always shipped, light and dark.",
    anchor: "white",
  },
  {
    name: "tailwind",
    range: [1.04, 17.76],
    curve: [0.615, 0.07, 0.225, 0.43],
    why: "The slate scale from Tailwind v4.",
  },
  {
    name: "carbon",
    range: [1.1, 18.1],
    curve: [0.525, 0.295, 0.655, 0.87],
    why: "IBM Carbon's gray, 10 through 100.",
  },
];

/**
 * Control points for a straight line. A cubic bezier with its handles at 1/3 and 2/3
 * reduces exactly to `t`, so an editor can show and drag them while `curve` is still
 * null without the rendered ramp shifting.
 */
export const IDENTITY_CURVE: Curve = [1 / 3, 1 / 3, 2 / 3, 2 / 3];

/** One axis of a cubic bezier from (0,0) to (1,1). */
export const bezier = (t: number, p1: number, p2: number) => {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t ** 3;
};

/** The same easing `_ease()` performs in the generator: solve x for t, then read y. */
export const ease = (x: number, curve: Curve | null) => {
  if (!curve) return x;

  let lo = 0;
  let hi = 1;

  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bezier(mid, curve[0], curve[2]) < x) lo = mid;
    else hi = mid;
  }

  return bezier((lo + hi) / 2, curve[1], curve[3]);
};

/** How a scale reads for a subject: which table, what it is measured against, which way. */
export interface Reading {
  table: ScaleTable;
  anchor: string;
  ceiling: number;
  /** A white-anchored gray on a dark page: shade 50 takes the far end of the range. */
  flip: boolean;
}

export const readingFor = (subject: ScaleSubject, scale: Scale): Reading =>
  subject.white && scale.anchor === "white"
    ? {
        table: subject.white.table,
        anchor: "#ffffff",
        ceiling: subject.white.ceiling,
        flip: luminance(toRgb(subject.surface)) <= 0.5,
      }
    : {
        table: subject.table,
        anchor: subject.anchor,
        ceiling: subject.ceiling,
        flip: false,
      };

export interface ScaleData {
  subjects: ScaleSubject[];
  /** Sass warnings raised while compiling, reported by the plugin on every serve. */
  warnings: string[];
}

/** Where a shade sits on the 0–1 axis, before easing. */
export const position = (index: number, count = 10) => index / (count - 1);

/** The contrast a shade at eased position `t` aims for: geometric between the two ends. */
export const target = ([lo, hi]: [number, number], t: number) =>
  lo * (hi / lo) ** t;

/** The ten contrast targets a scale asks for, in shade order. */
export const targets = ({ range, curve }: Scale, count = 10) =>
  Array.from({ length: count }, (_, i) =>
    target(range, ease(position(i, count), curve)),
  );

/**
 * A `(position, contrast target) -> color` table sampled geometrically across a span.
 * Each row is one shade position; each entry is a six-digit hex, concatenated.
 */
export interface ScaleTable {
  samples: number;
  span: [number, number];
  /** One string per shade position. */
  rows: string[];
}

/** The hex at `position` nearest to `contrast`, by index into the sampled span. */
export const lookup = (
  table: ScaleTable,
  position: number,
  contrast: number,
) => {
  const { samples, span, rows } = table;
  const fraction = Math.log(contrast / span[0]) / Math.log(span[1] / span[0]);
  const k = Math.min(
    samples - 1,
    Math.max(0, Math.round(fraction * (samples - 1))),
  );

  return rows[position].slice(k * 6, k * 6 + 6);
};

/** The ten hexes a scale produces from a table. */
/**
 * The ten hexes a scale produces from a table. `flip` reads the scale backwards, as the
 * generator does for a white-anchored gray on a dark surface: shade 50 takes the target
 * at the far end.
 */
export const rampFromTable = (
  table: ScaleTable,
  scale: Scale,
  flip = false,
) => {
  const wanted = targets(scale);
  const last = wanted.length - 1;

  return wanted.map((_, i) => lookup(table, i, wanted[flip ? last - i : i]));
};

export const sameScale = (a: Scale, b: Scale) =>
  a.range[0] === b.range[0] &&
  a.range[1] === b.range[1] &&
  String(a.curve) === String(b.curve) &&
  (a.anchor ?? "surface") === (b.anchor ?? "surface");
