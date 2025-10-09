#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as sass from 'sass-embedded';
import postcss from 'postcss';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SASS_ROOT = path.resolve(__dirname, '..');

// PostCSS plugin to strip comments
const stripComments = () => {
  return {
    postcssPlugin: 'postcss-strip-comments',
    OnceExit(root) {
      root.walkComments((node) => node.remove());
    },
  };
};

stripComments.postcss = true;
const postProcessor = postcss([stripComments]);

/**
 * Compile Sass string to CSS
 */
async function compileSass(sassCode) {
  const compiler = await sass.initAsyncCompiler();
  try {
    const result = await compiler.compileStringAsync(sassCode, {
      loadPaths: [SASS_ROOT],
      silenceDeprecations: ['color-functions'],
    });
    
    let cssStr = postProcessor.process(result.css).css;
    
    // Strip BOM if any
    if (cssStr.charCodeAt(0) === 0xfeff) {
      cssStr = cssStr.substring(1);
    }
    
    return cssStr;
  } finally {
    compiler.dispose();
  }
}

/**
 * Generate color palette CSS
 */
async function generateColorPalette(theme = 'material', variant = 'light') {
  const validThemes = ['material', 'bootstrap', 'fluent', 'indigo'];
  const validVariants = ['light', 'dark'];
  
  if (!validThemes.includes(theme)) {
    throw new Error(`Invalid theme: ${theme}. Valid themes are: ${validThemes.join(', ')}`);
  }
  
  if (!validVariants.includes(variant)) {
    throw new Error(`Invalid variant: ${variant}. Valid variants are: ${validVariants.join(', ')}`);
  }
  
  const sassCode = `
    @use 'sass:string';
    @use 'sass:map';
    @use 'sass' as *;
    @use 'sass/color' as igcolor;
    @use 'sass/color/presets' as *;

    $palette: $${variant}-${theme}-palette;
    $protoPalette: map.remove(igcolor.$IPalette, '_meta');
    $result: ();

    @each $p, $c in $protoPalette {
        $result: map.merge($result, ($p: ()));

        @each $v in $c {
            $shade: igcolor.color($palette, $p, $v);
            $contrast: igcolor.contrast-color($palette, $p, $v);
            $result: map.merge($result, $p, ($v: $shade, #{$v}-contrast: $contrast));
        }
    }

    :root {
        @each $palette-name, $color in $result {
            @each $shade, $value in $color {
                --ig-#{$palette-name}-#{$shade}: #{$value};
            } 
        }
    }
  `;
  
  return await compileSass(sassCode);
}

/**
 * Generate typography CSS
 */
async function generateTypography(theme = 'material') {
  const validThemes = ['material', 'bootstrap', 'fluent', 'indigo'];
  
  if (!validThemes.includes(theme)) {
    throw new Error(`Invalid theme: ${theme}. Valid themes are: ${validThemes.join(', ')}`);
  }
  
  const sassCode = `
    @use 'sass:map';
    @use 'sass/typography';
    @use 'sass/typography/presets' as *;

    $typeScale: $${theme}-type-scale;
    $typeface: $${theme}-typeface;

    :root {
        --ig-font-family: #{$typeface};
        
        @each $category, $props in $typeScale {
            @each $prop, $value in $props {
                @if $prop != 'font-family' {
                    --ig-#{$category}-#{$prop}: #{$value};
                }
            }
        }
    }

    @each $category, $props in $typeScale {
        .ig-typography-#{$category} {
            font-family: var(--ig-font-family);
            @each $prop, $value in $props {
                @if $prop != 'font-family' {
                    #{$prop}: var(--ig-#{$category}-#{$prop});
                }
            }
        }
    }
  `;
  
  return await compileSass(sassCode);
}

/**
 * Generate elevations CSS
 */
async function generateElevations(theme = 'material') {
  const validThemes = ['material', 'indigo'];
  
  if (!validThemes.includes(theme)) {
    throw new Error(`Invalid theme: ${theme}. Valid themes are: ${validThemes.join(', ')}`);
  }
  
  const sassCode = `
    @use 'sass:map';
    @use 'sass/elevations';
    @use 'sass/elevations/presets/${theme}' as *;

    :root {
        @each $level, $shadow in $elevations {
            --ig-elevation-#{$level}: #{$shadow};
        }
    }

    @each $level, $shadow in $elevations {
        .ig-elevation-#{$level} {
            box-shadow: var(--ig-elevation-#{$level});
        }
    }
  `;
  
  return await compileSass(sassCode);
}

/**
 * Generate sizing and spacing CSS
 */
async function generateSizingAndSpacing() {
  const sassCode = `
    @use 'sass/themes/mixins' as *;
    @use 'sass/themes/functions' as *;

    :root {
        // Size variables
        --ig-size-small: 1;
        --ig-size-medium: 2;
        --ig-size-large: 3;
        
        // Spacing variables
        --ig-spacing: 1;
        --ig-spacing-small: 1;
        --ig-spacing-medium: 1;
        --ig-spacing-large: 1;
        
        // Inline spacing
        --ig-spacing-inline: 1;
        --ig-spacing-inline-small: var(--ig-spacing-inline, var(--ig-spacing-small));
        --ig-spacing-inline-medium: var(--ig-spacing-inline, var(--ig-spacing-medium));
        --ig-spacing-inline-large: var(--ig-spacing-inline, var(--ig-spacing-large));
        
        // Block spacing
        --ig-spacing-block: 1;
        --ig-spacing-block-small: var(--ig-spacing-block, var(--ig-spacing-small));
        --ig-spacing-block-medium: var(--ig-spacing-block, var(--ig-spacing-medium));
        --ig-spacing-block-large: var(--ig-spacing-block, var(--ig-spacing-large));
        
        // Radius variables
        --ig-radius-factor: 1;
    }

    /* Size utility classes */
    .ig-size-small {
        --component-size: var(--ig-size-small);
    }

    .ig-size-medium {
        --component-size: var(--ig-size-medium);
    }

    .ig-size-large {
        --component-size: var(--ig-size-large);
    }

    /* Spacing utility classes */
    .ig-spacing-compact {
        --ig-spacing: 0.5;
    }

    .ig-spacing-cosy {
        --ig-spacing: 1;
    }

    .ig-spacing-comfortable {
        --ig-spacing: 1.5;
    }
  `;
  
  return await compileSass(sassCode);
}

/**
 * Generate complete theme CSS
 */
async function generateCompleteTheme(theme = 'material', variant = 'light') {
  const validThemes = ['material', 'bootstrap', 'fluent', 'indigo'];
  const validVariants = ['light', 'dark'];
  
  if (!validThemes.includes(theme)) {
    throw new Error(`Invalid theme: ${theme}. Valid themes are: ${validThemes.join(', ')}`);
  }
  
  if (!validVariants.includes(variant)) {
    throw new Error(`Invalid variant: ${variant}. Valid variants are: ${validVariants.join(', ')}`);
  }
  
  const palette = await generateColorPalette(theme, variant);
  const typography = await generateTypography(theme);
  const elevations = theme === 'material' || theme === 'indigo' 
    ? await generateElevations(theme) 
    : await generateElevations('material');
  const spacing = await generateSizingAndSpacing();
  
  return `/* ${theme} ${variant} Theme */\n\n${palette}\n\n${typography}\n\n${elevations}\n\n${spacing}`;
}

// Create MCP server
const server = new Server(
  {
    name: 'igniteui-theming-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_color_palette',
        description: 'Generate CSS color palette variables from igniteui-theming presets. Supports material, bootstrap, fluent, and indigo themes with light and dark variants.',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: 'Theme name (material, bootstrap, fluent, or indigo)',
              enum: ['material', 'bootstrap', 'fluent', 'indigo'],
              default: 'material',
            },
            variant: {
              type: 'string',
              description: 'Color variant (light or dark)',
              enum: ['light', 'dark'],
              default: 'light',
            },
          },
        },
      },
      {
        name: 'generate_typography',
        description: 'Generate CSS typography definitions from igniteui-theming presets. Includes type scales, font families, and typography utility classes.',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: 'Theme name (material, bootstrap, fluent, or indigo)',
              enum: ['material', 'bootstrap', 'fluent', 'indigo'],
              default: 'material',
            },
          },
        },
      },
      {
        name: 'generate_elevations',
        description: 'Generate CSS elevation (box-shadow) definitions from igniteui-theming presets. Supports material and indigo themes.',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: 'Theme name (material or indigo)',
              enum: ['material', 'indigo'],
              default: 'material',
            },
          },
        },
      },
      {
        name: 'generate_sizing_spacing',
        description: 'Generate CSS sizing and spacing utility variables and classes. Includes size variants (small, medium, large) and spacing modes (compact, cosy, comfortable).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'generate_complete_theme',
        description: 'Generate a complete CSS theme including color palette, typography, elevations, and sizing/spacing utilities.',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: 'Theme name (material, bootstrap, fluent, or indigo)',
              enum: ['material', 'bootstrap', 'fluent', 'indigo'],
              default: 'material',
            },
            variant: {
              type: 'string',
              description: 'Color variant (light or dark)',
              enum: ['light', 'dark'],
              default: 'light',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_color_palette': {
        const theme = args.theme || 'material';
        const variant = args.variant || 'light';
        const css = await generateColorPalette(theme, variant);
        return {
          content: [
            {
              type: 'text',
              text: css,
            },
          ],
        };
      }

      case 'generate_typography': {
        const theme = args.theme || 'material';
        const css = await generateTypography(theme);
        return {
          content: [
            {
              type: 'text',
              text: css,
            },
          ],
        };
      }

      case 'generate_elevations': {
        const theme = args.theme || 'material';
        const css = await generateElevations(theme);
        return {
          content: [
            {
              type: 'text',
              text: css,
            },
          ],
        };
      }

      case 'generate_sizing_spacing': {
        const css = await generateSizingAndSpacing();
        return {
          content: [
            {
              type: 'text',
              text: css,
            },
          ],
        };
      }

      case 'generate_complete_theme': {
        const theme = args.theme || 'material';
        const variant = args.variant || 'light';
        const css = await generateCompleteTheme(theme, variant);
        return {
          content: [
            {
              type: 'text',
              text: css,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('IgniteUI Theming MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
