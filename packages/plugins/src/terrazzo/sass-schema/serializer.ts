/**
 * Serializes a Sass tree (JS object) into a Sass variable declaration.
 *
 * Uses the Sass JavaScript API to build typed `SassMap` / `SassList` /
 * `SassString` / `SassNumber` objects, then converts them to a string with
 * either the API's natural compact form or an optional multi-line pretty form.
 *
 * Default compact output:
 * ```scss
 * $button-contained: (background: (idle: (light: (color: (ref: (secondary, secondary-500), hex: #df1b74)), dark: (color: (ref: (secondary, secondary-500), hex: #df1b74)))));
 * ```
 *
 * With `pretty: true`:
 * ```scss
 * $button-contained: (
 *   background: (
 *     idle: (
 *       light: (
 *         color: (
 *           ref: (secondary, secondary-500),
 *           hex: #df1b74,
 *         ),
 *       ),
 *     ),
 *   ),
 * );
 * ```
 */

import { OrderedMap } from "immutable";
import type { Value } from "sass-embedded";
import { SassList, SassMap, SassNumber, SassString } from "sass-embedded";

import { isSassModeLeaf, SASS_VALUE_KEYS } from "./guards.js";
import type {
  SassBorderLeaf,
  SassColorLeaf,
  SassDimensionLeaf,
  SassModeContent,
  SassModeLeaf,
  SassTree,
  SassValueKey,
} from "./types.js";

/** Bare (unquoted) Sass string — used for identifiers, hex values, dimension strings. */
const unquoted = (s: string): SassString =>
  new SassString(s, { quotes: false });

/** Parenthesized comma-separated ref path, e.g. `(secondary, 500, ...)`. */
const refList = (refs: string[]): SassList => {
  return new SassList([...refs.map(unquoted)], {
    separator: ",",
    brackets: false,
  });
};

/** A single string-key / Sass-value pair ready for use in `OrderedMap`. */
const pair = (key: string, value: Value): [Value, Value] => [
  unquoted(key),
  value,
];

/** Build a `SassMap` from an ordered list of string-keyed pairs. */
const buildMap = (pairs: [Value, Value][]): SassMap =>
  new SassMap(OrderedMap(pairs));

function colorLeafToSassMap(leaf: SassColorLeaf): SassMap {
  return buildMap([
    ...(leaf.ref !== undefined
      ? [pair("ref", unquoted(`(${refList(leaf.ref)})`))]
      : []),
    ...(leaf.alpha !== undefined
      ? [pair("alpha", new SassNumber(leaf.alpha))]
      : []),
    pair("hex", unquoted(leaf.hex)),
  ]);
}

function dimensionLeafToSassMap(leaf: SassDimensionLeaf): SassMap {
  return buildMap([
    ...(leaf.ref !== undefined
      ? [pair("ref", unquoted(`(${refList(leaf.ref)})`))]
      : []),
    pair("value", unquoted(leaf.value)),
  ]);
}

function borderLeafToSassMap(leaf: SassBorderLeaf): SassMap {
  return buildMap([
    ...(leaf.ref !== undefined
      ? [pair("ref", unquoted(`(${refList(leaf.ref)})`))]
      : []),
    ...(leaf.color !== undefined
      ? [pair("color", colorLeafToSassMap(leaf.color))]
      : []),
    ...(leaf.width !== undefined
      ? [pair("width", dimensionLeafToSassMap(leaf.width))]
      : []),
    ...(leaf.style !== undefined ? [pair("style", unquoted(leaf.style))] : []),
  ]);
}

/** Map of value-type key to the function that converts its leaf into a SassMap. */
const valueSerializers: Partial<
  Record<SassValueKey, (leaf: SassModeContent[SassValueKey]) => SassMap>
> = {
  color: (leaf) => colorLeafToSassMap(leaf as SassColorLeaf),
  dimension: (leaf) => dimensionLeafToSassMap(leaf as SassDimensionLeaf),
  border: (leaf) => borderLeafToSassMap(leaf as SassBorderLeaf),
};

function modeContentToSassMap(content: SassModeContent): SassMap {
  for (const key of SASS_VALUE_KEYS) {
    const leaf = content[key];
    const serializer = valueSerializers[key];

    if (leaf && serializer) {
      return buildMap([pair(key, serializer(leaf))]);
    }
  }

  return buildMap([]);
}

function modeLeafToSassMap(leaf: SassModeLeaf): SassMap {
  return buildMap(
    Object.entries(leaf).map(([mode, content]) =>
      pair(mode, modeContentToSassMap(content)),
    ),
  );
}

export function treeToSassMap(tree: SassTree): SassMap {
  return buildMap(
    Object.entries(tree).map(([key, value]) => {
      if (isSassModeLeaf(value)) {
        return pair(key, modeLeafToSassMap(value));
      }

      return pair(key, treeToSassMap(value as SassTree));
    }),
  );
}

/**
 * Recursively format a Sass value as indented multi-line text.
 * `SassMap` → multi-line with trailing commas; everything else → `.toString()`.
 */
function prettyPrint(value: Value, depth = 0): string {
  if (value instanceof SassMap) {
    const pad = String("").padStart(depth * 2);
    const inner = String("").padStart((depth + 1) * 2);
    const lines: string[] = [];

    for (const [k, v] of value.contents.entries()) {
      lines.push(`${inner}${k.toString()}: ${prettyPrint(v, depth + 1)},\n`);
    }

    return `(\n${lines.join("")}${pad})`;
  }

  return value.toString();
}

/**
 * Serialize a Sass tree to a complete Sass variable declaration.
 *
 * @param tree - The nested Sass tree to serialize.
 * @param variableName - The Sass variable name (without `$`), e.g. `"button-contained"`.
 * @param pretty - When `true`, produce indented multi-line output. Default: `false` (compact).
 * @returns Complete Sass string with variable declaration.
 */
export function serializeToSass(
  tree: SassTree,
  variableName: string,
  pretty = false,
): string {
  const map = treeToSassMap(tree);
  const body = pretty ? prettyPrint(map) : map.toString();

  return `$${variableName}: ${body};\n`;
}
