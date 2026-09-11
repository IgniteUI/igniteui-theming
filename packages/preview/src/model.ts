/** Turns compiled palettes into the view model the page renders. */
import { composite, contrast, hex, parse, type Rgb } from "./color.js";
import {
  ACCENTS,
  type Generator,
  paletteExpr,
  type Resolved,
  ROLES,
  resolve,
  SCALES,
  type Scope,
  SEEDS,
  SHADES,
  SURFACES,
  seedLandsOn,
  stylesheet,
} from "./palettes.js";

const AA = 4.5;
/** Below this the shade is indistinguishable from the surface it sits on. */
const SAME = 1.005;

export interface Swatch {
  key: string;
  token: string;
  rgb: Rgb;
  ratio: number;
  hex: string;
  against: string;
}

export interface Row {
  cls: string;
  label: string;
  swatches: Swatch[];
  verdict: string;
  ok: boolean;
}

export interface Role {
  key: string;
  away: number;
  collapsed: boolean;
}

export interface Ramp {
  label: string;
  seed: string;
  lands: string;
  shades: Row[];
  accents: Row[];
}

export interface Neutral {
  label: string;
  bg: string;
  fittedCls: string;
  legacySurface: Row;
  roles: Role[];
  grays: Row[];
}

export interface Score {
  legacyAA: number;
  fittedAA: number;
  legacyDup: number;
  fittedDup: number;
  pairs: number;
}

export interface Model {
  css: string;
  ramps: Ramp[];
  neutrals: Neutral[];
  flavors: { name: string; row: Row }[];
  score: Score;
}

const swatch = (
  family: string,
  key: string,
  literal: string,
  against: Rgb,
  label: string,
): Swatch => {
  const color = composite(parse(literal), [...against, 1]);
  return {
    key,
    token: `--ig-${family}-${key}`,
    rgb: color,
    ratio: contrast(color, against),
    hex: hex(color),
    against: label,
  };
};

const rgbOf = (swatches: Swatch[]) => swatches.map((s) => s.hex);

/** Any two shades five apart must clear AA — the guarantee the fitted generator makes. */
const failures = (swatches: Swatch[]) => {
  let fails = 0;

  for (let i = 0; i + 5 < swatches.length; i++) {
    if (contrast(swatches[i].rgb, swatches[i + 5].rgb) < AA) fails++;
  }

  return fails;
};

interface RowSpec {
  /** Scope class the palette was compiled under, and the row's caption. */
  cls: string;
  label: string;
  /** Which family, which of its keys, and the resolved literals to read them from. */
  family: string;
  keys: string[];
  resolved: Resolved;
  /** What the swatches are measured against, and how to name it. */
  against: Rgb;
  againstLabel: string;
  /** Whether to score the "500 apart clears AA" guarantee, which only ramps make. */
  scored?: boolean;
}

const row = ({
  cls,
  label,
  family,
  keys,
  resolved,
  against,
  againstLabel,
  scored = false,
}: RowSpec): Row => {
  const swatches = keys.map((k) =>
    swatch(family, k, resolved[`${family}-${k}`], against, againstLabel),
  );
  const dup = swatches.length - new Set(rgbOf(swatches)).size;
  const fails = scored ? failures(swatches) : 0;
  const bits: string[] = [];

  if (scored)
    bits.push(fails ? `${fails}/5 AA pairs fail` : "all 5 AA pairs pass");
  if (dup) bits.push(`${dup} duplicate${dup > 1 ? "s" : ""}`);

  return {
    cls,
    label,
    swatches,
    verdict: bits.join(" · "),
    ok: !fails && !dup,
  };
};

export const build = (): Model => {
  const scopes: Scope[] = [];
  const push = (
    cls: string,
    families: string[],
    keys: string[],
    seed: string,
    surface: string,
    generator: Generator,
    extra = "",
  ) => {
    scopes.push({
      cls,
      families,
      keys,
      expr: paletteExpr(seed, surface, generator, extra),
    });
    return cls;
  };

  const rampScopes = SEEDS.map(([, seed], i) => ({
    seed,
    legacy: push(
      `r${i}l`,
      ["primary"],
      [...SHADES, ...ACCENTS],
      seed,
      "#fff",
      "legacy",
    ),
    fitted: push(
      `r${i}f`,
      ["primary"],
      [...SHADES, ...ACCENTS],
      seed,
      "#fff",
      "fitted",
    ),
  }));

  const neutralScopes = SURFACES.map(([, bg], i) => ({
    bg,
    legacy: push(`n${i}l`, ["gray", "surface"], SHADES, "#09f", bg, "legacy"),
    fitted: push(`n${i}f`, ["gray"], SHADES, "#09f", bg, "fitted"),
    roles: push(`n${i}r`, ["surface"], ROLES, "#09f", bg, "fitted"),
  }));

  const flavorScopes = SCALES.map((name) => ({
    name,
    cls: push(
      `sc-${name}`,
      ["gray"],
      SHADES,
      "#09f",
      "#fff",
      "fitted",
      `, $scales: ('gray': '${name}')`,
    ),
  }));

  const css = stylesheet(scopes);
  const values = resolve(scopes);
  const at = (cls: string) => values.get(cls) as Resolved;
  const lands = seedLandsOn(SEEDS.map(([, seed]) => seed));
  const white = parse("#ffffff").slice(0, 3) as Rgb;
  const score: Score = {
    legacyAA: 0,
    fittedAA: 0,
    legacyDup: 0,
    fittedDup: 0,
    pairs: 0,
  };

  const ramps = SEEDS.map(([label, seed], i) => {
    const { legacy, fitted } = rampScopes[i];
    const ramp = (
      cls: string,
      label: string,
      keys: string[],
      scored: boolean,
    ) =>
      row({
        cls,
        label,
        family: "primary",
        keys,
        resolved: at(cls),
        against: white,
        againstLabel: "white",
        scored,
      });
    const shades = [
      ramp(legacy, "legacy", SHADES, true),
      ramp(fitted, "fitted", SHADES, true),
    ];

    score.pairs += 5;
    score.legacyAA += failures(shades[0].swatches);
    score.fittedAA += failures(shades[1].swatches);
    score.legacyDup +=
      shades[0].swatches.length - new Set(rgbOf(shades[0].swatches)).size;
    score.fittedDup +=
      shades[1].swatches.length - new Set(rgbOf(shades[1].swatches)).size;

    return {
      label,
      seed,
      lands: lands[i],
      shades,
      accents: [
        ramp(legacy, "legacy accent", ACCENTS, false),
        ramp(fitted, "fitted accent", ACCENTS, false),
      ],
    };
  });

  const neutrals = SURFACES.map(([label, bg], i) => {
    const { legacy, fitted, roles } = neutralScopes[i];
    const page = parse(bg).slice(0, 3) as Rgb;
    const onPage = (cls: string, label: string, family: string) =>
      row({
        cls,
        label,
        family,
        keys: SHADES,
        resolved: at(cls),
        against: page,
        againstLabel: `the page ${bg}`,
        scored: true,
      });

    return {
      label,
      bg,
      fittedCls: roles,
      legacySurface: onPage(legacy, "legacy", "surface"),
      roles: ROLES.map((key) => {
        const away = contrast(
          composite(parse(at(roles)[`surface-${key}`]), [...page, 1]),
          page,
        );
        return { key, away, collapsed: away < SAME };
      }),
      grays: [
        onPage(legacy, "legacy", "gray"),
        onPage(fitted, "fitted", "gray"),
      ],
    };
  });

  const flavors = flavorScopes.map(({ name, cls }) => ({
    name,
    row: row({
      cls,
      label: name,
      family: "gray",
      keys: SHADES,
      resolved: at(cls),
      against: white,
      againstLabel: "white",
    }),
  }));

  return { css, ramps, neutrals, flavors, score };
};
