/**
 * Color rules and guidance documentation for AI context.
 * This knowledge helps AI models understand the relationship between
 * theme variants and color choices.
 */

import {DEFAULT_MINIMUM_CONTRAST_RATIO, LUMINANCE_THRESHOLD, SUGGESTED_COLORS} from '../utils/color.js';
import COLOR_GUIDANCE_MARKDOWN from './docs/colors/guidance.md?raw';

/**
 * Color variant rules for surface and gray colors.
 */
export const COLOR_VARIANT_RULES = {
  light: {
    description: 'Light theme variant with light backgrounds and dark text',
    surface: {
      requirement: 'light',
      luminanceRule: `luminance > ${LUMINANCE_THRESHOLD}`,
      explanation: 'Light themes use bright backgrounds (white, off-white, light gray)',
      examples: SUGGESTED_COLORS.light.surface,
    },
    gray: {
      requirement: 'dark',
      luminanceRule: `luminance <= ${LUMINANCE_THRESHOLD}`,
      explanation: 'Gray base should be dark so the generated gray shades contrast well against light surfaces',
      examples: SUGGESTED_COLORS.light.gray,
    },
  },
  dark: {
    description: 'Dark theme variant with dark backgrounds and light text',
    surface: {
      requirement: 'dark',
      luminanceRule: `luminance <= ${LUMINANCE_THRESHOLD}`,
      explanation: 'Dark themes use dark backgrounds (near-black, dark gray)',
      examples: SUGGESTED_COLORS.dark.surface,
    },
    gray: {
      requirement: 'light',
      luminanceRule: `luminance > ${LUMINANCE_THRESHOLD}`,
      explanation: 'Gray base should be light so the generated gray shades contrast well against dark surfaces',
      examples: SUGGESTED_COLORS.dark.gray,
    },
  },
} as const;

export {COLOR_GUIDANCE_MARKDOWN};

/**
 * Compact rules for quick reference.
 */
export const COLOR_RULES_SUMMARY = {
  luminanceThreshold: LUMINANCE_THRESHOLD,
  minimumContrastRatio: DEFAULT_MINIMUM_CONTRAST_RATIO,
  rules: {
    light: {
      surface: `luminance > ${LUMINANCE_THRESHOLD} (light color)`,
      gray: `luminance <= ${LUMINANCE_THRESHOLD} (dark color)`,
    },
    dark: {
      surface: `luminance <= ${LUMINANCE_THRESHOLD} (dark color)`,
      gray: `luminance > ${LUMINANCE_THRESHOLD} (light color)`,
    },
  },
  suggestedColors: SUGGESTED_COLORS,
} as const;
