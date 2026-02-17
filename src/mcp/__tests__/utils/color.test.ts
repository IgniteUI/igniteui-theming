/**
 * Tests for color analysis utilities.
 *
 * These tests use real Sass compilation to verify color analysis.
 */

import {describe, expect, it} from 'vitest';
import {
  analyzeColor,
  analyzeColorForPalette,
  analyzeSurfaceGrayColors,
  calculateContrast,
  extractHue,
  huesAreClose,
  isValidColor,
  LUMINANCE_THRESHOLD,
  PALETTE_LUMINANCE_THRESHOLDS,
  validateColorsInBatch,
} from '../../utils/color.js';

describe('analyzeColor', () => {
  it('analyzes white as a light color', async () => {
    const result = await analyzeColor('white');
    expect(result.color).toBe('white');
    expect(result.luminance).toBeCloseTo(1, 1);
    expect(result.isLight).toBe(true);
  });

  it('analyzes black as a dark color', async () => {
    const result = await analyzeColor('black');
    expect(result.color).toBe('black');
    expect(result.luminance).toBeCloseTo(0, 1);
    expect(result.isLight).toBe(false);
  });

  it('analyzes hex colors correctly', async () => {
    const result = await analyzeColor('#808080'); // 50% gray
    expect(result.luminance).toBeGreaterThan(0.1);
    expect(result.luminance).toBeLessThan(0.5);
  });

  it('throws error for invalid colors', async () => {
    await expect(analyzeColor('not-a-color')).rejects.toThrow();
  });
});

describe('calculateContrast', () => {
  it('calculates maximum contrast between black and white', async () => {
    const ratio = await calculateContrast('white', 'black');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('calculates no contrast between same colors', async () => {
    const ratio = await calculateContrast('#808080', '#808080');
    expect(ratio).toBeCloseTo(1, 0);
  });

  it('calculates reasonable contrast for mid-tones', async () => {
    const ratio = await calculateContrast('white', '#808080');
    expect(ratio).toBeGreaterThan(3);
    expect(ratio).toBeLessThan(10);
  });
});

describe('analyzeSurfaceGrayColors', () => {
  it('returns empty object when no colors provided', async () => {
    const result = await analyzeSurfaceGrayColors({});
    expect(result).toEqual({});
  });

  it('analyzes surface only', async () => {
    const result = await analyzeSurfaceGrayColors({surface: 'white'});
    expect(result.surface).toBeDefined();
    expect(result.surface?.isLight).toBe(true);
    expect(result.gray).toBeUndefined();
    expect(result.contrastRatio).toBeUndefined();
  });

  it('analyzes gray only', async () => {
    const result = await analyzeSurfaceGrayColors({gray: 'black'});
    expect(result.gray).toBeDefined();
    expect(result.gray?.isLight).toBe(false);
    expect(result.surface).toBeUndefined();
  });

  it('analyzes both surface and gray with contrast', async () => {
    const result = await analyzeSurfaceGrayColors({
      surface: 'white',
      gray: 'black',
    });
    expect(result.surface?.isLight).toBe(true);
    expect(result.gray?.isLight).toBe(false);
    expect(result.contrastRatio).toBeCloseTo(21, 0);
  });
});

describe('isValidColor', () => {
  it('returns true for valid hex color', async () => {
    expect(await isValidColor('#ff0000')).toBe(true);
  });

  it('returns true for valid named color', async () => {
    expect(await isValidColor('rebeccapurple')).toBe(true);
  });

  it('returns true for rgb() color', async () => {
    expect(await isValidColor('rgb(255, 0, 0)')).toBe(true);
  });

  it('returns false for invalid color', async () => {
    expect(await isValidColor('not-a-color')).toBe(false);
  });

  it('returns false for empty string', async () => {
    expect(await isValidColor('')).toBe(false);
  });
});

describe('extractHue', () => {
  it('extracts hue from red', async () => {
    const hue = await extractHue('red');
    expect(hue).toBeCloseTo(0, 0);
  });

  it('extracts hue from blue', async () => {
    const hue = await extractHue('blue');
    expect(hue).toBeCloseTo(240, 0);
  });

  it('extracts hue from green', async () => {
    const hue = await extractHue('lime'); // lime is pure green
    expect(hue).toBeCloseTo(120, 0);
  });
});

describe('huesAreClose', () => {
  it('returns true for identical hues', () => {
    expect(huesAreClose(180, 180)).toBe(true);
  });

  it('returns true for hues within tolerance', () => {
    expect(huesAreClose(180, 190, 30)).toBe(true);
  });

  it('returns false for hues outside tolerance', () => {
    expect(huesAreClose(180, 220, 30)).toBe(false);
  });

  it('handles circular hue (0 and 360 are the same)', () => {
    expect(huesAreClose(10, 350, 30)).toBe(true);
  });

  it('handles crossing the 360/0 boundary', () => {
    expect(huesAreClose(355, 5, 15)).toBe(true);
  });
});

describe('analyzeColorForPalette', () => {
  it('marks mid-tone colors as suitable', async () => {
    const result = await analyzeColorForPalette('#2ab759'); // Medium green
    expect(result.suitable).toBe(true);
    // TypeScript correctly narrows: issue/description don't exist on suitable results
    if (!result.suitable) {
      throw new Error('Expected suitable result');
    }
  });

  it('marks very light colors as unsuitable (too light)', async () => {
    const result = await analyzeColorForPalette('#f8f8f8'); // Very light gray
    expect(result.suitable).toBe(false);
    if (result.suitable) {
      throw new Error('Expected unsuitable result');
    }
    expect(result.issue).toBe('too-light');
    expect(result.description).toBeDefined();
  });

  it('marks very dark colors as unsuitable (too dark)', async () => {
    const result = await analyzeColorForPalette('#0a0a0a'); // Very dark gray
    expect(result.suitable).toBe(false);
    if (result.suitable) {
      throw new Error('Expected unsuitable result');
    }
    expect(result.issue).toBe('too-dark');
    expect(result.description).toBeDefined();
  });

  it('uses correct threshold for too light', async () => {
    const result = await analyzeColorForPalette('white');
    expect(result.luminance).toBeGreaterThan(PALETTE_LUMINANCE_THRESHOLDS.TOO_LIGHT);
    expect(result.suitable).toBe(false);
  });

  it('uses correct threshold for too dark', async () => {
    const result = await analyzeColorForPalette('black');
    expect(result.luminance).toBeLessThan(PALETTE_LUMINANCE_THRESHOLDS.TOO_DARK);
    expect(result.suitable).toBe(false);
  });
});

describe('LUMINANCE_THRESHOLD', () => {
  it('is set to 0.5 for light/dark determination', () => {
    expect(LUMINANCE_THRESHOLD).toBe(0.5);
  });
});

describe('validateColorsInBatch', () => {
  it('returns empty object for empty input', async () => {
    const result = await validateColorsInBatch({});
    expect(result).toEqual({});
  });

  it('validates multiple valid colors in single batch', async () => {
    const result = await validateColorsInBatch({
      primary: '#ff0000',
      secondary: 'blue',
      surface: 'rgb(255, 255, 255)',
    });
    expect(result.primary).toBe(true);
    expect(result.secondary).toBe(true);
    expect(result.surface).toBe(true);
  });

  it('identifies invalid colors in batch', async () => {
    const result = await validateColorsInBatch({
      valid1: '#ff0000',
      invalid1: 'not-a-color',
      valid2: 'blue',
      invalid2: 'also-invalid',
    });
    expect(result.valid1).toBe(true);
    expect(result.invalid1).toBe(false);
    expect(result.valid2).toBe(true);
    expect(result.invalid2).toBe(false);
  });

  it('handles large batches efficiently (14+ colors)', async () => {
    const colors: Record<string, string> = {};
    const shades = [
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
      'A100',
      'A200',
      'A400',
      'A700',
    ];

    // Generate 14 valid hex colors
    for (const shade of shades) {
      colors[`shade-${shade}`] = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`;
    }

    const result = await validateColorsInBatch(colors);

    // All should be valid
    for (const shade of shades) {
      expect(result[`shade-${shade}`]).toBe(true);
    }
  });

  it('handles keys with special characters', async () => {
    const result = await validateColorsInBatch({
      'primary.500': '#ff0000',
      'contrast.A100': 'white',
    });
    expect(result['primary.500']).toBe(true);
    expect(result['contrast.A100']).toBe(true);
  });
});
