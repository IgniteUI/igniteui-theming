## Why

Ignite UI for Angular previously rendered floating elements (drop-downs, date pickers, time pickers) in an overlay container outside the host component's DOM tree. This forced compound component metadata to declare `additionalScopes` and `childScopes` so the MCP server could tell LLMs to scope child themes under overlay-specific selectors. The latest Angular version uses the popover API instead, keeping all content in the host DOM. The extra scope machinery is now dead complexity — confusing for both humans writing themes manually and for LLMs generating them.

## What Changes

- **BREAKING** Remove the `additionalScopes` field from `CompoundInfo` interface and all 6 component entries that use it (combo, simple-combo, date-picker, date-range-picker, select, time-picker)
- **BREAKING** Remove the `childScopes` field from `CompoundInfo` interface and the same 6 component entries
- Remove the `ScopeSelectors` interface (only used by `additionalScopes`)
- Simplify `get_component_design_tokens` output for compound components: replace per-platform scope tables and per-platform related-themes tables with a flat list of related themes and one parent-selector-per-platform line
- Remove the `getScopeSelectorForPlatform()` and `resolveChildScopeName()` helper functions
- Update tests to validate the simplified output format and the new invariant that all child themes scope under the parent selector

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `component-metadata-unification`: Remove `additionalScopes`, `childScopes`, and `ScopeSelectors` from the compound component data model. Remove the "Additional scopes for non-inline contexts" requirement entirely — all children are now inline.
- `component-theming`: Simplify compound component output format — remove per-platform scope tables, remove Scope column from related themes, collapse platform sections into a single related-themes list with parent selectors.

## Impact

- **Source files (4):** `component-metadata.ts`, `component-tokens.ts`, `knowledge/index.ts`, and the `component-theming` spec
- **Test files (2):** `component-metadata.test.ts`, `component-tokens.test.ts`
- **Living specs (2):** `openspec/specs/component-metadata-unification/spec.md`, `openspec/specs/component-theming/spec.md`
- **No generator changes:** `component-theme.ts`, `sass.ts`, `css.ts` have no compound scope awareness and are unaffected
- **MCP tool descriptions:** The `create_component_theme` and `get_component_design_tokens` tool descriptions reference the scope concept and compound examples — these will need review
- **Rollback plan:** Revert the commit. The `additionalScopes`/`childScopes` data and the two helper functions can be restored from git history. No migrations or data transformations involved.
