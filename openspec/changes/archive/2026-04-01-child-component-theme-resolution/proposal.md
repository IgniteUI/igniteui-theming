## Why

Child sub-components (e.g., `igx-list-item`, `igx-card-header`, `igx-step`) don't have their own theme functions — their styling is controlled through tokens on the parent theme (e.g., `list-theme()` has `item-background`, `item-text-color`, etc.). When a user asks the MCP to style a child component by name, the system either returns "not found" or requires an extra round-trip via fuzzy search. In some cases (e.g., `nav-drawer-item` → `navdrawer`), fuzzy search fails entirely due to naming mismatches.

Additionally, the existing `theme` alias mechanism (used by `textarea` → `input-group`) scopes generated code to the child's own CSS selector. For child sub-components, the generated code must scope to the **parent's** selector instead, since the parent's theme tokens are consumed at the parent element level. This requires a new relationship type distinct from the existing same-element alias.

## What Changes

- Add a `childOf` optional field to the `ComponentMetadata` interface, naming the parent component whose selector should be used for theming scope
- Add ~11 child component entries to `COMPONENT_METADATA` using both `theme` (for theme function resolution) and `childOf` (for selector resolution)
- Modify `handleGetComponentDesignTokens` to prepend a relationship note when resolving a child component (e.g., "list-item is a child of list. Its styling is controlled through the list theme.")
- Modify `handleCreateComponentTheme` and `generateComponentTheme` to resolve the scoping selector from `COMPONENT_METADATA[childOf].selectors` instead of the child's own selectors when `childOf` is present
- Modify `generateComponentThemeCss` to apply the same parent-selector resolution for CSS output

## Capabilities

### New Capabilities

- `child-component-resolution`: Defines the `childOf` metadata field, child-to-parent selector resolution behavior, handler messaging for child components, and the initial set of child component entries

### Modified Capabilities

- `component-metadata-unification`: The `ComponentMetadata` interface gains a new optional `childOf` field. Existing accessor functions are unchanged, but a new accessor may be needed for parent selector lookup.
- `component-theming`: The `get_component_design_tokens` and `create_component_theme` handlers gain child-component-aware behavior (relationship messaging and parent-scoped selectors)

## Impact

- **Code**: `component-metadata.ts` (interface + data entries), `component-tokens.ts` handler, `component-theme.ts` handler, `generators/sass.ts`, `generators/css.ts`
- **Tests**: New test cases for child resolution in both handlers and generators; existing tests unchanged (no breaking changes to current aliases)
- **APIs**: No tool schema changes — the MCP tools accept the same parameters. The behavioral change is internal to resolution logic.
- **Rollback**: Remove the `childOf` field from the interface and delete the child entries from `COMPONENT_METADATA`. All existing functionality (theme aliases, compound components) is unaffected.
