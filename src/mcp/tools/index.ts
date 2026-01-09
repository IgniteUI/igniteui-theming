/**
 * Tools index - exports schemas and handlers for all MCP tools.
 */

export {
  detectPlatformSchema,
  createPaletteSchema,
  createCustomPaletteSchema,
  createTypographySchema,
  createElevationsSchema,
  createThemeSchema,
  getComponentDesignTokensSchema,
  createComponentThemeSchema,
  platformSchema,
  type DetectPlatformParams,
  type CreatePaletteParams,
  type CreateCustomPaletteParams,
  type CreateTypographyParams,
  type CreateElevationsParams,
  type CreateThemeParams,
  type GetComponentDesignTokensParams,
  type CreateComponentThemeParams,
  type Platform,
} from './schemas.js';

export {
  handleDetectPlatform,
  handleCreatePalette,
  handleCreateCustomPalette,
  handleCreateTypography,
  handleCreateElevations,
  handleCreateTheme,
  handleGetComponentDesignTokens,
  handleCreateComponentTheme,
} from './handlers/index.js';
