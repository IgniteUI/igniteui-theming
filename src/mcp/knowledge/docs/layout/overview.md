# Layout scale overview

Ignite UI components expose sizing, spacing, and roundness through CSS custom properties.
You can set them globally on :root or locally on a specific component selector.

## Size
--ig-size is the primary control. Components map it into --component-size internally:
--component-size: var(--ig-size, <default-size-from-theme>).

Size affects any styles that use sizable() or pad() functions.
Suggested values:
- 1 = small
- 2 = medium (default in mosts components)
- 3 = large
- fractional values are NOT ALLOWED (0.75, 1.5)

## Spacing
--ig-spacing scales spacing used by pad(), pad-inline(), and pad-block().
Suggested values:
- 0 = no spacing
- 1 = default
- 2 = double
- fractional values are ALLOWED (0.75, 1.5)

You can override inline or block independently:
- --ig-spacing-inline
- --ig-spacing-block

## Roundness
--ig-radius-factor scales border radius values when border-radius() is used.
- 0 = minimum radius
- 1 = maximum radius
- values between 0 and 1 interpolate between min and max

## Examples

### CSS (global)
```css
:root {
  --ig-size: 2;
  --ig-spacing: 0.75;
  --ig-radius-factor: 0.8;
}
```

### CSS (component scope)
```css
igx-calendar,
igc-calendar {
  --ig-size: 1;
  --ig-spacing: 0.5;
  --ig-radius-factor: 0.9;
}
```

### Sass notes
- To react to --ig-size, component styles must include @include sizable().
- To use pad(), pad-inline(), or pad-block(), include @include spacing() once.
- border-radius() responds to --ig-radius-factor without extra mixins.
