#!/usr/bin/env node
/**
 * Ignite UI Theming MCP Server
 *
 * A Model Context Protocol server for generating Ignite UI theming code.
 * Provides tools for creating palettes, typography, elevations, and complete themes.
 */

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';

import {
  detectPlatformSchema,
  createPaletteSchema,
  createCustomPaletteSchema,
  createTypographySchema,
  createElevationsSchema,
  createThemeSchema,
  getComponentDesignTokensSchema,
  createComponentThemeSchema,
  getColorSchema,
  setSizeSchema,
  setSpacingSchema,
  setSpacingInputSchema,
  setRoundnessSchema,
  readResourceSchema,
  handleDetectPlatform,
  handleCreatePalette,
  handleCreateCustomPalette,
  handleCreateTypography,
  handleCreateElevations,
  handleCreateTheme,
  handleGetComponentDesignTokens,
  handleCreateComponentTheme,
  handleGetColor,
  handleSetSize,
  handleSetSpacing,
  handleSetRoundness,
  handleReadResource,
} from './tools/index.js';
import {TOOL_DESCRIPTIONS} from './tools/descriptions.js';
import {withPreprocessing} from './utils/preprocessing.js';
import {PALETTE_COLOR_GROUPS, SHADE_LEVELS, ACCENT_SHADE_LEVELS} from './utils/types.js';

import {RESOURCE_DEFINITIONS, getResourceContent} from './resources/index.js';

/**
 * Create and configure the MCP server.
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: 'igniteui-theming',
    version: '25.0.0',
  });

  // Register tools
  registerTools(server);

  // Register resources
  registerResources(server);

  return server;
}

/**
 * Register all theming tools.
 */
function registerTools(server: McpServer): void {
  // detect_platform tool
  server.registerTool(
    'detect_platform',
    {
      title: 'Detect Target Platform',
      description: TOOL_DESCRIPTIONS.detect_platform,
      inputSchema: {
        packageJsonPath: detectPlatformSchema.shape.packageJsonPath,
      },
    },
    async (params) => {
      const validated = detectPlatformSchema.parse(params);
      return handleDetectPlatform(validated);
    },
  );

  // create_palette tool
  server.registerTool(
    'create_palette',
    {
      title: 'Create Color Palette',
      description: TOOL_DESCRIPTIONS.create_palette,
      inputSchema: {
        platform: createPaletteSchema.shape.platform,
        licensed: createPaletteSchema.shape.licensed,
        variant: createPaletteSchema.shape.variant,
        name: createPaletteSchema.shape.name,
        output: createPaletteSchema.shape.output,
        primary: createPaletteSchema.shape.primary,
        secondary: createPaletteSchema.shape.secondary,
        surface: createPaletteSchema.shape.surface,
        gray: createPaletteSchema.shape.gray,
        info: createPaletteSchema.shape.info,
        success: createPaletteSchema.shape.success,
        warn: createPaletteSchema.shape.warn,
        error: createPaletteSchema.shape.error,
      },
    },
    async (params) => {
      const validated = createPaletteSchema.parse(params);
      return await handleCreatePalette(validated);
    },
  );

  // create_custom_palette tool
  server.registerTool(
    'create_custom_palette',
    {
      title: 'Create Custom Handmade Palette',
      description: TOOL_DESCRIPTIONS.create_custom_palette,
      inputSchema: {
        platform: createCustomPaletteSchema.shape.platform,
        licensed: createCustomPaletteSchema.shape.licensed,
        variant: createCustomPaletteSchema.shape.variant,
        designSystem: createCustomPaletteSchema.shape.designSystem,
        name: createCustomPaletteSchema.shape.name,
        output: createCustomPaletteSchema.shape.output,
        primary: createCustomPaletteSchema.shape.primary,
        secondary: createCustomPaletteSchema.shape.secondary,
        surface: createCustomPaletteSchema.shape.surface,
        gray: createCustomPaletteSchema.shape.gray,
        info: createCustomPaletteSchema.shape.info,
        success: createCustomPaletteSchema.shape.success,
        warn: createCustomPaletteSchema.shape.warn,
        error: createCustomPaletteSchema.shape.error,
      },
    },
    withPreprocessing(createCustomPaletteSchema, handleCreateCustomPalette),
  );

  // create_typography tool
  server.registerTool(
    'create_typography',
    {
      title: 'Create Typography',
      description: TOOL_DESCRIPTIONS.create_typography,
      inputSchema: {
        platform: createTypographySchema.shape.platform,
        licensed: createTypographySchema.shape.licensed,
        fontFamily: createTypographySchema.shape.fontFamily,
        designSystem: createTypographySchema.shape.designSystem,
        customScale: createTypographySchema.shape.customScale,
        name: createTypographySchema.shape.name,
      },
    },
    withPreprocessing(createTypographySchema, handleCreateTypography),
  );

  // create_elevations tool
  server.registerTool(
    'create_elevations',
    {
      title: 'Create Elevations',
      description: TOOL_DESCRIPTIONS.create_elevations,
      inputSchema: {
        platform: createElevationsSchema.shape.platform,
        licensed: createElevationsSchema.shape.licensed,
        designSystem: createElevationsSchema.shape.designSystem,
        name: createElevationsSchema.shape.name,
      },
    },
    async (params) => {
      const validated = createElevationsSchema.parse(params);
      return handleCreateElevations(validated);
    },
  );

  // create_theme tool
  server.registerTool(
    'create_theme',
    {
      title: 'Create Complete Theme',
      description: TOOL_DESCRIPTIONS.create_theme,
      inputSchema: {
        platform: createThemeSchema.shape.platform,
        licensed: createThemeSchema.shape.licensed,
        designSystem: createThemeSchema.shape.designSystem,
        primaryColor: createThemeSchema.shape.primaryColor,
        secondaryColor: createThemeSchema.shape.secondaryColor,
        surfaceColor: createThemeSchema.shape.surfaceColor,
        variant: createThemeSchema.shape.variant,
        name: createThemeSchema.shape.name,
        fontFamily: createThemeSchema.shape.fontFamily,
        includeTypography: createThemeSchema.shape.includeTypography,
        includeElevations: createThemeSchema.shape.includeElevations,
        includeSpacing: createThemeSchema.shape.includeSpacing,
      },
    },
    async (params) => {
      const validated = createThemeSchema.parse(params);
      return await handleCreateTheme(validated);
    },
  );

  // set_size tool
  server.registerTool(
    'set_size',
    {
      title: 'Set Size Scale',
      description: TOOL_DESCRIPTIONS.set_size,
      inputSchema: {
        platform: setSizeSchema.shape.platform,
        component: setSizeSchema.shape.component,
        scope: setSizeSchema.shape.scope,
        size: setSizeSchema.shape.size,
        output: setSizeSchema.shape.output,
      },
    },
    async (params) => {
      const validated = setSizeSchema.parse(params);
      return handleSetSize(validated);
    },
  );

  // set_spacing tool
  server.registerTool(
    'set_spacing',
    {
      title: 'Set Spacing Scale',
      description: TOOL_DESCRIPTIONS.set_spacing,
      inputSchema: {
        platform: setSpacingInputSchema.shape.platform,
        component: setSpacingInputSchema.shape.component,
        scope: setSpacingInputSchema.shape.scope,
        spacing: setSpacingInputSchema.shape.spacing,
        inline: setSpacingInputSchema.shape.inline,
        block: setSpacingInputSchema.shape.block,
        output: setSpacingInputSchema.shape.output,
      },
    },
    async (params) => {
      const validated = setSpacingSchema.parse(params);
      return handleSetSpacing(validated);
    },
  );

  // set_roundness tool
  server.registerTool(
    'set_roundness',
    {
      title: 'Set Roundness Scale',
      description: TOOL_DESCRIPTIONS.set_roundness,
      inputSchema: {
        platform: setRoundnessSchema.shape.platform,
        component: setRoundnessSchema.shape.component,
        scope: setRoundnessSchema.shape.scope,
        radiusFactor: setRoundnessSchema.shape.radiusFactor,
        output: setRoundnessSchema.shape.output,
      },
    },
    async (params) => {
      const validated = setRoundnessSchema.parse(params);
      return handleSetRoundness(validated);
    },
  );

  // get_component_design_tokens tool
  server.registerTool(
    'get_component_design_tokens',
    {
      title: 'Get Component Design Tokens',
      description: TOOL_DESCRIPTIONS.get_component_design_tokens,
      inputSchema: {
        component: getComponentDesignTokensSchema.shape.component,
      },
    },
    async (params) => {
      const validated = getComponentDesignTokensSchema.parse(params);
      return await handleGetComponentDesignTokens(validated);
    },
  );

  // create_component_theme tool
  server.registerTool(
    'create_component_theme',
    {
      title: 'Create Component Theme',
      description: TOOL_DESCRIPTIONS.create_component_theme,
      inputSchema: {
        platform: createComponentThemeSchema.shape.platform,
        licensed: createComponentThemeSchema.shape.licensed,
        designSystem: createComponentThemeSchema.shape.designSystem,
        variant: createComponentThemeSchema.shape.variant,
        component: createComponentThemeSchema.shape.component,
        tokens: createComponentThemeSchema.shape.tokens,
        selector: createComponentThemeSchema.shape.selector,
        name: createComponentThemeSchema.shape.name,
        output: createComponentThemeSchema.shape.output,
      },
    },
    withPreprocessing(createComponentThemeSchema, handleCreateComponentTheme),
  );

  // get_color tool
  server.registerTool(
    'get_color',
    {
      title: 'Get Palette Color',
      description: TOOL_DESCRIPTIONS.get_color,
      inputSchema: {
        color: z.enum(PALETTE_COLOR_GROUPS as unknown as [string, ...string[]]),
        variant: z.enum([...SHADE_LEVELS, ...ACCENT_SHADE_LEVELS] as unknown as [string, ...string[]]).optional(),
        contrast: z.boolean().optional(),
        opacity: z.number().min(0).max(1).optional(),
      },
    },
    async (params) => {
      const validated = getColorSchema.parse(params);
      return handleGetColor(validated);
    },
  );

  // read_resource tool — description built dynamically from RESOURCE_DEFINITIONS
  server.registerTool(
    'read_resource',
    {
      title: 'Read Theming Resource',
      description: buildReadResourceDescription(),
      inputSchema: {
        uri: readResourceSchema.shape.uri,
      },
    },
    async (params) => {
      const validated = readResourceSchema.parse(params);
      return handleReadResource(validated);
    },
  );
}

/**
 * Build the read_resource tool description dynamically from RESOURCE_DEFINITIONS.
 * Groups resources by URI path prefix and appends the catalog to the static description.
 */
function buildReadResourceDescription(): string {
  const groups: Record<string, Array<{uri: string; name: string; description: string}>> = {
    Platforms: [],
    Presets: [],
    'Color Guidance': [],
    'Layout Docs': [],
  };

  for (const r of RESOURCE_DEFINITIONS) {
    if (r.uri.includes('://platforms')) {
      groups['Platforms'].push(r);
    } else if (r.uri.includes('://presets/')) {
      groups['Presets'].push(r);
    } else if (r.uri.includes('://guidance/')) {
      groups['Color Guidance'].push(r);
    } else if (r.uri.includes('://docs/')) {
      groups['Layout Docs'].push(r);
    }
  }

  const lines: string[] = [TOOL_DESCRIPTIONS.read_resource, '', '<available_resources>'];

  for (const [groupName, resources] of Object.entries(groups)) {
    if (resources.length === 0) continue;
    lines.push(`  ${groupName}:`);
    for (const r of resources) {
      lines.push(`    - "${r.uri}" — ${r.name}`);
    }
  }

  lines.push('</available_resources>');
  return lines.join('\n');
}

/**
 * Register all theming resources.
 */
function registerResources(server: McpServer): void {
  for (const resource of RESOURCE_DEFINITIONS) {
    server.registerResource(
      resource.name.toLowerCase().replace(/\s+/g, '-'),
      resource.uri,
      {
        title: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      },
      async (uri) => {
        const content = getResourceContent(uri.href);
        if (!content) {
          throw new Error(`Resource not found: ${uri.href}`);
        }
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: content.mimeType,
              text: content.content,
            },
          ],
        };
      },
    );
  }
}

/**
 * Main entry point - start the MCP server with STDIO transport.
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Run the server
main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
