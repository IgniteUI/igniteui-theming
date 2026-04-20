## 1. Data model cleanup

- [x] 1.1 Remove `ScopeSelectors` interface from `component-metadata.ts`
- [x] 1.2 Remove `additionalScopes` field from `CompoundInfo` interface
- [x] 1.3 Remove `childScopes` field from `CompoundInfo` interface
- [x] 1.4 Strip `additionalScopes` and `childScopes` from all 6 component entries: combo, simple-combo, date-picker, date-range-picker, select, time-picker
- [x] 1.5 Remove `ScopeSelectors` re-export from `knowledge/index.ts`

## 2. Handler simplification

- [x] 2.1 Delete `getScopeSelectorForPlatform()` helper from `component-tokens.ts`
- [x] 2.2 Delete `resolveChildScopeName()` helper from `component-tokens.ts`
- [x] 2.3 Delete `PLATFORM_GROUPS` constant from `component-tokens.ts`
- [x] 2.4 Remove the numbered **Steps** block from compound output (lines 162-173)
- [x] 2.5 Replace per-platform scope tables and related-themes tables with simplified output: flat **Related themes** list + scoping instruction with per-platform parent selectors
- [x] 2.6 Implement platform availability filtering — omit platform lines where selectors are null
- [x] 2.7 Group WC/React/Blazor into a single "Web Components / React / Blazor" line

## 3. Test updates

- [x] 3.1 Remove `childScopes references should be valid` test from `component-metadata.test.ts`
- [x] 3.2 Remove `no inline scope should appear in additionalScopes` test from `component-metadata.test.ts`
- [x] 3.3 Remove `childScopes children should be listed in relatedThemes` test from `component-metadata.test.ts`
- [x] 3.4 Remove `additionalScopes` production invariant test from `component-metadata.test.ts`
- [x] 3.5 Add test: compound `CompoundInfo` entries SHALL NOT contain `additionalScopes` or `childScopes` fields
- [x] 3.6 Rewrite `component-tokens.test.ts` compound output tests to match new format — verify **Related themes** list, scoping instruction with parent selectors, no scope tables
- [x] 3.7 Add test: Angular-only compound (e.g., `time-picker`) omits WC platform line
- [x] 3.8 Add test: compound with both platforms shows both Angular and WC lines
- [x] 3.9 Verify simple component output (e.g., `avatar`) is unchanged — no compound sections present

## 4. Verification

- [x] 4.1 Run `npm run build` — confirm no TypeScript compilation errors
- [x] 4.2 Run `npm test` — confirm all tests pass
- [x] 4.3 Manually call `get_component_design_tokens` for `date-picker`, `combo`, `grid`, `time-picker`, and `avatar` to verify output format
