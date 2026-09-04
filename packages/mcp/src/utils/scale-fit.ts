/**
 * Fits a shade scale to an existing color ladder.
 *
 * A scale is two things: the WCAG contrast `range` a family spans from its lightest shade
 * to its darkest, and a cubic-bezier `curve` placing each shade inside that range. Given a
 * ladder of colors from some other design system, both can be recovered exactly - the range
 * from the two endpoints, the curve by least-squares over the shades between them.
 */

/** Control points of a cubic bezier whose outer points are pinned at 0 and 1. */
export type Curve = [number, number, number, number];

export interface FittedScale {
  /** Contrast against white at the lightest and darkest rungs. */
  range: [number, number];
  /** The eased placement, or null when the ladder is already evenly spread. */
  curve: Curve | null;
  /** RMS error between the fitted curve and the ladder, in normalized range units. */
  rms: number;
  /** Per-rung contrast the fitted scale would produce, against the ladder's own. */
  rungs: Array<{ index: number; actual: number; fitted: number }>;
}

/** WCAG contrast of a luminance against white. */
const againstWhite = (luminance: number) => 1.05 / (luminance + 0.05);

/** One axis of a cubic bezier with outer control points at 0 and 1. */
const bezier = (t: number, p1: number, p2: number) =>
  3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3;

/** Reads the curve the way CSS reads a timing function: solve x for t, return y. */
export const ease = (x: number, curve: Curve): number => {
  let lo = 0;
  let hi = 1;

  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;

    if (bezier(mid, curve[0], curve[2]) < x) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return bezier((lo + hi) / 2, curve[1], curve[3]);
};

const sse = (xs: number[], ts: number[], curve: Curve) =>
  xs.reduce((acc, x, i) => acc + (ease(x, curve) - ts[i]) ** 2, 0);

/**
 * Fit a scale to a ladder of luminances, ordered lightest to darkest.
 *
 * @param luminances - One luminance per rung, at least 3, lightest first.
 * @returns The range, the fitted curve, and how closely it reproduces the ladder.
 */
export function fitScale(luminances: number[]): FittedScale {
  if (luminances.length < 3) {
    throw new Error(
      `A scale needs at least 3 rungs to fit a curve, got ${luminances.length}.`,
    );
  }

  const contrasts = luminances.map(againstWhite);
  const lo = contrasts[0];
  const hi = contrasts[contrasts.length - 1];

  if (!(hi > lo)) {
    throw new Error(
      "Ladder must run lightest to darkest - its last color is not darker than its first.",
    );
  }

  // Contrast is perceived as a ratio, so the range is walked geometrically. Normalizing in
  // log space is what makes a straight line the "even" scale.
  const span = Math.log(hi) - Math.log(lo);
  const ts = contrasts.map((c) => (Math.log(c) - Math.log(lo)) / span);
  const xs = contrasts.map((_, i) => i / (contrasts.length - 1));

  // Coarse grid, then a shrinking coordinate descent. The surface is smooth and the grid is
  // dense enough to land in the right basin.
  let best: Curve = [0.5, 0.5, 0.5, 0.5];
  let bestErr = Number.POSITIVE_INFINITY;
  const grid = Array.from({ length: 11 }, (_, i) => i / 10);

  for (const p1x of grid) {
    for (const p1y of grid) {
      for (const p2x of grid) {
        for (const p2y of grid) {
          if (p1x <= 0 || p2x <= 0) continue;

          const candidate: Curve = [p1x, p1y, p2x, p2y];
          const err = sse(xs, ts, candidate);

          if (err < bestErr) {
            bestErr = err;
            best = candidate;
          }
        }
      }
    }
  }

  for (const step of [0.05, 0.02, 0.008, 0.003]) {
    let improved = true;

    while (improved) {
      improved = false;

      for (let axis = 0; axis < 4; axis++) {
        for (const delta of [-step, step]) {
          const candidate = [...best] as Curve;
          candidate[axis] = Math.min(
            1,
            Math.max(0.001, candidate[axis] + delta),
          );

          const err = sse(xs, ts, candidate);

          if (err < bestErr - 1e-12) {
            bestErr = err;
            best = candidate;
            improved = true;
          }
        }
      }
    }
  }

  const round = (n: number) => Math.round(n * 1000) / 1000;
  const straight = sse(xs, ts, [1 / 3, 1 / 3, 2 / 3, 2 / 3]);
  // A ladder already on the straight line does not need a curve, and `null` is how the
  // generator spells that.
  const curve: Curve | null =
    Math.sqrt(straight / xs.length) < 0.01 ? null : (best.map(round) as Curve);

  return {
    range: [round(lo), round(hi)],
    curve,
    rms: round(Math.sqrt(bestErr / xs.length)),
    rungs: contrasts.map((actual, i) => ({
      index: i,
      actual: round(actual),
      fitted: round(lo * (hi / lo) ** (curve ? ease(xs[i], curve) : xs[i])),
    })),
  };
}
