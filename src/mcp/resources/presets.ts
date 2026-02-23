/**
 * Resource handlers for preset data.
 * Provides access to palette, typography, elevation presets, and platform information.
 */

import {
	COLOR_SEMANTIC_ROLES,
	COLOR_USAGE_MARKDOWN,
	OPACITY_USAGE,
	STATE_PATTERNS,
	THEME_PATTERNS,
} from "../knowledge/color-usage.js";
import {
	COLOR_GUIDANCE_MARKDOWN,
	COLOR_RULES_SUMMARY,
	COLOR_VARIANT_RULES,
} from "../knowledge/colors.js";
import { ELEVATION_PRESETS } from "../knowledge/elevations.js";
import {
	BORDER_RADIUS_FUNCTION_DOC,
	LAYOUT_OVERVIEW_DOC,
	PAD_FUNCTION_DOC,
	SIZABLE_FUNCTION_DOC,
	SIZABLE_MIXIN_DOC,
	SIZING_MIXIN_DOC,
	SPACING_MIXIN_DOC,
} from "../knowledge/layout-docs.js";
// Import directly from source modules to avoid circular dependencies with preserveModules
import {
	DARK_PALETTE_PRESETS,
	LIGHT_PALETTE_PRESETS,
	PALETTE_PRESETS,
} from "../knowledge/palettes.js";
import { PLATFORM_SETUP_MARKDOWN } from "../knowledge/platform-setup.js";
import {
	ANGULAR_PLATFORM,
	ANGULAR_USAGE_EXAMPLES,
} from "../knowledge/platforms/angular.js";
import {
	BLAZOR_PLATFORM,
	BLAZOR_USAGE_EXAMPLES,
} from "../knowledge/platforms/blazor.js";
import {
	ELEVATIONS as ELEVATIONS_PRESETS,
	SCHEMAS as SCHEMA_PRESETS,
	TYPE_SCALES as TYPE_SCALE_PRESETS,
	TYPEFACES as TYPEFACE_PRESETS,
} from "../knowledge/platforms/common.js";
import { PLATFORM_METADATA } from "../knowledge/platforms/index.js";
import {
	REACT_PLATFORM,
	REACT_USAGE_EXAMPLES,
} from "../knowledge/platforms/react.js";
import {
	WEBCOMPONENTS_PLATFORM,
	WEBCOMPONENTS_RUNTIME_CONFIG,
	WEBCOMPONENTS_USAGE_EXAMPLES,
} from "../knowledge/platforms/webcomponents.js";
import { TYPOGRAPHY_PRESETS } from "../knowledge/typography.js";

/**
 * Resource URI scheme.
 */
export const RESOURCE_SCHEME = "theming";

/**
 * Available resource URIs.
 */
export const RESOURCE_URIS = {
	// Platform resources
	PLATFORMS: `${RESOURCE_SCHEME}://platforms`,
	PLATFORM_ANGULAR: `${RESOURCE_SCHEME}://platforms/angular`,
	PLATFORM_WEBCOMPONENTS: `${RESOURCE_SCHEME}://platforms/webcomponents`,
	PLATFORM_REACT: `${RESOURCE_SCHEME}://platforms/react`,
	PLATFORM_BLAZOR: `${RESOURCE_SCHEME}://platforms/blazor`,
	PLATFORM_GENERIC: `${RESOURCE_SCHEME}://platforms/generic`,
	// Preset resources
	PALETTES: `${RESOURCE_SCHEME}://presets/palettes`,
	PALETTES_LIGHT: `${RESOURCE_SCHEME}://presets/palettes/light`,
	PALETTES_DARK: `${RESOURCE_SCHEME}://presets/palettes/dark`,
	TYPOGRAPHY: `${RESOURCE_SCHEME}://presets/typography`,
	ELEVATIONS: `${RESOURCE_SCHEME}://presets/elevations`,
	// Platform setup guidance
	GUIDANCE_PLATFORM_SETUP: `${RESOURCE_SCHEME}://guidance/platform-setup`,
	// Color guidance resources (organized under colors/ parent)
	GUIDANCE_COLORS: `${RESOURCE_SCHEME}://guidance/colors`,
	GUIDANCE_COLORS_RULES: `${RESOURCE_SCHEME}://guidance/colors/rules`,
	GUIDANCE_COLORS_USAGE: `${RESOURCE_SCHEME}://guidance/colors/usage`,
	GUIDANCE_COLORS_ROLES: `${RESOURCE_SCHEME}://guidance/colors/roles`,
	GUIDANCE_COLORS_STATES: `${RESOURCE_SCHEME}://guidance/colors/states`,
	GUIDANCE_COLORS_THEMES: `${RESOURCE_SCHEME}://guidance/colors/themes`,
	// Layout documentation resources
	DOCS_LAYOUT_OVERVIEW: `${RESOURCE_SCHEME}://docs/spacing-and-sizing`,
	DOCS_FUNCTION_PAD: `${RESOURCE_SCHEME}://docs/functions/pad`,
	DOCS_FUNCTION_SIZABLE: `${RESOURCE_SCHEME}://docs/functions/sizable`,
	DOCS_FUNCTION_BORDER_RADIUS: `${RESOURCE_SCHEME}://docs/functions/border-radius`,
	DOCS_MIXIN_SPACING: `${RESOURCE_SCHEME}://docs/mixins/spacing`,
	DOCS_MIXIN_SIZING: `${RESOURCE_SCHEME}://docs/mixins/sizing`,
	DOCS_MIXIN_SIZABLE: `${RESOURCE_SCHEME}://docs/mixins/sizable`,
} as const;

/**
 * Resource definitions for MCP server.
 */
export const RESOURCE_DEFINITIONS = [
	// Platform resources
	{
		uri: RESOURCE_URIS.PLATFORMS,
		name: "Supported Platforms",
		description: "List of supported target platforms with their configurations",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.PLATFORM_ANGULAR,
		name: "Angular Platform Config",
		description:
			"Ignite UI for Angular platform configuration, schemas, palettes, and usage examples",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.PLATFORM_WEBCOMPONENTS,
		name: "Web Components Platform Config",
		description:
			"Ignite UI for Web Components platform configuration, presets, and usage examples",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.PLATFORM_REACT,
		name: "React Platform Config",
		description:
			"Ignite UI for React platform configuration, schemas, palettes, and usage examples",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.PLATFORM_BLAZOR,
		name: "Blazor Platform Config",
		description:
			"Ignite UI for Blazor platform configuration, schemas, palettes, and usage examples",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.PLATFORM_GENERIC,
		name: "Generic Platform Config",
		description:
			"Platform-agnostic theming configuration using igniteui-theming standalone, with presets for schemas, palettes, typography, and elevations",
		mimeType: "application/json",
	},
	// Preset resources
	{
		uri: RESOURCE_URIS.PALETTES,
		name: "Color Palettes - All Presets",
		description:
			"All predefined color palette configurations (light and dark variants for each design system)",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.PALETTES_LIGHT,
		name: "Color Palettes - Light",
		description: "Light mode color palette configurations",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.PALETTES_DARK,
		name: "Color Palettes - Dark",
		description: "Dark mode color palette configurations",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.TYPOGRAPHY,
		name: "Typography Presets",
		description:
			"Typography presets for all design systems (Material, Bootstrap, Fluent, Indigo)",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.ELEVATIONS,
		name: "Elevation Presets",
		description: "Elevation/shadow presets (Material and Indigo)",
		mimeType: "application/json",
	},
	// Platform setup guidance
	{
		uri: RESOURCE_URIS.GUIDANCE_PLATFORM_SETUP,
		name: "Platform Setup Guide",
		description:
			"Instruction guide for platform detection, Sass configuration, dependency handling, and the recommended theming workflow. Read this before generating theme code.",
		mimeType: "text/markdown",
	},
	// Color guidance resources (organized under colors/ parent)
	{
		uri: RESOURCE_URIS.GUIDANCE_COLORS,
		name: "Color Guidance Overview",
		description:
			"Overview of all color guidance resources. Lists available sub-resources for theme rules, shade reference, semantic roles, interaction states, and design system patterns.",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.GUIDANCE_COLORS_RULES,
		name: "Color Rules - Light and Dark Themes",
		description:
			"Guidelines for choosing surface and gray colors based on theme variant (light/dark). Explains luminance requirements and contrast considerations.",
		mimeType: "text/markdown",
	},
	{
		uri: RESOURCE_URIS.GUIDANCE_COLORS_USAGE,
		name: "Color Shade Reference",
		description:
			"Comprehensive guide explaining which shades (50-900) to use for different purposes across Ignite UI components. Includes shade-level guidance for all color families.",
		mimeType: "text/markdown",
	},
	{
		uri: RESOURCE_URIS.GUIDANCE_COLORS_ROLES,
		name: "Color Semantic Roles",
		description:
			"Structured data defining the semantic meaning of each color family (primary, secondary, gray, surface, error, success, warn, info). Includes component mappings and opacity usage.",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.GUIDANCE_COLORS_STATES,
		name: "Color Interaction States",
		description:
			"Patterns showing how colors change across interaction states (idle, hover, focus, active, disabled) for common UI elements like buttons, list items, and inputs.",
		mimeType: "application/json",
	},
	{
		uri: RESOURCE_URIS.GUIDANCE_COLORS_THEMES,
		name: "Color Design System Patterns",
		description:
			"Color usage characteristics specific to Material, Fluent, Bootstrap, and Indigo design systems.",
		mimeType: "application/json",
	},
	// Layout documentation resources
	{
		uri: RESOURCE_URIS.DOCS_LAYOUT_OVERVIEW,
		name: "Spacing and Sizing Overview",
		description:
			"Overview of size, spacing, and roundness variables with examples for CSS and Sass.",
		mimeType: "text/markdown",
	},
	{
		uri: RESOURCE_URIS.DOCS_FUNCTION_PAD,
		name: "Pad Spacing Function",
		description: "Documentation for the pad() spacing function and its usage.",
		mimeType: "text/markdown",
	},
	{
		uri: RESOURCE_URIS.DOCS_FUNCTION_SIZABLE,
		name: "Sizable Value Function",
		description:
			"Documentation for the sizable() function and size-based values.",
		mimeType: "text/markdown",
	},
	{
		uri: RESOURCE_URIS.DOCS_FUNCTION_BORDER_RADIUS,
		name: "Border Radius Function",
		description:
			"Documentation for the border-radius() function and roundness scaling.",
		mimeType: "text/markdown",
	},
	{
		uri: RESOURCE_URIS.DOCS_MIXIN_SPACING,
		name: "Spacing Mixin",
		description: "Documentation for the spacing() mixin and spacing variables.",
		mimeType: "text/markdown",
	},
	{
		uri: RESOURCE_URIS.DOCS_MIXIN_SIZING,
		name: "Sizing Mixin",
		description:
			"Documentation for the sizing() mixin and size custom properties.",
		mimeType: "text/markdown",
	},
	{
		uri: RESOURCE_URIS.DOCS_MIXIN_SIZABLE,
		name: "Sizable Mixin",
		description: "Documentation for the sizable() mixin and size flags.",
		mimeType: "text/markdown",
	},
];

// ============================================================================
// RESOURCE CONTENT HANDLERS
// Using a Map for better maintainability and easier extension
// ============================================================================

type ResourceHandler = () => { content: string; mimeType: string };

/**
 * Map of URI to content handler function.
 * Lazily evaluates content to avoid unnecessary JSON serialization.
 */
const RESOURCE_HANDLERS: Map<string, ResourceHandler> = new Map([
	// Platform resources
	[
		RESOURCE_URIS.PLATFORMS,
		() => ({
			content: JSON.stringify(
				{
					platforms: ["angular", "webcomponents", "react", "blazor", "generic"],
					metadata: PLATFORM_METADATA,
				},
				null,
				2,
			),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.PLATFORM_ANGULAR,
		() => ({
			content: JSON.stringify(
				{
					platform: ANGULAR_PLATFORM,
					schemas: SCHEMA_PRESETS,
					palettes: PALETTE_PRESETS,
					typefaces: TYPEFACE_PRESETS,
					typeScales: TYPE_SCALE_PRESETS,
					elevations: ELEVATIONS_PRESETS,
					usageExamples: ANGULAR_USAGE_EXAMPLES,
				},
				null,
				2,
			),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.PLATFORM_WEBCOMPONENTS,
		() => ({
			content: JSON.stringify(
				{
					platform: WEBCOMPONENTS_PLATFORM,
					schemas: SCHEMA_PRESETS,
					palettes: PALETTE_PRESETS,
					typefaces: TYPEFACE_PRESETS,
					typography: TYPOGRAPHY_PRESETS,
					elevations: ELEVATION_PRESETS,
					usageExamples: WEBCOMPONENTS_USAGE_EXAMPLES,
					runtimeConfig: WEBCOMPONENTS_RUNTIME_CONFIG,
				},
				null,
				2,
			),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.PLATFORM_REACT,
		() => ({
			content: JSON.stringify(
				{
					platform: REACT_PLATFORM,
					schemas: SCHEMA_PRESETS,
					palettes: PALETTE_PRESETS,
					typefaces: TYPEFACE_PRESETS,
					typography: TYPOGRAPHY_PRESETS,
					elevations: ELEVATION_PRESETS,
					usageExamples: REACT_USAGE_EXAMPLES,
				},
				null,
				2,
			),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.PLATFORM_BLAZOR,
		() => ({
			content: JSON.stringify(
				{
					platform: BLAZOR_PLATFORM,
					schemas: SCHEMA_PRESETS,
					palettes: PALETTE_PRESETS,
					typefaces: TYPEFACE_PRESETS,
					typography: TYPOGRAPHY_PRESETS,
					elevations: ELEVATION_PRESETS,
					usageExamples: BLAZOR_USAGE_EXAMPLES,
				},
				null,
				2,
			),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.PLATFORM_GENERIC,
		() => ({
			content: JSON.stringify(
				{
					platform: PLATFORM_METADATA.generic,
					schemas: SCHEMA_PRESETS,
					palettes: PALETTE_PRESETS,
					typefaces: TYPEFACE_PRESETS,
					typography: TYPOGRAPHY_PRESETS,
					elevations: ELEVATION_PRESETS,
				},
				null,
				2,
			),
			mimeType: "application/json",
		}),
	],

	// Preset resources
	[
		RESOURCE_URIS.PALETTES,
		() => ({
			content: JSON.stringify(PALETTE_PRESETS, null, 2),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.PALETTES_LIGHT,
		() => ({
			content: JSON.stringify(LIGHT_PALETTE_PRESETS, null, 2),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.PALETTES_DARK,
		() => ({
			content: JSON.stringify(DARK_PALETTE_PRESETS, null, 2),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.TYPOGRAPHY,
		() => ({
			content: JSON.stringify(TYPOGRAPHY_PRESETS, null, 2),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.ELEVATIONS,
		() => ({
			content: JSON.stringify(ELEVATION_PRESETS, null, 2),
			mimeType: "application/json",
		}),
	],

	// Platform setup guidance
	[
		RESOURCE_URIS.GUIDANCE_PLATFORM_SETUP,
		() => ({
			content: PLATFORM_SETUP_MARKDOWN,
			mimeType: "text/markdown",
		}),
	],
	// Color guidance resources
	[
		RESOURCE_URIS.GUIDANCE_COLORS,
		() => ({
			content: JSON.stringify(
				{
					description: "Color guidance resources for Ignite UI Theming",
					resources: [
						{
							uri: RESOURCE_URIS.GUIDANCE_COLORS_RULES,
							name: "Color Rules - Light and Dark Themes",
							description:
								"Guidelines for surface/gray colors based on theme variant",
							mimeType: "text/markdown",
						},
						{
							uri: RESOURCE_URIS.GUIDANCE_COLORS_USAGE,
							name: "Color Shade Reference",
							description:
								"Which shades (50-900) to use for different purposes",
							mimeType: "text/markdown",
						},
						{
							uri: RESOURCE_URIS.GUIDANCE_COLORS_ROLES,
							name: "Color Semantic Roles",
							description: "Semantic meaning of each color family",
							mimeType: "application/json",
						},
						{
							uri: RESOURCE_URIS.GUIDANCE_COLORS_STATES,
							name: "Color Interaction States",
							description: "Color changes across hover/focus/active/disabled",
							mimeType: "application/json",
						},
						{
							uri: RESOURCE_URIS.GUIDANCE_COLORS_THEMES,
							name: "Color Design System Patterns",
							description: "Material/Fluent/Bootstrap/Indigo characteristics",
							mimeType: "application/json",
						},
					],
				},
				null,
				2,
			),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.GUIDANCE_COLORS_RULES,
		() => ({
			content: COLOR_GUIDANCE_MARKDOWN,
			mimeType: "text/markdown",
		}),
	],
	[
		RESOURCE_URIS.GUIDANCE_COLORS_USAGE,
		() => ({
			content: COLOR_USAGE_MARKDOWN,
			mimeType: "text/markdown",
		}),
	],
	[
		RESOURCE_URIS.GUIDANCE_COLORS_ROLES,
		() => ({
			content: JSON.stringify(
				{
					semanticRoles: COLOR_SEMANTIC_ROLES,
					variantRules: COLOR_VARIANT_RULES,
					rulesSummary: COLOR_RULES_SUMMARY,
					opacityUsage: OPACITY_USAGE,
				},
				null,
				2,
			),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.GUIDANCE_COLORS_STATES,
		() => ({
			content: JSON.stringify(STATE_PATTERNS, null, 2),
			mimeType: "application/json",
		}),
	],
	[
		RESOURCE_URIS.GUIDANCE_COLORS_THEMES,
		() => ({
			content: JSON.stringify(THEME_PATTERNS, null, 2),
			mimeType: "application/json",
		}),
	],
	// Layout documentation resources
	[
		RESOURCE_URIS.DOCS_LAYOUT_OVERVIEW,
		() => ({
			content: LAYOUT_OVERVIEW_DOC,
			mimeType: "text/markdown",
		}),
	],
	[
		RESOURCE_URIS.DOCS_FUNCTION_PAD,
		() => ({
			content: PAD_FUNCTION_DOC,
			mimeType: "text/markdown",
		}),
	],
	[
		RESOURCE_URIS.DOCS_FUNCTION_SIZABLE,
		() => ({
			content: SIZABLE_FUNCTION_DOC,
			mimeType: "text/markdown",
		}),
	],
	[
		RESOURCE_URIS.DOCS_FUNCTION_BORDER_RADIUS,
		() => ({
			content: BORDER_RADIUS_FUNCTION_DOC,
			mimeType: "text/markdown",
		}),
	],
	[
		RESOURCE_URIS.DOCS_MIXIN_SPACING,
		() => ({
			content: SPACING_MIXIN_DOC,
			mimeType: "text/markdown",
		}),
	],
	[
		RESOURCE_URIS.DOCS_MIXIN_SIZING,
		() => ({
			content: SIZING_MIXIN_DOC,
			mimeType: "text/markdown",
		}),
	],
	[
		RESOURCE_URIS.DOCS_MIXIN_SIZABLE,
		() => ({
			content: SIZABLE_MIXIN_DOC,
			mimeType: "text/markdown",
		}),
	],
]);

/**
 * Get resource content by URI.
 */
export function getResourceContent(
	uri: string,
): { content: string; mimeType: string } | null {
	const handler = RESOURCE_HANDLERS.get(uri);
	return handler ? handler() : null;
}
