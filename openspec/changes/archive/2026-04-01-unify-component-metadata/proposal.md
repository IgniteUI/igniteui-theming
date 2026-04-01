## Why

Component metadata for compound components is scattered across two files (`component-selectors.ts` and `compound-theming.ts`) with three parallel data structures (`COMPONENT_SELECTORS`, `COMPOUND_COMPONENTS`, `COMPOUND_THEMING`) plus a separate `COMPONENT_VARIANTS` map. This duplication creates a real risk of silent bugs — the inline scope in `COMPOUND_THEMING` is reconstructed from `COMPONENT_SELECTORS` via `getPlatformSelector()`, so a typo or drift between the two maps would produce incorrect scoping output with no compile-time or test-time error. There is already a stray test entry (`shit: { angular: '.shit' }`) in date-picker's scopes demonstrating how easily invalid data slips through unnoticed.

## What Changes

- **Merge** `COMPONENT_SELECTORS`, `COMPOUND_COMPONENTS`, `COMPOUND_THEMING`, and `COMPONENT_VARIANTS` into a single `COMPONENT_METADATA` map with a unified `ComponentMetadata` interface
- **Rename** `component-selectors.ts` → `component-metadata.ts` to reflect its expanded role as the single source of truth
- **Delete** `compound-theming.ts` — all its data moves into the `.compound` field of each component's metadata entry
- **Derive inline scopes** from base selectors at runtime instead of declaring them explicitly — eliminates the primary duplication vector
- **Embed variants** directly on component records (`variants?: string[]`) instead of maintaining a separate `COMPONENT_VARIANTS` map
- **Remove** the unused `getCompoundSelector()` accessor function
- **Clean up** the stray `shit` scope entry from date-picker
- **Simplify** the handler (`component-tokens.ts`) to use a single lookup instead of stitching together two separate calls
- **Merge** the two test files into a single `component-metadata.test.ts`

Handler output remains **byte-for-byte identical** — this is a pure knowledge-layer refactor.

## Capabilities

### New Capabilities

- `component-metadata-unification`: Define the unified `ComponentMetadata` data structure, its interfaces, accessor functions, and the invariants that must hold (single source of truth, inline scope derivation, no duplicate declarations).

### Modified Capabilities

_(none — no spec-level behavior changes; all existing `component-theming` requirements remain satisfied)_

## Impact

- **Files created:** `src/mcp/knowledge/component-metadata.ts`, `src/mcp/__tests__/knowledge/component-metadata.test.ts`
- **Files deleted:** `src/mcp/knowledge/compound-theming.ts`, `src/mcp/__tests__/knowledge/compound-theming.test.ts`
- **Files modified:** `src/mcp/knowledge/index.ts`, `src/mcp/tools/handlers/component-tokens.ts`, `src/mcp/tools/handlers/layout.ts`, `src/mcp/tools/handlers/component-theme.ts`
- **Exports changed:** All current accessor functions preserved with same signatures (except `getCompoundThemingInfo` and `getCompoundSelector` which are removed). `COMPONENT_METADATA` replaces `COMPONENT_SELECTORS` as the primary export.
- **Rollback plan:** Revert the commit. No database migrations, no config changes, no external API changes.
