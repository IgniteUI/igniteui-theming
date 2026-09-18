/** Reading the packed ramps the sweep provider emits. Pure, shared by the view and its tests. */
import { failingPairs, PAIR_DISTANCE, type Rgb, toRgb } from "./color.js";
import type { SweepRamp } from "./data/color/sweep.js";
import type { Finding } from "./elements/verdict.js";
import { SHADES } from "./variants.js";

/** The six-digit hex of shade `i`, with its `#`. */
export const shadeHex = (ramp: SweepRamp, i: number) =>
  `#${ramp.hex.slice(i * 6, i * 6 + 6)}`;

export const shadeRgb = (ramp: SweepRamp, i: number): Rgb =>
  toRgb(shadeHex(ramp, i));

export const rampRgb = (ramp: SweepRamp): Rgb[] =>
  SHADES.map((_, i) => shadeRgb(ramp, i));

/** Whether the generator asked for shade `i` outside sRGB. */
export const isClamped = (ramp: SweepRamp, i: number) =>
  ((ramp.mask >> i) & 1) === 1;

export const clampedCount = (ramp: SweepRamp) =>
  SHADES.filter((_, i) => isClamped(ramp, i)).length;

export const duplicateCount = (ramp: SweepRamp) => {
  const shades = rampRgb(ramp);
  return shades.length - new Set(shades.map(String)).size;
};

/** What the verdict beside a ramp says. */
export const findings = (ramp: SweepRamp): Finding[] => {
  const shades = rampRgb(ramp);
  const pairs = shades.length - PAIR_DISTANCE;
  const fails = failingPairs(shades);
  const clamped = clampedCount(ramp);
  const dup = duplicateCount(ramp);
  const out: Finding[] = [
    {
      text: fails
        ? `${fails} of ${pairs} pairs fail AA`
        : `all ${pairs} pairs pass AA`,
      ok: fails === 0,
    },
  ];

  out.push(
    clamped
      ? { text: `${clamped} shade${clamped > 1 ? "s" : ""} clamped`, ok: false }
      : { text: "nothing clamped", ok: true },
  );
  if (dup) out.push({ text: `${dup} shades share a color`, ok: false });

  return out;
};
