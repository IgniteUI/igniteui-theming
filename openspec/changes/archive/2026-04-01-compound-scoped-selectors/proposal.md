## Why

The `simplify-compound-theming` change replaced inner selectors with token derivation hints and a single compound selector, but models still produce incorrect output for compound components whose children need different CSS scopes (e.g., date-picker's calendar and flat-button must be scoped to `.igx-date-picker` for the overlay outlet, not the `igx-date-picker` element). The current single-selector approach leaves scope assignment ambiguous, and weaker tool-calling models cannot infer the correct selector per child. This change introduces named scopes with explicit per-child bindings so that selector resolution is fully deterministic.

## What Changes

- **BREAKING**: Replace `selectorOverrides` in `CompoundThemingInfo` with a new `scopes` + `childScopes` system
  - `scopes`: a named map of selectors (e.g., `inline`, `overlay`), where each value is `string | string[]`
  - `childScopes`: a map of child theme name → scope name
- Scaffold `scopes` and `childScopes` for all 10 compound components in `COMPOUND_THEMING`
  - Most compounds get only `scopes: { inline: <selector> }` and `childScopes: {}`
  - `date-picker` and `date-range-picker` get both `inline` and `overlay` scopes with explicit child bindings
- Update `getCompoundSelector()` to accept an optional child theme name and resolve via `childScopes → scopes` lookup, falling back to the inline scope
- Remove `selectorOverrides` property and related resolution logic from `compound-theming.ts`
- Update `component-tokens` handler output to show a **Scopes** section listing scope name + resolved selector(s), and for each related theme show `child — scope: <scope-name> (<resolved selector>)` alongside derivation hints
- Update tool descriptions in `descriptions.ts` to reference scoped selectors instead of selector overrides

## Capabilities

### New Capabilities

_None — this change refines the existing compound theming data model._

### Modified Capabilities

- `component-theming`: The compound component response format changes from a single compound selector to named scopes with per-child bindings. The handler output includes a scopes legend and each related theme shows its scope name and resolved selector. The deterministic resolution rule is: if `childScopes[child]` exists → use `scopes[childScopes[child]]`; else → use `scopes.inline` (default).

## Impact

- **MCP knowledge layer** (`src/mcp/knowledge/compound-theming.ts`): `CompoundThemingInfo` interface changes (`selectorOverrides` removed, `scopes` and `childScopes` added). `getCompoundSelector()` signature changes to support per-child resolution. All 10 compound entries updated with scaffolded scopes.
- **MCP tools** (`src/mcp/tools/handlers/component-tokens.ts`): Handler output format changes for compound components (scopes section + per-child scope labels).
- **MCP tool descriptions** (`src/mcp/tools/descriptions.ts`): Compound example updated to reflect scoped selector output.
- **Tests** (`src/mcp/__tests__/`): Compound theming tests updated for new data shape and handler output format.
- **Breaking for internal consumers**: Any code calling `getCompoundSelector(name, platform)` without a child argument still works (returns inline scope). Code relying on `selectorOverrides` will break.

### Rollback Plan

Revert the commit. Restore `selectorOverrides` from git history. The `scopes`/`childScopes` fields are additive to the data structure and can be deleted. Handler output reverts to the single compound selector format.
