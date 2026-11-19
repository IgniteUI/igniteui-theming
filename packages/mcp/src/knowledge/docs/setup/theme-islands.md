# Theme Islands

A theme island is a part of a page with a different theme than the rest of it, such as an Indigo dark panel in a Material light app. Generate the island's theme with `create_theme` and pass the island's selector as `scope`.

## How an island works

A theme has two parts, and an island must change both:

1. **The custom properties** (palette, typography, elevations, `--ig-theme` and `--ig-theme-variant`). `theme()` and `typography()` inside a selector set them on that selector, and every descendant inherits them, including descendants in shadow roots.
2. **The styles of the components**, which differ per design system.
   - **Angular** picks them with `@container style(--ig-theme: ...)` queries, so the custom properties of the island are enough.
   - **Web Components, React and Blazor** pick them in JavaScript, from the closest theme provider: `igc-theme-provider`, `IgrThemeProvider` or `IgbThemeProvider`. Setting `--ig-theme` doesn't change them, so an island needs a provider with the island's `theme` and `variant`.

Put the page's theme first and the island's after it. Within the island, the island's values win because they are set on a closer ancestor, whatever the specificity.

## Angular

Include the island's theme in a selector of the global styles. `core()` and the page's theme are included once, before it:

```scss
@use 'igniteui-angular/theming' as *;

@include core();
@include typography($font-family: $material-typeface, $type-scale: $material-type-scale);
@include theme($palette: $light-material-palette, $schema: $light-material-schema);

.reports-panel {
  @include typography($font-family: $indigo-typeface, $type-scale: $indigo-type-scale);
  @include theme($palette: $dark-indigo-palette, $schema: $dark-indigo-schema);
}
```

```html
<div class="reports-panel">
  <igx-grid [data]="data"></igx-grid>
</div>
```

The theme can also go in the island component's own stylesheet, inside `:host { ... }`. With emulated encapsulation, a modal overlay in that component (`igx-dialog`, or a date or time picker in dialog mode) takes the structure of the page's design system. Prefer the global selector for islands with dialogs.

**Theme token.** `THEME_TOKEN` doesn't style anything. By default it holds the page's `--ig-theme`, read once from `<body>`, and components use it for decisions made in TypeScript, such as theme-specific icons. When the island has another design system, provide a token for it in the island component, with its own icon service:

```ts
providers: [
  { provide: THEME_TOKEN, useFactory: () => new ThemeToken('indigo') },
  IgxIconService,
],
```

## Web Components, React and Blazor

Wrap the island's content in a theme provider with the island's design system and variant, inside an element with the island's selector:

```html
<div class="reports-panel">
  <igc-theme-provider theme="indigo" variant="dark">
    <igc-grid></igc-grid>
  </igc-theme-provider>
</div>
```

React uses `<IgrThemeProvider theme="indigo" variant="dark">` and Blazor `<IgbThemeProvider Theme="Theme.Indigo" Variant="ThemeVariant.Dark">`.

Then set the island's custom properties with one of these options:

- **Sass:** the output of `create_theme` with `scope`, for example `.reports-panel { @include typography(...); @include theme(...); }`.
- **A prebuilt theme file in `@scope`:** the theme files that write their global rules to `:root, :scope, :host` apply to the scoping root inside `@scope`. Files that write them to `:root` only, as older versions do, don't work this way. Load a file into `@scope` like this:
  - **Sass:** `@use 'sass:meta';` then `@scope (.reports-panel) { @include meta.load-css('igniteui-webcomponents/themes/dark/indigo'); }`.
  - **JavaScript:** import the file's text (for example with Vite's `?inline`), then `sheet.replaceSync('@scope (.reports-panel) {' + css + '}')` and add the sheet to `document.adoptedStyleSheets`.
  - **Not** with `@import url(...) scope(...)`: browsers don't support it yet and drop the whole stylesheet. Also not with `@import` inside an `@scope` block: CSS ignores it there.

## Overlays and drag ghosts

An overlay inherits the theme of the place it is declared in, not of the element it is anchored to.

- **Angular 21.2 and later** render every overlay in place, in the browser's top layer: drop-downs, combos, selects, pickers, tooltips, dialogs, snackbars, toasts, and the grid's filtering menus and row editing. Declare them inside the island and they keep its theme. Older versions move overlays to an outlet under `<body>`, where they take the page's theme.
- **Web Components** popovers and dialogs are in the component's shadow root, so they keep the island's theme too. A tooltip or dropdown declared outside the island takes the page's theme, even when its anchor is inside the island.
- **Drag ghosts are appended to `<body>`** and take the page's theme. This applies to grid row dragging, chip dragging and the tile manager. For `igxDrag`, set `[ghostHost]` to an element inside the island.

## Shadow DOM

A theme file adopted by a shadow root applies to its host, through `:host`, so a custom element can be an island of its own.

The other side of this: a custom element inside an island that adopts the page's theme file resets its subtree to the page's theme. Inside an island, adopt only the styles the element needs, not the whole theme file.

## Nested islands and elevations

Islands can nest; the closest one wins. Pass `$elevation: false` to `theme()` to turn the shadows off in an island. With `theme()` from igniteui-theming, an island inherits the elevation factor of its parent, and `$elevation: true` turns the shadows back on.
