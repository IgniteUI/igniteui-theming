# The spacing() mixin

Defines [CSS @property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property) rules for spacing (--ig-spacing) and its variants:
## Sass example
```scss
@include spacing();
```

## CSS output
```css
:root {
  @property --ig-spacing {
      syntax: '<number> | <integer>';
      initial-value: 1;
      inherits: true;
  } 

  --ig-spacing-inline-small: var(--ig-spacing-inline, var(--ig-spacing-small));
  --ig-spacing-inline-medium: var(--ig-spacing-inline, var(--ig-spacing-medium));
  --ig-spacing-inline-large: var(--ig-spacing-inline, var(--ig-spacing-large));
  --ig-spacing-block-small: var(--ig-spacing-block, var(--ig-spacing-small));
  --ig-spacing-block-medium: var(--ig-spacing-block, var(--ig-spacing-medium));
  --ig-spacing-block-large: var(--ig-spacing-block, var(--ig-spacing-large));
}
```

## Notes
- spacing() is typically included once at the root scope/stylesheet.
