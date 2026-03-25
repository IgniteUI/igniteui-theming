# The border-radius() function

Clamps a radius value between min and max that can be configured using --ig-radius-factor with fractional values between 0 and 1.

## Mechanism
border-radius() calculates:
clamp(min, calc(var(--ig-radius-factor) * max), max)

## Sass example (include border-radius() in your styles)
```scss
.my-pill {
  border-radius: border-radius(16px, 4px, 20px);
}
```

## Configure radius factor to adjust the radius between min and max
```css
.my-pill {
  --ig-radius-factor: 0.8;
}
```

## Notes
- Works without additional mixins.
