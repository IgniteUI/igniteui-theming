## Context

The MCP component theming flow has three relationship types between component names and themes:

1. **Direct** — component name matches a theme function (e.g., `avatar` → `avatar-theme()`)
2. **Same-element alias** — component shares another's theme but has its own selector (e.g., `textarea` → `input-group-theme()`, scoped to `.igx-input-group--textarea-group`)
3. **Compound** — parent component contains independently-themeable child components with their own theme functions (e.g., `combo` contains `input-group`, `drop-down`, `checkbox`)

A fourth relationship exists in the UI but has no representation in the metadata: **child sub-components** whose styling is controlled by prefixed tokens on the parent's theme function (e.g., `list-item` → `list-theme()`'s `item-*` tokens). These children have their own DOM elements and selectors but no separate theme function.

Currently, selector resolution for theming scope happens in three places independently:

- `handleCreateComponentTheme` (handler, line ~188-198)
- `generateComponentTheme` (Sass generator, line ~432-439)
- `generateComponentThemeCss` (CSS generator, line ~261-267)

All three call `getComponentSelector(componentName, platform)` using the component name passed to them. For child components, this must resolve to the **parent's** selector instead.

## Goals / Non-Goals

**Goals:**

- Users can request theming for child sub-components by name and get correct results in a single tool call
- Generated code scopes tokens to the parent component's selector (where theme tokens are consumed)
- The `get_component_design_tokens` response clearly communicates the parent-child relationship
- Zero impact on existing alias, variant, and compound component flows

**Non-Goals:**

- Filtering tokens to only show child-relevant ones (e.g., showing only `item-*` tokens for `list-item`) — token descriptions are sufficient for LLM guidance
- Automatic derivation of child-to-parent mappings from token naming conventions — deferred until the token naming overhaul lands
- Supporting deeply nested child relationships (child-of-child) — no known use case

## Decisions

### Decision 1: Add `childOf` field to `ComponentMetadata`

Add an optional `childOf?: string` field to the `ComponentMetadata` interface. When present, it names the parent component whose selectors should be used for theming scope.

```typescript
export interface ComponentMetadata {
  selectors: ComponentSelectors;
  theme?: string;
  childOf?: string; // NEW — parent component for selector resolution
  variants?: string[];
  compound?: CompoundInfo;
}
```

A child component entry uses both `theme` and `childOf` together:

- `theme` → resolves which theme function to use (existing mechanism via `resolveComponentTheme`)
- `childOf` → resolves which selector to scope the generated code to (new mechanism)

**Why not reuse `theme` for selector resolution?** Because `theme` already has a defined meaning (same-element alias) where the component's own selector is correct. The `textarea` → `input-group` alias must continue using `textarea`'s selector. `childOf` is a distinct relationship that requires the parent's selector.

**Why not a generic `selectorSource` field?** `childOf` communicates semantic intent (this is a child sub-component), not just a mechanical override. The handlers use this to generate appropriate messaging ("list-item is a child of list").

**Alternatives considered:**

- Omitting `childOf` and relying on improved fuzzy search: rejected because it doesn't solve the scoping problem and still requires an extra round-trip
- Using `selectors: { angular: null, webcomponents: null }` with `theme` only: rejected because `null` selectors signal "not available on platform" which is incorrect — the child exists on the platform, it just inherits theming scope from its parent

### Decision 2: Centralize theming selector resolution

Add a new accessor function `getThemingSelector` to `component-metadata.ts` that encapsulates the `childOf` lookup:

```typescript
export function getThemingSelector(componentName: string, platform: Platform): string[] {
  const metadata = COMPONENT_METADATA[componentName];
  if (!metadata) return [];

  // Child components use parent's selector for theming scope
  if (metadata.childOf) {
    return getComponentSelector(metadata.childOf, platform);
  }

  return getComponentSelector(componentName, platform);
}
```

All three selector resolution sites (handler, Sass generator, CSS generator) switch from `getComponentSelector` to `getThemingSelector` for determining the scope of generated theme code. `getComponentSelector` itself remains unchanged — it returns the component's own selectors, which is still needed for other purposes (e.g., platform availability checks, compound component scope tables).

**Why centralize?** The same `childOf` check would otherwise be duplicated in three places. A single function ensures consistent behavior and is easier to test.

### Decision 3: Handler messaging for child components

When `handleGetComponentDesignTokens` resolves a child component (detected by `childOf` being present on the resolved metadata), it prepends a relationship note before the standard token output:

```
**Note:** `list-item` is a child of the `list` component.
Its styling is controlled through the `list` theme — all tokens below apply at the list level.
```

This uses the `childOf` value to auto-generate the message. No per-entry `guidance` field is needed for the relationship note. The existing token descriptions guide the LLM to the relevant tokens.

The `handleCreateComponentTheme` handler needs no special messaging — it generates correct code silently by using `getThemingSelector`.

### Decision 4: Initial child component entries

The following 11 entries cover the most common child sub-components users would reference. Selection criteria: the child has a well-known selector name, meaningful tokens exist in the parent theme, and the entry fixes a real discoverability or scoping gap.

| Entry                    | `theme`             | `childOf`           | Rationale                                      |
| ------------------------ | ------------------- | ------------------- | ---------------------------------------------- |
| `list-item`              | `"list"`            | `"list"`            | 25 item-\* tokens, very common                 |
| `list-header`            | `"list"`            | `"list"`            | 2 header-\* tokens                             |
| `drop-down-item`         | `"drop-down"`       | `"drop-down"`       | 18 item-\* tokens                              |
| `nav-drawer-item`        | `"navdrawer"`       | `"navdrawer"`       | Fixes naming mismatch (nav-drawer ≠ navdrawer) |
| `tab-item`               | `"tabs"`            | `"tabs"`            | 17 item-\* tokens                              |
| `step`                   | `"stepper"`         | `"stepper"`         | 53 step/indicator/title tokens                 |
| `card-header`            | `"card"`            | `"card"`            | header-text-color, subtitle-text-color         |
| `card-content`           | `"card"`            | `"card"`            | content-text-color                             |
| `card-actions`           | `"card"`            | `"card"`            | actions-text-color                             |
| `expansion-panel-header` | `"expansion-panel"` | `"expansion-panel"` | 7 header-_/disabled-_ tokens                   |
| `expansion-panel-body`   | `"expansion-panel"` | `"expansion-panel"` | 2 body-\* tokens                               |

Each entry includes real selectors for both platforms (or `null` where the child doesn't exist on a platform).

**Why these 11 specifically?**

- Tier 1 (list-item, list-header, drop-down-item, nav-drawer-item, tab-item): high-frequency components with rich token surfaces
- Tier 2 (step, card-_, expansion-panel-_): common sub-parts with meaningful token coverage
- Excluded: `combo-item` / `select-item` (no own tokens, styled via drop-down theme — already handled as compound), `card-media` / `banner-actions` (zero tokens in parent theme), calendar sub-views (users ask about "calendar" not "days-view")

### Decision 5: Validation constraint for `childOf`

The `childOf` value must reference an existing key in `COMPONENT_METADATA`. This is validated the same way `theme` alias targets are validated — at resolution time in the accessor function. No build-time validation is added.

Additionally, `childOf` and `compound` are mutually exclusive on the same entry — a child sub-component cannot itself be a compound component.

## Risks / Trade-offs

**[Manual maintenance of child entries] → Mitigated by small, stable set**
The 11 entries are manually curated. If new child components are added to the UI libraries, corresponding metadata entries must be added here. The set is small and changes infrequently. When the token naming convention overhaul lands, automatic derivation can replace manual entries.

**[`childOf` + `theme` always point to the same target] → Accepted redundancy**
For all initial entries, `childOf` and `theme` have the same value (e.g., both `"list"`). This is because the parent component name matches the theme name. In theory they could diverge (if a parent used a theme alias itself), but currently they don't. The two fields serve different purposes (theme function vs. selector scope), so the redundancy is acceptable for clarity.

**[LLM may still set tokens that don't apply to the child] → Acceptable**
Since we show all parent tokens unfiltered, the LLM could set `header-background` when the user asked about `list-item`. The token descriptions (e.g., "The list header background color") are the primary guardrail. This is a conscious trade-off: filtering tokens by prefix is fragile with current naming and would be worse than showing all tokens with good descriptions.
