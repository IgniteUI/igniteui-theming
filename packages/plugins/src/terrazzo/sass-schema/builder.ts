/**
 * Transforms individual DTCG leaf tokens into Sass leaf format with mode expansion.
 *
 * Handles:
 * - $type: "reference" with color → { color: { ref, hex, alpha? } }
 * - $type: "reference" with dimension → { dimension: { ref, value } }
 * - $type: "color" (literal) → { color: { hex, alpha? } }
 * - $type: "dimension" (literal) → { dimension: { value } }
 *
 * Mode expansion:
 * - Root $value → default mode (light)
 * - $extensions.modes.dark.$value → dark mode
 * - If no dark override, duplicate the default mode value
 */

import type {
  DTCGColorToken,
  DTCGColorValue,
  DTCGDimensionToken,
  DTCGDimensionValue,
  DTCGLeafToken,
  DTCGReferenceValue,
  SassColorLeaf,
  SassDimensionLeaf,
  SassModeContent,
  SassModeLeaf,
} from "./types.js";

interface BuildLeafOptions {
  /** Number of leading ref segments to strip. Default: 1 */
  stripRefSegments?: number;
  /** Mode names to emit (at least one). First mode is the default. Default: ['light', 'dark'] */
  modes?: [string, ...string[]];
}

/**
 * Parse a DTCG ref string into a string array.
 *
 * Example:
 *   parseRef("{primitive-colors.secondary.secondary-500}", 1)
 *   → ['secondary', 'secondary-500']
 *
 *   parseRef("{primitive-colors.grays.grays-100}", 1)
 *   → ['grays', 'grays-100']
 *
 * @param ref - The ref string, e.g., "{primitive-colors.secondary.secondary-500}"
 * @param stripSegments - Number of leading segments to strip after removing braces. Default: 1
 * @returns Array of path segments, e.g., ['secondary', 'secondary-500']
 */
export function parseRef(ref: string, stripSegments = 1): string[] {
  // Strip curly braces
  const inner = ref.replace(/^\{|\}$/g, "");

  // Split on dots
  const segments = inner.split(".");

  // Strip leading segments
  return segments.slice(stripSegments);
}

/**
 * Build a Sass mode leaf from a DTCG leaf token.
 */
export function buildSassLeaf(
  token: DTCGLeafToken,
  options: BuildLeafOptions = {},
): SassModeLeaf {
  const { stripRefSegments = 1, modes = ["light", "dark"] } = options;
  const [defaultMode] = modes;

  // Build the default mode value from root $value
  const defaultValue = buildModeValue(
    token.$type,
    token.$value,
    stripRefSegments,
  );

  // Build each mode: default mode gets the root value,
  // other modes get their override from $extensions.modes or fall back to the default.
  const result: SassModeLeaf = {};

  for (const mode of modes) {
    if (mode === defaultMode) {
      result[mode] = defaultValue;
    } else {
      const modeOverride = token.$extensions?.modes?.[mode];

      result[mode] = modeOverride
        ? buildModeValueFromOverride(
            token.$type,
            modeOverride.$value,
            stripRefSegments,
          )
        : defaultValue;
    }
  }

  return result;
}

/**
 * Build a single mode's value from the root $type and $value.
 */
function buildModeValue(
  type: string,
  value: DTCGLeafToken["$value"],
  stripRefSegments: number,
): SassModeContent {
  if (type === "reference") {
    return buildFromReference(value as DTCGReferenceValue, stripRefSegments);
  }

  if (type === "color") {
    return { color: buildColorLeaf(value as DTCGColorValue) };
  }

  if (type === "dimension") {
    return { dimension: buildDimensionLeaf(value as DTCGDimensionValue) };
  }

  // Fallback for unknown types - return empty
  return {};
}

/**
 * Build a single mode's value from a mode override entry.
 * Mode overrides for reference tokens have the same shape as the root $value
 * (with ref + type-keyed resolved value). For literal tokens in modes,
 * the value is wrapped in a type-keyed object.
 */
function buildModeValueFromOverride(
  rootType: string,
  value: unknown,
  stripRefSegments: number,
): SassModeContent {
  if (value == null || typeof value !== "object") return {};

  // If the override has a 'ref' field, it's a reference value
  if ("ref" in value) {
    return buildFromReference(
      value as unknown as DTCGReferenceValue,
      stripRefSegments,
    );
  }

  // For non-reference root types, the mode value is wrapped:
  // { color: { $type: "color", $value: {...} } } or bare value
  if (rootType === "color" || "color" in value) {
    const colorToken = (value as { color?: DTCGColorToken }).color;

    if (colorToken) {
      return { color: buildColorLeaf(colorToken.$value) };
    }

    // Bare color value
    return { color: buildColorLeaf(value as unknown as DTCGColorValue) };
  }

  if (rootType === "dimension" || "dimension" in value) {
    const dimToken = (value as { dimension?: DTCGDimensionToken }).dimension;

    if (dimToken) {
      return { dimension: buildDimensionLeaf(dimToken.$value) };
    }

    return {
      dimension: buildDimensionLeaf(value as unknown as DTCGDimensionValue),
    };
  }

  return {};
}

/**
 * Build mode value from a reference-type value.
 */
function buildFromReference(
  value: DTCGReferenceValue,
  stripRefSegments: number,
): SassModeContent {
  const ref = parseRef(value.ref, stripRefSegments);

  if (value.color) {
    const leaf = buildColorLeaf(value.color.$value);

    leaf.ref = ref;
    return { color: leaf };
  }

  if (value.dimension) {
    const leaf = buildDimensionLeaf(value.dimension.$value);

    leaf.ref = ref;
    return { dimension: leaf };
  }

  return {};
}

/**
 * Build a SassColorLeaf from a DTCG color value.
 * Alpha is included only when !== 1.
 */
function buildColorLeaf(value: DTCGColorValue): SassColorLeaf {
  const leaf: SassColorLeaf = { hex: value.hex };

  if (value.alpha !== 1) {
    leaf.alpha = value.alpha;
  }

  return leaf;
}

/**
 * Build a SassDimensionLeaf from a DTCG dimension value.
 */
function buildDimensionLeaf(value: DTCGDimensionValue): SassDimensionLeaf {
  return { value: `${value.value}${value.unit}` };
}
