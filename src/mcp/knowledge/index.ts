/**
 * Knowledge base index - re-exports all embedded theming data.
 */

// Color usage
export {
	COLOR_SEMANTIC_ROLES,
	COLOR_USAGE_MARKDOWN,
	type ColorSemanticRole,
	OPACITY_USAGE,
	type ShadeRange,
	STATE_PATTERNS,
	THEME_PATTERNS,
} from "./color-usage.js";

// Color guidance
export {
	COLOR_GUIDANCE_MARKDOWN,
	COLOR_RULES_SUMMARY,
	COLOR_VARIANT_RULES,
} from "./colors.js";
// Component Metadata (unified: selectors, variants, compound theming)
export {
	COMPONENT_METADATA,
	type ComponentMetadata,
	type ComponentSelectors,
	type CompoundInfo,
	getComponentPlatformAvailability,
	getComponentSelector,
	getComponentsForPlatform,
	getCompoundComponentInfo,
	getTokenDerivationsForChild,
	getVariants,
	hasVariants,
	// Platform availability
	isComponentAvailable,
	isCompoundComponent,
	isVariantTheme,
	type ScopeSelectors,
	type TokenDerivation,
	VARIANT_THEME_NAMES,
} from "./component-metadata.js";
// Component Themes
export {
	COMPONENT_NAMES,
	COMPONENT_THEMES,
	type ComponentTheme,
	type ComponentToken,
	getComponentTheme,
	getTokenNames,
	resolveComponentTheme,
	searchComponents,
	validateTokens,
} from "./component-themes.js";

// Custom Palettes
export {
	ALL_CHROMATIC_SHADES,
	ALL_GRAY_SHADES,
	CUSTOM_PALETTE_GUIDANCE,
	REQUIRED_SHADES,
} from "./custom-palettes.js";
// Elevations
export {
	ELEVATION_LEVELS,
	ELEVATION_PRESETS,
	type ElevationLevel,
	type ElevationPreset,
	INDIGO_ELEVATIONS,
	MATERIAL_ELEVATIONS,
} from "./elevations.js";
// Layout docs
export {
	BORDER_RADIUS_FUNCTION_DOC,
	LAYOUT_OVERVIEW_DOC,
	PAD_FUNCTION_DOC,
	SIZABLE_FUNCTION_DOC,
	SIZABLE_MIXIN_DOC,
	SIZING_MIXIN_DOC,
	SPACING_MIXIN_DOC,
} from "./layout-docs.js";
// Multipliers
export {
	ACCENT_SHADE_LEVELS,
	type AccentShadeLevel,
	COLOR_MULTIPLIERS,
	GRAYSCALE_MULTIPLIERS,
	SHADE_LEVELS,
	type ShadeLevel,
	type ShadeMultipliers,
} from "./multipliers.js";
// Palettes
export {
	DARK_PALETTE_PRESETS,
	LIGHT_PALETTE_PRESETS,
	PALETTE_PRESETS,
	type PaletteColors,
	type PalettePresetName,
} from "./palettes.js";

export {
	ELEVATIONS as ELEVATIONS_PRESETS,
	PALETTE_PRESETS_PATHS,
	PALETTES as PALETTES_PRESETS,
	SCHEMAS as SCHEMA_PRESETS,
	TYPE_SCALES as TYPE_SCALE_PRESETS,
	TYPEFACES as TYPEFACE_PRESETS,
	TYPOGRAPHY_PRESETS_PATHS,
} from "./platforms/common.js";
// Platforms
export {
	// Angular
	ANGULAR_PLATFORM,
	ANGULAR_USAGE_EXAMPLES,
	type AngularThemeTemplate,
	// Blazor
	BLAZOR_PLATFORM,
	BLAZOR_USAGE_EXAMPLES,
	type ConfigFileDetectionSignal,
	type CoreMixinOptions,
	type DetectionSignal,
	detectConfigFiles,
	detectPlatformFromDependencies,
	type FrameworkDetectionSignal,
	generateAngularThemeSass,
	generateWebComponentsThemeSass,
	getVariablePrefix,
	isLicensedPackage,
	type PackageDetectionSignal,
	PLATFORM_METADATA,
	PLATFORM_VARIABLE_PREFIX,
	// Platform utilities
	type Platform,
	type PlatformAlternative,
	type PlatformDetectionResult,
	// React
	REACT_PLATFORM,
	REACT_USAGE_EXAMPLES,
	type ThemeMixinOptions,
	// Web Components
	WEBCOMPONENTS_PLATFORM,
	WEBCOMPONENTS_RUNTIME_CONFIG,
	WEBCOMPONENTS_USAGE_EXAMPLES,
	type WebComponentsThemeTemplate,
} from "./platforms/index.js";
// Sass API Manifest (centralized API knowledge)
export {
	CORE_MIXIN,
	type CoreMixinParams,
	CSS_VARIABLE_PATTERNS,
	ELEVATIONS_MIXIN,
	type ElevationsMixinParams,
	getElevationsVariable,
	getImportPath,
	getPaletteColorGroups,
	IMPORT_PATHS,
	isMixinSupported,
	PALETTE_FUNCTION,
	PALETTE_MIXIN,
	type PaletteFunctionParams,
	type PaletteMixinParams,
	SHADES_FUNCTION,
	type ShadesFunctionParams,
	SPACING_MIXIN,
	THEME_MIXIN,
	type ThemeMixinParams,
	TYPOGRAPHY_MIXIN,
	type TypographyMixinParams,
	VARIABLE_PATTERNS,
} from "./sass-api.js";
// Typography
export {
	type DesignSystem,
	TYPE_SCALE_CATEGORIES,
	TYPOGRAPHY_PRESETS,
	type TypeScale,
	type TypeScaleCategory,
	type TypeStyle,
} from "./typography.js";
