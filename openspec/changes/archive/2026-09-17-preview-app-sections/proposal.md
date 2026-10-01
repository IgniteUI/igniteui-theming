## Why

`packages/preview` renders one static page with no client JavaScript. It proves a single claim — that the `fitted` generator produces better ramps than `legacy` — and it proves it only to whoever remembers to open `dist/index.html`. Its regression value depends on a human noticing that a number changed.

That shape has two problems. It has nowhere to put the other pillars of the framework — typography, elevations, sizing, spacing, roundness — because a build-time report cannot express anything interactive. And the knobs the color system exposes (`$shade-generator`, the `range` and `curve` of `$scales`, `$family-scales`) currently have no hands-on surface at all; a new user meets them as sassdoc and has to rebuild to see what they do.

The package should become the place someone goes to understand the framework by operating it, starting with color and with room for the rest.

## What Changes

- Restructure `packages/preview` into a sectioned application: one section per pillar of the theming system, one or more views inside each section, both declared through a registry the shell reads
- Render a section as a single page: the controls its views share are pinned at the top, the views are stacked beneath them, and each view's code and data are imported as it nears the viewport
- Introduce a build-time **data provider** contract with on-disk caching, so every pillar compiles the Sass it needs through one mechanism instead of inventing its own build step
- Adopt Lit as the rendering layer. The shell frames a demo from its registry metadata; a demo is a plain custom element, and recurring behaviour is offered as shared elements rather than imposed by a base class
- Drive the color section from the palettes the library already ships: a picker selects one, its seeds are read out of the library rather than transcribed, and every view on the page answers to that one selection
- Ship four color views: the selected palette through both generators, its surface roles and grayscale, a `range`/`curve` editor whose subjects follow the selection, and a hue sweep that stands as the evidence behind the claims
- Move the comparison page's pass/fail assertions into vitest, so a regression fails the build instead of waiting to be noticed
- Ship the `color` section only. Typography, elevations, sizing, spacing and roundness are accommodated by the structure and explicitly out of scope here

## Capabilities

### New Capabilities

- `preview-data-providers`: How a pillar declares the data it needs compiled from Sass, how that data is cached and invalidated, and how a demo loads it
- `preview-sections`: How sections and demos register themselves, how the shell renders and routes them, and the shared elements a demo may compose
- `preview-color-demos`: The three demos of the color section and the claims each one is responsible for showing

## Deferred

### Embedding the views outside this application — one shared bundle

Decided, not built here. The views are to be published as a **single** embed bundle that registers every view and the components once, so a post loads one script and then places `<ig-view-scales>` or `<ig-view-sweep>` wherever it wants.

Measured against the alternatives. One bundle per view was built and tested: `scales` came to 648 KB (99 KB gzipped) and `sweep` to 760 KB (148 KB), and two of them on one page ship two copies of Lit, of `igniteui-webcomponents` and of the 49 KB theme sheet — about 250 KB gzipped for a pair, against roughly 180 KB for a single bundle carrying all four. An iframe to a hosted build was the other candidate; it isolates cleanly but costs a full application load per frame and needs a bare mode that renders one view without the masthead.

What it accepts: the stylesheets stay document-scoped, so an embed restyles the page around it — measured on a bare host page, the body background, body padding, prose font and prose color all changed to this application's. That is tolerable for a post about this library on a site we control, and it is the reason this route is cheap.

What it cannot do without further work: drop into a page we do not own, or into a CodePen. That needs shadow DOM per view, which means moving the token block from `:root` to `:host` while leaving the `@property` registrations at document level — they do not register from inside a shadow root, and `--ig-size-*` and `--ig-spacing` must be registered for the components to have padding at all.

Already in place: every custom element registers through `src/define.ts`, which no-ops on a name already taken. Without it a second bundle on the page throws on the first shared element and aborts, leaving its view undefined and inert with nothing in the console to explain it.

## Impact

- **Code**: `packages/preview` restructured into `src/data/`, `src/sections/`, `src/shell/`. `src/render.ts`, `src/html.ts`, `src/plugin.ts`, `src/model.ts` and `src/palettes.ts` are removed; `src/color.ts` moves into the data layer largely intact, and `src/preset-model.ts` and `src/variants.ts` take over from the retired pair
- **Dependencies**: adds `lit` as the package's first runtime dependency, and `igniteui-webcomponents` for the app's own controls — the app demonstrates a theming framework, so its controls are the components that framework themes. `packages/preview` is `private: true` and is not published, so no consumer is affected
- **Tests**: the AA-pair, duplicate-shade and gamut assertions currently rendered as a scoreboard move into the vitest project alongside `color.spec.ts`. New tests cover data-provider cache invalidation and the curve/target math
- **Build**: `npm run preview` and `npm run preview:build` keep their names. CI is unaffected — root `npm run build` targets `packages/theming` only and never built the preview
- **APIs**: none. This package consumes the public Sass API and adds nothing to it
- **Rollback**: the restructure is contained to `packages/preview`, which nothing imports. Reverting the directory and dropping `lit` from its `devDependencies` restores the static report with no effect on the library, the MCP server, or any published artifact
