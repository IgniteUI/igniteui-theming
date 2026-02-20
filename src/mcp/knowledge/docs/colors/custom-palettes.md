# Custom Palette Creation Guide

## When to use create_custom_palette vs create_palette

### Use the create_palette tool (standard) when:
- Brand colors work well as base colors for automatic shade generation
- The base color has medium lightness (not too light, not too dark)
- Quick, consistent shade generation is desired
- Material Design shade conventions are acceptable

### Use the create_custom_palette tool when:
- The base color is very light (produces washed-out dark shades)
- The base color is very dark (produces muddy light shades)
- Precise control over specific shade values is required
- Brand guidelines specify exact colors for different shades
- Accessibility requirements need specific contrast ratios at certain shades
- You want to mix auto-generated and hand-picked colors in one palette

## Color Definition Modes

### mode: 'shades'
Uses the Sass shades() function to auto-generate all shade variants from a single base color.

```json
{
  "mode": "shades",
  "baseColor": "#6797de"
}
```

### mode: 'explicit'
Manually specify all shade values for complete control.

**Important:** Unlike the palette() function where 500 is always the base, with explicit 
shades you can define any shade as your "anchor" and build other shades around it.

```json
{
  "mode": "explicit",
  "shades": {
    "50": "#e6eff8",
    "100": "#bfd7f2",
    ...all 14 shades...
  },
  "contrastOverrides": {
    "50": "black",
    "500": "white"
  }
}
```

## Shade Conventions

| Shade | Typical Usage |
|-------|---------------|
| 50-100 | Very light tints, backgrounds, hover states |
| 200-300 | Light tints, borders, disabled states |
| 400 | Light accent, secondary text |
| 500 | Base/primary usage |
| 600-700 | Darker shades, active states, headers |
| 800-900 | Very dark shades, high contrast text |
| A100-A700 | Accent variants (vibrant alternatives) |

## Gray and Surface Relationship

The gray color should contrast with the surface color:
- **Light themes**: light surface (luminance > 0.5), dark gray base
- **Dark themes**: dark surface (luminance <= 0.5), light gray base

When gray uses mode:'shades', the surface color is passed to ensure proper contrast.

## Contrast Colors (Auto-Generated - Do Not Provide)

**DO NOT provide contrast colors** - they are automatically generated.

When you use explicit mode, the system automatically generates contrast colors for each shade:
```scss
'500': #4CAF50,
'500-contrast': adaptive-contrast(#4CAF50),  // AUTO-GENERATED
'500-raw': #4CAF50,
```

The `adaptive-contrast()` function automatically selects black or white based on the 
background color's luminance, ensuring WCAG-compliant text contrast.

**Only provide `contrastOverrides` if:**
- You have a specific accessibility audit requiring exact contrast values
- The auto-generated contrast doesn't meet specific brand requirements

This is rare - in 99% of cases, just omit `contrastOverrides` entirely.

## Shade Progression Rules

**⚠️ CRITICAL: Only GRAY inverts for dark themes. Chromatic colors NEVER invert.**

### Chromatic Colors (primary, secondary, surface, info, success, warn, error)

Chromatic shades should **always** follow light-to-dark progression **regardless of theme variant**:
- **Shade 50**: Lightest (highest luminance) - SAME for light AND dark themes
- **Shade 900**: Darkest (lowest luminance) - SAME for light AND dark themes
- **Accent shades (A100 → A700)**: Also light-to-dark, more vibrant alternatives

**DO NOT invert primary, secondary, or other chromatic colors for dark themes.**
The shade order is always 50=lightest to 900=darkest. This matches Material Design 
conventions and how the built-in `shades()` function works.

### ⚠️ CRITICAL: Monochromatic Requirement

**All shades within a color group MUST be the same color (same hue), just at different lightness levels.**

A shade palette is NOT a collection of different colors - it's ONE color at varying intensities.
Think of it like mixing paint with white (lighter shades) or black (darker shades).

**✅ CORRECT - Blue primary palette (all shades are BLUE):**
```
primary:
  50:  "#E3F2FD"  ← very light blue
  100: "#BBDEFB"  ← light blue
  200: "#90CAF9"  ← light blue
  300: "#64B5F6"  ← medium-light blue
  400: "#42A5F5"  ← medium blue
  500: "#2196F3"  ← blue (base)
  600: "#1E88E5"  ← medium-dark blue
  700: "#1976D2"  ← dark blue
  800: "#1565C0"  ← darker blue
  900: "#0D47A1"  ← very dark blue
```
All shades have the same blue hue (~210°), only lightness varies.

**❌ WRONG - Rainbow palette (different colors - DO NOT DO THIS):**
```
primary:
  50:  "#FFEBEE"  ← pink (hue ~350°)
  100: "#FFE0B2"  ← orange (hue ~30°)
  200: "#FFF9C4"  ← yellow (hue ~55°)
  500: "#4CAF50"  ← green (hue ~122°)
  700: "#1976D2"  ← blue (hue ~210°)
  900: "#9C27B0"  ← purple (hue ~291°)
```
This is WRONG! Each shade has a completely different hue.

**Why this matters:**
- Components use specific shades for states (hover uses 600, active uses 700, etc.)
- If shades are different colors, hover/active states will look broken
- The `contrast-color()` function expects consistent hue across shades
- Visual coherence requires related colors, not random ones

**Tolerance:** The validator allows ±30° hue variance to accommodate natural saturation shifts,
but intentionally different hues will trigger warnings.

### Gray Color (THE ONLY COLOR THAT INVERTS)

Gray is the **only** color family that changes shade progression based on theme variant.
This is because gray shades are used for text and UI elements that must contrast against 
the surface color.

**Light themes:**
- Shade 50: Lightest (e.g., near-white, #f5f5f5)
- Shade 900: Darkest (e.g., near-black, #212121)

**Dark themes (inverted progression):**
- Shade 50: Darkest (e.g., near-black, #1a1a1a)  
- Shade 900: Lightest (e.g., near-white, #f5f5f5)

This inversion ensures text remains readable: dark text on light backgrounds (light theme)
and light text on dark backgrounds (dark theme).

### Why This Matters

Consistent shade progression ensures:
1. Component styles that use hardcoded shade references work correctly
2. Hover/active states (often darker shades) behave as expected
3. Text contrast calculations remain valid
4. Theming utilities like `color()` and `contrast-color()` produce correct results

The validator issues **warnings** (not errors) for progression issues, allowing override 
when intentional deviation is needed.
