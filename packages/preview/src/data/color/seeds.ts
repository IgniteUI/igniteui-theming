/**
 * Two seeds at opposite ends of the lightness axis, compiled through both generators.
 *
 * The article's opening argument in data: the legacy generator pins every seed to shade
 * 500 and multiplies outward, so a near-black seed yields a family of near-blacks and a
 * near-white one yields a run of whites. Same hue and saturation on both, so lightness is
 * the only thing that differs.
 */
import { SHADES } from "../../variants.js";
import { defineProvider } from "../provider.js";
import { register } from "../registry.js";
import type { PresetSide } from "./presets.js";
import { COLOR_SASS, compile, HEX_FN, HEX_USE } from "./sass-util.js";

/** Edit these to change the demo; the article quotes them, so keep the two in step. */
export const SEEDS = [
  { key: "dark", label: "Dark blue", css: "hsl(210 80% 10%)" },
  { key: "pale", label: "Pale blue", css: "hsl(210 80% 90%)" },
] as const;

type Generator = "legacy" | "fitted";
const GENERATORS: Generator[] = ["legacy", "fitted"];

export interface SeedEntry {
  key: string;
  label: string;
  /** As written in the article and in the Sass call. */
  css: string;
  /** The same color as a hex literal, for the chip. */
  hex: string;
  legacy: PresetSide;
  fitted: PresetSide;
}

export interface SeedData {
  seeds: SeedEntry[];
  warnings: string[];
}

const call = (seed: string, generator: Generator) =>
  `palette($primary: ${seed}, $secondary: #df1b74, $surface: #fff, $generator: '${generator}')`;

const probe = ({ key, css }: (typeof SEEDS)[number]) =>
  [
    `hex-${key} { hex: '#{_hex(${css})}'; }`,
    ...GENERATORS.flatMap((generator) => [
      `.s-${key}-${generator} { $s: ${call(css, generator)}; @include palette($s); }`,
      `val-${key}-${generator} {\n  $s: ${call(css, generator)};\n` +
        SHADES.map(
          (shade) =>
            `  primary-${shade}: '#{_lit(map.get(map.get($s, "primary"), "${shade}-raw"))}';`,
        ).join("\n") +
        "\n}",
    ]),
  ].join("\n");

const PRELUDE = `@use 'sass:map';\n@use 'sass/color' as *;\n${HEX_USE}${HEX_FN}`;

/**
 * The primary family's declarations. The palette mixin emits more than one rule for a
 * selector, so every rule with this class is read.
 */
const primaryVars = (css: string, selector: string) => {
  const out: Record<string, string> = {};

  for (const [, name, body] of css.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
    if (name !== selector) continue;

    for (const [, prop, value] of body.matchAll(
      /(--ig-primary-[\w-]+):\s*([^;]+);/g,
    )) {
      out[prop] = value.trim();
    }
  }

  if (!Object.keys(out).length)
    throw new Error(`seeds: no primary tokens in .${selector}`);
  return out;
};

const quoted = (css: string, selector: string) => {
  const rule = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
  if (!rule) throw new Error(`seeds: missing ${selector}`);

  return Object.fromEntries(
    [...rule[1].matchAll(/([\w-]+):\s*"([^"]*)"/g)].map(([, name, value]) => [
      name,
      value,
    ]),
  );
};

export const seedData = defineProvider<SeedData>({
  id: "color.seeds",
  module: import.meta.url,
  deps: [COLOR_SASS],
  build() {
    const { css, warnings } = compile(PRELUDE + SEEDS.map(probe).join("\n"));

    const side = (key: string, generator: Generator): PresetSide => ({
      vars: primaryVars(css, `s-${key}-${generator}`),
      values: quoted(css, `val-${key}-${generator}`),
    });

    return {
      warnings,
      seeds: SEEDS.map((seed) => ({
        ...seed,
        hex: quoted(css, `hex-${seed.key}`).hex,
        legacy: side(seed.key, "legacy"),
        fitted: side(seed.key, "fitted"),
      })),
    };
  },
});

register(seedData);
