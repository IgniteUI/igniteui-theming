## 1. Interface and accessor

- [x] 1.1 Add `childOf?: string` to the `ComponentMetadata` interface in `component-metadata.ts`
- [x] 1.2 Add `getThemingSelector(componentName, platform)` accessor function that returns parent selectors when `childOf` is set, own selectors otherwise
- [x] 1.3 Export `getThemingSelector` from `knowledge/index.ts`

## 2. Child component entries

- [x] 2.1 Add `list-item` and `list-header` entries to `COMPONENT_METADATA` with selectors, `theme: "list"`, and `childOf: "list"`
- [x] 2.2 Add `drop-down-item` entry with selectors, `theme: "drop-down"`, and `childOf: "drop-down"`
- [x] 2.3 Add `nav-drawer-item` entry with selectors, `theme: "navdrawer"`, and `childOf: "navdrawer"`
- [x] 2.4 Add `tab-item` entry with selectors, `theme: "tabs"`, and `childOf: "tabs"`
- [x] 2.5 Add `step` entry with selectors, `theme: "stepper"`, and `childOf: "stepper"`
- [x] 2.6 Add `card-header`, `card-content`, and `card-actions` entries with selectors, `theme: "card"`, and `childOf: "card"`
- [x] 2.7 Add `expansion-panel-header` and `expansion-panel-body` entries with selectors, `theme: "expansion-panel"`, and `childOf: "expansion-panel"`

## 3. Handler: get_component_design_tokens

- [x] 3.1 In `handleGetComponentDesignTokens`, after resolving the theme, detect `childOf` on the metadata entry and prepend a relationship note (e.g., "`list-item` is a child of the `list` component. Its styling is controlled through the `list` theme.")

## 4. Selector resolution in generators

- [x] 4.1 In `handleCreateComponentTheme` (`component-theme.ts`), switch from `getComponentSelector` to `getThemingSelector` for determining the default scoping selector
- [x] 4.2 In `generateComponentTheme` (`generators/sass.ts`), switch from `getComponentSelector` to `getThemingSelector` for the fallback selector resolution
- [x] 4.3 In `generateComponentThemeCss` (`generators/css.ts`), switch from `getComponentSelector` to `getThemingSelector` for the default selector resolution

## 5. Tests

- [x] 5.1 Add unit tests for `getThemingSelector`: child resolves to parent, non-child resolves to own, same-element alias resolves to own, unknown returns empty
- [x] 5.2 Add unit tests for child component metadata entries: verify `childOf`, `theme`, and `selectors` are correct for all 11 entries
- [x] 5.3 Add handler test for `get_component_design_tokens("list-item")`: verify the response includes the relationship note and the list theme's tokens
- [x] 5.4 Add handler test for `create_component_theme("list-item", ...)`: verify Sass output scopes to the parent selector (`igx-list` / `igc-list`)
- [x] 5.5 Add handler test for `create_component_theme("list-item", ..., output: "css")`: verify CSS output scopes to the parent selector
- [x] 5.6 Verify existing tests pass: `textarea` alias, compound components, direct components all unchanged

## 6. Verify end-to-end

- [x] 6.1 Run the full test suite (`vitest`) and confirm all tests pass
- [x] 6.2 Build the project and confirm no type errors
