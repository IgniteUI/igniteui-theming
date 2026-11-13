# Contributing

## Development

```
npm ci
npm run build
npm run lint
npm test
```

`npm run lint` checks the Sass sources with Stylelint and Prettier, and the TypeScript sources with Biome.

## Supported Sass versions

The library supports Dart Sass 1.97.1 and later. The minimum is declared in two places:

- the `sass` peer dependency range in `packages/theming/package.json`;
- the `sass-embedded` dependency range in `packages/theming/package.json` and `packages/mcp/package.json`.

The `sass-minimum` CI job reads the `sass` peer range, installs the lowest `sass` and `sass-embedded` versions in it, and runs the build and the tests with them. If a change needs a newer Sass, raise both ranges and the version in the README files.

## Sass conditionals

Return early from a function with `@if` blocks:

```scss
@function bem--with-dot($x) {
    $first: string.slice($x, 0, 1);

    @if $first == '.' {
        @return $x;
    }

    @return string.insert($x, '.', -100);
}
```

Use the CSS-style `if()` only for a short assignment that fits on one line:

```scss
$scope: if(sass(is-root()): ':root'; else: '&');
```

Use `@if` / `@else` instead when:

- the assignment doesn't fit on one line;
- the choice has three or more outcomes;
- the `if()` would sit inside another expression, such as a function argument or another `if()`.

Don't use the legacy `if($condition, $a, $b)` syntax. Sass deprecates it, and the deprecation test fails on it.
