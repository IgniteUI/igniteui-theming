/**
 * Compiles every palette the page needs in two passes: one emits the `--ig-*` custom
 * properties the page renders from, the other reports the resolved literal behind each
 * token so the build can measure contrast without a browser.
 */
import { fileURLToPath } from "node:url";
import * as sass from "sass-embedded";

const LOAD_PATH = fileURLToPath(new URL("../../theming", import.meta.url));

export const SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];
export const ACCENTS = ["A100", "A200", "A400", "A700"];
export const ROLES = ["base", "sunken", "raised", "overlay", "container"];
export const SCALES = ["even", "material", "tailwind", "carbon"];

export const SEEDS: [string, string][] = [
  ["Framework primary", "#0099ff"],
  ["Framework secondary", "#df1b74"],
  ["Warn", "#faa419"],
  ["Success", "#4eb862"],
  ["Near-white seed", "#ffe9b0"],
  ["Near-black seed", "#141225"],
  ["Neon", "#00ff00"],
  ["Washed out", "#a99bb0"],
  ["Pure gray", "#8a8a8a"],
];

export const SURFACES: [string, string][] = [
  ["Pure white", "#ffffff"],
  ["Off-white", "#f8f8fa"],
  ["Dark", "#1a1a24"],
  ["Pure black", "#000000"],
];

export type Generator = "legacy" | "fitted";

export interface Scope {
  cls: string;
  families: string[];
  keys: string[];
  expr: string;
}

/** Resolved literals for one scope, keyed `family.shade`. */
export type Resolved = Record<string, string>;

const compile = (source: string) =>
  sass.compileString(source, {
    loadPaths: [LOAD_PATH],
    logger: {
      warn(message, options) {
        // The preview exists to catch generator problems, so a warning from the very
        // code under test is a result, not noise.
        const where = options.span ? ` (${options.span.text})` : "";

        console.warn(`sass: ${message}${where}`);
      },
    },
  }).css;

export const paletteExpr = (
  seed: string,
  surface: string,
  generator: Generator,
  extra = "",
) =>
  `palette($primary: ${seed}, $secondary: ${seed}, $surface: ${surface}, $gray: #333` +
  `${generator === "legacy" ? ", $generator: 'legacy'" : ""}${extra})`;

/** The `--ig-*` declarations the page paints with. */
export const stylesheet = (scopes: Scope[]) =>
  compile(
    `@use 'sass:map';\n@use 'sass/color' as *;\n${scopes
      .map(
        (s) =>
          `.${s.cls} { $p: ${s.expr}; @include palette((` +
          `${s.families.map((f) => `'${f}': map.get($p, '${f}')`).join(", ")})); }`,
      )
      .join("\n")}`,
  );

/**
 * The literal behind every token. `-raw` is the color Sass computed before it was
 * written out as a custom property, so it matches what the browser resolves.
 */
export const resolve = (scopes: Scope[]): Map<string, Resolved> => {
  const css = compile(
    `@use 'sass:map';\n@use 'sass/color' as *;\n${scopes
      .map((s, i) => {
        const rows = s.families.flatMap((f) =>
          s.keys.map(
            (k) =>
              `  ${f}-${k}: '#{map.get(map.get($p, '${f}'), '${k}-raw')}';`,
          ),
        );
        return `s${i} { $p: ${s.expr};\n${rows.join("\n")}\n}`;
      })
      .join("\n")}`,
  );

  const blocks = [...css.matchAll(/s(\d+)\s*\{([^}]*)\}/g)];

  return new Map(
    blocks.map(([, index, body]) => {
      const entries = [...body.matchAll(/([\w-]+):\s*"([^"]+)"/g)].map(
        ([, token, value]) => [token, value] as const,
      );
      return [scopes[Number(index)].cls, Object.fromEntries(entries)];
    }),
  );
};

export const seedLandsOn = (seeds: string[]) => {
  const css = compile(
    `@use 'sass/color' as *;\nout {\n${seeds
      .map(
        (seed, i) =>
          `  s${i}: seed-lands-on(${paletteExpr(seed, "#fff", "fitted")}, 'primary');`,
      )
      .join("\n")}\n}`,
  );

  return seeds.map(
    (_, i) =>
      css
        .match(new RegExp(`s${i}:\\s*"?([^";]+)"?;`))?.[1]
        ?.replace(/"/g, "") ?? "",
  );
};
