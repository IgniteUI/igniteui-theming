#!/usr/bin/env node

/**
 * CLI wrapper for the IgniteUI Theming MCP Server
 * This allows direct command-line usage for testing and debugging
 */

import * as sass from 'sass-embedded';
import postcss from 'postcss';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SASS_ROOT = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const theme = args.find(arg => arg.startsWith('--theme='))?.split('=')[1] || 'material';
const variant = args.find(arg => arg.startsWith('--variant='))?.split('=')[1] || 'light';
const output = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

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

async function compileSass(sassCode) {
  const compiler = await sass.initAsyncCompiler();
  try {
    const result = await compiler.compileStringAsync(sassCode, {
      loadPaths: [SASS_ROOT],
      silenceDeprecations: ['color-functions'],
    });
    
    let cssStr = postProcessor.process(result.css).css;
    if (cssStr.charCodeAt(0) === 0xfeff) {
      cssStr = cssStr.substring(1);
    }
    
    return cssStr;
  } finally {
    compiler.dispose();
  }
}

async function generateColorPalette(theme, variant) {
  const sassCode = `
    @use 'sass:map';
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

async function generateTypography(theme) {
  const sassCode = `
    @use 'sass:map';
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

async function generateElevations(theme) {
  const sassCode = `
    @use 'sass:map';
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

async function generateSizingAndSpacing() {
  const sassCode = `
    :root {
        --ig-size-small: 1;
        --ig-size-medium: 2;
        --ig-size-large: 3;
        
        --ig-spacing: 1;
        --ig-spacing-small: 1;
        --ig-spacing-medium: 1;
        --ig-spacing-large: 1;
        
        --ig-spacing-inline: 1;
        --ig-spacing-inline-small: var(--ig-spacing-inline, var(--ig-spacing-small));
        --ig-spacing-inline-medium: var(--ig-spacing-inline, var(--ig-spacing-medium));
        --ig-spacing-inline-large: var(--ig-spacing-inline, var(--ig-spacing-large));
        
        --ig-spacing-block: 1;
        --ig-spacing-block-small: var(--ig-spacing-block, var(--ig-spacing-small));
        --ig-spacing-block-medium: var(--ig-spacing-block, var(--ig-spacing-medium));
        --ig-spacing-block-large: var(--ig-spacing-block, var(--ig-spacing-large));
        
        --ig-radius-factor: 1;
    }

    .ig-size-small {
        --component-size: var(--ig-size-small);
    }

    .ig-size-medium {
        --component-size: var(--ig-size-medium);
    }

    .ig-size-large {
        --component-size: var(--ig-size-large);
    }

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

async function main() {
  if (!command) {
    console.log(`
IgniteUI Theming CLI

Usage:
  node cli.js <command> [options]

Commands:
  palette       Generate color palette CSS
  typography    Generate typography CSS
  elevations    Generate elevations CSS
  spacing       Generate sizing and spacing CSS

Options:
  --theme=<name>      Theme name (material, bootstrap, fluent, indigo)
  --variant=<type>    Variant type (light, dark) - for palette only
  --output=<file>     Output file path (optional, prints to stdout if not specified)

Examples:
  node cli.js palette --theme=material --variant=light
  node cli.js typography --theme=bootstrap
  node cli.js elevations --theme=material --output=elevations.css
  node cli.js spacing
    `);
    process.exit(0);
  }

  try {
    let css;
    
    switch (command) {
      case 'palette':
        css = await generateColorPalette(theme, variant);
        break;
      case 'typography':
        css = await generateTypography(theme);
        break;
      case 'elevations':
        css = await generateElevations(theme);
        break;
      case 'spacing':
        css = await generateSizingAndSpacing();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    if (output) {
      await fs.writeFile(output, css, 'utf-8');
      console.log(`✓ Generated ${output}`);
    } else {
      console.log(css);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
