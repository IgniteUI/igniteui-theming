# sizable() function

Returns a size-aware value based on --ig-size and --component-size.

## Mechanism
sizable() chooses between small/medium/large values using:
- --component-size (resolved from --ig-size)
- --ig-size-small/medium/large
- --is-small/medium/large from @include sizable()

## Sass example
```scss
.my-avatar {
  width: sizable(32px, 40px, 48px);
  height: sizable(32px, 40px, 48px);
}
```

## CSS example
```css
:root {
  --ig-size: 2;
}
```

## Notes
- Requires @include sizable() in component styles.
