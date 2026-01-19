/**
 * Tests for Zod schemas in tools/schemas.ts.
 *
 * These tests verify that the colorSchema correctly validates
 * CSS Color Level 4 color formats at the schema level.
 *
 * Note: The schema performs permissive pattern matching. Full validation
 * of actual color values happens at Sass compile time.
 */

import {describe, it, expect} from 'vitest';
import {colorSchema, createCustomPaletteSchema} from '../../tools/schemas.js';

describe('colorSchema', () => {
  describe('hex colors', () => {
    it('accepts 3-digit hex', () => {
      expect(colorSchema.safeParse('#fff').success).toBe(true);
      expect(colorSchema.safeParse('#F00').success).toBe(true);
      expect(colorSchema.safeParse('#abc').success).toBe(true);
    });

    it('accepts 4-digit hex (with alpha)', () => {
      expect(colorSchema.safeParse('#ffff').success).toBe(true);
      expect(colorSchema.safeParse('#F00F').success).toBe(true);
      expect(colorSchema.safeParse('#abcd').success).toBe(true);
    });

    it('accepts 6-digit hex', () => {
      expect(colorSchema.safeParse('#ffffff').success).toBe(true);
      expect(colorSchema.safeParse('#FF0000').success).toBe(true);
      expect(colorSchema.safeParse('#abcdef').success).toBe(true);
    });

    it('accepts 8-digit hex (with alpha)', () => {
      expect(colorSchema.safeParse('#ffffffff').success).toBe(true);
      expect(colorSchema.safeParse('#FF0000FF').success).toBe(true);
      expect(colorSchema.safeParse('#abcdef80').success).toBe(true);
    });

    it('rejects invalid hex lengths', () => {
      expect(colorSchema.safeParse('#ff').success).toBe(false);
      expect(colorSchema.safeParse('#fffff').success).toBe(false);
      expect(colorSchema.safeParse('#fffffff').success).toBe(false);
    });

    it('hex without hash matches as named color (permissive for Sass validation)', () => {
      // 'ffffff' without hash matches the named color pattern [a-z]+
      // This is intentional - the schema is permissive and Sass will catch
      // invalid color names at compile time
      expect(colorSchema.safeParse('ffffff').success).toBe(true);
    });
  });

  describe('RGB/RGBA colors', () => {
    it('accepts legacy comma-separated rgb()', () => {
      expect(colorSchema.safeParse('rgb(255, 0, 0)').success).toBe(true);
      expect(colorSchema.safeParse('rgb(0, 128, 255)').success).toBe(true);
    });

    it('accepts legacy comma-separated rgba()', () => {
      expect(colorSchema.safeParse('rgba(255, 0, 0, 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('rgba(0, 128, 255, 1)').success).toBe(true);
    });

    it('accepts modern space-separated rgb()', () => {
      expect(colorSchema.safeParse('rgb(255 0 0)').success).toBe(true);
      expect(colorSchema.safeParse('rgb(0 128 255)').success).toBe(true);
    });

    it('accepts modern rgb() with slash alpha', () => {
      expect(colorSchema.safeParse('rgb(255 0 0 / 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('rgb(255 0 0 / 50%)').success).toBe(true);
    });

    it('accepts percentage values', () => {
      expect(colorSchema.safeParse('rgb(100%, 0%, 0%)').success).toBe(true);
      expect(colorSchema.safeParse('rgb(100% 0% 0% / 50%)').success).toBe(true);
    });
  });

  describe('HSL/HSLA colors', () => {
    it('accepts legacy comma-separated hsl()', () => {
      expect(colorSchema.safeParse('hsl(180, 50%, 50%)').success).toBe(true);
      expect(colorSchema.safeParse('hsl(0, 100%, 50%)').success).toBe(true);
    });

    it('accepts legacy comma-separated hsla()', () => {
      expect(colorSchema.safeParse('hsla(180, 50%, 50%, 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('hsla(0, 100%, 50%, 1)').success).toBe(true);
    });

    it('accepts modern space-separated hsl()', () => {
      expect(colorSchema.safeParse('hsl(180 50% 50%)').success).toBe(true);
      expect(colorSchema.safeParse('hsl(0 100% 50%)').success).toBe(true);
    });

    it('accepts modern hsl() with slash alpha', () => {
      expect(colorSchema.safeParse('hsl(180 50% 50% / 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('hsl(180 50% 50% / 50%)').success).toBe(true);
    });

    it('accepts hue angle units', () => {
      expect(colorSchema.safeParse('hsl(180deg 50% 50%)').success).toBe(true);
      expect(colorSchema.safeParse('hsl(0.5turn 50% 50%)').success).toBe(true);
      expect(colorSchema.safeParse('hsl(3.14rad 50% 50%)').success).toBe(true);
      expect(colorSchema.safeParse('hsl(200grad 50% 50%)').success).toBe(true);
    });
  });

  describe('HWB colors (CSS Color Level 4)', () => {
    it('accepts hwb() syntax', () => {
      expect(colorSchema.safeParse('hwb(180 20% 30%)').success).toBe(true);
      expect(colorSchema.safeParse('hwb(0 0% 0%)').success).toBe(true);
    });

    it('accepts hwb() with alpha', () => {
      expect(colorSchema.safeParse('hwb(180 20% 30% / 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('hwb(180 20% 30% / 50%)').success).toBe(true);
    });

    it('accepts hwb() with hue angle units', () => {
      expect(colorSchema.safeParse('hwb(180deg 20% 30%)').success).toBe(true);
      expect(colorSchema.safeParse('hwb(0.5turn 20% 30%)').success).toBe(true);
    });
  });

  describe('LAB colors (CSS Color Level 4)', () => {
    it('accepts lab() syntax', () => {
      expect(colorSchema.safeParse('lab(50% 40 59.5)').success).toBe(true);
      expect(colorSchema.safeParse('lab(100 0 0)').success).toBe(true);
    });

    it('accepts lab() with alpha', () => {
      expect(colorSchema.safeParse('lab(50% 40 59.5 / 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('lab(50% 40 59.5 / 50%)').success).toBe(true);
    });

    it('accepts lab() with negative values', () => {
      expect(colorSchema.safeParse('lab(50% -40 -59.5)').success).toBe(true);
    });
  });

  describe('LCH colors (CSS Color Level 4)', () => {
    it('accepts lch() syntax', () => {
      expect(colorSchema.safeParse('lch(50% 80 30)').success).toBe(true);
      expect(colorSchema.safeParse('lch(100 0 0)').success).toBe(true);
    });

    it('accepts lch() with alpha', () => {
      expect(colorSchema.safeParse('lch(50% 80 30 / 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('lch(50% 80 30 / 50%)').success).toBe(true);
    });

    it('accepts lch() with hue angle units', () => {
      expect(colorSchema.safeParse('lch(50% 80 30deg)').success).toBe(true);
      expect(colorSchema.safeParse('lch(50% 80 0.5turn)').success).toBe(true);
    });
  });

  describe('OKLAB colors (CSS Color Level 4)', () => {
    it('accepts oklab() syntax', () => {
      expect(colorSchema.safeParse('oklab(59% 0.1 0.1)').success).toBe(true);
      expect(colorSchema.safeParse('oklab(1 0 0)').success).toBe(true);
    });

    it('accepts oklab() with alpha', () => {
      expect(colorSchema.safeParse('oklab(59% 0.1 0.1 / 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('oklab(59% 0.1 0.1 / 50%)').success).toBe(true);
    });

    it('accepts oklab() with negative values', () => {
      expect(colorSchema.safeParse('oklab(59% -0.1 -0.1)').success).toBe(true);
    });
  });

  describe('OKLCH colors (CSS Color Level 4)', () => {
    it('accepts oklch() syntax', () => {
      expect(colorSchema.safeParse('oklch(60% 0.15 50)').success).toBe(true);
      expect(colorSchema.safeParse('oklch(1 0 0)').success).toBe(true);
    });

    it('accepts oklch() with alpha', () => {
      expect(colorSchema.safeParse('oklch(60% 0.15 50 / 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('oklch(60% 0.15 50 / 50%)').success).toBe(true);
    });

    it('accepts oklch() with hue angle units', () => {
      expect(colorSchema.safeParse('oklch(60% 0.15 50deg)').success).toBe(true);
      expect(colorSchema.safeParse('oklch(60% 0.15 0.14turn)').success).toBe(true);
    });
  });

  describe('color() function (CSS Color Level 4)', () => {
    it('accepts color() with display-p3', () => {
      expect(colorSchema.safeParse('color(display-p3 1 0.5 0)').success).toBe(true);
      expect(colorSchema.safeParse('color(display-p3 0 1 0)').success).toBe(true);
    });

    it('accepts color() with srgb', () => {
      expect(colorSchema.safeParse('color(srgb 1 0 0)').success).toBe(true);
      expect(colorSchema.safeParse('color(srgb 0.5 0.5 0.5)').success).toBe(true);
    });

    it('accepts color() with alpha', () => {
      expect(colorSchema.safeParse('color(display-p3 1 0.5 0 / 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('color(srgb 1 0 0 / 50%)').success).toBe(true);
    });

    it('accepts color() with other color spaces', () => {
      expect(colorSchema.safeParse('color(srgb-linear 1 0 0)').success).toBe(true);
      expect(colorSchema.safeParse('color(a98-rgb 1 0 0)').success).toBe(true);
      expect(colorSchema.safeParse('color(prophoto-rgb 1 0 0)').success).toBe(true);
      expect(colorSchema.safeParse('color(rec2020 1 0 0)').success).toBe(true);
      expect(colorSchema.safeParse('color(xyz 0.5 0.5 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('color(xyz-d50 0.5 0.5 0.5)').success).toBe(true);
      expect(colorSchema.safeParse('color(xyz-d65 0.5 0.5 0.5)').success).toBe(true);
    });
  });

  describe('named colors', () => {
    it('accepts standard CSS named colors', () => {
      expect(colorSchema.safeParse('red').success).toBe(true);
      expect(colorSchema.safeParse('blue').success).toBe(true);
      expect(colorSchema.safeParse('green').success).toBe(true);
      expect(colorSchema.safeParse('white').success).toBe(true);
      expect(colorSchema.safeParse('black').success).toBe(true);
    });

    it('accepts extended CSS named colors', () => {
      expect(colorSchema.safeParse('rebeccapurple').success).toBe(true);
      expect(colorSchema.safeParse('cornflowerblue').success).toBe(true);
      expect(colorSchema.safeParse('papayawhip').success).toBe(true);
    });

    it('accepts transparent keyword', () => {
      expect(colorSchema.safeParse('transparent').success).toBe(true);
    });

    it('accepts currentColor keyword', () => {
      expect(colorSchema.safeParse('currentColor').success).toBe(true);
      expect(colorSchema.safeParse('currentcolor').success).toBe(true);
    });

    it('is case-insensitive for named colors', () => {
      expect(colorSchema.safeParse('RED').success).toBe(true);
      expect(colorSchema.safeParse('Red').success).toBe(true);
      expect(colorSchema.safeParse('RebeccaPurple').success).toBe(true);
    });
  });

  describe('invalid colors', () => {
    it('rejects empty string', () => {
      expect(colorSchema.safeParse('').success).toBe(false);
    });

    it('rejects strings with spaces only', () => {
      expect(colorSchema.safeParse('   ').success).toBe(false);
    });

    it('rejects numbers as strings', () => {
      // Numbers alone are not valid colors
      expect(colorSchema.safeParse('123').success).toBe(false);
      expect(colorSchema.safeParse('0').success).toBe(false);
    });

    it('rejects arbitrary strings with non-alpha characters', () => {
      expect(colorSchema.safeParse('not-a-color').success).toBe(false);
      expect(colorSchema.safeParse('hello_world').success).toBe(false);
      expect(colorSchema.safeParse('color.name').success).toBe(false);
    });

    it('rejects unknown function names', () => {
      expect(colorSchema.safeParse('cmyk(0, 100, 100, 0)').success).toBe(false);
      expect(colorSchema.safeParse('custom(1, 2, 3)').success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('accepts colors with none keyword for missing components', () => {
      // CSS Color Level 4 allows 'none' for missing components
      expect(colorSchema.safeParse('hsl(none 50% 50%)').success).toBe(true);
      expect(colorSchema.safeParse('oklch(60% 0.15 none)').success).toBe(true);
    });

    it('accepts calc() expressions inside color functions', () => {
      // While unusual, calc() can be used inside color functions
      expect(colorSchema.safeParse('rgb(calc(255 * 0.5) 0 0)').success).toBe(true);
    });
  });
});

describe('createCustomPaletteSchema', () => {
  describe('color definition validation', () => {
    it('rejects plain string colors for primary/secondary/surface', () => {
      const result = createCustomPaletteSchema.safeParse({
        primary: '#1976d2',
        secondary: '#ff9800',
        surface: '#fafafa',
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.errors.map((e) => e.path.join('.'));

        expect(paths).toContain('primary');
        expect(paths).toContain('secondary');
        expect(paths).toContain('surface');
      }
    });

    it('accepts shades mode with baseColor', () => {
      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'shades', baseColor: '#1976d2'},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
      });

      expect(result.success).toBe(true);
    });

    it('accepts explicit mode with all 14 shades for chromatic colors', () => {
      const allShades = {
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
      };

      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'explicit', shades: allShades},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
      });

      expect(result.success).toBe(true);
    });

    it('rejects explicit mode with missing shades', () => {
      const incompleteShades = {
        '500': '#2196f3',
        '700': '#1976d2',
      };

      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'explicit', shades: incompleteShades},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
      });

      expect(result.success).toBe(false);
    });

    it('accepts gray with only 10 shades (no accent shades)', () => {
      const grayShades = {
        '50': '#fafafa',
        '100': '#f5f5f5',
        '200': '#eeeeee',
        '300': '#e0e0e0',
        '400': '#bdbdbd',
        '500': '#9e9e9e',
        '600': '#757575',
        '700': '#616161',
        '800': '#424242',
        '900': '#212121',
      };

      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'shades', baseColor: '#1976d2'},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
        gray: {mode: 'explicit', shades: grayShades},
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid mode value', () => {
      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'invalid', baseColor: '#1976d2'},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
      });

      expect(result.success).toBe(false);
    });

    it('rejects shades mode without baseColor', () => {
      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'shades'},
        secondary: {mode: 'shades', baseColor: '#FF9800'},
        surface: {mode: 'shades', baseColor: '#FAFAFA'},
      });

      expect(result.success).toBe(false);
    });

    it('rejects explicit mode without shades', () => {
      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'explicit'},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
      });

      expect(result.success).toBe(false);
    });
  });

  describe('optional parameters', () => {
    it('accepts variant parameter', () => {
      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'shades', baseColor: '#1976d2'},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
        variant: 'dark',
      });

      expect(result.success).toBe(true);
    });

    it('accepts output parameter', () => {
      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'shades', baseColor: '#1976d2'},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
        output: 'css',
      });

      expect(result.success).toBe(true);
    });

    it('accepts all optional color groups', () => {
      const result = createCustomPaletteSchema.safeParse({
        primary: {mode: 'shades', baseColor: '#1976d2'},
        secondary: {mode: 'shades', baseColor: '#ff9800'},
        surface: {mode: 'shades', baseColor: '#fafafa'},
        gray: {mode: 'shades', baseColor: '#9e9e9e'},
        info: {mode: 'shades', baseColor: '#2196f3'},
        success: {mode: 'shades', baseColor: '#4caf50'},
        warn: {mode: 'shades', baseColor: '#ff9800'},
        error: {mode: 'shades', baseColor: '#f44336'},
      });

      expect(result.success).toBe(true);
    });
  });
});
