/**
 * Every hue at several saturations, through both generators.
 *
 * Sweeping hue alone would only test one slice of seed space, and the most obvious
 * objection to the result is that maximally saturated seeds are unrepresentative. The
 * saturation axis is here to answer that rather than to be pretty.
 */
import {
  displayable,
  failingPairs,
  hex,
  PAIR_DISTANCE,
  parseRaw,
  toRgb,
} from "../../color.js";
import { SHADES } from "../../variants.js";
import { defineProvider } from "../provider.js";
import { register } from "../registry.js";
import {
  COLOR_SASS,
  compile,
  HEX_FN,
  HEX_USE,
  shadeList,
} from "./sass-util.js";

/** Muted, mid and vivid. Brand colors land across this span. */
export const SATURATIONS = [35, 60, 85];
export const HUE_STEP = 1;

export interface SweepRamp {
  /** Ten shades, concatenated six-digit hex, as the display will paint them. */
  hex: string;
  /** Bit per shade: the generator asked for a color outside sRGB. */
  mask: number;
  /** Unclipped `r, g, b` of the masked shades only — where each one asked to be. */
  ask: number[];
}

export interface SweepRow {
  saturation: number;
  /** Six-digit hex per hue step. */
  seeds: string[];
  legacy: SweepRamp[];
  fitted: SweepRamp[];
}

export interface SweepTotals {
  seeds: number;
  pairs: number;
  shades: number;
  legacyFails: number;
  fittedFails: number;
  legacyOog: number;
  fittedOog: number;
  legacyDup: number;
  fittedDup: number;
  /** Seeds where all five pairs clear AA. */
  legacyClean: number;
  fittedClean: number;
}

export interface SweepData {
  saturations: number[];
  hueStep: number;
  rows: SweepRow[];
  totals: SweepTotals;
  /** Sass warnings raised while compiling, reported by the plugin on every serve. */
  warnings: string[];
}

const hues = () => {
  const out: number[] = [];
  for (let hue = 0; hue < 360; hue += HUE_STEP) out.push(hue);
  return out;
};

/** A seed per rule, both generators run on it, the results joined by `#`. */
const probe = (index: number, seed: string) =>
  `o${index} { $s: ${seed}; ` +
  `$l: shades('primary', $s, types.$INumericShades, $generator: 'legacy'); ` +
  `$f: shades('primary', $s, types.$INumericShades); ` +
  `v: '#{$s}#${shadeList("$l")}#${shadeList("$f")}'; }`;

/** Reads a ramp's literals into what the browser paints and what the generator asked for. */
const measure = (literals: string[]) => {
  const clipped = literals.map(toRgb);
  const ask: number[] = [];
  let mask = 0;

  literals.forEach((literal, index) => {
    const [r, g, b] = parseRaw(literal);
    if (displayable([r, g, b])) return;
    mask |= 1 << index;
    ask.push(r, g, b);
  });

  return {
    ramp: { hex: clipped.map((c) => hex(c).slice(1)).join(""), mask, ask },
    fails: failingPairs(clipped),
    oog: ask.length / 3,
    dup: clipped.length - new Set(clipped.map(String)).size,
  };
};

export const sweepData = defineProvider<SweepData>({
  id: "color.sweep",
  module: import.meta.url,
  deps: [COLOR_SASS],
  build() {
    const seeds = SATURATIONS.flatMap((saturation) =>
      hues().map((hue) => ({
        saturation,
        seed: `hsl(${hue}, ${saturation}%, 50%)`,
      })),
    );
    const { css, warnings } = compile(
      `@use 'sass:map';\n@use 'sass/color' as *;\n@use 'sass/color/types' as types;\n` +
        HEX_USE +
        HEX_FN +
        seeds.map((s, i) => probe(i, s.seed)).join("\n"),
    );

    const payloads = new Map<number, string[]>();
    for (const [, index, payload] of css.matchAll(
      /o(\d+)\s*\{\s*v:\s*"([^"]+)"/g,
    )) {
      payloads.set(Number(index), payload.split("#"));
    }

    const totals: SweepTotals = {
      seeds: 0,
      pairs: 0,
      shades: 0,
      legacyFails: 0,
      fittedFails: 0,
      legacyOog: 0,
      fittedOog: 0,
      legacyDup: 0,
      fittedDup: 0,
      legacyClean: 0,
      fittedClean: 0,
    };
    const rows: SweepRow[] = SATURATIONS.map((saturation) => ({
      saturation,
      seeds: [],
      legacy: [],
      fitted: [],
    }));

    seeds.forEach(({ saturation }, index) => {
      const parts = payloads.get(index);
      if (!parts) throw new Error(`sweep: missing rule ${index}`);

      const row = rows[SATURATIONS.indexOf(saturation)];
      const legacy = measure(parts[1].split("|"));
      const fitted = measure(parts[2].split("|"));

      row.seeds.push(hex(toRgb(parts[0])).slice(1));
      row.legacy.push(legacy.ramp);
      row.fitted.push(fitted.ramp);

      totals.seeds++;
      totals.pairs += SHADES.length - PAIR_DISTANCE;
      totals.shades += SHADES.length;
      totals.legacyFails += legacy.fails;
      totals.fittedFails += fitted.fails;
      totals.legacyOog += legacy.oog;
      totals.fittedOog += fitted.oog;
      totals.legacyDup += legacy.dup;
      totals.fittedDup += fitted.dup;
      if (!legacy.fails) totals.legacyClean++;
      if (!fitted.fails) totals.fittedClean++;
    });

    return {
      saturations: SATURATIONS,
      hueStep: HUE_STEP,
      rows,
      totals,
      warnings,
    };
  },
});

register(sweepData);
