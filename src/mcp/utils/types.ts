/**
 * Shared TypeScript types for the MCP server.
 *
 * This module is the SINGLE SOURCE OF TRUTH for shared types and constants.
 * Other modules should import from here rather than redefining types.
 *
 * IMPORTANT: This module should have NO imports from knowledge/ to avoid
 * circular dependencies. Knowledge modules may import from this module.
 */

// ============================================================================
// CANONICAL CONSTANTS
// These constants are the source of truth - Zod schemas derive from these.
// ============================================================================

/**
 * Supported target platforms for code generation.
 *
 * - angular: Ignite UI for Angular (uses igniteui-angular/theming)
 * - webcomponents: Ignite UI for Web Components (uses igniteui-theming directly)
 * - react: Ignite UI for React (uses igniteui-theming directly)
 * - blazor: Ignite UI for Blazor (uses igniteui-theming for Sass compilation)
 */
export const PLATFORMS = ['angular', 'webcomponents', 'react', 'blazor'] as const;

/**
 * Supported design systems.
 */
export const DESIGN_SYSTEMS = ['material', 'bootstrap', 'fluent', 'indigo'] as const;

/**
 * Supported theme variants.
 */
export const VARIANTS = ['light', 'dark'] as const;

/**
 * Supported elevation presets.
 */
export const ELEVATION_PRESETS = ['material', 'indigo'] as const;

/**
 * Supported output formats for code generation.
 *
 * - sass: Generates Sass code using the igniteui-theming library functions
 * - css: Generates CSS custom properties (variables) directly
 */
export const OUTPUT_FORMATS = ['sass', 'css'] as const;

/**
 * Standard shade levels used in the theming system.
 */
export const SHADE_LEVELS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

/**
 * Accent shade levels (Material Design style).
 */
export const ACCENT_SHADE_LEVELS = ['A100', 'A200', 'A400', 'A700'] as const;

// ============================================================================
// CANONICAL TYPES (derived from constants)
// ============================================================================

/**
 * Target platform for code generation.
 */
export type Platform = (typeof PLATFORMS)[number];

/**
 * Design system for theming.
 */
export type DesignSystem = (typeof DESIGN_SYSTEMS)[number];

/**
 * Theme variant - light or dark mode.
 */
export type ThemeVariant = (typeof VARIANTS)[number];

/**
 * Elevation preset type.
 */
export type ElevationPreset = (typeof ELEVATION_PRESETS)[number];

/**
 * Output format for code generation.
 */
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

/**
 * Standard shade level type.
 */
export type ShadeLevel = (typeof SHADE_LEVELS)[number];

/**
 * Accent shade level type.
 */
export type AccentShadeLevel = (typeof ACCENT_SHADE_LEVELS)[number];

/**
 * Input parameters for palette creation.
 */
export interface CreatePaletteInput {
  /** Target platform for code generation */
  platform?: Platform;
  /** Primary brand color (hex, rgb, or hsl) */
  primary: string;
  /** Secondary/accent color (required by Sass palette function) */
  secondary: string;
  /** Surface/background color (required by Sass palette function) */
  surface: string;
  /** Gray base color */
  gray?: string;
  /** Info state color */
  info?: string;
  /** Success state color */
  success?: string;
  /** Warning state color */
  warn?: string;
  /** Error state color */
  error?: string;
  /** Theme variant (light or dark) - affects surface defaults */
  variant?: ThemeVariant;
  /** Custom name for the palette variable */
  name?: string;
}

/**
 * Input parameters for typography creation.
 */
export interface CreateTypographyInput {
  /** Target platform for code generation */
  platform?: Platform;
  /** Font family string */
  fontFamily: string;
  /** Design system preset to use for type scale */
  designSystem?: DesignSystem;
  /** Custom type scale (overrides designSystem) */
  customScale?: Partial<Record<string, TypeStyleInput>>;
  /** Custom name for the typography variable */
  name?: string;
}

/**
 * Input for a single type style.
 */
export interface TypeStyleInput {
  fontSize?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  marginTop?: string;
  marginBottom?: string;
}

/**
 * Input parameters for elevations creation.
 */
export interface CreateElevationsInput {
  /** Target platform for code generation */
  platform?: Platform;
  /** Design system preset to use (material or indigo) */
  designSystem?: 'material' | 'indigo';
  /** Custom name for the elevations variable */
  name?: string;
}

/**
 * Input parameters for complete theme creation.
 */
export interface CreateThemeInput {
  /** Target platform for code generation */
  platform?: Platform;
  /** Design system to base the theme on */
  designSystem?: DesignSystem;
  /** Primary brand color */
  primaryColor: string;
  /** Secondary/accent color */
  secondaryColor?: string;
  /** Surface/background color */
  surfaceColor?: string;
  /** Theme variant */
  variant?: ThemeVariant;
  /** Theme name (used for variable naming) */
  name?: string;
  /** Font family for typography */
  fontFamily?: string;
  /** Whether to include typography setup */
  includeTypography?: boolean;
  /** Whether to include elevations setup */
  includeElevations?: boolean;
  /** Whether to include spacing setup (Web Components only) */
  includeSpacing?: boolean;
}

/**
 * Result from code generation.
 */
export interface GeneratedCode {
  /** The generated Sass code */
  code: string;
  /** Description of what was generated */
  description: string;
  /** Variable names created */
  variables: string[];
}

/**
 * Color in HSL format.
 */
export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

// ============================================================================
// Custom Palette Types
// ============================================================================

/**
 * All chromatic shade levels (standard + accent).
 * Derived from SHADE_LEVELS and ACCENT_SHADE_LEVELS to maintain single source of truth.
 */
export const ALL_COLOR_SHADES = [...SHADE_LEVELS, ...ACCENT_SHADE_LEVELS] as const;

/**
 * All palette color groups.
 * These are the color families that make up a complete palette.
 */
export const PALETTE_COLOR_GROUPS = [
  'primary',
  'secondary',
  'gray',
  'surface',
  'info',
  'success',
  'warn',
  'error',
] as const;

/**
 * Type for palette color group names.
 */
export type PaletteColorGroup = (typeof PALETTE_COLOR_GROUPS)[number];

/**
 * Chromatic color groups (excludes gray which has different shade handling).
 * These groups use 14 shades (50-900, A100-A700).
 * Derived from PALETTE_COLOR_GROUPS to maintain single source of truth.
 */
export const CHROMATIC_COLOR_GROUPS = PALETTE_COLOR_GROUPS.filter(
  (g): g is Exclude<PaletteColorGroup, 'gray'> => g !== 'gray',
);

/**
 * Type for chromatic color group names.
 */
export type ChromaticColorGroup = (typeof CHROMATIC_COLOR_GROUPS)[number];

/**
 * Combined type for all chromatic shade levels.
 */
export type ColorShadeLevel = ShadeLevel | AccentShadeLevel;

/**
 * Color definition using the shades() function.
 * Generates all shades from a single base color.
 */
export interface ShadesBasedColor {
  mode: 'shades';
  baseColor: string;
}

/**
 * Explicit shade definition for chromatic colors.
 * All 14 shades must be provided (50-900, A100-A700).
 */
export interface ExplicitColorShades {
  mode: 'explicit';
  shades: Record<ColorShadeLevel, string>;
  /** Optional explicit contrast colors per shade (defaults to adaptive-contrast) */
  contrastOverrides?: Partial<Record<ColorShadeLevel, string>>;
}

/**
 * Explicit shade definition for gray.
 * All 10 shades must be provided (50-900).
 */
export interface ExplicitGrayShades {
  mode: 'explicit';
  shades: Record<ShadeLevel, string>;
  /** Optional explicit contrast colors per shade (defaults to adaptive-contrast) */
  contrastOverrides?: Partial<Record<ShadeLevel, string>>;
}

/**
 * Color definition - either shades-based or explicit.
 */
export type ColorDefinition = ShadesBasedColor | ExplicitColorShades;

/**
 * Gray definition - either shades-based or explicit.
 */
export type GrayDefinition = ShadesBasedColor | ExplicitGrayShades;

/**
 * Input parameters for custom palette creation.
 */
export interface CreateCustomPaletteInput {
  /** Target platform for code generation */
  platform?: Platform;
  /** Theme variant (light or dark) */
  variant?: ThemeVariant;
  /** Design system to use for default color values */
  designSystem?: DesignSystem;
  /** Custom name for the palette variable */
  name?: string;

  // Required colors
  /** Primary brand color definition */
  primary: ColorDefinition;
  /** Secondary/accent color definition */
  secondary: ColorDefinition;
  /** Surface/background color definition */
  surface: ColorDefinition;

  // Optional colors (defaults from design system preset)
  /** Gray/neutral color definition */
  gray?: GrayDefinition;
  /** Info state color definition */
  info?: ColorDefinition;
  /** Success state color definition */
  success?: ColorDefinition;
  /** Warning state color definition */
  warn?: ColorDefinition;
  /** Error state color definition */
  error?: ColorDefinition;
}
