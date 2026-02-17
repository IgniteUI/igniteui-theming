# pad() function

Returns a size-aware spacing value based on --ig-spacing and size flags.

## Mechanism
pad() uses --is-small/medium/large (from @include sizable()) and multiplies the
chosen size by spacing variables:
- --ig-spacing
- --ig-spacing-inline (optional)
- --ig-spacing-block (optional)

## Sass example
```scss
.my-card {
  padding: pad(4px, 8px, 16px);
}
```

## CSS example
```css
.my-card {
  --ig-spacing: 0.75;
}
```

## Notes
- Requires @include sizing() and @include sizable() in component styles.
- Requires @include spacing() once to set spacing variables.
