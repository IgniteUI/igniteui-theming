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
import {colorSchema} from '../../tools/schemas.js';

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
