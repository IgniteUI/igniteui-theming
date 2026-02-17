# border-radius() function

Clamps a radius value between min and max using --ig-radius-factor (0 to 1).

## Mechanism
border-radius() calculates:
clamp(min, calc(var(--ig-radius-factor) * max), max)

## Sass example
```scss
.my-pill {
  border-radius: border-radius(16px, 4px, 20px);
}
```

## CSS example
```css
.my-pill {
  --ig-radius-factor: 0.8;
}
```

## Notes
- Works without additional mixins.
