#!/usr/bin/env node
/**
 * Ignite UI Theming MCP Server
 *
 * A Model Context Protocol server for generating Ignite UI theming code.
 * Provides tools for creating palettes, typography, elevations, and complete themes.
 */

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  detectPlatformSchema,
  createPaletteSchema,
  createCustomPaletteSchema,
  createTypographySchema,
  createElevationsSchema,
  createThemeSchema,
  handleDetectPlatform,
  handleCreatePalette,
  handleCreateCustomPalette,
  handleCreateTypography,
  handleCreateElevations,
  handleCreateTheme,
} from './tools/index.js';
import {TOOL_DESCRIPTIONS} from './tools/descriptions.js';

import {RESOURCE_DEFINITIONS, getResourceContent} from './resources/index.js';

/**
 * Create and configure the MCP server.
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: 'igniteui-theming',
    version: '1.0.0',
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
        primary: createPaletteSchema.shape.primary,
        secondary: createPaletteSchema.shape.secondary,
        surface: createPaletteSchema.shape.surface,
        gray: createPaletteSchema.shape.gray,
        info: createPaletteSchema.shape.info,
        success: createPaletteSchema.shape.success,
        warn: createPaletteSchema.shape.warn,
        error: createPaletteSchema.shape.error,
        variant: createPaletteSchema.shape.variant,
        name: createPaletteSchema.shape.name,
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
        variant: createCustomPaletteSchema.shape.variant,
        designSystem: createCustomPaletteSchema.shape.designSystem,
        name: createCustomPaletteSchema.shape.name,
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
    async (params) => {
      const validated = createCustomPaletteSchema.parse(params);
      return await handleCreateCustomPalette(validated);
    },
  );

  // create_typography tool
  server.registerTool(
    'create_typography',
    {
      title: 'Create Typography',
      description: TOOL_DESCRIPTIONS.create_typography,
      inputSchema: {
        platform: createTypographySchema.shape.platform,
        fontFamily: createTypographySchema.shape.fontFamily,
        designSystem: createTypographySchema.shape.designSystem,
        name: createTypographySchema.shape.name,
      },
    },
    async (params) => {
      const validated = createTypographySchema.parse(params);
      return handleCreateTypography(validated);
    },
  );

  // create_elevations tool
  server.registerTool(
    'create_elevations',
    {
      title: 'Create Elevations',
      description: TOOL_DESCRIPTIONS.create_elevations,
      inputSchema: {
        platform: createElevationsSchema.shape.platform,
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
