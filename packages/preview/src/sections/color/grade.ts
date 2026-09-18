/** How a measured contrast is reported to the reader. Pure, so it is easy to test. */
import type { Swatch } from "../../preset-model.js";

/** WCAG thresholds, coarsest last, so the first match is the best grade a ratio earns. */
const GRADES: [number, string][] = [
  [7, "AAA"],
  [4.5, "AA"],
  [3, "UI"],
];

/** The best grade a ratio earns, or null when it clears none of them. */
export const grade = (value: number) =>
  GRADES.find(([min]) => value >= min)?.[1] ?? null;

export const ratio = (value: number) => `${value.toFixed(1)}:1`;

/** `50, 100 and 200` */
export const listKeys = (keys: string[]) =>
  keys.length > 1
    ? `${keys.slice(0, -1).join(", ")} and ${keys.at(-1)}`
    : keys[0];

/** The tooltip for a swatch: token, hex, the measured ratio, and whatever is wrong with it. */
export const describe = (
  swatch: Swatch,
  against: string | null,
  value: number,
) => {
  const notes = [`${swatch.token}  ${swatch.hex}`];

  notes.push(
    against
      ? `${value.toFixed(2)}:1 against ${against} · ${grade(value) ?? "below 3:1, no grade"}`
      : `${value.toFixed(2)}:1 against ${swatch.against}`,
  );

  if (swatch.same.length) notes.push(`same color as ${listKeys(swatch.same)}`);
  if (swatch.clipped)
    notes.push("asked for a color the screen cannot show, so it was clipped");

  return notes.join("   ");
};
