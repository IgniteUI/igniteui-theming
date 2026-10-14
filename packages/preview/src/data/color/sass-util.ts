/**
 * What every color provider needs to compile a probe stylesheet against the library.
 */
import { fileURLToPath } from "node:url";
import * as sass from "sass-embedded";
import { SHADES } from "../../variants.js";

/** The theming package, which the probes `@use` by path. */
export const THEMING = new URL("../../../../theming/", import.meta.url);

/** The Sass sources whose contents change what a color provider produces. */
export const COLOR_SASS = fileURLToPath(new URL("sass/color/", THEMING));

/**
 * Sass serialises a color to its shortest form, so a seed written as `white` or `red`
 * interpolates as that keyword rather than as a hex literal. Emitting through
 * `ie-hex-str` — the one built-in that always produces `#AARRGGBB` — keeps every seed in
 * a single shape the Node side can parse.
 *
 * Split in two because `@use` is only legal at the top of a stylesheet, above the
 * function definitions the callers interleave with their own.
 */
export const HEX_USE = `@use 'sass:color';\n@use 'sass:meta';\n@use 'sass:string';\n`;

export const HEX_FN =
  `@function _hex($c) { @return '#' + string.slice(color.ie-hex-str($c), 4); }\n` +
  // A resolved shade is usually a relative-color string the browser finishes, but a
  // plain color comes back a color — and so gets the same keyword treatment. `rgba()`
  // rather than `_hex()` because a shade may carry alpha.
  //
  // Only legacy-rgb colors are rewritten. A legacy `hsl()` is left exactly as written:
  // its saturation routinely exceeds 100%, and asking for a red channel would both fail
  // and throw away the out-of-gamut position the reader is here to see.
  "@function _lit($v) {\n" +
  `  @if meta.type-of($v) != 'color' { @return $v; }\n` +
  `  @if color.space($v) != 'rgb' { @return $v; }\n` +
  `  @return 'rgba(' + color.channel($v, 'red') + ',' + color.channel($v, 'green')\n` +
  `    + ',' + color.channel($v, 'blue') + ',' + color.alpha($v) + ')';\n` +
  "}\n";

/** The ten raw shade literals of a compiled family, `|`-separated, through `_lit`. */
export const shadeList = (name: string) =>
  SHADES.map((shade) => `#{_lit(map.get(${name}, "${shade}-raw"))}`).join("|");

export interface CompileOptions {
  /** Warnings matching this are expected by the probe and not worth reporting. */
  expected?: RegExp;
}

/**
 * Compiles a probe stylesheet with the theming package on the load path.
 *
 * Sass warnings come back with the CSS so a provider can carry them in its output: the
 * plugin reports them whenever it serves the module, cached or not, which is how
 * "shade 900 wanted 16.1:1 but its hue only reaches 15.2:1" reaches the terminal on
 * every run and not only the one that compiled it.
 */
export const compile = (source: string, { expected }: CompileOptions = {}) => {
  const warnings = new Set<string>();

  const { css } = sass.compileString(source, {
    loadPaths: [fileURLToPath(THEMING)],
    logger: {
      warn(message, options) {
        const where = options.span ? ` (${options.span.text})` : "";
        warnings.add(`${message}${where}`);
      },
    },
  });

  return {
    css,
    warnings: [...warnings].filter((warning) => !expected?.test(warning)),
  };
};
