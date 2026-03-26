/**
 * Zod schemas for JSON build artifacts.
 * Source of truth for build-time validation and TypeScript type generation.
 */
import {z} from 'zod';

const shadeLevels = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  'A100',
  'A200',
  'A400',
  'A700',
];

const shadeRecord = z.record(z.enum(/** @type {[string, ...string[]]} */ (shadeLevels)), z.string());

export const PaletteMultipliersSchema = z.object({
  color: z.object({s: shadeRecord, l: shadeRecord}),
  grayscale: z.object({s: shadeRecord.optional(), l: shadeRecord}),
});

export const PaletteMetaSchema = z.record(z.string(), z.array(z.string()));

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
  })
);

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
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
];

export const ElevationsSchema = z.object({
  elevations: z.record(z.enum(/** @type {[string, ...string[]]} */ (elevationLevels)), z.string()),
});

const typographyStyleSchema = z.object({
  'font-family': z.string(),
  'font-size': z.string(),
  'font-weight': z.string(),
  'font-style': z.string(),
  'line-height': z.string(),
  'letter-spacing': z.string(),
  'text-transform': z.string(),
  'margin-top': z.string(),
  'margin-bottom': z.string(),
});

const typescaleSchema = z.object({typeface: z.string()}).catchall(typographyStyleSchema);

export const TypescalesSchema = z.record(z.string(), typescaleSchema);

/** Maps each JSON output path to its barrel export name and validation schema. */
export const EXPORT_MAP = {
  'colors/meta/multipliers': {exportName: 'PaletteMultipliers', schema: PaletteMultipliersSchema},
  'colors/meta/palette': {exportName: 'PaletteMeta', schema: PaletteMetaSchema},
  'colors/presets/palettes': {exportName: 'Palettes', schema: PalettesSchema},
  'components/bootstrap': {exportName: 'BootstrapThemes', schema: DesignSystemThemesSchema},
  'components/fluent': {exportName: 'FluentThemes', schema: DesignSystemThemesSchema},
  'components/indigo': {exportName: 'IndigoThemes', schema: DesignSystemThemesSchema},
  'components/material': {exportName: 'MaterialThemes', schema: DesignSystemThemesSchema},
  'components/themes': {exportName: 'ComponentThemes', schema: ComponentThemesSchema},
  'elevations/indigo': {exportName: 'IndigoElevations', schema: ElevationsSchema},
  'elevations/material': {exportName: 'MaterialElevations', schema: ElevationsSchema},
  'typography/presets/typescales': {exportName: 'Typescales', schema: TypescalesSchema},
};
