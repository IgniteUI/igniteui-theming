import {describe, it, expect} from 'vitest';
import * as path from 'path';
import {fileURLToPath} from 'url';
import {generatePaletteCss, generateCustomPaletteCss, formatCssOutput} from '../../generators/css.js';
import {SHADE_LEVELS} from '../../utils/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// From src/mcp/__tests__/generators/ we need to go up 4 levels to package root
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const TEST_LOAD_PATHS = [PACKAGE_ROOT];

describe('generatePaletteCss', () => {
  it('should generate CSS custom properties for a basic palette', async () => {
    const result = await generatePaletteCss({
      primary: '#1976d2',
      secondary: '#ff9800',
      surface: '#fafafa',
      variant: 'light',
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toBeDefined();
    expect(result.description).toContain('light palette');
    expect(result.description).toContain('#1976d2');

    expect(result.css).toContain(':root');
    expect(result.css).toContain('--ig-primary-50');
    expect(result.css).toContain('--ig-primary-500');
    expect(result.css).toContain('--ig-primary-900');
    expect(result.css).toContain('--ig-secondary-50');
    expect(result.css).toContain('--ig-secondary-500');
    expect(result.css).toContain('--ig-surface-50');
    expect(result.css).toContain('--ig-surface-500');
    expect(result.css).toContain('--ig-gray-50');
    expect(result.css).toContain('--ig-gray-500');
    expect(result.css).toContain('--ig-wcag-aa');
    expect(result.css).toContain('--ig-contrast-level');

    // CSS variables should have actual color values (hsl, hsla, rgb, rgba, color, or hex)
    // This regex matches CSS variable declarations with color values
    const colorValuePattern = /--ig-primary-500:\s*(hsl|hsla|rgb|rgba|color|#)[\w\d(),.\s%-]+;/;
    expect(result.css).toMatch(colorValuePattern);
  });

  it('should generate CSS for a dark palette', async () => {
    const result = await generatePaletteCss({
      primary: '#bb86fc',
      secondary: '#03dac6',
      surface: '#121212',
      variant: 'dark',
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toBeDefined();
    expect(result.description).toContain('dark palette');
    expect(result.css).toContain('--ig-primary-500');
    expect(result.css).toContain('--ig-secondary-500');
    expect(result.css).toContain('--ig-surface-500');
    expect(result.css).toContain('--ig-gray-500');
  });

  it('should include optional colors when provided', async () => {
    const result = await generatePaletteCss({
      primary: '#1976d2',
      secondary: '#ff9800',
      surface: '#fafafa',
      info: '#2196f3',
      success: '#4caf50',
      warn: '#ff9800',
      error: '#f44336',
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toContain('--ig-info-500');
    expect(result.css).toContain('--ig-success-500');
    expect(result.css).toContain('--ig-warn-500');
    expect(result.css).toContain('--ig-error-500');
  });

  it('should include contrast variables for each shade', async () => {
    const result = await generatePaletteCss({
      primary: '#1976d2',
      secondary: '#ff9800',
      surface: '#fafafa',
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toContain('--ig-primary-500-contrast');
    expect(result.css).toContain('--ig-secondary-500-contrast');
  });

  it('should generate valid color values for all palette shades', async () => {
    const result = await generatePaletteCss({
      primary: '#1976d2',
      secondary: '#ff9800',
      surface: '#fafafa',
      _loadPaths: TEST_LOAD_PATHS,
    });

    const getVarValue = (css: string, varName: string): string | null => {
      const match = css.match(new RegExp(`${varName}:\\s*([^;]+);`));

      return match ? match[1].trim() : null;
    };

    const colorPattern = /^(hsl|hsla|rgb|rgba|color|#)/;

    for (const shade of SHADE_LEVELS) {
      const value = getVarValue(result.css, `--ig-primary-${shade}`);

      expect(value, `--ig-primary-${shade} should have a value`).not.toBeNull();
      expect(value, `--ig-primary-${shade} should be a valid color`).toMatch(colorPattern);
    }

    const contrastValue = getVarValue(result.css, '--ig-primary-500-contrast');

    expect(contrastValue, '--ig-primary-500-contrast should have a value').not.toBeNull();
    expect(contrastValue, '--ig-primary-500-contrast should be a valid color').toMatch(colorPattern);
  });

  it('should throw an error for invalid colors', async () => {
    await expect(
      generatePaletteCss({
        primary: 'not-a-color',
        secondary: '#ff9800',
        surface: '#fafafa',
        _loadPaths: TEST_LOAD_PATHS,
      }),
    ).rejects.toThrow();
  });
});

describe('generateCustomPaletteCss', () => {
  it('should generate CSS for a custom palette with shades mode', async () => {
    const result = await generateCustomPaletteCss({
      variant: 'light',
      surfaceColor: '#fafafa',
      colors: {
        primary: {mode: 'shades', baseColor: '#1976d2'},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
        gray: {mode: 'shades', baseColor: '#000000'},
        info: {mode: 'shades', baseColor: '#2196f3'},
        success: {mode: 'shades', baseColor: '#4caf50'},
        warn: {mode: 'shades', baseColor: '#ff9800'},
        error: {mode: 'shades', baseColor: '#f44336'},
      },
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toBeDefined();
    expect(result.description).toContain('custom');
    expect(result.description).toContain('light');

    // Should contain all palette variables
    expect(result.css).toContain('--ig-primary-500');
    expect(result.css).toContain('--ig-secondary-500');
    expect(result.css).toContain('--ig-gray-500');
  });

  it('should generate CSS for a custom palette with explicit shades', async () => {
    const result = await generateCustomPaletteCss({
      variant: 'light',
      surfaceColor: '#FAFAFA',
      colors: {
        primary: {
          mode: 'explicit',
          shades: {
            '50': '#e3f2fd',
            '100': '#bbdefb',
            '200': '#90caf9',
            '300': '#64b5f6',
            '400': '#42a5f5',
            '500': '#2196f3',
            '600': '#1e88e5',
            '700': '#1976d2',
            '800': '#1565c0',
            '900': '#0d47a1',
            A100: '#82b1ff',
            A200: '#448aff',
            A400: '#2979ff',
            A700: '#2962ff',
          },
        },
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
        gray: {mode: 'shades', baseColor: '#000000'},
        info: {mode: 'shades', baseColor: '#2196f3'},
        success: {mode: 'shades', baseColor: '#4caf50'},
        warn: {mode: 'shades', baseColor: '#ff9800'},
        error: {mode: 'shades', baseColor: '#f44336'},
      },
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toBeDefined();
    expect(result.css).toContain('--ig-primary-500');
    expect(result.css).toContain('--ig-primary-50');
    expect(result.css).toContain('--ig-primary-900');

    const primary500Match = result.css.match(/--ig-primary-500:\s*([^;]+);/);

    expect(primary500Match).not.toBeNull();
    expect(primary500Match![1].trim()).toMatch(/^(hsl|hsla|rgb|rgba|#)/);
  });
});

describe('formatCssOutput', () => {
  it('should add a header comment to CSS output', () => {
    const css = ':root { --ig-primary-500: #1976d2; }';
    const description = 'Test palette';
    const formatted = formatCssOutput(css, description);

    expect(formatted).toContain('/* Generated by Ignite UI Theming MCP Server */');
    expect(formatted).toContain('/* Test palette */');
    expect(formatted).toContain(':root { --ig-primary-500: #1976d2; }');
  });
});

describe('generateComponentThemeCss', () => {
  // Note: Button themes have a nested structure (flat, outlined, contained, fab)
  // which requires special handling. Using avatar for simpler tests.

  it('should generate CSS custom properties for an avatar theme', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      platform: 'webcomponents',
      designSystem: 'material',
      variant: 'light',
      component: 'avatar',
      tokens: {background: '#ff5722'},
      selector: 'igc-avatar',
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toBeDefined();
    expect(result.description).toContain('avatar');
    expect(result.description).toContain('1 token');

    // Should contain the selector
    expect(result.css).toContain('igc-avatar');

    // Should contain CSS custom properties with correct prefix in var() fallback
    expect(result.css).toContain('--background: var(--igx-avatar-background, var(--ig-avatar-background');
  });

  it('should use platform-specific selector as default when no selector provided', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      platform: 'webcomponents',
      designSystem: 'material',
      variant: 'light',
      component: 'avatar',
      tokens: {background: '#ff5722'},
      _loadPaths: TEST_LOAD_PATHS,
    });

    // Should use the Web Components selector as default
    expect(result.css).toContain('igc-avatar');
  });

  it('should use platform-specific selector when platform is specified', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      component: 'avatar',
      platform: 'webcomponents',
      designSystem: 'material',
      variant: 'light',
      tokens: {background: '#ff5722'},
      _loadPaths: TEST_LOAD_PATHS,
    });

    // Should use the Web Components selector
    expect(result.css).toContain('igc-avatar');
  });

  it('should handle numeric token values', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      platform: 'webcomponents',
      designSystem: 'material',
      variant: 'light',
      component: 'badge',
      tokens: {
        'background-color': '#1976d2',
        'border-radius': 4,
      },
      selector: 'igc-badge',
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toBeDefined();
    expect(result.css).toContain('igc-badge');
  });

  it('should throw error for unknown component', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    await expect(
      generateComponentThemeCss({
        platform: 'webcomponents',
        designSystem: 'material',
        variant: 'light',
        component: 'unknown-component',
        tokens: {background: '#1976d2'},
        _loadPaths: TEST_LOAD_PATHS,
      }),
    ).rejects.toThrow('Unknown component');
  });

  it('should generate valid CSS for multiple tokens', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      platform: 'webcomponents',
      designSystem: 'material',
      variant: 'light',
      component: 'avatar',
      tokens: {
        background: '#ff5722',
        color: 'white',
        'icon-color': 'white',
        'border-radius': '8px',
      },
      selector: '.my-avatar',
      _loadPaths: TEST_LOAD_PATHS,
    });

    expect(result.css).toContain('.my-avatar');
    expect(result.description).toContain('4 token');

    // CSS should be valid (no Sass syntax remaining)
    expect(result.css).not.toContain('$');
    expect(result.css).not.toContain('@include');
    expect(result.css).not.toContain('@use');
  });

  it('should handle Angular selector with igx prefix', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      component: 'avatar',
      platform: 'angular',
      designSystem: 'material',
      variant: 'light',
      tokens: {background: '#ff5722'},
      _loadPaths: TEST_LOAD_PATHS,
    });

    // Should use the Angular selector
    expect(result.css).toMatch(/igx-avatar/);
    // Should use igx prefix for variables in var() fallback
    expect(result.css).toContain('--background: var(--igx-avatar-background');
  });

  it('should include schema parameter for bootstrap design system', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      component: 'avatar',
      platform: 'webcomponents',
      designSystem: 'bootstrap',
      variant: 'light',
      tokens: {background: '#ff5722'},
      _loadPaths: TEST_LOAD_PATHS,
    });

    // Check the description includes bootstrap
    expect(result.description).toContain('bootstrap');
    expect(result.description).toContain('light');
  });

  it('should include schema parameter for dark variant', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      component: 'avatar',
      platform: 'webcomponents',
      designSystem: 'material',
      variant: 'dark',
      tokens: {background: '#ff5722'},
      _loadPaths: TEST_LOAD_PATHS,
    });

    // Check the description includes dark
    expect(result.description).toContain('dark');
  });

  it('should default to material light when not specified', async () => {
    const {generateComponentThemeCss} = await import('../../generators/css.js');

    const result = await generateComponentThemeCss({
      component: 'avatar',
      platform: 'webcomponents',
      tokens: {background: '#ff5722'},
      _loadPaths: TEST_LOAD_PATHS,
    });

    // Should default to material light
    expect(result.description).toContain('material');
    expect(result.description).toContain('light');
  });
});
