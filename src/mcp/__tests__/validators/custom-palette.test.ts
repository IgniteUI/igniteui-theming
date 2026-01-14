/**
 * Tests for custom palette validation.
 */

import { describe, it, expect } from 'vitest';
import {
  validateCustomPalette,
  formatCustomPaletteValidation,
  type CustomPaletteValidationResult,
} from '../../validators/custom-palette.js';
import type { CreateCustomPaletteInput, ShadesBasedColor, ExplicitColorShades } from '../../utils/types.js';

// Helper to create a minimal valid shades-based palette
function createShadesBasedPalette(overrides?: Partial<CreateCustomPaletteInput>): CreateCustomPaletteInput {
  const shadesColor = (baseColor: string): ShadesBasedColor => ({
    mode: 'shades',
    baseColor,
  });

  return {
    platform: 'angular',
    variant: 'light',
    designSystem: 'material',
    name: 'test-palette',
    primary: shadesColor('#2ab759'),
    secondary: shadesColor('#f7bd32'),
    surface: shadesColor('#fafafa'),
    ...overrides,
  };
}

// Helper to create explicit shade maps
function createExplicitShades(): ExplicitColorShades['shades'] {
  return {
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
    'A100': '#b9f6ca',
    'A200': '#69f0ae',
    'A400': '#00e676',
    'A700': '#00c853',
  };
}

describe('validateCustomPalette', () => {
  describe('shades mode validation', () => {
    it('validates a minimal shades-based palette', async () => {
      const input = createShadesBasedPalette();
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('reports error for invalid base color', async () => {
      const input = createShadesBasedPalette({
        primary: { mode: 'shades', baseColor: 'not-a-color' },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary',
          message: expect.stringContaining('Invalid base color'),
        })
      );
    });

    it('validates all color groups with shades mode', async () => {
      const input = createShadesBasedPalette({
        gray: { mode: 'shades', baseColor: '#333333' },
        info: { mode: 'shades', baseColor: '#0288d1' },
        success: { mode: 'shades', baseColor: '#4caf50' },
        warn: { mode: 'shades', baseColor: '#ff9800' },
        error: { mode: 'shades', baseColor: '#f44336' },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(true);
    });
  });

  describe('explicit mode validation', () => {
    it('validates explicit shades with all required shades', async () => {
      const input = createShadesBasedPalette({
        primary: {
          mode: 'explicit',
          shades: createExplicitShades(),
        },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(true);
    });

    it('reports error for missing required shade', async () => {
      const shades = createExplicitShades();
      // Remove a required shade
      delete (shades as Record<string, string>)['500'];

      const input = createShadesBasedPalette({
        primary: {
          mode: 'explicit',
          shades: shades as ExplicitColorShades['shades'],
        },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary.500',
          message: expect.stringContaining('Missing required shade'),
        })
      );
    });

    it('reports error for invalid color value in shade', async () => {
      const shades = createExplicitShades();
      (shades as Record<string, string>)['500'] = 'invalid-color';

      const input = createShadesBasedPalette({
        primary: {
          mode: 'explicit',
          shades: shades as ExplicitColorShades['shades'],
        },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary.500',
          message: expect.stringContaining('Invalid color value'),
        })
      );
    });
  });

  describe('contrast overrides validation', () => {
    it('validates valid contrast overrides', async () => {
      const input = createShadesBasedPalette({
        primary: {
          mode: 'explicit',
          shades: createExplicitShades(),
          contrastOverrides: {
            '500': 'white',
            '900': '#ffffff',
          },
        },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(true);
    });

    it('reports error for invalid contrast override key', async () => {
      const input = createShadesBasedPalette({
        primary: {
          mode: 'explicit',
          shades: createExplicitShades(),
          contrastOverrides: {
            'invalid-shade': 'white',
          } as ExplicitColorShades['contrastOverrides'],
        },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary.invalid-shade',
          message: expect.stringContaining('Invalid contrast override key'),
        })
      );
    });

    it('reports error for invalid contrast color value', async () => {
      const input = createShadesBasedPalette({
        primary: {
          mode: 'explicit',
          shades: createExplicitShades(),
          contrastOverrides: {
            '500': 'not-a-color',
          },
        },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary.contrast.500',
          message: expect.stringContaining('Invalid contrast color'),
        })
      );
    });
  });

  describe('shade progression validation', () => {
    it('warns when shade 50 is darker than shade 900 for chromatic colors', async () => {
      const shades = createExplicitShades();
      // Invert 50 and 900
      (shades as Record<string, string>)['50'] = '#1b5e20'; // dark
      (shades as Record<string, string>)['900'] = '#e8f5e9'; // light

      const input = createShadesBasedPalette({
        primary: {
          mode: 'explicit',
          shades: shades as ExplicitColorShades['shades'],
        },
      });
      const result = await validateCustomPalette(input, 'light');

      // Should still be valid but have warnings
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'primary',
          message: expect.stringContaining('shade 50 should be lighter than shade 900'),
        })
      );
    });

    it('warns for incorrect gray progression in dark themes', async () => {
      // For dark themes, gray 50 should be DARKER than 900 (inverted)
      const grayShades = {
        '50': '#fafafa', // light - wrong for dark theme
        '100': '#f5f5f5',
        '200': '#eeeeee',
        '300': '#e0e0e0',
        '400': '#bdbdbd',
        '500': '#9e9e9e',
        '600': '#757575',
        '700': '#616161',
        '800': '#424242',
        '900': '#212121', // dark - wrong for dark theme
      };

      const input = createShadesBasedPalette({
        variant: 'dark',
        gray: {
          mode: 'explicit',
          shades: grayShades,
        },
      });
      const result = await validateCustomPalette(input, 'dark');

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'gray',
          message: expect.stringContaining('dark themes'),
        })
      );
    });
  });

  describe('monochromatic hue validation', () => {
    it('warns when shades have different hues', async () => {
      const shades = createExplicitShades();
      // Change 500 to a completely different hue (blue instead of green)
      (shades as Record<string, string>)['500'] = '#2196f3';

      const input = createShadesBasedPalette({
        primary: {
          mode: 'explicit',
          shades: shades as ExplicitColorShades['shades'],
        },
      });
      const result = await validateCustomPalette(input, 'light');

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'primary',
          message: expect.stringContaining('monochromatic'),
        })
      );
    });
  });
});

describe('formatCustomPaletteValidation', () => {
  it('returns empty string for valid result with no warnings', () => {
    const result: CustomPaletteValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };
    expect(formatCustomPaletteValidation(result)).toBe('');
  });

  it('formats errors', () => {
    const result: CustomPaletteValidationResult = {
      isValid: false,
      errors: [{field: 'primary.500', message: 'Invalid color'}],
      warnings: [],
    };
    const formatted = formatCustomPaletteValidation(result);

    expect(formatted).toContain('**Errors:**');
    expect(formatted).toContain('primary.500');
    expect(formatted).toContain('Invalid color');
  });

  it('formats warnings', () => {
    const result: CustomPaletteValidationResult = {
      isValid: true,
      errors: [],
      warnings: [{field: 'gray', message: 'Consider adjusting', severity: 'warning'}],
    };
    const formatted = formatCustomPaletteValidation(result);

    expect(formatted).toContain('**Warnings:**');
    expect(formatted).toContain('gray');
    expect(formatted).toContain('Consider adjusting');
  });

  it('formats both errors and warnings', () => {
    const result: CustomPaletteValidationResult = {
      isValid: false,
      errors: [{field: 'primary', message: 'Error message'}],
      warnings: [{field: 'gray', message: 'Warning message', severity: 'warning'}],
    };
    const formatted = formatCustomPaletteValidation(result);

    expect(formatted).toContain('**Errors:**');
    expect(formatted).toContain('**Warnings:**');
  });
});
