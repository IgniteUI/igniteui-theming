#!/usr/bin/env node

/**
 * Test script for the IgniteUI Theming MCP Server
 * This script validates that CSS can be generated successfully
 */

import * as sass from 'sass-embedded';
import postcss from 'postcss';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SASS_ROOT = path.resolve(__dirname, '..');
const testOutputDir = path.join(__dirname, 'test-output');

// Ensure test output directory exists
await fs.mkdir(testOutputDir, { recursive: true });

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

async function compileSass(sassCode, testName) {
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
    
    // Save output for inspection
    await fs.writeFile(path.join(testOutputDir, `${testName}.css`), cssStr, 'utf-8');
    
    return cssStr;
  } finally {
    compiler.dispose();
  }
}

async function testColorPalette() {
  console.log('Testing color palette generation...');
  const themes = [['material', 'light'], ['bootstrap', 'dark']];
  
  for (const [theme, variant] of themes) {
    try {
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
      
      const css = await compileSass(sassCode, `palette-${theme}-${variant}`);
      if (css.includes('--ig-primary-')) {
        console.log(`  ✓ ${theme} ${variant} palette (${css.split('\n').length} lines)`);
      } else {
        throw new Error('Missing expected CSS variables');
      }
    } catch (error) {
      console.error(`  ✗ ${theme} ${variant} palette failed:`, error.message);
      throw error;
    }
  }
}

async function testTypography() {
  console.log('\nTesting typography generation...');
  const theme = 'material';
  
  try {
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
    `;
    
    const css = await compileSass(sassCode, `typography-${theme}`);
    if (css.includes('--ig-font-family:') && css.includes('--ig-h1-font-size:')) {
      console.log(`  ✓ ${theme} typography (${css.split('\n').length} lines)`);
    } else {
      throw new Error('Missing expected typography variables');
    }
  } catch (error) {
    console.error(`  ✗ ${theme} typography failed:`, error.message);
    throw error;
  }
}

async function testElevations() {
  console.log('\nTesting elevations generation...');
  const theme = 'material';
  
  try {
    const sassCode = `
      @use 'sass:map';
      @use 'sass/elevations/presets/${theme}' as *;

      :root {
          @each $level, $shadow in $elevations {
              --ig-elevation-#{$level}: #{$shadow};
          }
      }
    `;
    
    const css = await compileSass(sassCode, `elevations-${theme}`);
    if (css.includes('--ig-elevation-0:') && css.includes('--ig-elevation-12:')) {
      console.log(`  ✓ ${theme} elevations (${css.split('\n').length} lines)`);
    } else {
      throw new Error('Missing expected elevation variables');
    }
  } catch (error) {
    console.error(`  ✗ ${theme} elevations failed:`, error.message);
    throw error;
  }
}

console.log('='.repeat(60));
console.log('🧪 Running MCP Server Tests');
console.log('='.repeat(60) + '\n');

try {
  await testColorPalette();
  await testTypography();
  await testElevations();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests passed!');
  console.log('='.repeat(60));
  console.log(`\nTest output saved to: ${testOutputDir}`);
  console.log('\nTo run the MCP server:');
  console.log('  npm start');
} catch (error) {
  console.error('\n❌ Tests failed!');
  process.exit(1);
}
