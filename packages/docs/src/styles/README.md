# Site styles

`theme.scss` is the single entry point (imported by `src/layouts/BaseLayout.astro`). The `@use` order there is
the cascade order:

| Path                     | What it is                                                                                                                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base/`                  | The generic base rules: variables (`--it-*`), typography, grid, utilities and the structural rules of each component family (navbar, menu, footer, breadcrumbs, pagination, TOC, markdown, alert, tabs, hero), all inside the `base.generic` cascade layer. |
| `_breakpoints.scss`      | The five shared viewport widths (`$bp-mobile`, `$bp-desktop`, `$bp-wide`, `$bp-footer-wide`, `$bp-xwide`). Emits no CSS, so component stylesheets `@use` it too. One-off widths that tune a single component stay inline.                                   |
| `_config.scss`           | Typography scale, palette, spacing / radius tokens and the `--it-*` variables the site overrides.                                                                                                                                                           |
| `_layout.scss`           | The page grid (landing and docs), the page shell, themed logos and the skip link.                                                                                                                                                                           |
| `_shiki.css`             | Code block colours (Rosé Pine Dawn / Moon).                                                                                                                                                                                                                 |
| `components/`            | One partial per UI area: navbar, search, colour-mode toggle, sidebar, TOC, breadcrumbs, paginator, doc main, markdown, back-to-top, footer, admonitions, buttons, samples, 404 page.                                                                        |
| `scroll-animations.scss` | The landing page scroll reveals.                                                                                                                                                                                                                            |
| `docs/*.module.scss`     | CSS modules imported by MDX content (colour swatches, tables); they live here because the content paths are shared with the ja translation workflow.                                                                                                        |

## Cascade layers

Base rules sit in two layers below every site rule, so a site rule wins regardless of specificity:

- `base.generic` — the `base/` files.
- `base.theme` — structural rules a component still relies on; each partial keeps them in a
  `@layer base.theme { … }` block at the top, above its own rules.

Un-layered rules in the `// ---- … layout rules` sections of a partial keep their specificity on purpose.

## Class names

Every class the site renders is prefixed `it-` and follows BEM (`it-block__element--modifier`). Two vocabularies
share some elements: the structural `base/` classes (`it-nav-menu__*`, `it-navbar__*`, `it-footer__*`, `it-col`,
`it-row`, `it-container`, …) and the design classes of the component partials (`it-menu__*`, `it-doc-sidebar`,
…). Scripts under `src/scripts/` toggle state modifiers such as `it-dropdown--show`, `it-navbar-sidebar--show`,
`it-nav-menu__list-item--collapsed` and `it-toc-mobile--expanded`.

## Conventions

- Colours come from the igniteui-theming palette through `light-dark()`; no raw hex outside `_shiki.css`.
- Sizes use `rem()` from igniteui-theming and the `--ig-spacing-*` / `--ig-border-radius-*` tokens.
- Component-local styles (landing page sections, component preview) live next to their component as CSS
  modules or a local `.scss`, and `@use '../../styles/breakpoints'` for the shared widths.
