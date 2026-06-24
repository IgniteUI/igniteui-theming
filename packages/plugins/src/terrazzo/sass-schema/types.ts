/**
 * Types for the DTCG tokens format (2025.10) and the Sass output structure
 * used by the sass-schema plugin.
 *
 * Architecture:
 *   DTCGValueMap        — single source of truth: maps each $type key to its raw $value shape.
 *   DTCGTypedToken<K>   — generic {$type, $value} wrapper derived from the map.
 *   Individual aliases  — DTCGColorToken, DTCGBooleanToken, etc. (= DTCGTypedToken<K>).
 *   DTCGReferenceValue  — Terrazzo-specific resolved alias (ref + typed token, derived).
 *   DTCGModeEntry       — mode override inside $extensions.modes (derived).
 *   DTCGLeafToken       — discriminated union on $type (derived from map + "reference").
 *
 * Adding a new DTCG type only requires:
 *   1. Define a value interface (if composite).
 *   2. Add one entry to DTCGValueMap.
 *   Everything else auto-derives.
 */

/** A map of well-known font weight numeric values to their string name aliases. */
const fontWeights = {
  100: ["thin", "hairline"],
  200: ["extra-light", "ultra-light"],
  300: ["light"],
  400: ["normal", "regular", "book"],
  500: ["medium"],
  600: ["semi-bold", "demi-bold"],
  700: ["bold"],
  800: ["extra-bold", "ultra-bold"],
  900: ["black", "heavy"],
  950: ["extra-black", "ultra-black"],
} as const;

/** Well-known numeric font weight values (100, 200, ..., 950). */
type FontWeightNumeric = keyof typeof fontWeights;

/** Pre-defined font weight string aliases (e.g., 'thin', 'bold', 'extra-black'). */
type FontWeightAlias = (typeof fontWeights)[FontWeightNumeric][number];

/** A DTCG reference string pointing to another token's value, e.g. "{colors.primary.500}". */
type DTCGReference = string;

/**
 * DTCG color value (spec §8.1).
 * Uses the CSS Color Level 4 color-space model.
 * The `hex` convenience field is populated by Terrazzo's resolver.
 */
export interface DTCGColorValue {
  colorSpace: string;
  components: number[];
  alpha: number;
  hex: string;
}

/**
 * DTCG dimension value (spec §8.2).
 * Also reused for duration sub-values (unit: "ms" | "s") and typography fontSize.
 */
export interface DTCGDimensionValue {
  value: number;
  unit: string;
}

/**
 * DTCG stroke-style object value (spec §9.3.2).
 * The simpler string form ("solid", "dashed", …) uses DTCGStrokeStyleValue directly.
 */
export interface DTCGStrokeStyleObjectValue {
  dashArray: DTCGDimensionValue[];
  lineCap: "round" | "butt" | "square";
}

/**
 * DTCG stroke-style value (spec §9.3).
 * Either one of the pre-defined CSS line-style keywords or an object form.
 */
export type DTCGStrokeStyleValue =
  | "solid"
  | "dashed"
  | "dotted"
  | "double"
  | "groove"
  | "ridge"
  | "outset"
  | "inset"
  | DTCGStrokeStyleObjectValue;

/**
 * DTCG border composite value (spec §9.4).
 */
export interface DTCGBorderValue {
  color: DTCGColorValue;
  width: DTCGDimensionValue;
  style: DTCGStrokeStyleValue;
}

/**
 * DTCG transition composite value (spec §9.5).
 */
export interface DTCGTransitionValue {
  duration: DTCGDimensionValue;
  delay: DTCGDimensionValue;
  timingFunction: [number, number, number, number];
}

/**
 * DTCG shadow object (spec §9.6).
 * A shadow token's $value can be a single instance or an array of these.
 */
export interface DTCGShadowValue {
  color: DTCGColorValue;
  offsetX: DTCGDimensionValue;
  offsetY: DTCGDimensionValue;
  blur: DTCGDimensionValue;
  spread: DTCGDimensionValue;
  inset?: boolean;
}

/**
 * DTCG gradient stop (spec §9.7).
 * A gradient token's $value is an array of these.
 */
export interface DTCGGradientStop {
  color: DTCGColorValue;
  /** Position along the gradient axis in the range [0, 1]. */
  position: number;
}

/**
 * DTCG typography composite value (spec §9.8).
 * Sub-values are raw values (not wrapped in {$type,$value} tokens) as per the spec.
 */
export interface DTCGTypographyValue {
  /** Font family string or ordered array (most-preferred first). */
  fontFamily: string | string[];
  /** Font size as a dimension value. */
  fontSize: DTCGDimensionValue;
  /** Font weight: any number in [1, 1000] or a pre-defined alias. */
  fontWeight: number | FontWeightAlias;
  /** Horizontal character spacing as a dimension value. */
  letterSpacing?: DTCGDimensionValue;
  /** Line height as a unitless multiplier of fontSize. */
  lineHeight?: number;
}

/**
 * Maps every DTCG $type string to its raw $value shape.
 *
 * This is the central registry. All derived types (token wrappers, references,
 * mode entries, leaf tokens) are auto-generated from this interface.
 *
 * Spec §8 scalar types:  boolean, string, number, color, dimension, fontFamily, fontWeight, duration, cubicBezier
 * Spec §9 composite types: strokeStyle, border, transition, shadow, gradient, typography
 *
 * Note: "boolean" and "string" are not formally standardised in the 2025.10 spec
 * (they appear in §8.8 "Additional types") but are widely implemented by tools.
 */
export interface DTCGValueMap {
  boolean: boolean;
  string: string;
  number: number;
  color: DTCGColorValue;
  dimension: DTCGDimensionValue;
  fontFamily: string | string[];
  fontWeight: number | FontWeightAlias;
  duration: DTCGDimensionValue;
  cubicBezier: [number, number, number, number];
  strokeStyle: DTCGStrokeStyleValue;
  border: DTCGBorderValue;
  transition: DTCGTransitionValue;
  shadow: DTCGShadowValue | DTCGShadowValue[];
  gradient: DTCGGradientStop[];
  typography: DTCGTypographyValue;
}

/** All known DTCG $type strings. */
export type DTCGTokenType = keyof DTCGValueMap;

/**
 * A DTCG typed token: `{$type: K, $value: DTCGValueMap[K]}`.
 *
 * Distributive conditional — when K is a union, produces a proper discriminated
 * union where each member has a concrete $type and the corresponding $value.
 */
export type DTCGTypedToken<K extends DTCGTokenType = DTCGTokenType> =
  K extends DTCGTokenType ? { $type: K; $value: DTCGValueMap[K] } : never;

// ─── Convenience Token Type Aliases ────────────────────────────────────────

/** @see DTCGValueMap.boolean */
export type DTCGBooleanToken = DTCGTypedToken<"boolean">;

/** @see DTCGValueMap.string */
export type DTCGStringToken = DTCGTypedToken<"string">;

/** @see DTCGValueMap.number */
export type DTCGNumberToken = DTCGTypedToken<"number">;

/** @see DTCGValueMap.color */
export type DTCGColorToken = DTCGTypedToken<"color">;

/** @see DTCGValueMap.dimension */
export type DTCGDimensionToken = DTCGTypedToken<"dimension">;

/** @see DTCGValueMap.fontFamily */
export type DTCGFontFamilyToken = DTCGTypedToken<"fontFamily">;

/** @see DTCGValueMap.fontWeight */
export type DTCGFontWeightToken = DTCGTypedToken<"fontWeight">;

/** @see DTCGValueMap.duration */
export type DTCGDurationToken = DTCGTypedToken<"duration">;

/** @see DTCGValueMap.cubicBezier */
export type DTCGCubicBezierToken = DTCGTypedToken<"cubicBezier">;

/** @see DTCGValueMap.strokeStyle */
export type DTCGStrokeStyleToken = DTCGTypedToken<"strokeStyle">;

/** @see DTCGValueMap.border */
export type DTCGBorderToken = DTCGTypedToken<"border">;

/** @see DTCGValueMap.transition */
export type DTCGTransitionToken = DTCGTypedToken<"transition">;

/** @see DTCGValueMap.shadow */
export type DTCGShadowToken = DTCGTypedToken<"shadow">;

/** @see DTCGValueMap.gradient */
export type DTCGGradientToken = DTCGTypedToken<"gradient">;

/** @see DTCGValueMap.typography */
export type DTCGTypographyToken = DTCGTypedToken<"typography">;

/**
 * Terrazzo-resolved reference value (Terrazzo-specific, not part of the DTCG spec).
 *
 * In the DTCG spec, an alias token has `$value: "{token.path}"` (a plain string).
 * Terrazzo resolves the reference at parse time and records it as `$type: "reference"`
 * with this shape:
 *   - `ref`: the original curly-brace reference string
 *   - One optional key per DTCG type holding the resolved `{$type, $value}` token
 *
 * The optional resolved-token keys are auto-derived from DTCGValueMap, so no manual
 * sync is needed when the map grows.
 */
export type DTCGReferenceValue = { ref: DTCGReference } & {
  [K in DTCGTokenType]?: DTCGTypedToken<K>;
};

/** Union of all raw DTCG $value shapes. */
type DTCGAnyValue = DTCGValueMap[DTCGTokenType];

/**
 * A single mode override entry inside `$extensions.modes`.
 *
 * $value is either:
 *   - A DTCGReferenceValue (Terrazzo resolved alias with `ref` + typed token)
 *   - Any raw DTCG value (for literal mode overrides, e.g. a bare DTCGColorValue)
 */
export interface DTCGModeEntry {
  $value: DTCGReferenceValue | DTCGAnyValue;
}

/** Extensions block on a DTCG token. */
export interface DTCGExtensions {
  modes?: Record<string, DTCGModeEntry>;
  [key: string]: unknown;
}

/**
 * Helper: produces one leaf-token variant for a given $type.
 * Distributive — when K is a union, each member gets its own $value type.
 */
type DTCGLeafTokenOf<K extends DTCGTokenType | "reference"> =
  K extends "reference"
    ? {
        $type: "reference";
        $value: DTCGReferenceValue;
        $description?: string;
        $extensions?: DTCGExtensions;
      }
    : K extends DTCGTokenType
      ? {
          $type: K;
          $value: DTCGValueMap[K];
          $description?: string;
          $extensions?: DTCGExtensions;
        }
      : never;

/**
 * A leaf token in the DTCG document. This is the `originalValue` as seen
 * by the Terrazzo parser for each individual token.
 *
 * This is a proper discriminated union on `$type`: narrowing `$type` to "color"
 * constrains `$value` to `DTCGColorValue`; narrowing to "reference" constrains
 * `$value` to `DTCGReferenceValue`; and so on.
 *
 * "reference" is a Terrazzo-specific pseudo-type for resolved aliases.
 */
export type DTCGLeafToken = DTCGLeafTokenOf<DTCGTokenType | "reference">;

/**
 * A nested DTCG document. Groups contain either more groups or leaf tokens.
 * A leaf token is identified by having a `$type` property.
 */
export type DTCGNode = DTCGLeafToken | DTCGGroup;
export type DTCGGroup = { [key: string]: DTCGNode };

/** A single color entry in the Sass output. */
export interface SassColorLeaf {
  ref?: string[];
  alpha?: number;
  hex: string;
}

/** A single dimension entry in the Sass output. */
export interface SassDimensionLeaf {
  ref?: string[];
  value: string;
}

/** A single border entry in the Sass output. */
export interface SassBorderLeaf {
  ref?: string[];
  color?: SassColorLeaf;
  width?: SassDimensionLeaf;
  style?: string;
}

/**
 * Maps each supported Sass value-type key to its leaf shape.
 *
 * Extend this interface to add new value types to the output.
 * Both `SassModeContent` and the runtime guard `SASS_VALUE_KEYS`
 * (in serializer.ts / index.ts) derive from this map.
 */
export interface SassValueMap {
  color: SassColorLeaf;
  dimension: SassDimensionLeaf;
  border: SassBorderLeaf;
}

/** Known Sass value-type keys, for use in runtime guards. */
export type SassValueKey = keyof SassValueMap;

/**
 * The content for a single mode — at most one value-type entry is present.
 * Auto-derived from SassValueMap so it stays in sync.
 */
export type SassModeContent = {
  [K in SassValueKey]?: SassValueMap[K];
};

/**
 * The mode-expanded leaf for a single token.
 * Keys are mode names (e.g. "light", "dark"); values are the per-mode content.
 */
export type SassModeLeaf = Record<string, SassModeContent>;

/** Recursive Sass tree structure. Leaves are SassModeLeaf, branches are nested maps. */
export type SassTree = { [key: string]: SassTree | SassModeLeaf };

// ─── Plugin Config ──────────────────────────────────────────────────────────

/** Configuration options for the sass-schema plugin. */
export interface SassSchemaPluginConfig {
  /** File prefix for Sass partials. Default: '_' */
  filePrefix?: string;
  /** Number of leading ref path segments to strip (e.g., 1 strips 'primitive-colors'). Default: 1 */
  stripRefSegments?: number;
  /** Mode names to emit (at least one). First mode is the default. Default: ['light', 'dark'] */
  modes?: [string, ...string[]];
  /** Produce indented multi-line Sass output instead of compact single-line. Default: false */
  pretty?: boolean;
}
