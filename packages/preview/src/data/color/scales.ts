/**
 * An exact `(position, contrast target) -> color` table per subject, so `range` and
 * `curve` can be manipulated live without reimplementing the generator.
 *
 * The trick is a degenerate range: compiling `shades()` with `range: X X` pins every
 * shade to the same contrast target while each keeps its own position-dependent chroma
 * taper. Sweeping X across the reachable span therefore yields the whole table, and a
 * scale is then a lookup rather than a computation.
 *
 * Reproduces every shipped preset closely rather than exactly: 78% of shades match the
 * generator's output bit for bit, 99% are within one step per channel, and none is more
 * than two — well under a perceptible difference, and guarded by `scales.spec.ts`.
 *
 * Gray is included twice, on a light and a dark page, because a neutral family is
 * anchored to the background rather than to white — which is the whole reason the
 * `material` scale exists, and it cannot be shown on a chromatic family.
 */
import { contrast, hex, toRgb } from "../../color.js";
import type { Anchor, ScaleTable } from "../../scale-math.js";
import { PRESETS, SHADES, THEMES, type Theme } from "../../variants.js";
import { defineProvider } from "../provider.js";
import { register } from "../registry.js";
import {
  COLOR_SASS,
  compile,
  HEX_FN,
  HEX_USE,
  shadeList,
} from "./sass-util.js";

/** How many contrast targets are sampled, geometrically, across the span below. */
export const SAMPLES = 400;
export const SPAN: [number, number] = [1, 21];

export interface ScaleSubject {
  key: string;
  label: string;
  /** For a narrow picker: an embed in an article column, on a phone. */
  short: string;
  /** Which `<preset>-<theme>` selections this subject serves. */
  presets: string[];
  /** What the reader is looking at, in one line. */
  note: string;
  family: "primary" | "gray";
  seed: string;
  surface: string;
  /** What contrast is measured against: white for a chromatic family, the page for gray. */
  anchor: string;
  table: ScaleTable;
  /** The highest contrast this subject can actually reach against its anchor. */
  ceiling: number;
  /**
   * Gray only: the same family under a white-anchored scale — measured against white,
   * and reversed on a dark page.
   */
  white?: { table: ScaleTable; ceiling: number };
}

type Definition = Omit<ScaleSubject, "table" | "ceiling" | "white">;

export interface ScaleData {
  subjects: ScaleSubject[];
  /** Sass warnings raised while compiling, reported by the plugin on every serve. */
  warnings: string[];
}

interface Seeds {
  name: string;
  theme: Theme;
  primary: string;
  gray: string;
  surface: string;
}

/** Read from the shipped palettes so the editor's subjects are the ones the picker offers. */
const readSeeds = (): Seeds[] => {
  const rules = PRESETS.flatMap(({ key }) =>
    THEMES.map(
      (theme) =>
        `s-${theme}-${key} { ` +
        (["primary", "gray", "surface"] as const)
          .map(
            (f) =>
              `${f}: '#{_hex(map.get(map.get($${theme}-${key}-palette, "${f}"), "seed"))}';`,
          )
          .join(" ") +
        " }",
    ),
  );
  const { css } = compile(
    `@use 'sass:map';\n@use 'sass/color/presets' as *;\n${HEX_USE}${HEX_FN}${rules.join("\n")}`,
  );

  return [...css.matchAll(/s-(\w+)-(\w+)\s*\{([^}]*)\}/g)].map(
    ([, theme, name, body]) =>
      ({
        name,
        theme,
        ...Object.fromEntries(
          [...body.matchAll(/([\w-]+):\s*"([^"]+)"/g)].map(([, key, value]) => [
            key,
            value,
          ]),
        ),
      }) as Seeds,
  );
};

const capitalise = (name: string) => name[0].toUpperCase() + name.slice(1);

/**
 * One subject per distinct (family, seed, surface). Several presets share a surface, and
 * a chromatic family is anchored to white whatever the page is, so the list collapses
 * well below one entry per preset.
 */
const definitions = (): Definition[] => {
  const seen = new Map<string, Definition>();

  for (const entry of readSeeds()) {
    const candidates: Definition[] = [
      {
        key: `${entry.name}-primary`,
        label: `${capitalise(entry.name)} primary`,
        short: "Primary",
        note: "A color family, measured against white.",
        family: "primary",
        seed: entry.primary,
        surface: "#ffffff",
        anchor: "#ffffff",
        presets: [],
      },
      {
        key: `${entry.name}-${entry.theme}-gray`,
        label: `Gray on a ${entry.theme} page`,
        short: `Gray on ${entry.theme}`,
        note: "Measured against the page instead of white. This is the family the material scale was tuned for.",
        family: "gray",
        seed: entry.gray,
        surface: entry.surface,
        anchor: entry.surface,
        presets: [],
      },
    ];

    for (const subject of candidates) {
      const id = `${subject.family}|${subject.seed}|${subject.surface}`;
      const tag = `${entry.name}-${entry.theme}`;
      const existing = seen.get(id);

      if (existing) existing.presets.push(tag);
      else seen.set(id, { ...subject, presets: [tag] });
    }
  }

  return [...seen.values()];
};

/** The contrast targets sampled, geometrically spaced so each step is a constant ratio. */
const sampled = () =>
  Array.from(
    { length: SAMPLES },
    (_, k) => SPAN[0] * (SPAN[1] / SPAN[0]) ** (k / (SAMPLES - 1)),
  );

/** One rule per target: every shade pinned to the same contrast. */
const probe = (
  index: string,
  subject: Definition,
  target: number,
  anchor: Anchor,
) => {
  const surface =
    subject.family === "gray" ? `, $surface: ${subject.surface}` : "";
  const range = `${target.toFixed(5)} ${target.toFixed(5)}`;

  return (
    `o${index} { $s: shades('${subject.family}', ${subject.seed}, types.$INumericShades` +
    `${surface}, $scale: (range: ${range}, curve: null, anchor: '${anchor}')); v: '${shadeList("$s")}'; }`
  );
};

/** The sampled rows of one subject's table, and the most contrast they reach. */
const tableOf = (
  payloads: Map<string, string[]>,
  prefix: string,
  key: string,
  anchor: string,
) => {
  const rows = SHADES.map(() => [] as string[]);

  for (let k = 0; k < SAMPLES; k++) {
    const literals = payloads.get(`${prefix}_${k}`);
    if (!literals)
      throw new Error(`scales: missing rule for ${key} sample ${k}`);

    literals.forEach((literal, position) => {
      rows[position].push(hex(toRgb(literal)).slice(1));
    });
  }

  const reference = toRgb(anchor);
  const ceiling = Math.max(
    ...rows.flatMap((row) =>
      row.map((h) => contrast(toRgb(`#${h}`), reference)),
    ),
  );

  return {
    ceiling: Number(ceiling.toFixed(3)),
    table: {
      samples: SAMPLES,
      span: SPAN,
      rows: rows.map((row) => row.join("")),
    },
  };
};

export const scaleData = defineProvider<ScaleData>({
  id: "color.scales",
  module: import.meta.url,
  deps: [COLOR_SASS],
  build() {
    const subjects = definitions();
    const targets = sampled();
    const rules = subjects.flatMap((subject, s) => [
      ...targets.map((target, k) =>
        probe(`${s}s_${k}`, subject, target, "surface"),
      ),
      ...(subject.family === "gray"
        ? targets.map((target, k) =>
            probe(`${s}w_${k}`, subject, target, "white"),
          )
        : []),
    ]);
    const { css, warnings } = compile(
      `@use 'sass:map';\n@use 'sass/color' as *;\n@use 'sass/color/types' as types;\n` +
        HEX_USE +
        HEX_FN +
        rules.join("\n"),
      {
        // Sampling deliberately runs past what a subject can reach, so the generator's
        // "wanted X but only reaches Y" is the probe working, not a problem. `ceiling`
        // carries the same information, per subject.
        expected: /wanted [\d.]+:1 but its hue only reaches/,
      },
    );

    const payloads = new Map<string, string[]>();
    for (const [, index, payload] of css.matchAll(
      /o(\d+[sw]_\d+)\s*\{\s*v:\s*"([^"]+)"/g,
    )) {
      payloads.set(index, payload.split("|"));
    }

    return {
      warnings,
      subjects: subjects.map((subject, s) => ({
        ...subject,
        ...tableOf(payloads, `${s}s`, subject.key, subject.anchor),
        white:
          subject.family === "gray"
            ? tableOf(payloads, `${s}w`, subject.key, "#ffffff")
            : undefined,
      })),
    };
  },
});

register(scaleData);
