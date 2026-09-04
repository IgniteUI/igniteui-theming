/**
 * Zod schemas for JSON build artifacts.
 * Source of truth for build-time validation and TypeScript type generation.
 */
import { z } from "zod";

const shadeLevels = [
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
  "A100",
  "A200",
  "A400",
  "A700",
];

const shadeRecord = z.record(
  z.enum(/** @type {[string, ...string[]]} */ (shadeLevels)),
  z.string(),
);

export const PaletteMultipliersSchema = z.object({
  color: z.object({ s: shadeRecord, l: shadeRecord }),
  grayscale: z.object({ s: shadeRecord.optional(), l: shadeRecord }),
});

export const PaletteMetaSchema = z.record(z.string(), z.array(z.string()));

/**
 * A shade scale: the WCAG contrast `range` the family spans from shade 50 to 900, and the
 * cubic-bezier `curve` that places each shade in it. An empty `curve` is the straight line.
 */
export const ShadeScalesSchema = z.record(
  z.string(),
  z.object({
    range: z.array(z.string()).length(2),
    curve: z.array(z.string()),
  }),
);

/** Which scale each family uses by default. Unlisted families use `even`. */
export const FamilyScalesSchema = z.record(z.string(), z.string());

export const PalettesSchema = z.record(
  z.string(),
  z.object({
    primary: z.string(),
    secondary: z.string(),
    gray: z.string(),
    surface: z.string(),
    info: z.string(),
    success: z.string(),
    warn: z.string(),
    error: z.string(),
  }),
);

const chartBrushSetSchema = z.record(z.string(), z.string());

export const ChartBrushesSchema = z.object({
  regular: chartBrushSetSchema,
  "color-blind": chartBrushSetSchema,
});

const componentTokenSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  description: z.string(),
});

const componentThemeSchema = z.object({
  name: z.string(),
  themeFunctionName: z.string(),
  description: z.string(),
  primaryTokens: z.array(componentTokenSchema),
  primaryTokensSummary: z.string().optional(),
  tokens: z.array(componentTokenSchema),
});

export const ComponentThemesSchema = z.record(z.string(), componentThemeSchema);

export const DesignSystemThemesSchema = z.object({
  light: z.record(z.string(), z.record(z.string(), z.string())),
  dark: z.record(z.string(), z.record(z.string(), z.string())),
});

const elevationLevels = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
];

export const ElevationsSchema = z.object({
  elevations: z.record(
    z.enum(/** @type {[string, ...string[]]} */ (elevationLevels)),
    z.string(),
  ),
});

const typographyStyleSchema = z.object({
  "font-family": z.string(),
  "font-size": z.string(),
  "font-weight": z.string(),
  "font-style": z.string(),
  "line-height": z.string(),
  "letter-spacing": z.string(),
  "text-transform": z.string(),
  "margin-top": z.string(),
  "margin-bottom": z.string(),
});

const typescaleSchema = z
  .object({ typeface: z.string() })
  .catchall(typographyStyleSchema);

export const TypescalesSchema = z.record(z.string(), typescaleSchema);

/** Maps each JSON output path to its barrel export name and validation schema. */
export const EXPORT_MAP = {
  "colors/meta/multipliers": {
    exportName: "PaletteMultipliers",
    schema: PaletteMultipliersSchema,
  },
  "colors/meta/palette": {
    exportName: "PaletteMeta",
    schema: PaletteMetaSchema,
  },
  "colors/meta/scales": {
    exportName: "ShadeScales",
    schema: ShadeScalesSchema,
  },
  "colors/meta/family-scales": {
    exportName: "FamilyScales",
    schema: FamilyScalesSchema,
  },
  "colors/presets/palettes": { exportName: "Palettes", schema: PalettesSchema },
  "colors/charts/brushes": {
    exportName: "ChartBrushes",
    schema: ChartBrushesSchema,
  },
  "components/bootstrap": {
    exportName: "BootstrapThemes",
    schema: DesignSystemThemesSchema,
  },
  "components/fluent": {
    exportName: "FluentThemes",
    schema: DesignSystemThemesSchema,
  },
  "components/indigo": {
    exportName: "IndigoThemes",
    schema: DesignSystemThemesSchema,
  },
  "components/material": {
    exportName: "MaterialThemes",
    schema: DesignSystemThemesSchema,
  },
  "components/themes": {
    exportName: "ComponentThemes",
    schema: ComponentThemesSchema,
  },
  "elevations/indigo": {
    exportName: "IndigoElevations",
    schema: ElevationsSchema,
  },
  "elevations/material": {
    exportName: "MaterialElevations",
    schema: ElevationsSchema,
  },
  "typography/presets/typescales": {
    exportName: "Typescales",
    schema: TypescalesSchema,
  },
};
