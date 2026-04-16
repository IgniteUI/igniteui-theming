## Context

Compound components (combo, date-picker, select, etc.) contain child components that need independent theming. The current metadata model uses two fields to handle scoping:

- `additionalScopes` — maps scope names (e.g., `"overlay"`) to per-platform CSS selectors for DOM contexts outside the host element
- `childScopes` — maps each child theme name to a scope name (`"inline"` or a key from `additionalScopes`)

This existed because Angular rendered overlay content (drop-downs, date pickers) in a body-level overlay container, outside the host component's DOM. The popover API migration in Ignite UI for Angular eliminated this — all children now render inside the host component's DOM tree. The scoping distinction is dead.

The current output format repeats platform sections 4 times (Angular, Web Components, React, Blazor) with scope tables and related-themes tables. Most rows are identical across platforms since WC/React/Blazor share selectors, and the "Scope" column adds no value when every child resolves to the parent selector.

## Goals / Non-Goals

**Goals:**

- Remove `additionalScopes`, `childScopes`, and `ScopeSelectors` from the data model
- Simplify `get_component_design_tokens` compound output to reduce token count and improve LLM comprehension
- Preserve all information the LLM needs: child theme list, parent selector per platform, token derivations, guidance
- Keep the change strictly within the metadata and formatting layers — do not touch generators
- Update the raletad MCP tool descriptions to reflect the new format where needed

**Non-Goals:**

- Changing how `create_component_theme` works (it has no compound awareness, remains unchanged)
- Modifying token derivation logic or guidance content
- Restructuring the `CompoundInfo` type beyond removing the two scope fields

## Decisions

### Decision 1: Collapse compound output to a single platform-aware block

**Choice:** Replace 4 per-platform sections (each with scope table + related-themes table) with one block:

```
**Related themes:** `calendar`, `flat-button`, `input-group`
Scope all related themes under the parent component selector:
- **Angular:** `igx-date-picker`
- **Web Components / React / Blazor:** `igc-date-picker`
```

**Rationale:** Every child now scopes under the parent selector. Repeating this per-platform in a 3-column table (Theme | Scope | Selector) is noise — every row has the same Scope and Selector value. The flat format states the rule once and lists platform selectors. This cuts token count substantially for complex compounds like grid (12+ related themes × 4 platforms = 48+ rows → 1 list + 2 lines).

**Alternative considered:** Keep per-platform tables but remove the Scope column. Rejected because even without Scope, the tables duplicate the same selector in every row.

### Decision 2: Omit platform lines where the component is unavailable

**Choice:** Only show selector lines for platforms where the component has a non-null selector entry.

Example for `time-picker` (Angular-only):

```
Scope all related themes under the parent component selector:
- **Angular:** `igx-time-picker`
```

**Rationale:** Showing "Web Components: N/A" adds no actionable information. The existing behavior already filters N/A scope rows — we extend that to the simplified format.

### Decision 3: Group WC/React/Blazor into one line

**Choice:** Show a single line for "Web Components / React / Blazor" since they all share `igc-` selectors.

**Rationale:** This mirrors the existing `PLATFORM_GROUPS` pattern where React and Blazor map to `webcomponents` for selector resolution. Rather than 3 lines with identical selectors, one combined line is clearer. The `PLATFORM_GROUPS` constant itself can be removed — the new code just needs to check which platforms have non-null selectors and group WC-based ones.

### Decision 4: Remove helpers, inline the simplified logic

**Choice:** Delete `getScopeSelectorForPlatform()`, `resolveChildScopeName()`, and the `PLATFORM_GROUPS` constant. Replace with a small inline block in the compound section that:

1. Reads `compoundInfo.relatedThemes` as a flat list
2. Calls `getComponentSelector()` for Angular and Web Components to get the parent selectors
3. Formats the output

**Rationale:** These functions existed to resolve the scope indirection (child → scope name → scope selector). Without that indirection, they're over-abstraction. The replacement is ~15 lines of straightforward logic.

### Decision 5: Keep Steps section removal

**Choice:** Remove the numbered "Steps" block from compound output.

**Rationale:** The steps ("1. Choose your platform...", "2. For each related theme...") were procedural scaffolding. The `create_component_theme` tool description already explains the workflow. The compound output should provide data (which themes, which selectors, which derivations), not repeat process instructions.

## Risks / Trade-offs

**[Spec output format change] → May affect LLM behavior for compound theming**
The output format change is intentionally simpler, but LLMs that learned patterns from the old per-platform tables might initially produce slightly different code structure. Mitigation: the `create_component_theme` tool description and its `selector` parameter documentation remain unchanged, so the LLM still knows how to pass selectors. The new format makes the correct selector more obvious, not less.

**[Breaking metadata interface] → External consumers of CompoundInfo type**
If any code outside this repo imports `CompoundInfo` and reads `additionalScopes`/`childScopes`, it will break. Mitigation: the `igniteui-theming` package's public API does not expose `CompoundInfo` — it's internal to the MCP server. The only consumer is `component-tokens.ts`.

**[Reduced output detail] → Loss of per-child scope specificity**
Before: each child had an explicit scope assignment. After: all children implicitly scope under the parent. If a future Angular version re-introduces overlay rendering for some component, we'd need to re-add scope machinery. Mitigation: this is unlikely given the direction toward popover API. If needed, the old code is in git history and the architecture supports re-adding the fields.
