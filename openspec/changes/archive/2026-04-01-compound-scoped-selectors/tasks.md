## 1. Update CompoundThemingInfo interface and remove selectorOverrides

- [x] 1.1 Add `scopes` property (`Record<string, string | string[]>`) and `childScopes` property (`Record<string, string>`) to `CompoundThemingInfo` interface in `src/mcp/knowledge/compound-theming.ts`
- [x] 1.2 Remove `selectorOverrides` property from `CompoundThemingInfo` interface
- [x] 1.3 Remove `selectorOverrides` entries from `date-picker` and `date-range-picker` in `COMPOUND_THEMING`

## 2. Scaffold scopes for all compound components

- [x] 2.1 Add `scopes: { inline: '<angular selector>' }` and `childScopes: {}` to all 10 compound entries in `COMPOUND_THEMING` (banner, combo, file-input, select, date-picker, date-range-picker, time-picker, grid, query-builder, pivot-data-selector)
- [x] 2.2 Populate date-picker scopes: `inline: 'igx-date-picker'`, `overlay: '.igx-date-picker'` with childScopes `calendar → overlay`, `flat-button → overlay`, `input-group → inline`, `date-time-input → inline`
- [x] 2.3 Populate date-range-picker scopes: `inline: 'igx-date-range-picker'`, `overlay: '.igx-date-picker'` with childScopes `calendar → overlay`, `flat-button → overlay`, `date-range-start → inline`, `date-range-end → inline`, `date-time-input → inline`
- [x] 2.4 Populate grid scopes: `inline: ['igx-grid', 'igx-tree-grid', 'igx-hierarchical-grid', 'igx-pivot-grid', 'igx-grid-excel-style-filtering']` with empty childScopes

## 3. Update getCompoundSelector() accessor

- [x] 3.1 Add optional `childThemeName` parameter to `getCompoundSelector()` signature
- [x] 3.2 Implement scope resolution logic: childScopes lookup → scopes[scopeName] → scopes.inline → COMPONENT_SELECTORS fallback
- [x] 3.3 Handle array scope values by returning the first element as primary selector
- [x] 3.4 Remove selectorOverrides resolution logic from `getCompoundSelector()`

## 4. Add scope formatting helper for handler output

- [x] 4.1 Create a helper function to format scope values for display (join arrays with `|`, wrap in backticks)
- [x] 4.2 Create a helper function to resolve a child's scope name and formatted selector string (returns `scope: <name> (<selector>)`)

## 5. Update component-tokens handler output

- [x] 5.1 Add "Scopes" section to compound component output listing each scope name and resolved selector(s)
- [x] 5.2 Update "Related themes" section to show per-child scope assignment: `child — scope: <scope-name> (<resolved selector>)` with derivation hints underneath
- [x] 5.3 Remove the single "Compound selector" line from handler output

## 6. Update tool descriptions

- [x] 6.1 Update `get_component_design_tokens` description in `descriptions.ts` to reference per-child scoped selectors instead of a single compound selector
- [x] 6.2 Update `create_component_theme` compound example in `descriptions.ts` to show different selectors per child based on scope assignments

## 7. Update knowledge index re-exports

- [x] 7.1 Verify `src/mcp/knowledge/index.ts` re-exports are correct (no selectorOverrides-related types to remove; scopes/childScopes are part of existing CompoundThemingInfo)

## 8. Tests

- [x] 8.1 Remove `selectorOverrides` validation tests from `compound-theming.test.ts`
- [x] 8.2 Add tests for `scopes` data structure validation (all compounds have scopes.inline, values are string or string[])
- [x] 8.3 Add tests for `childScopes` validation (referenced scope names exist in scopes, child names exist in relatedThemes)
- [x] 8.4 Update `getCompoundSelector()` tests: test childScopes resolution, inline fallback, array scope handling, COMPONENT_SELECTORS fallback
- [x] 8.5 Update component-tokens handler tests to verify new output format (scopes section, per-child scope labels)
- [x] 8.6 Run full test suite and fix any failures
