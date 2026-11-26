# The sizable() function

Returns a size-aware value based on the values --ig-size and a user-declared --component-size CSS variables.

## Mechanism
The sizable() function chooses between small/medium/large values using:
- --component-size (user declared and liked to --ig-size)
- --ig-size-small/medium/large (registered by theme() or @include sizing())
- --is-small/medium/large from @include sizable()

## Sass example
```scss
.my-avatar {
  @include sizable(); // Include --is-small/medium/large flags

  --component-size: var(--ig-size, var(--ig-size-medium)); // Link component size to --ig-size with a default of 2 (medium)
  --size: #{sizable(32px, 40px, 48px)};

  width: var(--size);
  height: var(--size);
}
```

## Change the global size to medium, which will make the wid
```scss
:root {
  --ig-size: 2;
}
```

## Default step without the sizable() mixin
Without `@include sizable()` the `--is-*` flags are not set, and the function returns the largest of the three values. Pass `$default` (1, 2 or 3) to return that step instead.

```scss
.my-handle {
  // 2px when the element does not include sizable()
  border-radius: sizable(2px, 8px, 8px, $default: 1);
}
```

## Notes
- Requires `@include sizable()` in component styles. Without it, the value is the largest step, or the `$default` step when it is set.
- Requires the size variables, which `theme()` registers. Without `theme()`, include `@include sizing()` once.
