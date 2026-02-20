## Context

The MCP knowledge layer stores component metadata across two files and four data structures:

| Structure             | File                     | Purpose                                                                    |
| --------------------- | ------------------------ | -------------------------------------------------------------------------- |
| `COMPONENT_SELECTORS` | `component-selectors.ts` | Maps ~65 components → platform-specific CSS selectors                      |
| `COMPOUND_COMPONENTS` | `component-selectors.ts` | Maps ~12 compounds → `{ description, relatedThemes[] }`                    |
| `COMPONENT_VARIANTS`  | `component-selectors.ts` | Maps base components → variant names                                       |
| `COMPOUND_THEMING`    | `compound-theming.ts`    | Maps ~11 compounds → `{ scopes, childScopes, tokenDerivations, guidance }` |

The handler (`component-tokens.ts`) calls `getCompoundComponentInfo()` and `getCompoundThemingInfo()` separately and stitches results together. The `COMPOUND_THEMING` map reconstructs inline selectors from `COMPONENT_SELECTORS` via `getPlatformSelector()`, creating a hidden coupling where the same data is derived in two places.

Constraints:

- Handler output must remain byte-for-byte identical (pure refactor)
- All 673 existing tests must pass
- TypeScript must compile cleanly

## Goals / Non-Goals

**Goals:**

- Single source of truth: one map, one file, one lookup per component
- Inline scope derivation from base selectors (never declared explicitly)
- Eliminate the `getPlatformSelector()` indirection in compound theming data
- Remove dead code (`getCompoundSelector()` is unused in production)
- Clean up stray test data (`shit` scope in date-picker)

**Non-Goals:**

- Changing handler output format or behavior
- Adding new components or compound relationships
- Modifying the Sass compilation pipeline
- Changing the MCP tool API surface

## Decisions

### 1. Single unified map with nested `compound` field

**Decision:** Merge all four structures into `COMPONENT_METADATA: Record<string, ComponentMetadata>` where compound-specific data lives in an optional `.compound` field.

**Alternatives considered:**

- _Keep two maps but co-locate in one file_ — reduces file scatter but preserves the stitching problem in the handler and the duplication of selector data.
- _Flat structure with all compound fields at top level_ — pollutes simple components with `null` compound fields; the nested `.compound` pattern makes the compound/simple distinction explicit.

**Rationale:** The nested approach gives every component exactly one record. Simple components are clean (`selectors` only). Compound components carry their full context in `.compound`. The handler does one lookup.

### 2. Inline scope derived at runtime, never declared

**Decision:** The inline scope (the component's own selector used for scoping child themes) is always constructed from `metadata.selectors[platform]` by the handler. It never appears in `additionalScopes`.

**Alternatives considered:**

- _Explicit inline scope in data_ — this is the current approach via `getPlatformSelector()` and is exactly what causes the duplication bug risk.

**Rationale:** Derivation from the single source of truth (`.selectors`) is inherently correct. The handler already knows the platform, so constructing the inline scope is trivial.

### 3. `additionalScopes` for non-inline scopes only

**Decision:** Compound entries declare `additionalScopes?: Record<string, ScopeSelectors>` only for scopes that differ from the component's base selector (e.g., `overlay` for date-picker on Angular uses `.igx-date-picker` instead of `igx-date-picker`). Most compounds won't have this field.

**Rationale:** Keeps the data minimal. The `childScopes` map can reference `'inline'` (use base selector) or a key from `additionalScopes`.

### 4. Variants embedded on component records

**Decision:** Replace the separate `COMPONENT_VARIANTS` map with a `variants?: string[]` field on `ComponentMetadata`. Derive the `VARIANT_THEME_NAMES` set at module initialization.

**Alternatives considered:**

- _Keep `COMPONENT_VARIANTS` as a separate export_ — maintains the status quo fragmentation; a new variant would require updating two places.

**Rationale:** Variants are an intrinsic property of a component, not a separate concern. Embedding them ensures a single edit point.

### 5. Drop `getCompoundSelector()` and `getCompoundThemingInfo()`

**Decision:** Remove both accessor functions entirely.

- `getCompoundSelector()` is unused in any handler or production code path
- `getCompoundThemingInfo()` becomes unnecessary since all data lives in `getCompoundComponentInfo().compound`

**Rationale:** Dead code removal. The handler builds scope resolution inline; it never calls `getCompoundSelector()`.

### 6. File naming: `component-metadata.ts`

**Decision:** Rename `component-selectors.ts` → `component-metadata.ts`.

**Rationale:** The file now contains selectors, variants, and compound theming data — "selectors" no longer describes its scope.

## Risks / Trade-offs

**[Risk] Inline scope derivation produces different selectors than the current explicit approach** → Mitigated by snapshot-style tests comparing handler output before and after the refactor for representative components (date-picker, combo, grid, avatar, button).

**[Risk] Import path changes break downstream consumers** → The barrel export (`knowledge/index.ts`) preserves all public accessor function signatures. Only `COMPONENT_SELECTORS` → `COMPONENT_METADATA` rename affects direct map consumers (`layout.ts`). Internal-only impact.

**[Risk] Merge conflicts with concurrent changes to compound-theming.ts** → Low probability; this is a focused refactor on stable knowledge files. If conflicts arise, the unified structure is strictly simpler to resolve.

**[Trade-off] Larger single file vs. separation of concerns** → `component-metadata.ts` will be ~600-700 lines (combined from ~400 + ~300). Acceptable because all data describes the same entities (components) and the file is pure data with accessor functions — no complex logic.
