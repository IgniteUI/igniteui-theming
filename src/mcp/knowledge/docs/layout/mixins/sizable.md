# sizable() mixin

Defines size state flags used by sizable() and pad():
- --is-small
- --is-medium
- --is-large

## Sass example
```scss
.my-component {
  @include sizable();
}
```

## Notes
- Required for components to react to --ig-size changes.
