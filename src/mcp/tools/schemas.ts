/**
 * Zod schemas for tool input validation.
 *
 * Schemas are derived from constants in utils/types.ts to maintain
 * a single source of truth. When adding new enums, add the constant
 * array to utils/types.ts first, then derive the Zod schema here.
 *
 * Parameter descriptions are imported from descriptions.ts to maintain
 * consistent, comprehensive documentation across the MCP server.
 */

import {z} from 'zod';
import {SHADE_LEVELS} from '../knowledge/index.js';
import {
  ACCENT_SHADE_LEVELS,
  ALL_COLOR_SHADES,
  DESIGN_SYSTEMS,
  ELEVATION_PRESETS,
  OUTPUT_FORMATS,
  PALETTE_COLOR_GROUPS,
  PLATFORMS,
  VARIANTS,
} from '../utils/types.js';
import {PARAM_DESCRIPTIONS} from './descriptions.js';

/**
 * Regex for validating CSS color values.
 *
 * This is a permissive pattern matcher for CSS Color Level 4 syntax.
 * It validates the general structure of color values but does NOT validate
 * the actual color values (e.g., that RGB values are 0-255). Full validation
 * happens at Sass compile time via the isValidColor() utility.
 *
 * Supported formats:
 * - Hex colors: #RGB, #RGBA, #RRGGBB, #RRGGBBAA (3, 4, 6, or 8 hex digits)
 * - Legacy RGB/RGBA: rgb(r, g, b) or rgba(r, g, b, a)
 * - Modern RGB: rgb(r g b) or rgb(r g b / alpha)
 * - Legacy HSL/HSLA: hsl(h, s%, l%) or hsla(h, s%, l%, a)
 * - Modern HSL: hsl(h s% l%) or hsl(h s% l% / alpha)
 * - HWB (CSS Color Level 4): hwb(h w% b%) or hwb(h w% b% / alpha)
 * - LAB (CSS Color Level 4): lab(L a b) or lab(L a b / alpha)
 * - LCH (CSS Color Level 4): lch(L C H) or lch(L C H / alpha)
 * - OKLAB (CSS Color Level 4): oklab(L a b) or oklab(L a b / alpha)
 * - OKLCH (CSS Color Level 4): oklch(L C H) or oklch(L C H / alpha)
 * - color() function: color(colorspace values...) for wide-gamut colors
 *   e.g., color(display-p3 1 0.5 0), color(srgb 1 0 0 / 0.5)
 * - Named colors: CSS named colors (e.g., red, blue, rebeccapurple, transparent)
 *
 * @see https://www.w3.org/TR/css-color-4/ for the full CSS Color Level 4 specification
 */
const colorRegex =
  /^(#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\(.+\)|hsla?\(.+\)|hwb\(.+\)|lab\(.+\)|lch\(.+\)|oklab\(.+\)|oklch\(.+\)|color\(.+\)|[a-z]+)$/i;

/**
 * Schema for CSS color values.
 * Supports CSS Color Level 4 formats including hex, rgb, hsl, hwb, lab, lch, oklab, oklch, color(), and named colors.
 */
export const colorSchema = z
  .string()
  .regex(colorRegex, 'Must be a valid CSS color (hex, rgb, hsl, hwb, lab, lch, oklab, oklch, color(), or named color)');

/**
 * Theme variant schema - derived from VARIANTS constant.
 */
export const variantSchema = z.enum(VARIANTS).optional();

/**
 * Design system schema - derived from DESIGN_SYSTEMS constant.
 */
export const designSystemSchema = z.enum(DESIGN_SYSTEMS).optional();

/**
 * Elevation preset schema - derived from ELEVATION_PRESETS constant.
 */
export const elevationPresetSchema = z.enum(ELEVATION_PRESETS).optional();

/**
 * Output format schema - derived from OUTPUT_FORMATS constant.
 */
export const outputFormatSchema = z.enum(OUTPUT_FORMATS).optional();

/**
 * Size keyword schema for layout tools.
 */
export const sizeKeywordSchema = z.enum(['small', 'medium', 'large']);

/**
 * Platform schema - derived from PLATFORMS constant.
 */
export const platformSchema = z.enum(PLATFORMS).optional().describe(PARAM_DESCRIPTIONS.platform);

/**
 * Licensed package schema - for @infragistics prefixed packages.
 */
export const licensedSchema = z.boolean().optional().describe(PARAM_DESCRIPTIONS.licensed);

/**
 * Schema for detect_platform tool.
 */
export const detectPlatformSchema = z.object({
  packageJsonPath: z.string().optional().describe(PARAM_DESCRIPTIONS.packageJsonPath),
});

/**
 * Schema for create_palette tool.
 */
export const createPaletteSchema = z.object({
  platform: platformSchema,
  licensed: licensedSchema,
  primary: colorSchema.describe(PARAM_DESCRIPTIONS.primary),
  secondary: colorSchema.describe(PARAM_DESCRIPTIONS.secondary),
  surface: colorSchema.describe(PARAM_DESCRIPTIONS.surface),
  gray: colorSchema.optional().describe(PARAM_DESCRIPTIONS.gray),
  info: colorSchema.optional().describe(PARAM_DESCRIPTIONS.info),
  success: colorSchema.optional().describe(PARAM_DESCRIPTIONS.success),
  warn: colorSchema.optional().describe(PARAM_DESCRIPTIONS.warn),
  error: colorSchema.optional().describe(PARAM_DESCRIPTIONS.error),
  variant: variantSchema.describe(PARAM_DESCRIPTIONS.variant),
  name: z.string().optional().describe(PARAM_DESCRIPTIONS.name),
  output: outputFormatSchema.describe(PARAM_DESCRIPTIONS.output),
});

/**
 * Schema for type style customization.
 */
export const typeStyleSchema = z.object({
  fontSize: z.string().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  fontStyle: z.string().optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),
  textTransform: z.string().optional(),
  marginTop: z.string().optional(),
  marginBottom: z.string().optional(),
});

/**
 * Schema for create_typography tool.
 */
export const createTypographySchema = z.object({
  platform: platformSchema,
  licensed: licensedSchema,
  fontFamily: z.string().describe(PARAM_DESCRIPTIONS.fontFamily),
  designSystem: designSystemSchema.describe(PARAM_DESCRIPTIONS.designSystem),
  customScale: z.record(typeStyleSchema).optional().describe(PARAM_DESCRIPTIONS.customScale),
  name: z.string().optional().describe(PARAM_DESCRIPTIONS.name),
});

/**
 * Schema for create_elevations tool.
 */
export const createElevationsSchema = z.object({
  platform: platformSchema,
  licensed: licensedSchema,
  designSystem: elevationPresetSchema.describe(PARAM_DESCRIPTIONS.elevationPreset),
  name: z.string().optional().describe(PARAM_DESCRIPTIONS.name),
});

/**
 * Schema for create_theme tool.
 */
export const createThemeSchema = z.object({
  platform: platformSchema,
  licensed: licensedSchema,
  designSystem: designSystemSchema.describe(PARAM_DESCRIPTIONS.designSystem),
  primaryColor: colorSchema.describe(PARAM_DESCRIPTIONS.primaryColor),
  secondaryColor: colorSchema.describe(PARAM_DESCRIPTIONS.secondaryColor),
  surfaceColor: colorSchema.describe(PARAM_DESCRIPTIONS.surfaceColor),
  variant: variantSchema.describe(PARAM_DESCRIPTIONS.variant),
  name: z.string().optional().describe(PARAM_DESCRIPTIONS.name),
  fontFamily: z.string().optional().describe(PARAM_DESCRIPTIONS.fontFamily),
  includeTypography: z.boolean().optional().default(true).describe(PARAM_DESCRIPTIONS.includeTypography),
  includeElevations: z.boolean().optional().default(true).describe(PARAM_DESCRIPTIONS.includeElevations),
  includeSpacing: z.boolean().optional().default(true).describe(PARAM_DESCRIPTIONS.includeSpacing),
});

/**
 * Type exports inferred from schemas.
 */
export type DetectPlatformParams = z.infer<typeof detectPlatformSchema>;
export type CreatePaletteParams = z.infer<typeof createPaletteSchema>;
export type CreateTypographyParams = z.infer<typeof createTypographySchema>;
export type CreateElevationsParams = z.infer<typeof createElevationsSchema>;
export type CreateThemeParams = z.infer<typeof createThemeSchema>;

// Re-export canonical types from utils/types.ts for convenience
export type {DesignSystem, ElevationPreset, OutputFormat, Platform, ThemeVariant} from '../utils/types.js';

// ============================================================================
// Custom Palette Schemas
// ============================================================================

/**
 * All chromatic shade levels combined for schema validation.
 * Imported from types.ts - the single source of truth.
 */

/**
 * Schema for shades-based color generation (uses Sass shades() function).
 */
const shadesBasedColorSchema = z.object({
  mode: z.literal('shades'),
  baseColor: colorSchema.describe(PARAM_DESCRIPTIONS.baseColor),
});

/**
 * Schema for explicit chromatic shades (14 shades required).
 * Dynamically builds the shades object from SHADE_LEVELS and ACCENT_SHADE_LEVELS.
 */
const explicitColorShadesSchema = z.object({
  mode: z.literal('explicit'),
  shades: z
    .object(Object.fromEntries(ALL_COLOR_SHADES.map((s) => [s, colorSchema])) as Record<string, z.ZodString>)
    .describe(PARAM_DESCRIPTIONS.shades),
  contrastOverrides: z
    .record(z.enum(ALL_COLOR_SHADES as unknown as [string, ...string[]]), colorSchema)
    .optional()
    .describe(PARAM_DESCRIPTIONS.contrastOverrides),
});

/**
 * Schema for explicit gray shades (10 shades required).
 */
const explicitGrayShadesSchema = z.object({
  mode: z.literal('explicit'),
  shades: z
    .object(Object.fromEntries(SHADE_LEVELS.map((s) => [s, colorSchema])) as Record<string, z.ZodString>)
    .describe(PARAM_DESCRIPTIONS.grayShades),
  contrastOverrides: z
    .record(z.enum(SHADE_LEVELS as unknown as [string, ...string[]]), colorSchema)
    .optional()
    .describe(PARAM_DESCRIPTIONS.contrastOverrides),
});

/**
 * Schema for color definition - either shades-based or explicit.
 */
const colorDefinitionSchema = z.union([shadesBasedColorSchema, explicitColorShadesSchema]);

/**
 * Schema for gray definition - either shades-based or explicit.
 */
const grayDefinitionSchema = z.union([shadesBasedColorSchema, explicitGrayShadesSchema]);

/**
 * Schema for create_custom_palette tool.
 */
export const createCustomPaletteSchema = z.object({
  platform: platformSchema,
  licensed: licensedSchema,
  variant: variantSchema.describe(PARAM_DESCRIPTIONS.variant),
  designSystem: designSystemSchema.describe(PARAM_DESCRIPTIONS.designSystem),
  name: z.string().optional().describe(PARAM_DESCRIPTIONS.name),
  output: outputFormatSchema.describe(PARAM_DESCRIPTIONS.output),

  // Required colors - use colorDefinition description for detailed guidance
  primary: colorDefinitionSchema.describe(PARAM_DESCRIPTIONS.colorDefinition),
  secondary: colorDefinitionSchema.describe(PARAM_DESCRIPTIONS.colorDefinition),
  surface: colorDefinitionSchema.describe(PARAM_DESCRIPTIONS.colorDefinition),

  // Optional colors - defaults from design system preset if not provided
  gray: grayDefinitionSchema.optional().describe(PARAM_DESCRIPTIONS.grayDefinition),
  info: colorDefinitionSchema.optional().describe(PARAM_DESCRIPTIONS.colorDefinition),
  success: colorDefinitionSchema.optional().describe(PARAM_DESCRIPTIONS.colorDefinition),
  warn: colorDefinitionSchema.optional().describe(PARAM_DESCRIPTIONS.colorDefinition),
  error: colorDefinitionSchema.optional().describe(PARAM_DESCRIPTIONS.colorDefinition),
});

export type CreateCustomPaletteParams = z.infer<typeof createCustomPaletteSchema>;

// ============================================================================
// Component Theming Schemas
// ============================================================================

/**
 * Schema for get_component_design_tokens tool.
 */
export const getComponentDesignTokensSchema = z.object({
  component: z.string().describe(PARAM_DESCRIPTIONS.component),
});

/**
 * Schema for token value in create_component_theme.
 * Supports colors, numbers with units, and other Sass-compatible values.
 */
const tokenValueSchema = z.union([
  colorSchema,
  z.string().describe('CSS value (e.g., "8px", "1rem", "0 2px 4px rgba(0,0,0,0.1)")'),
  z.number().describe('Numeric value'),
]);

/**
 * Schema for create_component_theme tool.
 */
export const createComponentThemeSchema = z.object({
  platform: z.enum(PLATFORMS).describe(PARAM_DESCRIPTIONS.platform),
  licensed: licensedSchema,
  designSystem: designSystemSchema.describe(PARAM_DESCRIPTIONS.designSystem),
  variant: variantSchema.describe(PARAM_DESCRIPTIONS.variant),
  component: z.string().describe(PARAM_DESCRIPTIONS.componentTheme),
  tokens: z.record(z.string(), tokenValueSchema).describe(PARAM_DESCRIPTIONS.tokens),
  selector: z.string().optional().describe(PARAM_DESCRIPTIONS.selector),
  name: z.string().optional().describe(PARAM_DESCRIPTIONS.themeName),
  output: outputFormatSchema.describe(PARAM_DESCRIPTIONS.output),
});

export type GetComponentDesignTokensParams = z.infer<typeof getComponentDesignTokensSchema>;
export type CreateComponentThemeParams = z.infer<typeof createComponentThemeSchema>;

// ============================================================================
// Color Operations Schemas
// ============================================================================

/**
 * Base schema for get_color tool input.
 */
const getColorBaseSchema = z.object({
  color: z.enum(PALETTE_COLOR_GROUPS as unknown as [string, ...string[]]).describe(PARAM_DESCRIPTIONS.colorName),
  variant: z
    .enum([...SHADE_LEVELS, ...ACCENT_SHADE_LEVELS] as unknown as [string, ...string[]])
    .optional()
    .describe(PARAM_DESCRIPTIONS.shadeVariant),
  contrast: z.boolean().optional().describe(PARAM_DESCRIPTIONS.contrastFlag),
  opacity: z.number().min(0).max(1).optional().describe(PARAM_DESCRIPTIONS.opacity),
});

/**
 * Schema for get_color tool with validation.
 * Retrieves palette colors as CSS variable references.
 */
export const getColorSchema = getColorBaseSchema.refine(
  (data) => {
    if (data.color === 'gray' && data.variant) {
      return !ACCENT_SHADE_LEVELS.includes(data.variant as any);
    }

    return true;
  },
  {
    message: 'Gray color does not support accent shades (A100, A200, A400, A700). Use standard shades: 50-900.',
    path: ['variant'],
  }
);

export type GetColorParams = z.infer<typeof getColorSchema>;

// ============================================================================
// Layout Tools Schemas
// ============================================================================

const sizeValueSchema = z
  .union([sizeKeywordSchema, z.number().int().min(1).max(3)])
  .describe(PARAM_DESCRIPTIONS.sizeValue);

export const setSizeSchema = z.object({
  platform: platformSchema,
  component: z.string().optional().describe(PARAM_DESCRIPTIONS.layoutComponent),
  scope: z.string().optional().describe(PARAM_DESCRIPTIONS.scope),
  size: sizeValueSchema,
  output: outputFormatSchema.describe(PARAM_DESCRIPTIONS.output),
});

export const setSpacingInputSchema = z.object({
  platform: platformSchema,
  component: z.string().optional().describe(PARAM_DESCRIPTIONS.layoutComponent),
  scope: z.string().optional().describe(PARAM_DESCRIPTIONS.scope),
  spacing: z.number().min(0).describe(PARAM_DESCRIPTIONS.spacing),
  inline: z.number().min(0).optional().describe(PARAM_DESCRIPTIONS.spacingInline),
  block: z.number().min(0).optional().describe(PARAM_DESCRIPTIONS.spacingBlock),
  output: outputFormatSchema.describe(PARAM_DESCRIPTIONS.output),
});

export const setSpacingSchema = setSpacingInputSchema;

export const setRoundnessSchema = z.object({
  platform: platformSchema,
  component: z.string().optional().describe(PARAM_DESCRIPTIONS.layoutComponent),
  scope: z.string().optional().describe(PARAM_DESCRIPTIONS.scope),
  radiusFactor: z.number().min(0).max(1).describe(PARAM_DESCRIPTIONS.radiusFactor),
  output: outputFormatSchema.describe(PARAM_DESCRIPTIONS.output),
});

export type SetSizeParams = z.infer<typeof setSizeSchema>;
export type SetSpacingParams = z.infer<typeof setSpacingSchema>;
export type SetRoundnessParams = z.infer<typeof setRoundnessSchema>;

// ============================================================================
// Resource Read Schema
// ============================================================================

/**
 * Schema for read_resource tool.
 */
export const readResourceSchema = z.object({
  uri: z.string().describe(PARAM_DESCRIPTIONS.resourceUri),
});

export type ReadResourceParams = z.infer<typeof readResourceSchema>;
