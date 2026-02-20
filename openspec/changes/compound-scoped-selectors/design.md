## Context

The MCP theming server helps AI models generate Sass themes for Ignite UI compound components (date-picker, combo, grid, etc.). Each compound is composed of multiple child components that need individual themes scoped under the compound's CSS selector.

The previous change (`simplify-compound-theming`) replaced inner CSS selectors with token derivation hints and a single compound selector. However, some compound components need **different selectors for different children**. For example, date-picker's calendar and flat-button render inside an overlay outlet (scoped to `.igx-date-picker`), while the input-group renders inline (scoped to `igx-date-picker`). The current system provides only one selector per compound, leaving the model to guess which children need which scope — and weaker models get it wrong.

Current state:

- `compound-theming.ts` has `CompoundThemingInfo` with optional `selectorOverrides` (a flat angular/webcomponents override map)
- `getCompoundSelector(componentName, platform)` resolves one selector per compound
- `component-tokens.ts` handler shows one "Compound selector" line for all children
- `component-theme.ts` handler resolves the selector via `getComponentSelector()` but has no compound-child awareness

## Goals / Non-Goals

**Goals:**

- Replace `selectorOverrides` with a `scopes` + `childScopes` system that maps each child theme to a named scope
- Make selector resolution per-child fully deterministic so even weak tool-calling models produce correct output
- Scaffold `scopes` and `childScopes` for all 10 compound components
- Encode the date-picker and date-range-picker inline/overlay split explicitly
- Update handler output to show scope name + resolved selector per child

**Non-Goals:**

- Changing how `create_component_theme` resolves selectors (models pass selectors explicitly; the handler doesn't auto-resolve compound child scopes)
- Adding scopes for web components platform (Angular only for now, WC can be added later)
- Populating overlay scopes for grid (all grid children are inline initially)
- Changing token derivation logic (derivations stay as-is)

## Decisions

### Decision 1: Data shape — `scopes` and `childScopes` on `CompoundThemingInfo`

**Choice:** Add two new properties to `CompoundThemingInfo`:

```typescript
interface CompoundThemingInfo {
  // ... existing tokenDerivations, guidance ...

  /** Named selector scopes. Values can be string or string[] for multi-selector scopes. */
  scopes?: Record<string, string | string[]>;

  /** Maps child theme name → scope name. Children not listed fall back to 'inline'. */
  childScopes?: Record<string, string>;
}
```

**Alternatives considered:**

- Per-child selector overrides (`childSelectorOverrides: Record<string, string>`) — rejected because it duplicates selectors when multiple children share the same scope and loses the semantic "inline vs overlay" label.
- Extending `selectorOverrides` with per-child keys — rejected because it mixes two concerns (platform overrides and child scoping) in one flat map.

**Resolution rule (deterministic):**

1. If `childScopes[childName]` exists → use `scopes[childScopes[childName]]`
2. Else → use `scopes.inline` (the default scope)
3. If `scopes` is not defined → fall back to `COMPONENT_SELECTORS[compoundName][platform]` (backward compatible)

**Array scope resolution:** When a scope value is `string[]`, the handler joins them with `, ` for display and the first element is used as the primary selector.

### Decision 2: Remove `selectorOverrides` entirely

**Choice:** Delete the `selectorOverrides` property from `CompoundThemingInfo` and all related resolution logic.

**Rationale:** `selectorOverrides` was introduced in `simplify-compound-theming` but proved insufficient — it provided one override per platform, not per child. The `scopes` system supersedes it completely. Keeping both would create confusion.

**Removal surface:**

- `CompoundThemingInfo` interface: remove `selectorOverrides` property
- `COMPOUND_THEMING` data: remove `selectorOverrides` entries from `date-picker` and `date-range-picker`
- `getCompoundSelector()`: remove `selectorOverrides` lookup branch
- `compound-theming.test.ts`: remove `selectorOverrides` validation tests

### Decision 3: Scaffold all 10 compounds with `scopes`

**Choice:** Every compound gets at minimum:

```typescript
scopes: { inline: '<compound selector from COMPONENT_SELECTORS>' },
childScopes: {},
```

This ensures the structure is consistent and ready for future population. The `inline` scope always resolves to the compound's own selector from `COMPONENT_SELECTORS`.

**Compounds with explicit scopes populated now:**

| Compound            | Scopes                                                                                                               | Child Scope Assignments                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `date-picker`       | `inline: 'igx-date-picker'`, `overlay: '.igx-date-picker'`                                                           | `calendar → overlay`, `flat-button → overlay`, `input-group → inline`, `date-time-input → inline`                                 |
| `date-range-picker` | `inline: 'igx-date-range-picker'`, `overlay: '.igx-date-picker'`                                                     | `calendar → overlay`, `flat-button → overlay`, `date-range-start → inline`, `date-range-end → inline`, `date-time-input → inline` |
| `grid`              | `inline: ['igx-grid', 'igx-tree-grid', 'igx-hierarchical-grid', 'igx-pivot-grid', 'igx-grid-excel-style-filtering']` | all children → inline (default)                                                                                                   |

All other compounds get scaffolded with `inline` pointing to their `COMPONENT_SELECTORS` angular entry and empty `childScopes`.

### Decision 4: Update `getCompoundSelector()` signature

**Choice:** Extend the function to accept an optional `childThemeName` parameter:

```typescript
getCompoundSelector(
  componentName: string,
  platform: Platform,
  childThemeName?: string
): string | undefined
```

**Resolution logic:**

1. Look up `COMPOUND_THEMING[componentName]`
2. If `childThemeName` is provided and `childScopes[childThemeName]` exists:
   - Get scope name from `childScopes[childThemeName]`
   - Resolve via `scopes[scopeName]`
3. Else if `scopes.inline` exists:
   - Resolve via `scopes.inline`
4. Else:
   - Fall back to `COMPONENT_SELECTORS[componentName][platform]`

For array scope values, return the first element when returning a single string. The full array is used in handler output formatting.

### Decision 5: Handler output format for compound components

**Choice:** Update `component-tokens.ts` handler to show scopes and per-child selector assignments:

```
**Compound Component:** The date picker combines input and calendar components.

**Theming approach:** Use `@include tokens(child-theme(...))` for each related
theme inside the appropriate scope selector.

**Scopes:**
- inline: `igx-date-picker`
- overlay: `.igx-date-picker`

**Related themes (create a theme for each):**
1. `calendar` — scope: overlay (`.igx-date-picker`)
   - `foreground` → `adaptive-contrast` of `calendar.content-background`
2. `flat-button` — scope: overlay (`.igx-date-picker`)
   - `foreground` → `adaptive-contrast` of `calendar.content-background`
3. `input-group` — scope: inline (`igx-date-picker`)
4. `date-time-input` — scope: inline (`igx-date-picker`)

**Guidance:** The date-picker calendar popup will render in an overlay outlet...
```

This format is explicit enough for even weak models: every child has a labeled scope and a resolved selector.

### Decision 6: Update tool descriptions

**Choice:** Update the `create_component_theme` compound example in `descriptions.ts` to show scoped selectors per child rather than a single compound selector:

Current example shows all children using `"selector": "igx-combo"`. The updated example should show different selectors per child when scopes differ, and reference the scopes legend from `get_component_design_tokens`.

## Risks / Trade-offs

**[Scaffolding accuracy]** The scaffolded `inline` scope for all compounds uses only the Angular selector initially. Web Components scopes are not populated.
→ Mitigation: The handler falls back to `COMPONENT_SELECTORS` when scopes don't have platform-specific values. WC scopes can be added incrementally. The scaffolding ensures the structure exists for future population.

**[Array scope display]** Grid's `inline` scope will be a 5-element array, which could produce long output lines.
→ Mitigation: The handler can join with `|` and wrap if needed. The model only needs the first selector for code generation; the full list is informational.

**[Breaking internal API]** `getCompoundSelector()` signature changes (new optional parameter). Existing callers pass 2 args and still work.
→ Mitigation: The third parameter is optional, so all existing call sites continue to work without changes.

**[Empty childScopes]** Most compounds will have `childScopes: {}`, meaning all children fall back to `inline`. This is correct behavior but means the scaffolding doesn't add much value until populated.
→ Mitigation: The consistent structure is the value — it makes it trivial to add per-child scopes later without changing the interface or handler logic.
