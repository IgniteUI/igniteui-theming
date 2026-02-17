# The sizable() function

Returns a size-aware value based on the values --ig-size and a user-declared --component-size CSS variables.

## Mechanism
The sizable() function chooses between small/medium/large values using:
- --component-size (user declared and liked to --ig-size)
- --ig-size-small/medium/large (set by @include sizing())
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

## Notes
- Requires `@include sizable()` in component styles.
- Requires `@include sizing()` once to set size variables.
