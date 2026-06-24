/**
 * Runtime type guards for distinguishing SassModeLeaf nodes from SassTree
 * branches during serialization and tree construction.
 */

import type { SassModeLeaf, SassValueKey } from "./types.js";

/**
 * Runtime-available keys from SassValueMap.
 * Must stay in sync with the SassValueMap interface in types.ts.
 */
export const SASS_VALUE_KEYS: readonly SassValueKey[] = [
  "color",
  "dimension",
  "border",
];

/**
 * Leaf-shape validators keyed by SassValueKey.
 *
 * Each validator checks whether a candidate value matches the expected leaf
 * structure for that type. This prevents tree branches whose key happens to
 * collide with a SassValueKey (e.g., a group named "color" or "border")
 * from being misidentified as mode-leaf content.
 */
const LEAF_VALIDATORS: Record<SassValueKey, (v: unknown) => boolean> = {
  /** SassColorLeaf always has `hex`. */
  color: (v) => typeof v === "object" && v !== null && "hex" in v,

  /** SassDimensionLeaf always has `value` (string). */
  dimension: (v) =>
    typeof v === "object" &&
    v !== null &&
    "value" in v &&
    typeof (v as Record<string, unknown>).value === "string",

  /** SassBorderLeaf has at least one of style (string), width (has value), or color (has hex). */
  border: (v) => {
    if (typeof v !== "object" || v === null) return false;

    const b = v as Record<string, unknown>;

    if ("style" in b && typeof b.style === "string") return true;

    if (
      "width" in b &&
      typeof b.width === "object" &&
      b.width !== null &&
      "value" in b.width
    ) {
      return true;
    }

    if (
      "color" in b &&
      typeof b.color === "object" &&
      b.color !== null &&
      "hex" in b.color
    ) {
      return true;
    }

    return false;
  },
};

/**
 * Check if a value is a SassModeLeaf (mode-keyed object with value-type content).
 *
 * Two-level check: the first entry's value must contain a recognized
 * SassValueKey AND the value under that key must match the corresponding
 * leaf shape (e.g., a color leaf must have `hex`).
 */
export function isSassModeLeaf(value: unknown): value is SassModeLeaf {
  if (typeof value !== "object" || value === null) return false;

  const entries = Object.values(value as Record<string, unknown>);

  if (entries.length === 0) return false;

  const first = entries[0];

  if (typeof first !== "object" || first === null) return false;

  const content = first as Record<string, unknown>;

  return SASS_VALUE_KEYS.some(
    (key) => key in content && LEAF_VALIDATORS[key](content[key]),
  );
}
