/**
 * Color rules and guidance documentation for AI context.
 * This knowledge helps AI models understand the relationship between
 * theme variants and color choices.
 */

import { LUMINANCE_THRESHOLD, SUGGESTED_COLORS, DEFAULT_MINIMUM_CONTRAST_RATIO } from '../utils/color.js';

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
      explanation:
        'Gray base should be dark so the generated gray shades contrast well against light surfaces',
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
      explanation:
        'Gray base should be light so the generated gray shades contrast well against dark surfaces',
      examples: SUGGESTED_COLORS.dark.gray,
    },
  },
} as const;

/**
 * Full documentation about color rules in markdown format.
 * This is intended to be provided as context to AI models.
 */
export const COLOR_GUIDANCE_MARKDOWN = `# Ignite UI Theming - Color Guidance

## Understanding Theme Variants

Ignite UI themes support two variants: **light** and **dark**. The variant affects how colors are chosen and how the palette generates shades.

## Surface Color Rules

The **surface** color is the main background color used throughout your application.

| Variant | Surface Requirement | Luminance | Examples |
|---------|---------------------|-----------|----------|
| light | Light color | > ${LUMINANCE_THRESHOLD} | ${SUGGESTED_COLORS.light.surface.join(', ')} |
| dark | Dark color | ≤ ${LUMINANCE_THRESHOLD} | ${SUGGESTED_COLORS.dark.surface.join(', ')} |

## Gray Color Rules

The **gray** parameter sets the base color used to generate the grayscale palette. This is INVERTED from the surface because the grayscale shades need to contrast against the surface.

| Variant | Gray Base Requirement | Luminance | Examples |
|---------|----------------------|-----------|----------|
| light | Dark color | ≤ ${LUMINANCE_THRESHOLD} | ${SUGGESTED_COLORS.light.gray.join(', ')} |
| dark | Light color | > ${LUMINANCE_THRESHOLD} | ${SUGGESTED_COLORS.dark.gray.join(', ')} |

### Why is Gray Inverted?

The \`palette()\` function generates grayscale shades that are used for text, borders, and UI elements. These shades need to be readable against the surface:

- **Light theme**: Light surface needs dark gray shades for readable text → use dark gray base
- **Dark theme**: Dark surface needs light gray shades for readable text → use light gray base

## Luminance Calculation

Luminance is calculated using the WCAG 2.0 formula:
- 0 = pure black
- 1 = pure white
- ${LUMINANCE_THRESHOLD} = threshold between "light" and "dark" colors

## Contrast Ratio

When both surface and gray are provided, the system checks their contrast ratio. A minimum of ${DEFAULT_MINIMUM_CONTRAST_RATIO}:1 is recommended for good readability.

## Best Practices

1. **Let the system auto-calculate gray**: If you're unsure, omit the \`gray\` parameter. The palette() function will automatically derive an appropriate gray base from the surface color.

2. **Match surface to variant**: Always use a light surface for light themes and a dark surface for dark themes.

3. **Test contrast**: Ensure your color combinations meet accessibility standards (WCAG 2.0).

## Common Mistakes

❌ **Light theme with dark surface**: Creates visual confusion
❌ **Dark theme with light surface**: Defeats the purpose of dark mode
❌ **Light theme with light gray base**: Produces unreadable gray shades
❌ **Dark theme with dark gray base**: Produces unreadable gray shades

## Examples

### Correct Light Theme
\`\`\`scss
$palette: palette(
  $primary: #0066cc,
  $secondary: #ff6600,
  $surface: white,      // ✅ Light surface for light theme
  $gray: #333333        // ✅ Dark gray base (optional)
);
\`\`\`

### Correct Dark Theme
\`\`\`scss
$palette: palette(
  $primary: #3399ff,
  $secondary: #ff9933,
  $surface: #1a1a1a,    // ✅ Dark surface for dark theme
  $gray: #f5f5f5        // ✅ Light gray base (optional)
);
\`\`\`
`;

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
