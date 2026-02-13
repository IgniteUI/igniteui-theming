/**
 * Knowledge base index - re-exports all embedded theming data.
 */

// Sass API Manifest (centralized API knowledge)
export {
  IMPORT_PATHS,
  PALETTE_FUNCTION,
  SHADES_FUNCTION,
  TYPOGRAPHY_MIXIN,
  ELEVATIONS_MIXIN,
  PALETTE_MIXIN,
  SPACING_MIXIN,
  CORE_MIXIN,
  THEME_MIXIN,
  CSS_VARIABLE_PATTERNS,
  VARIABLE_PATTERNS,
  getImportPath,
  getElevationsVariable,
  isMixinSupported,
  getPaletteColorGroups,
  type PaletteFunctionParams,
  type ShadesFunctionParams,
  type TypographyMixinParams,
  type ElevationsMixinParams,
  type PaletteMixinParams,
  type CoreMixinParams,
  type ThemeMixinParams,
} from './sass-api.js';

// Color guidance
export {COLOR_VARIANT_RULES, COLOR_GUIDANCE_MARKDOWN, COLOR_RULES_SUMMARY} from './colors.js';

// Color usage
export {
  COLOR_SEMANTIC_ROLES,
  COLOR_USAGE_MARKDOWN,
  OPACITY_USAGE,
  STATE_PATTERNS,
  THEME_PATTERNS,
  type ColorSemanticRole,
  type ShadeRange,
} from './color-usage.js';

// Palettes
export {
  type PaletteColors,
  type PalettePresetName,
  PALETTE_PRESETS,
  LIGHT_PALETTE_PRESETS,
  DARK_PALETTE_PRESETS,
} from './palettes.js';

// Custom Palettes
export {CUSTOM_PALETTE_GUIDANCE, REQUIRED_SHADES, ALL_CHROMATIC_SHADES, ALL_GRAY_SHADES} from './custom-palettes.js';

// Multipliers
export {
  type ShadeMultipliers,
  COLOR_MULTIPLIERS,
  GRAYSCALE_MULTIPLIERS,
  SHADE_LEVELS,
  ACCENT_SHADE_LEVELS,
  type ShadeLevel,
  type AccentShadeLevel,
} from './multipliers.js';

// Typography
export {
  type TypeStyle,
  type TypeScale,
  type DesignSystem,
  TYPOGRAPHY_PRESETS,
  TYPE_SCALE_CATEGORIES,
  type TypeScaleCategory,
} from './typography.js';

// Elevations
export {
  type ElevationLevel,
  type ElevationPreset,
  MATERIAL_ELEVATIONS,
  INDIGO_ELEVATIONS,
  ELEVATION_PRESETS,
  ELEVATION_LEVELS,
} from './elevations.js';

// Platforms
export {
  // Angular
  ANGULAR_PLATFORM,
  ANGULAR_USAGE_EXAMPLES,
  generateAngularThemeSass,
  type CoreMixinOptions,
  type ThemeMixinOptions,
  type AngularThemeTemplate,
  // Web Components
  WEBCOMPONENTS_PLATFORM,
  WEBCOMPONENTS_USAGE_EXAMPLES,
  WEBCOMPONENTS_RUNTIME_CONFIG,
  generateWebComponentsThemeSass,
  type WebComponentsThemeTemplate,
  // React
  REACT_PLATFORM,
  REACT_USAGE_EXAMPLES,
  // Blazor
  BLAZOR_PLATFORM,
  BLAZOR_USAGE_EXAMPLES,
  // Platform utilities
  type Platform,
  type PlatformDetectionResult,
  type DetectionSignal,
  type PackageDetectionSignal,
  type ConfigFileDetectionSignal,
  type FrameworkDetectionSignal,
  type PlatformAlternative,
  detectPlatformFromDependencies,
  isLicensedPackage,
  detectConfigFiles,
  PLATFORM_METADATA,
  PLATFORM_VARIABLE_PREFIX,
  getVariablePrefix,
} from './platforms/index.js';

export {
  PALETTE_PRESETS_PATHS,
  TYPOGRAPHY_PRESETS_PATHS,
  SCHEMAS as SCHEMA_PRESETS,
  TYPEFACES as TYPEFACE_PRESETS,
  TYPE_SCALES as TYPE_SCALE_PRESETS,
  PALETTES as PALETTES_PRESETS,
  ELEVATIONS as ELEVATIONS_PRESETS,
} from './platforms/common.js';

// Layout docs
export {
  LAYOUT_OVERVIEW_DOC,
  PAD_FUNCTION_DOC,
  SIZABLE_FUNCTION_DOC,
  BORDER_RADIUS_FUNCTION_DOC,
  SPACING_MIXIN_DOC,
  SIZING_MIXIN_DOC,
  SIZABLE_MIXIN_DOC,
} from './layout-docs.js';

// Component Themes
export {
  type ComponentToken,
  type ComponentTheme,
  COMPONENT_THEMES,
  COMPONENT_NAMES,
  getComponentTheme,
  getTokenNames,
  validateTokens,
  searchComponents,
} from './component-themes.js';

// Component Metadata (unified: selectors, variants, compound theming)
export {
  type ComponentSelectors,
  type ComponentMetadata,
  type CompoundInfo,
  type TokenDerivation,
  type ScopeSelectors,
  COMPONENT_METADATA,
  VARIANT_THEME_NAMES,
  getComponentSelector,
  hasVariants,
  getVariants,
  isVariantTheme,
  getCompoundComponentInfo,
  isCompoundComponent,
  getTokenDerivationsForChild,
  // Platform availability
  isComponentAvailable,
  getComponentsForPlatform,
  getComponentPlatformAvailability,
} from './component-metadata.js';
