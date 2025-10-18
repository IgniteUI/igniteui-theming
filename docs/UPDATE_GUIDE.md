# Ignite UI Theming — Usage Guide

This guide explains the two main workflows supported by the package (Sass build-time themes and runtime CSS custom properties), shows exact import paths and commonly used mixins/functions found in the repository, and includes examples for SASS-based theming, runtime CSS-variable based theming, Tailwind utility generation, and how to consume the JSON token exports from JS.

Table of contents
- Overview
- Installation
- Build-time SASS theming (recommended for compiled projects)
- Runtime CSS Custom Properties (recommended for dynamic switching)
- Tailwind utility generation
- JS token usage (JSON exports)
- Examples
  - Minimal SASS custom theme (compile-time)
  - Runtime theme switching with CSS variables
  - Generating Tailwind utilities from theme schemas
  - Importing token JSON in JavaScript
- Best practices
- Troubleshooting

Overview
- Ignite UI Theming exposes a modular Sass codebase of schemas, mixins and functions used to define palettes, component tokens, typography scales and elevations. The repository compiles schemas into CSS variables and also produces JSON artifacts (palettes/typescales/elevations) for consumption by JavaScript.
- Two common approaches:
  1. Build-time (Sass): use the repository's theme functions/mixins to compile CSS (small bundles, optimized).
  2. Runtime (CSS variables): compile base CSS that exposes CSS custom properties and override them at runtime to switch themes.

Installation
- Install from npm:
  - npm:
    npm install igniteui-theming
  - yarn:
    yarn add igniteui-theming

- Where to import from (SASS):
  - The repository SASS layout is under `sass/`. When using the package you can import with explicit paths like:
    @use 'igniteui-theming/sass/themes' as themes;
    @use 'igniteui-theming/sass/themes/components' as components;
    @use 'igniteui-theming/sass/themes/charts' as charts;
    @use 'igniteui-theming/sass/tailwind/_mixins' as twmixins;
  - Alternatively, add `node_modules/igniteui-theming/sass` to your Sass loadPaths and import using the short names, e.g.:
    @use 'themes' as themes;

Key mixins, functions and variable conventions (repository specifics)
- Mixins you will commonly use:
  - `@include css-vars($theme, $scope: null)` — adds CSS variables for a component/theme map to a scope (the mixin lives in `sass/themes/_mixins.scss`).
  - `@mixin css-vars-from-theme($theme, $name, $ignored: $ignored-keys)` — lower-level helper that generates `--<variable>` CSS custom properties from a theme map.
  - `@mixin chart-themes($schema, $target: 'angular')` — adds chart-specific variables and themes (see `sass/themes/charts/_theme.scss`).
  - `@mixin tailwind-theme($component, $props: ())` and `@mixin tailwind-themes()` — helpers that generate Tailwind-compatible utility classes based on theme schemas (`sass/tailwind/_mixins.scss`).
  - Utility mixins in `sass/themes/_mixins.scss`: `sizable()`, `border-radius(...)`, `hide-default`, etc.

- Important naming / CSS variable patterns:
  - Many mixins produce CSS variables prefixed with `--ig-`. Examples from the code:
    - global theme identifier: `--ig-theme`
    - radius related factor: `--ig-radius-factor`
    - tailwind utilities use `--ig-<type>-<prop>` internally as a naming convention.
  - When `css-vars-from-theme` emits variables it follows the naming derived from the theme's `prefix` or the token key (so you will see variables such as `--ig-primary` or `--ig-button-background` depending on the theme map).

- Component theme functions
  - Each component/theme file (for example `sass/themes/components/button/button-theme.scss`) exports a theme function which can be called to get the theme map for that component. You can pass `$schema` overrides and then feed the result into `css-vars` to emit variables.

Build-time SASS theming (compile-time)
- Use this workflow when you want to produce a fully compiled stylesheet containing theme variables and component styles:
  1. Ensure Sass compilation is configured (Dart Sass, node-sass compatible loader or framework CLI).
  2. Import the package SASS modules.
  3. Create theme maps or call component theme functions and use `@include css-vars(...)` to convert them into CSS variables that your components consume.

- Typical pattern:
  - Import the theme modules:
    @use 'igniteui-theming/sass/themes' as themes;
    @use 'igniteui-theming/sass/themes/components' as components;
  - Generate and scope variables:
    $btn-theme: components.button-theme($schema: themes.$light-material-schema);
    .my-app-root {
      @include themes.css-vars($btn-theme);
    }

- Example (Sass pseudo-code):
```scss
@use 'igniteui-theming/sass/themes' as themes;
@use 'igniteui-theming/sass/themes/components' as components;

// Generate the button theme from a schema (defaults to the library schemas if you omit $schema)
$my-button-theme: components.button-theme($schema: themes.$light-material-schema);

// Emit CSS variables scoped to .brand-theme
.brand-theme {
  @include themes.css-vars($my-button-theme);
}
```

Runtime CSS Custom Properties (CSS variables)
- The repository's mixins deliberately output CSS custom properties so you can switch themes at runtime by swapping top-level scopes (classes on the root or container).
- Example variable generation used in charts:
  - `@include css-vars-from-theme( ( chart-brushes: color.chart-brushes() ), 'ig' );` — this shows how the repo emits a set of `--ig-*` variables for chart brushes.
- Switching themes at runtime:
  - Compile and include the base CSS that contains theme classes (e.g., `.theme-light { --ig-primary: ... }`, `.theme-dark { --ig-primary: ... }`).
  - Toggle a class on `document.documentElement` (or a top-level container) to switch theme scope.
  - For direct variable updates you can call:
    document.documentElement.style.setProperty('--ig-primary', '#0b74de');

Tailwind utility generation
- The repository contains a tailwind utilities generator implemented in SASS (`sass/tailwind/*`).
- Usage pattern:
  - The tailwind mixins (e.g. `@include tailwind-themes();`) iterate over theme schemas (provided by `theme-schemas`) and emit utilities using `@include tailwind-theme($component, $props)`.
  - Example: `sass/tailwind/utilities/material.scss` includes `@include tailwind-themes();` and component-specific `@include tailwind-theme(...)` calls for slider, switch, etc.
- To create Tailwind-friendly utility classes:
  - Import the `tailwind` SASS utilities module and include `tailwind-themes()` in a stylesheet that is processed into your Tailwind pipeline, or compile the utilities into a separate CSS file you include in your build.

JS token usage (JSON exports)
- The repo creates JSON artifacts under `json/` and index.js re-exports them:
  - `index.js` exports:
    - Palettes from `./json/colors/presets/palettes.json`
    - PaletteMeta from `./json/colors/meta/palette.json`
    - PaletteMultipliers from `./json/colors/meta/multipliers.json`
    - Typescales from `./json/typography/presets/typescales.json`
    - Elevations from `./json/elevations/elevations.json`
- Example (import tokens in JS):
```js
import { Palettes, Typescales, Elevations } from 'igniteui-theming';

console.log(Palettes);
console.log(Typescales);
console.log(Elevations);
```
- The JSON is generated from the SASS schemas by `scripts/buildJSON.mjs` which uses `scripts/parser.mjs` to convert the CSS variable output into JSON.

Examples

1) Minimal SASS custom theme (compile-time)
```scss
@use 'igniteui-theming/sass/themes' as themes;
@use 'igniteui-theming/sass/themes/components' as components;

// Pick a base schema provided by the package:
$schema: themes.$light-material-schema;

// Create a button theme from the schema (component theme functions return a theme map)
$my-button-theme: components.button-theme($schema: $schema);

// Emit CSS variables scoped to the .brand-theme container
.brand-theme {
  @include themes.css-vars($my-button-theme);
}
```

2) Runtime theme switching (vanilla JS)
- Compile both `.theme-light` and `.theme-dark` scopes (or produce a CSS file that contains both) so switching is just adding/removing the class.
```html
<link rel="stylesheet" href="/assets/igniteui-theming.css" />
<script>
  function setTheme(themeClass) {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(themeClass);
  }

  // Example usage:
  document.getElementById('btnDark').addEventListener('click', () => setTheme('theme-dark'));
</script>
```

3) Generating Tailwind utilities
```scss
@use 'igniteui-theming/sass/tailwind/_mixins' as twmixins;
@use 'igniteui-theming/sass/tailwind/utilities/material' as material-utils;

// Include the common utilities and theme-specific utilities
@include material-utils.tailwind-themes(); // or compile the utilities file that does this
```
- The tailwind SASS modules were organized to generate utilities per component using `@include tailwind-theme(...)`. See `sass/tailwind/utilities/*.scss`.

4) Importing color / typography tokens in JS (JSON artifacts)
```js
import { Palettes, Typescales, Elevations } from 'igniteui-theming';

const primaryPalette = Palettes.primary || Palettes['blue']; // inspect the JSON structure
console.log('Primary palette tokens:', primaryPalette);
```

Best practices
- Prefer tokens (generated theme maps / CSS vars) instead of hard-coded values inside components — the repo is designed to centralize tokens in theme schemas.
- Scope theme variables at a high level for runtime switching (e.g., on `:root` or `document.documentElement`) to minimize layout thrash.
- Use the provided schemas (e.g. `themes.$light-material-schema`, `themes.$dark-fluent-schema`) as a starting point and only override the tokens you need.
- Keep accessibility in mind — the theme schemas include both color and contrast tokens; check WCAG contrast for text on surfaces especially when customizing palettes.
- If you integrate with Tailwind, use the packaged tailwind utility generators rather than hand-coding utilities, so changes to theme schemas propagate to your classes.

Troubleshooting
- "SASS function not found" when importing:
  - Ensure the import path matches your project's Sass load path. Adding `node_modules/igniteui-theming/sass` to loadPaths will let you use short imports such as `@use 'themes' as themes;`.
- Variables not applied when switching theme:
  - Confirm the scope where `css-vars(...)` was emitted (class selector vs `:root`). The mixin `css-vars` uses the theme map's `selector` or `name` to decide the emitted scope.
- JSON tokens are stale:
  - Re-run the repo's JSON build script (`scripts/buildJSON.mjs`) if you are modifying the SASS schemas locally; packaged npm releases should already contain up-to-date `json/` artifacts.

Notes on repository specifics used for this guide
- SASS mixins and functions used in examples are taken from:
  - `sass/themes/_mixins.scss` (mixins `css-vars`, `css-vars-from-theme`, `sizable`, `border-radius`, etc.).
  - Component theme files exported under `sass/themes/components/*` and chart themes `sass/themes/charts/*`.
  - Tailwind utilities are implemented under `sass/tailwind/*` and rely on `@mixin tailwind-theme(...)` / `@mixin tailwind-themes()`.
- JSON and JS exports are available from the repository's `index.js` which re-exports JSON artifacts generated into `json/` (`json/colors/...`, `json/typography/...`, `json/elevations/...`).
