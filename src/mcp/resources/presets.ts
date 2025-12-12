/**
 * Resource handlers for preset data.
 * Provides access to palette, typography, elevation presets, and platform information.
 */

import {
  PALETTE_PRESETS,
  LIGHT_PALETTE_PRESETS,
  DARK_PALETTE_PRESETS,
  TYPOGRAPHY_PRESETS,
  ELEVATION_PRESETS,
  PLATFORM_METADATA,
  ANGULAR_PLATFORM,
  ANGULAR_USAGE_EXAMPLES,
  WEBCOMPONENTS_PLATFORM,
  WEBCOMPONENTS_USAGE_EXAMPLES,
  WEBCOMPONENTS_RUNTIME_CONFIG,
  COLOR_VARIANT_RULES,
  COLOR_GUIDANCE_MARKDOWN,
  COLOR_RULES_SUMMARY,
  COLOR_SEMANTIC_ROLES,
  COLOR_USAGE_MARKDOWN,
  OPACITY_USAGE,
  STATE_PATTERNS,
  THEME_PATTERNS,
  TYPEFACE_PRESETS,
  TYPE_SCALE_PRESETS,
  ELEVATIONS_PRESETS,
  SCHEMA_PRESETS,
  REACT_PLATFORM,
  REACT_USAGE_EXAMPLES,
  BLAZOR_PLATFORM,
  BLAZOR_USAGE_EXAMPLES,
} from '../knowledge/index.js';

/**
 * Resource URI scheme.
 */
export const RESOURCE_SCHEME = 'theming';

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
  // Preset resources
  PALETTES: `${RESOURCE_SCHEME}://presets/palettes`,
  PALETTES_LIGHT: `${RESOURCE_SCHEME}://presets/palettes/light`,
  PALETTES_DARK: `${RESOURCE_SCHEME}://presets/palettes/dark`,
  TYPOGRAPHY: `${RESOURCE_SCHEME}://presets/typography`,
  ELEVATIONS: `${RESOURCE_SCHEME}://presets/elevations`,
  // Color guidance resources (organized under colors/ parent)
  GUIDANCE_COLORS: `${RESOURCE_SCHEME}://guidance/colors`,
  GUIDANCE_COLORS_RULES: `${RESOURCE_SCHEME}://guidance/colors/rules`,
  GUIDANCE_COLORS_USAGE: `${RESOURCE_SCHEME}://guidance/colors/usage`,
  GUIDANCE_COLORS_ROLES: `${RESOURCE_SCHEME}://guidance/colors/roles`,
  GUIDANCE_COLORS_STATES: `${RESOURCE_SCHEME}://guidance/colors/states`,
  GUIDANCE_COLORS_THEMES: `${RESOURCE_SCHEME}://guidance/colors/themes`,
} as const;

/**
 * Resource definitions for MCP server.
 */
export const RESOURCE_DEFINITIONS = [
  // Platform resources
  {
    uri: RESOURCE_URIS.PLATFORMS,
    name: 'Supported Platforms',
    description: 'List of supported target platforms with their configurations',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.PLATFORM_ANGULAR,
    name: 'Angular Platform',
    description: 'Ignite UI for Angular platform configuration, schemas, palettes, and usage examples',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.PLATFORM_WEBCOMPONENTS,
    name: 'Web Components Platform',
    description: 'Ignite UI for Web Components platform configuration, presets, and usage examples',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.PLATFORM_REACT,
    name: 'React Platform',
    description: 'Ignite UI for React platform configuration, schemas, palettes, and usage examples',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.PLATFORM_BLAZOR,
    name: 'Blazor Platform',
    description: 'Ignite UI for Blazor platform configuration, schemas, palettes, and usage examples',
    mimeType: 'application/json',
  },
  // Preset resources
  {
    uri: RESOURCE_URIS.PALETTES,
    name: 'All Palette Presets',
    description: 'All predefined color palette configurations (light and dark variants for each design system)',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.PALETTES_LIGHT,
    name: 'Light Palette Presets',
    description: 'Light mode color palette configurations',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.PALETTES_DARK,
    name: 'Dark Palette Presets',
    description: 'Dark mode color palette configurations',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.TYPOGRAPHY,
    name: 'Typography Presets',
    description: 'Typography presets for all design systems (Material, Bootstrap, Fluent, Indigo)',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.ELEVATIONS,
    name: 'Elevation Presets',
    description: 'Elevation/shadow presets (Material and Indigo)',
    mimeType: 'application/json',
  },
  // Color guidance resources (organized under colors/ parent)
  {
    uri: RESOURCE_URIS.GUIDANCE_COLORS,
    name: 'Color Guidance',
    description:
      'Overview of all color guidance resources. Lists available sub-resources for theme rules, shade reference, semantic roles, interaction states, and design system patterns.',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.GUIDANCE_COLORS_RULES,
    name: 'Light & Dark Theme Rules',
    description:
      'Guidelines for choosing surface and gray colors based on theme variant (light/dark). Explains luminance requirements and contrast considerations.',
    mimeType: 'text/markdown',
  },
  {
    uri: RESOURCE_URIS.GUIDANCE_COLORS_USAGE,
    name: 'Shade Reference',
    description:
      'Comprehensive guide explaining which shades (50-900) to use for different purposes across Ignite UI components. Includes shade-level guidance for all color families.',
    mimeType: 'text/markdown',
  },
  {
    uri: RESOURCE_URIS.GUIDANCE_COLORS_ROLES,
    name: 'Color Roles',
    description:
      'Structured data defining the semantic meaning of each color family (primary, secondary, gray, surface, error, success, warn, info). Includes component mappings and opacity usage.',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.GUIDANCE_COLORS_STATES,
    name: 'Interaction States',
    description:
      'Patterns showing how colors change across interaction states (idle, hover, focus, active, disabled) for common UI elements like buttons, list items, and inputs.',
    mimeType: 'application/json',
  },
  {
    uri: RESOURCE_URIS.GUIDANCE_COLORS_THEMES,
    name: 'Design System Patterns',
    description:
      'Color usage characteristics specific to Material, Fluent, Bootstrap, and Indigo design systems.',
    mimeType: 'application/json',
  },
];

// ============================================================================
// RESOURCE CONTENT HANDLERS
// Using a Map for better maintainability and easier extension
// ============================================================================

type ResourceHandler = () => {content: string; mimeType: string};

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
          platforms: ['angular', 'webcomponents', 'react', 'blazor'],
          metadata: PLATFORM_METADATA,
        },
        null,
        2,
      ),
      mimeType: 'application/json',
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
      mimeType: 'application/json',
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
      mimeType: 'application/json',
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
      mimeType: 'application/json',
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
      mimeType: 'application/json',
    }),
  ],

  // Preset resources
  [
    RESOURCE_URIS.PALETTES,
    () => ({
      content: JSON.stringify(PALETTE_PRESETS, null, 2),
      mimeType: 'application/json',
    }),
  ],
  [
    RESOURCE_URIS.PALETTES_LIGHT,
    () => ({
      content: JSON.stringify(LIGHT_PALETTE_PRESETS, null, 2),
      mimeType: 'application/json',
    }),
  ],
  [
    RESOURCE_URIS.PALETTES_DARK,
    () => ({
      content: JSON.stringify(DARK_PALETTE_PRESETS, null, 2),
      mimeType: 'application/json',
    }),
  ],
  [
    RESOURCE_URIS.TYPOGRAPHY,
    () => ({
      content: JSON.stringify(TYPOGRAPHY_PRESETS, null, 2),
      mimeType: 'application/json',
    }),
  ],
  [
    RESOURCE_URIS.ELEVATIONS,
    () => ({
      content: JSON.stringify(ELEVATION_PRESETS, null, 2),
      mimeType: 'application/json',
    }),
  ],

  // Color guidance resources
  [
    RESOURCE_URIS.GUIDANCE_COLORS,
    () => ({
      content: JSON.stringify(
        {
          description: 'Color guidance resources for Ignite UI Theming',
          resources: [
            {
              uri: RESOURCE_URIS.GUIDANCE_COLORS_RULES,
              name: 'Light & Dark Theme Rules',
              description: 'Guidelines for surface/gray colors based on theme variant',
              mimeType: 'text/markdown',
            },
            {
              uri: RESOURCE_URIS.GUIDANCE_COLORS_USAGE,
              name: 'Shade Reference',
              description: 'Which shades (50-900) to use for different purposes',
              mimeType: 'text/markdown',
            },
            {
              uri: RESOURCE_URIS.GUIDANCE_COLORS_ROLES,
              name: 'Color Roles',
              description: 'Semantic meaning of each color family',
              mimeType: 'application/json',
            },
            {
              uri: RESOURCE_URIS.GUIDANCE_COLORS_STATES,
              name: 'Interaction States',
              description: 'Color changes across hover/focus/active/disabled',
              mimeType: 'application/json',
            },
            {
              uri: RESOURCE_URIS.GUIDANCE_COLORS_THEMES,
              name: 'Design System Patterns',
              description: 'Material/Fluent/Bootstrap/Indigo characteristics',
              mimeType: 'application/json',
            },
          ],
        },
        null,
        2,
      ),
      mimeType: 'application/json',
    }),
  ],
  [
    RESOURCE_URIS.GUIDANCE_COLORS_RULES,
    () => ({
      content: COLOR_GUIDANCE_MARKDOWN,
      mimeType: 'text/markdown',
    }),
  ],
  [
    RESOURCE_URIS.GUIDANCE_COLORS_USAGE,
    () => ({
      content: COLOR_USAGE_MARKDOWN,
      mimeType: 'text/markdown',
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
      mimeType: 'application/json',
    }),
  ],
  [
    RESOURCE_URIS.GUIDANCE_COLORS_STATES,
    () => ({
      content: JSON.stringify(STATE_PATTERNS, null, 2),
      mimeType: 'application/json',
    }),
  ],
  [
    RESOURCE_URIS.GUIDANCE_COLORS_THEMES,
    () => ({
      content: JSON.stringify(THEME_PATTERNS, null, 2),
      mimeType: 'application/json',
    }),
  ],
]);

/**
 * Get resource content by URI.
 */
export function getResourceContent(uri: string): {content: string; mimeType: string} | null {
  const handler = RESOURCE_HANDLERS.get(uri);
  return handler ? handler() : null;
}
