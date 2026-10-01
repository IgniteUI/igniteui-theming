/** Turns a compiled preset into the view model the color views render. */

import {
  composite,
  contrast,
  displayable,
  hex,
  parse,
  parseRaw,
  type Rgb,
  toRgb,
} from "./color.js";
import type { Preset, PresetSide } from "./data/color/presets.js";
import {
  ACCENTS,
  type Family,
  ROLES,
  type RoleKey,
  SHADES,
  type Theme,
} from "./variants.js";

/** Below this the shade is indistinguishable from the surface it sits on. */
const SAME = 1.005;

/**
 * The families that get the full ten shades plus accents. `gray` and `surface` are
 * shown on their own terms, because both are about the page rather than about a color.
 */
export const CHROMATIC: { key: Family; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "info", label: "Info" },
  { key: "success", label: "Success" },
  { key: "warn", label: "Warn" },
  { key: "error", label: "Error" },
];

export interface Swatch {
  key: string;
  token: string;
  rgb: Rgb;
  ratio: number;
  hex: string;
  against: string;
  /** The shade asked for a color outside sRGB, and the browser clipped it to fit. */
  clipped: boolean;
  /** Keys of other shades in the same row that resolve to this exact color. */
  same: string[];
}

export interface Row {
  /** The custom properties this row paints from, applied to its own subtree. */
  vars: Record<string, string>;
  label: string;
  swatches: Swatch[];
  /** Whether a pinned shade number applies here. Accents run on their own keys. */
  probeable: boolean;
}

export interface Role {
  key: RoleKey;
  /** Contrast against the page. */
  away: number;
  /** The role had no room and resolved onto the page. */
  collapsed: boolean;
}

export interface FamilyBlock {
  key: Family;
  label: string;
  seed: string;
  shades: Row[];
  accents: Row[];
}

export interface SurfaceBlock {
  /** The page the preset paints on, and what grays are measured against. */
  bg: string;
  seed: string;
  fittedVars: Record<string, string>;
  legacySurface: Row;
  roles: Role[];
  grays: Row[];
}

export interface PresetModel {
  key: string;
  label: string;
  theme: Theme;
  bg: string;
  families: FamilyBlock[];
  surface: SurfaceBlock;
}

interface RowSpec {
  side: PresetSide;
  label: string;
  family: Family;
  keys: readonly string[];
  against: Rgb;
  againstLabel: string;
  /** Whether the row takes part in the probe, which only the numbered ramps do. */
  probeable?: boolean;
}

const swatch = (
  family: Family,
  key: string,
  literal: string,
  against: Rgb,
  label: string,
): Swatch => {
  const color = composite(parse(literal), against);

  return {
    key,
    token: `--ig-${family}-${key}`,
    rgb: color,
    ratio: contrast(color, against),
    hex: hex(color),
    against: label,
    clipped: !displayable(toRgbRaw(literal)),
    same: [],
  };
};

const toRgbRaw = (literal: string): Rgb => {
  const [r, g, b] = parseRaw(literal);
  return [r, g, b];
};

/**
 * Marks every shade that resolves to the same color as another in its row.
 *
 * Two tokens with one color is the quiet failure: a border drawn in 600 over a fill of
 * 700 simply is not there, and nothing in the markup says so. It happens when a ramp is
 * asked for ten steps in a direction that has fewer than ten left.
 */
export const markTwins = (swatches: Swatch[]) => {
  const byColor = new Map<string, Swatch[]>();

  for (const entry of swatches) {
    const group = byColor.get(entry.hex) ?? [];
    group.push(entry);
    byColor.set(entry.hex, group);
  }

  for (const group of byColor.values()) {
    if (group.length < 2) continue;

    for (const entry of group) {
      entry.same = group.filter((o) => o !== entry).map((o) => o.key);
    }
  }
};

const row = ({
  side,
  label,
  family,
  keys,
  against,
  againstLabel,
  probeable = false,
}: RowSpec): Row => {
  const swatches = keys.map((key) =>
    swatch(family, key, side.values[`${family}-${key}`], against, againstLabel),
  );

  markTwins(swatches);

  return { vars: side.vars, label, swatches, probeable };
};

const WHITE: Rgb = [255, 255, 255];

/**
 * The ten numbered shades of one chromatic family, measured against white. For a view
 * that shows a family on its own rather than as part of a shipped preset.
 */
export const familyRow = (
  side: PresetSide,
  label: string,
  family: Family,
): Row =>
  row({
    side,
    label,
    family,
    keys: SHADES,
    against: WHITE,
    againstLabel: "white",
    probeable: true,
  });

export const buildPreset = (preset: Preset): PresetModel => {
  const bg = preset.seeds.surface;
  const page = toRgb(bg);

  // Chromatic families are cut against white whatever the page is, so that is what
  // their numbers are measured against — the page would be a different claim.
  const chromatic = (
    side: PresetSide,
    label: string,
    family: Family,
    keys: readonly string[],
    probeable: boolean,
  ) =>
    row({
      side,
      label,
      family,
      keys,
      against: WHITE,
      againstLabel: "white",
      probeable,
    });

  const onPage = (side: PresetSide, label: string, family: Family) =>
    row({
      side,
      label,
      family,
      keys: SHADES,
      against: page,
      againstLabel: `the page ${bg}`,
      probeable: true,
    });

  const families = CHROMATIC.map(({ key, label }) => ({
    key,
    label,
    seed: preset.seeds[key],
    shades: [
      chromatic(preset.legacy, "legacy", key, SHADES, true),
      chromatic(preset.fitted, "fitted", key, SHADES, true),
    ],
    accents: [
      chromatic(preset.legacy, "legacy accent", key, ACCENTS, false),
      chromatic(preset.fitted, "fitted accent", key, ACCENTS, false),
    ],
  }));

  const roles = ROLES.map((key): Role => {
    const literal = preset.fitted.values[`surface-${key}`];
    const away = contrast(composite(parse(literal), page), page);
    return { key, away, collapsed: away < SAME };
  });

  return {
    key: preset.key,
    label: preset.label,
    theme: preset.theme,
    bg,
    families,
    surface: {
      bg,
      seed: preset.seeds.gray,
      fittedVars: preset.fitted.vars,
      legacySurface: onPage(preset.legacy, "legacy", "surface"),
      roles,
      grays: [
        onPage(preset.legacy, "legacy", "gray"),
        onPage(preset.fitted, "fitted", "gray"),
      ],
    },
  };
};
