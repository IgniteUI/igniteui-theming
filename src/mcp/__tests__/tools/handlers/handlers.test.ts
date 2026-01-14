/**
 * Tests for tool handler functions.
 *
 * These tests verify that handlers:
 * 1. Return the correct MCP response format
 * 2. Include expected content in responses
 * 3. Handle validation and warnings correctly
 */

import {describe, it, expect} from 'vitest';
import {handleCreatePalette} from '../../../tools/handlers/palette.js';
import {handleCreateTheme} from '../../../tools/handlers/theme.js';
import {handleCreateTypography} from '../../../tools/handlers/typography.js';
import {handleCreateElevations} from '../../../tools/handlers/elevations.js';
import {handleCreateCustomPalette} from '../../../tools/handlers/custom-palette.js';

describe('handleCreatePalette', () => {
  it('returns MCP response format', async () => {
    const result = await handleCreatePalette({
      primary: '#2ab759',
      secondary: '#f7bd32',
      surface: 'white',
    });

    expect(result).toHaveProperty('content');
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
  });

  it('includes generated Sass code', async () => {
    const result = await handleCreatePalette({
      primary: '#2ab759',
      secondary: '#f7bd32',
      surface: 'white',
    });

    const text = result.content[0].text;
    expect(text).toContain('```scss');
    expect(text).toContain('palette(');
    expect(text).toContain('$primary: #2ab759');
  });

  it('shows platform info when specified', async () => {
    const result = await handleCreatePalette({
      platform: 'angular',
      primary: '#2ab759',
      secondary: '#f7bd32',
      surface: 'white',
    });

    const text = result.content[0].text;
    expect(text).toContain('Ignite UI for Angular');
  });

  it('shows platform hint when not specified', async () => {
    const result = await handleCreatePalette({
      primary: '#2ab759',
      secondary: '#f7bd32',
      surface: 'white',
    });

    const text = result.content[0].text;
    expect(text).toContain('Platform: Not specified');
    expect(text).toContain('Specify `platform`');
  });

  it('includes validation warnings for incorrect surface/variant', async () => {
    const result = await handleCreatePalette({
      primary: '#2ab759',
      secondary: '#f7bd32',
      surface: '#121212', // dark surface for light variant
      variant: 'light',
    });

    const text = result.content[0].text;
    expect(text).toContain('Warning');
    expect(text).toContain('surface');
  });

  it('includes variable names in response', async () => {
    const result = await handleCreatePalette({
      primary: '#2ab759',
      secondary: '#f7bd32',
      surface: 'white',
      name: 'my-brand',
    });

    const text = result.content[0].text;
    expect(text).toContain('$my-brand-palette');
  });
});

describe('handleCreateTheme', () => {
  const baseThemeParams = {
    primaryColor: '#2ab759',
    secondaryColor: '#f7bd32',
    surfaceColor: 'white',
    includeTypography: true,
    includeElevations: true,
    includeSpacing: true,
  };

  it('returns MCP response format', async () => {
    const result = await handleCreateTheme(baseThemeParams);

    expect(result).toHaveProperty('content');
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
  });

  it('includes generated Sass code', async () => {
    const result = await handleCreateTheme(baseThemeParams);

    const text = result.content[0].text;
    expect(text).toContain('```scss');
    expect(text).toContain('palette');
  });

  it('includes typography when not explicitly excluded', async () => {
    const result = await handleCreateTheme(baseThemeParams);

    const text = result.content[0].text;
    expect(text).toContain('typography');
  });

  it('excludes typography when requested', async () => {
    const result = await handleCreateTheme({
      ...baseThemeParams,
      includeTypography: false,
    });

    const text = result.content[0].text;
    expect(text).not.toContain('@include typography(');
  });

  it('warns about color suitability issues', async () => {
    const result = await handleCreateTheme({
      ...baseThemeParams,
      primaryColor: '#fafafa', // very light color
    });

    const text = result.content[0].text;
    // Should warn about luminance issues - check for warning indicators
    const hasWarning = text.includes('luminance') || text.toLowerCase().includes('warning');
    expect(hasWarning).toBe(true);
  });

  it('shows Angular-specific content for angular platform', async () => {
    const result = await handleCreateTheme({
      ...baseThemeParams,
      platform: 'angular',
    });

    const text = result.content[0].text;
    expect(text).toContain('Angular');
    expect(text).toContain('core()');
    expect(text).toContain('theme(');
  });

  it('shows Web Components-specific content for webcomponents platform', async () => {
    const result = await handleCreateTheme({
      ...baseThemeParams,
      platform: 'webcomponents',
    });

    const text = result.content[0].text;
    expect(text).toContain('Web Components');
  });

  it('shows React-specific platform name for react platform', async () => {
    const result = await handleCreateTheme({
      ...baseThemeParams,
      platform: 'react',
    });

    const text = result.content[0].text;
    expect(text).toContain('Platform: Ignite UI for React');
  });

  it('shows Blazor-specific platform name for blazor platform', async () => {
    const result = await handleCreateTheme({
      ...baseThemeParams,
      platform: 'blazor',
    });

    const text = result.content[0].text;
    expect(text).toContain('Platform: Ignite UI for Blazor');
  });
});

describe('handleCreateTypography', () => {
  it('returns MCP response format', () => {
    const result = handleCreateTypography({
      fontFamily: 'Roboto',
    });

    expect(result).toHaveProperty('content');
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0]).toHaveProperty('type', 'text');
  });

  it('includes typography mixin in code', () => {
    const result = handleCreateTypography({
      fontFamily: 'Roboto',
    });

    const text = result.content[0].text;
    expect(text).toContain('```scss');
    expect(text).toContain('@include typography(');
    expect(text).toContain('Roboto');
  });

  it('uses specified design system type scale', () => {
    const result = handleCreateTypography({
      fontFamily: 'Inter',
      designSystem: 'indigo',
    });

    const text = result.content[0].text;
    expect(text).toContain('$indigo-type-scale');
  });
});

describe('handleCreateElevations', () => {
  it('returns MCP response format', () => {
    const result = handleCreateElevations({});

    expect(result).toHaveProperty('content');
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0]).toHaveProperty('type', 'text');
  });

  it('includes elevations mixin in code', () => {
    const result = handleCreateElevations({});

    const text = result.content[0].text;
    expect(text).toContain('```scss');
    expect(text).toContain('@include elevations(');
  });

  it('uses material elevations by default', () => {
    const result = handleCreateElevations({});

    const text = result.content[0].text;
    expect(text).toContain('$material-elevations');
  });

  it('uses indigo elevations when specified', () => {
    const result = handleCreateElevations({
      designSystem: 'indigo',
    });

    const text = result.content[0].text;
    expect(text).toContain('$indigo-elevations');
  });
});

describe('handleCreateCustomPalette', () => {
  it('returns MCP response format', async () => {
    const result = await handleCreateCustomPalette({
      primary: {mode: 'shades', baseColor: '#2ab759'},
      secondary: {mode: 'shades', baseColor: '#f7bd32'},
      surface: {mode: 'shades', baseColor: 'white'},
    });

    expect(result).toHaveProperty('content');
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0]).toHaveProperty('type', 'text');
  });

  it('generates palette with shades mode', async () => {
    const result = await handleCreateCustomPalette({
      primary: {mode: 'shades', baseColor: '#2ab759'},
      secondary: {mode: 'shades', baseColor: '#f7bd32'},
      surface: {mode: 'shades', baseColor: 'white'},
    });

    const text = result.content[0].text;
    expect(text).toContain('```scss');
    expect(text).toContain('shades(');
  });

  it('shows validation errors for invalid colors', async () => {
    const result = await handleCreateCustomPalette({
      primary: {mode: 'shades', baseColor: 'not-a-color'},
      secondary: {mode: 'shades', baseColor: '#f7bd32'},
      surface: {mode: 'shades', baseColor: 'white'},
    });

    const text = result.content[0].text;
    expect(text).toContain('Validation Failed');
    expect(text).toContain('Invalid');
  });

  it('shows which colors use shades mode', async () => {
    const result = await handleCreateCustomPalette({
      primary: {mode: 'shades', baseColor: '#2ab759'},
      secondary: {mode: 'shades', baseColor: '#f7bd32'},
      surface: {mode: 'shades', baseColor: 'white'},
    });

    const text = result.content[0].text;
    expect(text).toContain('shades() function');
  });

  it('supports explicit shade definitions', async () => {
    const result = await handleCreateCustomPalette({
      primary: {
        mode: 'explicit',
        shades: {
          '50': '#e8f5e9',
          '100': '#c8e6c9',
          '200': '#a5d6a7',
          '300': '#81c784',
          '400': '#66bb6a',
          '500': '#4caf50',
          '600': '#43a047',
          '700': '#388e3c',
          '800': '#2e7d32',
          '900': '#1b5e20',
          A100: '#b9f6ca',
          A200: '#69f0ae',
          A400: '#00e676',
          A700: '#00c853',
        },
      },
      secondary: {mode: 'shades', baseColor: '#f7bd32'},
      surface: {mode: 'shades', baseColor: 'white'},
    });

    const text = result.content[0].text;
    expect(text).toContain('explicit shades');
  });
});
