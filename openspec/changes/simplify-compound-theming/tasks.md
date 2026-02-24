## 1. Create compound-theming.ts knowledge file

- [x] 1.1 Create `src/mcp/knowledge/compound-theming.ts` with `TokenDerivation`, `CompoundThemingInfo` interfaces and `COMPOUND_THEMING` record
- [x] 1.2 Add accessor functions: `getCompoundThemingInfo`, `getCompoundSelector`, `getTokenDerivationsForChild`
- [x] 1.3 Populate `COMPOUND_THEMING` entries for all 10 compound components with `selectorOverrides` and `guidance` (tokenDerivations populated incrementally — start with date-picker, combo, select)
- [x] 1.4 Re-export new types and functions from `src/mcp/knowledge/index.ts`

## 2. Remove innerSelectors infrastructure from component-selectors.ts

- [x] 2.1 Remove `CompoundInnerSelectors` interface and `innerSelectors` property from `CompoundComponentInfo`
- [x] 2.2 Remove `innerSelectors` data from all 10 compound component entries in `COMPOUND_COMPONENTS`
- [x] 2.3 Remove 11 accessor functions: `getPartSelector`, `getAngularInnerSelector`, `getInnerSelector`, `hasPartSelectors`, `hasAngularInnerSelectors`, `hasInnerSelectors`, `getAllPartSelectors`, `getAllAngularInnerSelectors`, `getAllInnerSelectors`
- [x] 2.4 Remove re-exports of the 11 functions from `src/mcp/knowledge/index.ts`

## 3. Update component-tokens handler

- [x] 3.1 Remove `hasPartSelectors` and `hasAngularInnerSelectors` imports from `component-tokens.ts`
- [x] 3.2 Add imports for `getCompoundThemingInfo`, `getCompoundSelector`, `getTokenDerivationsForChild` from compound-theming
- [x] 3.3 Replace inner-selector table and checklist formatting with new derivation-aware output (compound selector, related themes with derivation hints, guidance prose)

## 4. Update Sass generator output

- [x] 4.1 Change `generateComponentTheme` in `generators/sass.ts` to emit `@include tokens($theme-variable)` instead of `@include css-vars-from-theme($theme-variable, '$prefix-$name')`
- [x] 4.2 Remove the `varName` / variable-prefix logic that was only needed for `css-vars-from-theme`

## 5. Update tool descriptions

- [x] 5.1 Update `get_component_design_tokens` description in `descriptions.ts` to reference tokens mixin, remove inner selector references, mention derivation hints
- [x] 5.2 Update `create_component_theme` description in `descriptions.ts` to show `@include tokens(...)` output, update compound example to use tokens mixin pattern with derivation hints

## 6. Update chart themes

- [x] 6.1 Replace all `@include css-vars(...)` calls with `@include tokens(...)` in `sass/themes/charts/_theme.scss`

## 7. Tests

- [x] 7.1 Remove inner selector test blocks from `component-selectors.test.ts` (`getPartSelector()`, `hasPartSelectors()`, `getAllPartSelectors()`)
- [x] 7.2 Add tests for `compound-theming.ts`: data structure validation (keys align with COMPOUND_COMPONENTS), derivation rule format, accessor functions
- [x] 7.3 Update `component-tokens` handler tests (if they exist) to verify new derivation-aware output format
- [x] 7.4 Update generator tests to verify `@include tokens(...)` output instead of `css-vars-from-theme`
- [x] 7.5 Run full test suite and fix any failures
