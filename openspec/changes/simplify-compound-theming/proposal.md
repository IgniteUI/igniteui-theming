## Why

Compound component theming through the MCP is unreliable because the model receives only structural information (which children exist, what selectors to use) but no semantic guidance about how to set child component tokens relative to the parent's intent. The new `tokens` mixin eliminates the need for inner selectors entirely — child components consume CSS variables via `var(--ig-{component}-{token}, fallback)`, so scoping is handled by the CSS cascade. This makes `innerSelectors` obsolete while exposing a new gap: the model still doesn't know that, for example, a flat-button's foreground inside a date-picker should be `adaptive-contrast` of the calendar's content-background. This change addresses both: simplifying the selector story and adding the missing semantic layer.

## What Changes

- **BREAKING**: Remove `innerSelectors` and `CompoundInnerSelectors` from `CompoundComponentInfo` in `component-selectors.ts`, along with all associated accessor functions (`getPartSelector`, `getAngularInnerSelector`, `getInnerSelector`, `hasPartSelectors`, `hasAngularInnerSelectors`, `hasInnerSelectors`, `getAllPartSelectors`, `getAllAngularInnerSelectors`, `getAllInnerSelectors`)
- Add new `compound-theming.ts` knowledge file containing per-compound `tokenDerivations`, optional `selectorOverrides`, and `guidance` prose
- Update `component-tokens.ts` handler to merge structural data (`relatedThemes`) with semantic data (`tokenDerivations`, `guidance`) and present derivation hints to the model alongside the compound checklist
- Update `generators/sass.ts` to emit `@include tokens(...)` (global mode) instead of `@include css-vars-from-theme(...)`
- Update tool descriptions in `descriptions.ts` to reference the `tokens` mixin pattern, remove inner selector references, and update compound component examples
- Replace `@include css-vars(...)` with `@include tokens(...)` in `sass/themes/charts/_theme.scss`
- Remove inner selector tests from `component-selectors.test.ts` and add tests for compound theming data and updated handler output

## Capabilities

### New Capabilities

- `compound-theming-guidance`: Token derivation rules and prose guidance for compound components, enabling the model to deterministically set child component tokens based on the parent component's theme intent

### Modified Capabilities

- `component-theming`: Compound component responses shift from inner-selector-based checklists to derivation-hint-based guidance using the `tokens` mixin. The `create_component_theme` Sass output changes from `css-vars-from-theme` to `tokens`. Inner selector references are removed entirely.
- `css-output`: Sass output for component themes uses `@include tokens(...)` instead of `@include css-vars-from-theme(...)`. Chart themes switch from `@include css-vars(...)` to `@include tokens(...)`.

## Impact

- **MCP knowledge layer** (`src/mcp/knowledge/`): New `compound-theming.ts` file. Significant removals from `component-selectors.ts` (interfaces, data, 11 functions).
- **MCP tools** (`src/mcp/tools/`): Handler and description changes for `get_component_design_tokens` and `create_component_theme`.
- **MCP generators** (`src/mcp/generators/`): Sass code generation output format changes.
- **Sass source** (`sass/themes/`): Chart theme mixin calls updated.
- **Tests** (`src/mcp/__tests__/`): Inner selector tests removed, compound theming and updated generator tests added.
- **Breaking for MCP consumers**: Any external code relying on `getPartSelector`, `getAngularInnerSelector`, `getInnerSelector`, or `hasInnerSelectors` APIs will break. The `CompoundInnerSelectors` type is removed.
- **Model behavior change**: Models consuming the MCP will receive different compound component guidance format. The new format is richer (derivations + guidance) but structurally different from the current inner-selector table.

### Rollback Plan

Revert the commit. The `innerSelectors` data and accessor functions can be restored from git history. The `css-vars` mixin remains functional (it wraps `tokens` in scoped mode), so reverting the generator output is safe. The new `compound-theming.ts` file is additive and can simply be deleted.
