# Ignite UI Color Usage Guide

## Overview

The Ignite UI theming system uses **8 color families**, each with **10 shade levels** (50-900). Understanding how these colors interact with components helps you create cohesive, accessible themes.

## Color Families

### Primary Color
**Role:** Brand identity and primary actions

The primary color is your brand's signature color. It draws attention to the most important interactive elements.

**Used For:**
- Primary action buttons (filled/contained style)
- Links and navigation highlights
- Active/selected states (tabs, list items, checkboxes, radios, switches)
- Progress indicators and sliders
- Focus rings and outlines
- Calendar date selection
- Grid row selection

**Shade Usage:**
| Shades | Purpose | Examples |
|--------|---------|----------|
| 50-100 | Subtle backgrounds, disabled | Focus backgrounds, disabled button fills |
| 200-300 | Focus outlines, selections with opacity | Focus rings, selected backgrounds (Indigo) |
| **500** | **Default/main color** | Button backgrounds, link text, checkbox fills |
| 600-700 | Hover and active states | Button hover, pressed states |
| 800-900 | Dark mode, maximum emphasis | Dark theme selections |

---

### Secondary Color
**Role:** Accent and secondary emphasis

Most prominent in Material Design. Provides accent without competing with primary.

**Used For:**
- Flat/outlined button text (Material)
- List and dropdown headers
- Alternative selection backgrounds
- Secondary action buttons

**Shade Usage:**
| Shades | Purpose |
|--------|---------|
| 100-200 | Selected backgrounds, light accents |
| **500** | Default accent |
| 600-700 | Headers (Fluent), strong accents |

---

### Gray Color
**Role:** Neutral UI foundation

The most used color family. Creates text hierarchy, borders, and backgrounds.

**Used For:**
- All text (primary, secondary, disabled, placeholder)
- Borders and dividers
- Backgrounds (hover, selected, disabled)
- Icons
- Tooltips

**Shade Usage:**
| Shade | Purpose | Examples |
|-------|---------|----------|
| 50 | Lightest backgrounds | Dark mode bg, group areas |
| 100 | Hover/focus backgrounds | Item hover, light borders |
| 200 | Selected backgrounds, borders | Selected items (Fluent), borders |
| 300 | Borders, dividers | Default borders, dividers |
| 400 | Disabled elements, placeholders | Disabled text, placeholder |
| 500 | Secondary text, icons | Disabled text, secondary content |
| 600 | Labels, secondary text | Header text (Indigo), labels |
| 700 | Descriptions, tooltips | Tooltip bg, descriptions |
| 800 | Primary text | Main text, titles |
| **900** | **Maximum contrast text** | Headings, emphasis |

---

### Surface Color
**Role:** Component background foundation

The "canvas" color. Typically white (light) or dark gray (dark themes).

**Used For:**
- Card, dialog, dropdown backgrounds
- Input field backgrounds
- List and panel backgrounds
- Navigation backgrounds

**Note:** Usually only shade 500 is used. The surface determines whether gray shades appear light or dark.

---

### Error Color
**Role:** Validation errors and destructive actions

Communicates problems. Use sparingly for maximum impact.

**Used For:**
- Form validation errors (borders, text)
- Invalid state indicators
- Destructive action buttons
- Error progress state

**Shade Usage:**
| Shades | Purpose |
|--------|---------|
| 200-400 | Focus rings, light errors |
| **500** | Default error |
| 600-800 | Hover states, Material errors |

---

### Success, Warn, Info Colors
**Role:** Feedback states

| Color | Purpose |
|-------|---------|
| **Success** | Completion, positive feedback |
| **Warn** | Caution, potential issues |
| **Info** | Neutral information |

These primarily use shade **500** for their default state.

---

## Interaction State Patterns

### Button States
```
idle    → primary-500 background
hover   → primary-600 (or 500 + overlay)
focus   → primary-500 + focus ring (200-300)
active  → primary-700
disabled → gray-300 bg, gray-500 text
```

### List Item States
```
idle     → surface bg, gray-800 text
hover    → gray-100 or 200 bg
focus    → gray-100 bg + outline
selected → primary-100/200 bg (or 300 @ 0.3 opacity)
disabled → gray-400 text
```

### Input States
```
idle    → surface bg, gray-300/400 border
hover   → gray-400/500 border
focus   → primary-500 border + ring
error   → error-500 border/text
disabled → gray-100 bg, gray-400 text
```

---

## Opacity Usage

Opacity modifiers adjust color intensity while maintaining relationships:

| Opacity | Use Case |
|---------|----------|
| 0.05-0.1 | Subtle hover overlays |
| 0.12-0.15 | Active states, disabled bg |
| 0.2 | Disabled elements |
| 0.3 | Selected backgrounds (Indigo) |
| **0.38** | Material disabled (standard) |
| 0.5 | Focus outlines |
| 0.8-0.9 | Strong overlays, tooltips |

---

## Contrast Colors

Always use `contrast-color` for text on colored backgrounds:

```scss
// Text on primary button
color: contrast-color('primary', 500);

// Text with opacity
color: contrast-color('gray', 50, 0.8);
```

---

## Theme Variations

### Material Design
- Secondary color for accents
- Ripple effects
- A100-A700 accent shades
- Elevation through shadows

### Fluent Design
- Gray-based, subtle
- 100-200 for hovers
- Border-focused styling

### Bootstrap
- Primary for accents
- 600 for hover states
- Strong borders

### Indigo Design
- Transparent backgrounds
- Primary 300 @ 0.3 opacity for selections
- Clean, modern aesthetic

---

## Dark Mode Guidelines

IMPORTANT: Chromatic color shades (primary, secondary, etc.) are NEVER inverted.
The shade order is always 50=lightest, 900=darkest regardless of theme variant.
Only GRAY inverts its shade progression for dark themes.

1. **Gray shades invert**: Lower numbers become darker (50=darkest in dark mode)
2. **Use lighter primary shades**: In dark mode UI, reference lighter shades (100-300) 
   instead of darker ones (500-700) for better visibility. The palette itself is NOT 
   inverted - you just USE different shades from the same palette.
3. **Surface becomes dark**: #222, #1a1a1a, etc.
4. **Contrast still works**: `contrast-color` adapts automatically

---

## Quick Reference

| Need | Color | Shade |
|------|-------|-------|
| Primary button bg | primary | 500 |
| Link text | primary | 500 |
| Main body text | gray | 800-900 |
| Secondary text | gray | 600-700 |
| Disabled text | gray | 400-500 |
| Component bg | surface | 500 |
| Hover bg | gray | 100-200 |
| Border | gray | 200-400 |
| Error state | error | 500 |
| Success state | success | 500 |
| Focus ring | primary | 200-300 |
