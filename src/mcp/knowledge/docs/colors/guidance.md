# Ignite UI Theming - Color Guidance

## Understanding Theme Variants

Ignite UI themes support two variants: **light** and **dark**. The variant affects how colors are chosen and how the palette generates shades.

## Surface Color Rules

The **surface** color is the main background color used throughout your application.

| Variant | Surface Requirement | Luminance | Examples |
|---------|---------------------|-----------|----------|
| light | Light color | > 0.5 | white, #ffffff, #f5f5f5, #e8e8e8 |
| dark | Dark color | ≤ 0.5 | #121212, #1a1a1a, #1e1e1e, #212121 |

## Gray Color Rules

The **gray** parameter sets the base color used to generate the grayscale palette. This is INVERTED from the surface because the grayscale shades need to contrast against the surface.

| Variant | Gray Base Requirement | Luminance | Examples |
|---------|----------------------|-----------|----------|
| light | Dark color | ≤ 0.5 | #333333, #212121, #424242, #2c2c2c |
| dark | Light color | > 0.5 | #f5f5f5, #e0e0e0, #d0d0d0, #cccccc |

### Why is Gray Inverted?

The `palette()` function generates grayscale shades that are used for text, borders, and UI elements. These shades need to be readable against the surface:

- **Light theme**: Light surface needs dark gray shades for readable text → use dark gray base
- **Dark theme**: Dark surface needs light gray shades for readable text → use light gray base

## Luminance Calculation

Luminance is calculated using the WCAG 2.0 formula:
- 0 = pure black
- 1 = pure white
- 0.5 = threshold between "light" and "dark" colors

## Contrast Ratio

When both surface and gray are provided, the system checks their contrast ratio. A minimum of 4.5:1 is recommended for good readability.

## Best Practices

1. **Let the system auto-calculate gray**: If you're unsure, omit the `gray` parameter. The palette() function will automatically derive an appropriate gray base from the surface color.

2. **Match surface to variant**: Always use a light surface for light themes and a dark surface for dark themes.

3. **Test contrast**: Ensure your color combinations meet accessibility standards (WCAG 2.0).

## Common Mistakes

❌ **Light theme with dark surface**: Creates visual confusion
❌ **Dark theme with light surface**: Defeats the purpose of dark mode
❌ **Light theme with light gray base**: Produces unreadable gray shades
❌ **Dark theme with dark gray base**: Produces unreadable gray shades

## Examples

### Correct Light Theme
```scss
$palette: palette(
  $primary: #06c,
  $secondary: #f60,
  $surface: white,      // ✅ Light surface for light theme
  $gray: #333           // ✅ Dark gray base (optional)
);
```

### Correct Dark Theme
```scss
$palette: palette(
  $primary: #39f,
  $secondary: #f93,
  $surface: #1a1a1a,    // ✅ Dark surface for dark theme
  $gray: #f5f5f5        // ✅ Light gray base (optional)
);
```
