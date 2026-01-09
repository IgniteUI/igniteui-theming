/**
 * Sass API Manifest
 *
 * This module centralizes all knowledge about the igniteui-theming Sass API.
 * When the Sass framework changes, update this file to propagate changes
 * throughout the MCP server codebase.
 *
 * This manifest defines:
 * - Function signatures and parameters
 * - Mixin signatures and parameters
 * - Variable naming conventions
 * - CSS custom property patterns
 * - Import paths for different platforms
 */

import {
  PALETTE_COLOR_GROUPS,
  type Platform,
  type DesignSystem,
  type ThemeVariant,
  type ElevationPreset,
} from '../utils/types.js';

// ============================================================================
// IMPORT PATHS
// ============================================================================

/**
 * Import paths for the theming library by platform.
 */
export const IMPORT_PATHS = {
  /** Ignite UI for Angular theming module (forwards igniteui-theming with overrides) */
  angular: 'igniteui-angular/theming',

  /** Direct igniteui-theming module for Web Components */
  webcomponents: 'igniteui-theming',

  /** Direct igniteui-theming module for React */
  react: 'igniteui-theming',

  /** Direct igniteui-theming module for Blazor */
  blazor: 'igniteui-theming',

  /** Default for platform-agnostic code */
  default: 'igniteui-theming',
} as const;

/**
 * Get the appropriate import path for a platform.
 */
export function getImportPath(platform?: Platform): string {
  switch (platform) {
    case 'webcomponents':
      return IMPORT_PATHS.webcomponents;
    case 'react':
      return IMPORT_PATHS.react;
    case 'blazor':
      return IMPORT_PATHS.blazor;
    case 'angular':
      return IMPORT_PATHS.angular;
    default:
      return IMPORT_PATHS.default;
  }
}

// ============================================================================
// PALETTE FUNCTION
// ============================================================================

/**
 * Parameters for the palette() Sass function.
 */
export interface PaletteFunctionParams {
  /** Primary brand color (required) */
  primary: string;
  /** Secondary/accent color (required) */
  secondary: string;
  /** Surface/background color (required) */
  surface: string;
  /** Gray base color (optional - auto-generated from surface if not provided) */
  gray?: string;
  /** Info state color (optional) */
  info?: string;
  /** Success state color (optional) */
  success?: string;
  /** Warning state color (optional) */
  warn?: string;
  /** Error state color (optional) */
  error?: string;
}

/**
 * Metadata about the palette() function.
 */
export const PALETTE_FUNCTION = {
  name: 'palette',

  /** Required parameters (must always be provided) */
  requiredParams: ['primary', 'secondary', 'surface'] as const,

  /** Optional parameters */
  optionalParams: ['gray', 'info', 'success', 'warn', 'error'] as const,

  /** Default variable name pattern */
  defaultVariablePattern: '$custom-{variant}-palette',

  /** Description for documentation */
  description:
    'Creates a color palette map from base colors. Automatically generates shade variants (50-900, A100-A700) for each color using internal algorithms.',
} as const;

// ============================================================================
// SHADES FUNCTION
// ============================================================================

/**
 * Parameters for the shades() Sass function.
 * Used for generating shade variants from a single base color.
 */
export interface ShadesFunctionParams {
  /** Color group name (e.g., 'primary', 'secondary') */
  colorName: string;
  /** Base color to generate shades from */
  baseColor: string;
  /** List of shade levels to generate */
  shadeLevels: readonly string[];
  /** Surface color (required for gray shades to calculate proper contrast) */
  surface?: string;
}

/**
 * Metadata about the shades() function.
 */
export const SHADES_FUNCTION = {
  name: 'shades',

  /** Description for documentation */
  description: 'Generates a shade map from a base color. Creates contrast-accessible shade variants automatically.',

  /** Chromatic shade levels (for primary, secondary, etc.) */
  chromaticShadeLevels: [
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
  ] as const,

  /** Gray shade levels (no accent shades) */
  grayShadeLevels: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const,
} as const;

// ============================================================================
// TYPOGRAPHY MIXIN
// ============================================================================

/**
 * Parameters for the typography() mixin.
 */
export interface TypographyMixinParams {
  /** Font family string (e.g., "'Inter', sans-serif") */
  fontFamily: string;
  /** Type scale variable reference (e.g., '$material-type-scale') */
  typeScale: string;
}

/**
 * Metadata about the typography() mixin.
 */
export const TYPOGRAPHY_MIXIN = {
  name: 'typography',

  /** Parameter names in order */
  params: ['$font-family', '$type-scale'] as const,

  /** Description for documentation */
  description: 'Applies typography CSS custom properties for font sizes, weights, line heights, and letter spacing.',

  /** CSS class required on root element (Angular only) */
  angularRootClass: 'ig-typography',
} as const;

// ============================================================================
// ELEVATIONS MIXIN
// ============================================================================

/**
 * Parameters for the elevations() mixin.
 */
export interface ElevationsMixinParams {
  /** Elevations variable reference (e.g., '$material-elevations') */
  elevations: string;
}

/**
 * Metadata about the elevations() mixin.
 */
export const ELEVATIONS_MIXIN = {
  name: 'elevations',

  /** Parameter names */
  params: ['$elevations'] as const,

  /** Number of elevation levels (0-24) */
  levelCount: 25,

  /** Description for documentation */
  description: 'Applies elevation CSS custom properties for box-shadow values at 25 levels (0-24).',
} as const;

// ============================================================================
// PALETTE MIXIN
// ============================================================================

/**
 * Parameters for the palette() mixin (applies palette to CSS variables).
 */
export interface PaletteMixinParams {
  /** Palette variable reference (e.g., '$my-palette') */
  palette: string;
}

/**
 * Metadata about the palette() mixin.
 */
export const PALETTE_MIXIN = {
  name: 'palette',

  /** Description for documentation */
  description: 'Applies a palette map as CSS custom properties (--ig-* variables).',
} as const;

// ============================================================================
// SPACING MIXIN (Web Components only)
// ============================================================================

/**
 * Metadata about the spacing() mixin.
 */
export const SPACING_MIXIN = {
  name: 'spacing',

  /** Platforms that support this mixin */
  supportedPlatforms: ['webcomponents', 'react', 'blazor'] as const,

  /** Description for documentation */
  description: 'Applies spacing CSS custom properties for consistent margins and paddings.',
} as const;

// ============================================================================
// ANGULAR-SPECIFIC MIXINS
// ============================================================================

/**
 * Parameters for the core() mixin (Angular only).
 */
export interface CoreMixinParams {
  /** Include/exclude styles for printing */
  printLayout?: boolean;
  /** Enable enhanced accessibility colors */
  enhancedAccessibility?: boolean;
}

/**
 * Metadata about the core() mixin.
 */
export const CORE_MIXIN = {
  name: 'core',

  /** Platforms that support this mixin */
  supportedPlatforms: ['angular'] as const,

  /** Description for documentation */
  description: 'Provides base definitions for theming. Must be included before theme() mixin.',

  /** Optional parameters with defaults */
  optionalParams: {
    '$print-layout': true,
    '$enhanced-accessibility': false,
  },
} as const;

/**
 * Parameters for the theme() mixin (Angular only).
 */
export interface ThemeMixinParams {
  /** Palette map to use */
  palette: string;
  /** Schema to use for component styling */
  schema: string;
  /** Global roundness factor (0 to 1) */
  roundness?: number;
  /** Enable/disable elevations */
  elevation?: boolean;
  /** Custom elevations map */
  elevations?: string;
  /** Components to exclude from theming */
  exclude?: string[];
}

/**
 * Metadata about the theme() mixin.
 */
export const THEME_MIXIN = {
  name: 'theme',

  /** Platforms that support this mixin */
  supportedPlatforms: ['angular'] as const,

  /** Required parameters */
  requiredParams: ['$palette', '$schema'] as const,

  /** Optional parameters */
  optionalParams: ['$roundness', '$elevation', '$elevations', '$exclude'] as const,

  /** Description for documentation */
  description: 'Generates styles for all components using the specified palette and schema.',
} as const;

// ============================================================================
// CSS CUSTOM PROPERTY PATTERNS
// ============================================================================

/**
 * CSS custom property naming patterns used by the theming library.
 */
export const CSS_VARIABLE_PATTERNS = {
  /** Theme identifier */
  theme: '--ig-theme',
  /** Theme variant (light/dark) */
  themeVariant: '--ig-theme-variant',
  /** Component size levels */
  sizes: {
    small: '--ig-size-small',
    medium: '--ig-size-medium',
    large: '--ig-size-large',
  },
  /** Scrollbar customization */
  scrollbar: {
    size: '--ig-scrollbar-size',
    thumbBackground: '--ig-scrollbar-thumb-background',
    trackBackground: '--ig-scrollbar-track-background',
  },
  /** RTL direction multiplier */
  direction: '--ig-dir',
  /** Color function pattern: --ig-{color}-{shade} */
  colorPattern: '--ig-{color}-{shade}',
  /** Elevation pattern: --ig-elevation-{level} */
  elevationPattern: '--ig-elevation-{level}',
  /** Typography patterns */
  typography: {
    fontFamily: '--ig-font-family',
    fontSize: '--ig-font-size-{category}',
    fontWeight: '--ig-font-weight-{category}',
    lineHeight: '--ig-line-height-{category}',
    letterSpacing: '--ig-letter-spacing-{category}',
  },
} as const;

// ============================================================================
// VARIABLE NAMING CONVENTIONS
// ============================================================================

/**
 * Variable naming patterns for the theming library.
 */
export const VARIABLE_PATTERNS = {
  /** Palette variable: ${variant}-${designSystem}-palette */
  palettePreset: (variant: ThemeVariant, designSystem: DesignSystem) => `$${variant}-${designSystem}-palette`,

  /** Schema variable: ${variant}-${designSystem}-schema */
  schema: (variant: ThemeVariant, designSystem: DesignSystem) => `$${variant}-${designSystem}-schema`,

  /** Typeface variable: ${designSystem}-typeface */
  typeface: (designSystem: DesignSystem) => `$${designSystem}-typeface`,

  /** Type scale variable: ${designSystem}-type-scale */
  typeScale: (designSystem: DesignSystem) => `$${designSystem}-type-scale`,

  /** Elevations variable: ${preset}-elevations */
  elevations: (preset: ElevationPreset) => `$${preset}-elevations`,

  /** Custom palette variable */
  customPalette: (name: string, variant: ThemeVariant) => `$${name}-${variant}-palette`,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the appropriate elevations variable for a design system.
 */
export function getElevationsVariable(designSystem: DesignSystem): string {
  // Only material and indigo have elevation presets; others use material
  const preset: ElevationPreset = designSystem === 'indigo' ? 'indigo' : 'material';
  return VARIABLE_PATTERNS.elevations(preset);
}

/**
 * Check if a mixin is supported on a given platform.
 */
export function isMixinSupported(mixin: 'core' | 'theme' | 'spacing', platform?: Platform): boolean {
  switch (mixin) {
    case 'core':
    case 'theme':
      return platform === 'angular';
    case 'spacing':
      return platform !== 'angular';
    default:
      return true;
  }
}

/**
 * Get all color groups that should be in a palette.
 * Returns the canonical list from types.ts.
 */
export function getPaletteColorGroups(): readonly string[] {
  return PALETTE_COLOR_GROUPS;
}
