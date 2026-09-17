## Context

`packages/preview` is 1,272 lines with two devDependencies and no client JavaScript. Its page is generated at build time by a Vite plugin that fills placeholders in `index.html` with markup built from compiled palettes. That is a good shape for a report and the wrong shape for everything we now want the package to do.

The constraint that drives most of the decisions below: **the generator lives in Sass and only in Sass.** Shades cannot be computed in the browser. Anything interactive has to be served from data compiled at build time, which makes the data layer the load-bearing piece rather than the rendering layer.

## Goals / Non-Goals

**Goals:**

- One application that teaches the framework by letting someone operate it, not a gallery of separate pages
- Adding a pillar costs a folder and a registry entry, never a shell edit
- Every demo looks and behaves like part of one product, because the shared pieces make consistency the path of least resistance
- Regressions in the claims the app makes fail the test suite, not the reader's attention
- Demos remain embeddable outside this app — in the sassdoc output, a marketing page, or a sandbox

**Non-Goals:**

- Porting the shade generator to TypeScript. The lookup strategy in Decision 8 removes the need, and a second implementation of the algorithm would be a correctness liability
- Implementing the typography, elevations, sizing, spacing or roundness sections. This change establishes the structure that will hold them
- Publishing this package or any component from it
- Server-side rendering or hydration. The app is a local and internal tool

## Decisions

### 1) Lit as the rendering layer

Adopt `lit` for demos and the shell.

Rationale: the package acquires a client runtime for the first time here, so the question is not whether to leave vanilla but what the new runtime should be. Lit is already the org's component technology (`igniteui-webcomponents`), so it is existing team knowledge. Its output is custom elements, which makes a demo portable into the sassdoc site or any other page without build coupling — that portability is what allows the demos to be reused rather than reimplemented.

Alternatives considered:

- **Imperative DOM with a tagged-template helper**: this is what the prototypes used. It works at this size, but its full-rebuild pattern (`replaceChildren()` on every state change) destroys DOM identity, which already produced two defects during prototyping: a pointer capture lost when an SVG re-rendered mid-drag, and keyboard focus needing manual restoration after each update. Both are the class of problem a diffing renderer removes.
- **React or Svelte**: neither offers anything Lit does not for this use, and both are unfamiliar in this repository.

### 2) Composition over inheritance: the frame belongs to the shell

A demo is a custom element with no base class and no required methods. The shell renders the surrounding frame — title and the one-line statement of what the demo teaches — from the registry metadata it already holds. Recurring behaviour is offered as elements a demo may use: `<ig-code-block>` for generated Sass with its copy control, `<ig-verdict>` for a pass/fail readout, `<ig-palette-scope>` for applying a compiled palette.

Rationale: an earlier draft of this design fixed a four-part anatomy — controls, stage, verdict, generated Sass — in an abstract base class. That anatomy was generalised from three demos of a single pillar, and color is the pillar least like the others. Contrast is objectively measurable, so a verdict is natural there; a type scale's quality signals are line length and minimum size, which are guidelines rather than thresholds, and elevation's real question is whether one level reads as above another, which is perceptual. Sizing, spacing and roundness are multipliers whose stage is a real component being resized and which have no honest number at all. A contract that presumes a verdict, or presumes that a stage is a visualisation rather than a specimen, would have to be worked around by the second pillar to arrive.

Moving the frame into the shell also keeps demos portable. A demo placed in the documentation site or a post should not carry this application's chrome with it, which a base class rendering that chrome would force it to do.

Alternatives considered:

- **A base class with optional hooks**: still presumes a rendering shape, and still couples every demo to the application it happens to live in.
- **No shared elements at all**: consistency degrades and each pillar reinvents the copy affordance and the palette scope.

Trade-off: consistency across pillars becomes a convention upheld in review rather than a constraint enforced by the type system. For an application with a small number of authors that is the cheaper error — an inconsistent demo is a review comment, whereas a wrong abstraction spread across six pillars is a migration.

### 3) Build-time data providers behind virtual modules

A provider declares an id, the Sass paths that invalidate it, and a build function. A Vite plugin registers them and serves each as `virtual:data/<id>`.

```ts
interface DataProvider<T> {
  id: string;
  deps: string[];
  build(): Promise<T>;
}
```

Rationale: every pillar needs Sass compiled to JSON, and without a shared contract each will grow its own script — which is exactly how `previewShades.mjs` became unmaintainable. One mechanism, declared dependencies, uniform loading.

### 4) On-disk caching keyed on inputs

Provider output is cached under the package's build directory, keyed on a hash of its `deps` contents plus the provider module's own source.

Rationale: the color scale tables take roughly 40 seconds of Sass to compile. Uncached, that lands on every `npm run preview`. Hashing the provider source as well as its inputs means editing the provider invalidates its own cache, which a naive mtime check would miss. CI is unaffected either way, since it never builds this package.

### 5) Per-demo lazy loading of both code and data

Sections are code-split, and a demo's data module is dynamically imported when the demo first renders.

Rationale: the color tables are roughly 300 KB. Someone reading about spacing should not download them. This is nearly free to set up now and awkward to retrofit once several pillars exist.

### 6) The static report becomes a demo; its assertions become tests

The generator comparison is ported to `<ig-demo-generators>`. The AA-pair, duplicate-shade and out-of-gamut counts it displayed are asserted in the vitest project instead.

Rationale: the page's regression value was always conditional on someone looking at it. Assertions belong where they fail the build. What remains — seeing thirty palettes side by side — is a legitimate demo, so the visuals stay and the checking moves.

### 7) Hash routing, no router dependency

`#/color/scales` selects section and demo. Unknown routes fall back to the first section.

Rationale: deep links make demos citable from the docs and from a post. A hash router for a flat two-level structure is a few lines; a routing library is not warranted.

### 8) Lookup tables generated through a degenerate range

For the scale editor, `shades()` is compiled at N contrast targets using a `range` whose endpoints are equal. Every shade then solves to the same contrast while keeping its own position-dependent chroma taper, producing an exact `(position, target) -> color` table the editor reads.

Rationale: a shade's color depends only on its position and its contrast target, so the table is complete in structure; sampling makes it approximate only in resolution. Across every subject and all four shipped presets, 78% of shades match the generator bit for bit, 99% are within one step per channel and none is more than two — far below a perceptible difference, and asserted in `scales.spec.ts` so it cannot drift unnoticed. This is what makes live `range` and `curve` manipulation possible without a second implementation of the generator.

Alternatives considered:

- **Port the generator to TypeScript**: enables arbitrary seeds entered at runtime, at the cost of two implementations that must be kept in agreement. Deferred until a feature actually requires it.
- **Bake only the four presets**: no editor, and the knobs stay abstract.

### 9) The sweep covers hue and saturation, not hue alone

Seeds are `hsl(h, s%, 50%)` at three saturations rather than one.

Rationale: a hue-only sweep tests a single slice of seed space, and the obvious objection to any result from it is that maximally saturated seeds are unrepresentative. Widening the grid answers that before it is raised, and the answer is not uniform: the AA result holds everywhere — no seed at any of the three saturations clears all five pairs under `legacy`, against every seed clearing them under `fitted` — while the out-of-gamut result turns out to be specific to saturated seeds, appearing at 85% and not at all at 60% or 35%. Reporting both accurately is worth more than a larger headline.

Known gap: the grid fixes lightness at 50%, so near-white and near-black seeds are not represented, and those are exactly where duplicate shades come from. The generator comparison covers that end with named seeds. Neither view should be presented as exhaustive on its own.

### 10) App chrome styled from the library's own neutrals

The shell takes its surface, text and line colors from the `gray` family and surface roles the library generates.

Rationale: dogfooding, and a constraint rather than a preference — chrome carrying its own hue would contaminate how a reader perceives the swatches under test. The gray family is both the honest demonstration and the correct neutral. Demo content applies its scoped palettes through a wrapper element rather than ancestor classes, so a demo stays self-contained when embedded elsewhere. Custom properties inherit through shadow boundaries, so `var(--ig-*)` resolves inside components without further work.

### 11) The build is served, not opened

Code splitting produces several chunks, so the output is no longer a single file that works from `file://`. `npm run preview` runs the dev server and `vite preview` serves a build.

Rationale: the previous report was a single self-contained page precisely so it could be emailed and double-clicked. An application with lazily loaded sections cannot be that, and should not pretend to be. What is lost is a convenience the report had; what is gained is that a reader never downloads a pillar they did not open.

### 12) A palette travels with the markup that uses it

`<ig-palette-scope>` sets one scope's `--ig-*` declarations on itself rather than the document carrying a stylesheet of scoped rules. It is a plain custom element with no render method, so the children written by whoever used it survive.

Rationale: a demo that depends on a stylesheet another part of the app injected only works inside that app, which defeats the portability the whole composition approach is for. Setting the properties on the element means the palette is part of the markup, and custom properties inherit through shadow boundaries, so children resolve them wherever the element is mounted.

It also removed a duplicate: the provider had been carrying both the stylesheet text and the same declarations parsed per scope. Dropping the stylesheet took the color chunk from 197 KB back to 111 KB.

### 13) Every SVG fragment uses Lit's `svg` tag

Any template inserted inside an `<svg>` is built with `svg` rather than `html`.

Rationale: Lit parses each template independently, and `html` parses in the HTML namespace. A nested `html` fragment holding `<rect>` or `<circle>` therefore produces HTML elements with those names, which render nothing and cannot take focus. The failure is quiet — the markup is present, the selectors match, and the plot is simply empty — so it is worth stating as a rule rather than rediscovering.

### 14) Straight-line curve handles sit at the identity control points

When `curve` is null the editor still shows two handles, placed at 1/3 and 2/3.

Rationale: a cubic bezier with control points at 1/3 and 2/3 reduces exactly to `t`, so the handles can be visible and grabbable while the scale is still a straight line, and the ramp does not shift when they appear. Rendering handles only once a preset had been chosen left the editor with nothing to drag on first load.

### 15) A section is one page, with its controls pinned

A section renders all of its views stacked on a single page, under a sticky bar holding the controls they share. The in-section nav scrolls rather than swaps.

Rationale: tabs implied the views were independent subjects, and the seed picker had to be repeated in each one. Once the whole section reads one selection, tabs actively hide the payoff — the reader changes a palette and cannot see the other three views respond. Stacking costs nothing at load: an `IntersectionObserver` imports each view as it nears the viewport, so the code-splitting from Decision 5 still holds, and the first paint still carries one view's chunk.

### 16) Section state lives in a controller, not in the shell

The color section owns a small store and a `ReactiveController` over it. The shell knows only that a section may declare a persistent controls element; it never reads or writes what that element controls.

Rationale: the pillars will not agree on what "the controls" are — typography has no seed, elevations have no theme — so a state shape in the shell would be a color-shaped shape imposed on everything else. A controller also makes a view independent of where it is mounted, which keeps Decision 2's promise that a view is a plain custom element. The selection is mirrored into the hash as a query string so a link carries it, using `replaceState` rather than assignment: it is a selection, not a navigation, and a `hashchange` would send the shell scrolling.

### 17) The demos' seeds are the shipped palettes, read out of the library

Every seed on the page comes from `$<theme>-<name>-palette`, read at build time rather than transcribed, and the fitted side is regenerated from exactly those seeds. The scale editor derives its subjects the same way, deduplicated by `(family, seed, surface)`.

Rationale: a comparison between generators is only honest if both start from the same input, and a reader trusts a palette they recognise more than nine seeds chosen to make a point. Reading the seeds also means the page cannot drift from the library: change a preset's seed and the demo changes with it. The earlier `color.palettes` provider, with its hand-picked adversarial seeds, is retired — the hue sweep already covers the adversarial case across 1080 seeds, and with far better standing.

### 18) Sass color keywords are normalised where they are emitted

A provider that interpolates a resolved color emits it through a helper that rewrites a legacy-rgb color as `rgba(...)`, leaving every other value alone.

Rationale: Sass serialises a color to its shortest form, so a shade that happens to equal `#ffffff` interpolates as `white` and the Node-side parser throws. Teaching the parser 148 color keywords would put a table in the browser bundle to work around a serialisation detail. The one value that must not be rewritten is a legacy `hsl()`: its saturation routinely exceeds 100%, and asking for its red channel would both fail and discard the out-of-gamut position the sweep exists to show.

### 19) The app's own controls are the library's components

The pickers, the range controls and the action buttons are `igc-button-group`, `igc-toggle-button`, `igc-slider` and `igc-button` from `igniteui-webcomponents`, themed by the palette `shell/theme.scss` puts on `:root`.

Rationale: an app that exists to show off a theming framework should be built from the components that framework themes. It is also a live check that the fitted generator produces a usable theme for real components rather than only for swatches — the shipped CSS reads `--ig-*` at runtime, so no rebuild of the component library is involved and what paints the controls is this branch's generator.

What the token audit found, per component's compiled CSS:

| component | palette families it reads | usable under a fitted palette |
| --- | --- | --- |
| `igc-button` | none — typography and sizing only | anywhere |
| `igc-button-group` | `gray`, `primary` | yes |
| `igc-slider` | `gray`, `primary`, `secondary`, `surface` | needs numbered surface tokens |
| `igc-color-picker` | `gray`, `primary`, `error`, `surface` | needs numbered surface tokens |

Two consequences. The controls sit outside every `<ig-palette-scope>`, so they take the document theme and a demo scope cannot repaint them — the same reason `chrome()` resolves to concrete colors. And `--ig-surface-500`, which the shipped components reference 488 times, no longer exists under the fitted generator, which is Decision 20.

Trade-offs: the package's `exports` map publishes only `.`, `./themes/*.css` and `./extras`, so there is no subpath to import four components from and the whole library comes with them — about 59 KB gzipped, loaded with the section's controls. And the components are compiled against the theming version pinned at their publish time, so their *structure* is a release behind this branch even though their *colors* are current.

### 20) Numbered surface tokens are aliased onto the named roles

`theme.scss` emits `--ig-surface-50` through `--ig-surface-900`, all resolving to `surface.base`.

Rationale: the fitted generator replaced the numbered surface ramp with five named roles, and `igc-slider` — like every shipped component — still asks for `--ig-surface-500`. Aliasing every numbered token to `base` is the model rather than a fudge: under the fitted generator the page is one color, and depth is carried by the roles and the elevation shadow, which is what the Neutrals view says in prose. The library has the same decision to make for real consumers, and this is the concrete proposal.

### 21) The segmented control is themed to the chrome neutrals

`igc-button-group` is given the chrome's own colors through its public `--ig-button-group-item-*` tokens.

Rationale: at its defaults the group paints itself in `primary`, and a blue control pinned above the swatches under test changes how those swatches read — the objection Decision 10 already makes about chrome carrying a hue of its own. Overriding published tokens is still using the component as a consumer would, so the dogfooding claim survives. The one action button keeps its `primary` tint, because it is the only control on the page that does something rather than selecting something.

### 22) The hue slider stays bespoke

Sweep's hue control remains a native `input[type=range]`.

Rationale: its track is the hue wheel. `igc-slider` publishes only flat `--ig-slider-*-color` tokens with no hook for a gradient, so adopting it would mean overriding shadow parts to draw the one thing that makes the control legible — more coupling than the bespoke input costs. Everything else about it, including keyboard operation, already works.

### 23) The component family is `indigo`, chosen independently of the palette

`configureTheme('indigo', variant)` in `elements/ignite.ts`, with `shell/theme.scss` taking `indigo` for its typography and elevation presets.

Rationale: family and palette are separate axes and the app is better for showing that. The family decides the components' structure — their density, shapes and the type and elevation scales they assume — while the colors still come from this branch's generator, so switching it changes how the controls are built without touching what the views are about. Both sides name the same family so a component never assumes a type scale the document does not emit.

The variant is taken from `prefers-color-scheme`, not from the section's theme picker. They mean different things: the picker chooses which shipped palette the views render, while the variant is the scheme the reader's own chrome is drawn in. Conflating them would repaint the page every time someone compared a light palette against a dark one.

Two visible consequences, both left alone on purpose: the controls are denser than under `material` (28px against 38px), and they stopped being uppercased, because uppercasing was Material's button convention rather than anything this app asked for. Overriding either would be reintroducing a bespoke control through the back door.

### 24) The curve chart's canvas follows the handle bound, not the plot

The viewBox is derived from how far a control point may be pulled — `PY(1 + OVER) - PAD` to `PY(-OVER) + PAD` — rather than from the plotted range.

Rationale: overshoot is the interesting part of a curve, since it is what bunches one end, so the bound is deliberately generous at ±0.4 beyond the range. But the canvas used to stop at the plot, which meant a handle pulled past it was drawn outside the viewBox: still live, still holding its value, and with nothing on screen left to grab it by. Deriving one from the other makes that unrepresentable rather than merely fixed. The cost is vertical headroom that sits empty while the curve is tame, and a dashed line closes the range so that space reads as overshoot rather than padding.

The handles also carry a transparent target wider than their mark and are painted after the shade dots. Ten dots sit on the same curve, and a handle that had drifted under one was both invisible and unhittable.

### 25) The shades are a contrast probe, not a scoreboard

Clicking a shade pins its *number*. Every numbered strip on the page then measures its own shades against its own shade of that number, reporting the ratio and the best WCAG grade it earns. The score tiles, the per-row readout and the failing-pair dots that preceded this are all gone.

Rationale: each of those answered a question the library has rather than one a reader has. "Do any two shades 500 apart miss AA" is the generator's internal promise; a developer asks "can I put 600 on 100", about an arbitrary pair. The dots were also, by construction, only ever going to appear on `legacy` — permanently empty on the row people would actually build from, which made them evidence dressed as a tool.

Pinning the number rather than the swatch is what makes it an argument. Pin `100` and the two rows answer at once: `legacy` says 2.3:1 and fails, `fitted` says 4.5:1 and clears. That is the guarantee, performed by the reader in two clicks instead of asserted by a badge. Accent rows are untouched, since their keys are their own.

The pin is section state, not per-view, because it is one key space: a reader who pins 100 has asked the same question of every strip that has a 100. It stays out of the hash — a palette is a selection worth linking to, an inspection is not.

Mechanics worth recording. The swatches are native `<button>`s in a `role="radiogroup"`, not `igc-button-group`: the component paints its own background, which fights a swatch whose whole job is to be the color, its per-item borders and end radii break the seamless ten-swatch run, and Shades would carry a hundred and twenty instances. Native buttons give focus, activation and a focus ring for nothing, and roving tabindex gives one tab stop per strip instead of ten — arrows move and pin, Escape clears. Below 3:1 a swatch is marked at its bottom edge rather than in its label, because the label has to stay in the swatch's own contrast color to be readable at all. The `=` mark for a duplicate stays; that failure is invisible by nature.

One `igc-tooltip` serves the whole app, moved to whichever swatch has the pointer or focus. It takes a transient anchor, so a shared instance does what a hundred and twenty would.

## Risks / Trade-offs

- **Lit is the package's first runtime dependency.** Contained: the package is private and unpublished.
- **`igniteui-webcomponents` is a dependency of the app that demonstrates its theming.** A version of the component library compiled against an older theming release now styles part of this one. Accepted: the colors are still this branch's, since the shipped CSS reads tokens at runtime, and the package is private. The risk to watch is a future component that stops reading `--ig-*` and bakes a color instead, which would silently opt out of the demonstration.
- **The cache is correctness-sensitive.** A stale table would misrepresent the library. Mitigated by hashing provider source alongside inputs, and by the preset-reproduction assertion in Decision 8, which fails if the table drifts from what Sass produces.
- **The AA guarantee is conditional on the range being reachable.** A neutral on a dark page tops out near 17:1, so the default `even` scale — which reaches for 18.232:1 — compresses at the dark end and drops one pair below AA. This is not a generator failure: it is a range asking for contrast that does not exist, and `ceiling` is what surfaces it. The scales demo has to show it rather than let the reader assume the guarantee is unconditional.
- **Nothing enforces visual consistency between pillars.** Shared elements make the consistent thing the easy thing, but a demo can ignore them. Accepted deliberately: see the trade-off under Decision 2.
- **Shared elements can accrete pillar-specific options.** If `<ig-verdict>` grows a typography mode, that is a signal it was the wrong shared piece, not a reason to add the flag.
