# Ignite UI Theming - Chart Series Colors

## The Shared Series Brush Palette

Ignite UI charts pull their default categorical colors from **one shared palette of 10 colors**, not from the primary/secondary/gray palette used by other components. This palette is identical across all four design systems (Material, Fluent, Bootstrap, Indigo) and both light and dark variants — there is no per-theme variation to configure.

Two variants of this palette exist:

- **Regular** — the default, visually distinct categorical colors.
- **Color-blind** — an alternate palette chosen for better distinguishability under common color vision deficiencies.

Both are exposed as a single CSS custom property, `--chart-brushes`, set once at `:root` by the chart theme mixin:

```scss
--chart-brushes: var(--ig-chart-brushes, #{color.chart-brushes()});
```

Switch to the color-blind palette with the `configure-colors` mixin:

```scss
@use 'igniteui-theming/sass/color' as *;

.enhanced-accessibility {
  @include configure-colors($enhanced-accessibility: true);
}
```

Individual chart theme tokens whose value is the literal keyword `series` (see the token table below) resolve to `var(--chart-brushes)` automatically — you don't reference the palette directly unless you want to inspect or override its raw values.

## ⚠️ Theme Default vs. Component Override (read this first)

Setting Sass theme brushes only changes the **default** color for chart instances rendered with that theme. Every in-scope chart component also exposes its own color-list properties directly (e.g. Angular's `brushes`, `outlines`, `markerBrushes`, `markerOutlines`, `rangeBrushes`, `rangeOutlines` inputs). **A value bound on the component instance takes precedence over the Sass theme default.**

If you change `category-chart-theme($brushes: ...)` and a chart still doesn't reflect the new colors, check whether the app is also binding `[brushes]` (or the equivalent property in your framework) on that chart instance — the component-level value wins.

This MCP generates **Sass theme code only**. It does not generate framework component bindings.

## Per-Chart-Type Color Tokens

Each theme function below accepts arguments for its list-valued series color tokens. Passing an explicit list overrides `series` (the shared palette) with your own colors. Tokens marked "fixed default" resolve to a specific hardcoded value rather than the shared palette, even though they still accept custom color lists.

| Chart Type | Theme Function | Tokens (default source) |
|---|---|---|
| Category Chart | `category-chart-theme()` | `brushes` (series), `marker-brushes` (series), `outlines` (series), `marker-outlines` (series), `trend-line-brushes` (series), `negative-brushes` (fixed default: red, for Waterfall-style negative values), `negative-outlines` (fixed default: red) |
| Data Chart | `data-chart-theme()` | `brushes` (series), `marker-brushes` (series), `outlines` (series), `marker-outlines` (series) |
| Doughnut Chart | `doughnut-chart-theme()` | `brushes` (series), `outlines` (series) |
| Pie Chart | `pie-chart-theme()` | `brushes` (series), `outlines` (series) |
| Funnel Chart | `funnel-chart-theme()` | `brushes` (series), `outlines` (series) |
| Shape Chart | `shape-chart-theme()` | `brushes` (series), `marker-brushes` (series), `outlines` (series), `marker-outlines` (series), `trend-line-brushes` (series) |
| Financial Chart | `financial-chart-theme()` | `brushes` (series), `outlines` (series), `marker-brushes` (series), `marker-outlines` (series), `negative-brushes` (series), `negative-outlines` (series), `indicator-brushes` (series), `indicator-negative-brushes` (series), `overlay-brushes` (series), `trend-line-brushes` (series), `volume-brushes` (series), `volume-outlines` (series) |
| Linear Gauge | `linear-gauge-theme()` | `range-brushes` (series), `range-outlines` (series) |
| Radial Gauge | `radial-gauge-theme()` | `range-brushes` (series), `range-outlines` (series) |
| Bullet Graph | `bullet-graph-theme()` | `range-brushes` (series), `range-outlines` (series) |

Note that Financial Chart's `negative-brushes`/`negative-outlines` default to the **shared series palette** (`series`), unlike Category Chart's `negative-brushes`/`negative-outlines`, which default to a **fixed red** intended for Waterfall-style contextual coloring. Always check the "default source" column rather than assuming consistent behavior across chart types.

## Overriding Series Colors in Sass

Pass an explicit color list to any of the tokens above to override the shared palette for that chart instance's theme:

```scss
@use 'igniteui-theming/sass/themes/charts' as *;

$custom-chart-theme: category-chart-theme(
  $brushes: (#4285f4, #ea4335, #fbbc05, #34a853),
  $marker-brushes: (#4285f4, #ea4335, #fbbc05, #34a853),
);

:root {
  @include tokens($custom-chart-theme);
}
```

`tokens()` is the current mixin for emitting a theme's CSS custom properties — it superseded the deprecated `css-vars()` mixin (which now just forwards to `tokens($theme, $mode: 'scoped')` internally). Chart themes are applied globally, so use the default `'global'` mode at `:root` as shown above, matching the pattern the framework itself uses in `themes/charts/_theme.scss` (`@include tokens(category-chart-theme($schema: $schema));`).

You can also override the shared palette globally (affecting every chart using `series` for a given token) by setting the `--ig-chart-brushes` CSS custom property, which the theme mixin reads before falling back to the built-in palette:

```css
:root {
  --ig-chart-brushes: #4285f4, #ea4335, #fbbc05, #34a853;
}
```

## Not Covered by This Guidance

Two chart-adjacent color surfaces are intentionally **not** covered here:

- **Sparkline** colors (`brush`, `low-marker-brush`, `high-marker-brush`, `first-marker-brush`, `last-marker-brush`, `negative-brush`, `normal-range-fill`, `trend-line-brush`) are all **singular**, not list-valued, and default from the `primary` palette color rather than the shared series brushes — a different theming model from the charts above.
- **Selection/highlight colors** (`selectionBrush`, `focusBrush`, `selectionMode`) are component-only properties with no discovered Sass theme equivalent.

## Legend Colors

Legend swatches (`IgxDataLegendComponent`, `IgxItemLegendComponent`, etc.) derive automatically from each series' actual brush — there is no separate "legend color" theme token to set.
