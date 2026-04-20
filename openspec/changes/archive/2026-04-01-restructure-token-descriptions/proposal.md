## Why

The `get_component_design_tokens` handler produces component descriptions that are bloated, unstructured, and Angular-centric. The SassDoc-derived descriptions dump verbose "PRIMARY TOKENS" prose verbatim, compound component sections show N/A overlay rows for platforms that don't use overlays, and the output reads like a reference document rather than actionable instructions. Web Components users get misleading scope guidance because the format was designed around Angular's overlay pattern. Models need skill-like, step-by-step instructions — not walls of prose.

## What Changes

- **Restructure `component-tokens.ts` handler output** to produce an instruction-oriented format that leads with actionable steps, separates platform-specific scopes clearly, and omits irrelevant sections per platform (e.g., no overlay rows for Web Components).
- **Introduce two distinct output formats**: a compound component format (with steps, per-platform scope tables, related themes, token derivations, guidance) and a simpler non-compound format (theme function, primary tokens, token table).
- **Group platforms by theming strategy**: Angular is one group; Web Components, React, and Blazor are a second group (React and Blazor wrap Web Components and use identical `igc-` selectors, `--ig-` variable prefixes, and inline-only scoping). The output should show two platform sections — "Angular" and "Web Components / React / Blazor" — rather than repeating identical tables for three WC-based platforms.
- **Trim SassDoc descriptions** in all 54 `*-theme.scss` files to remove verbose derivation lists from the prose section. Keep individual `@param` annotations intact (they already carry derivation info).
- **Update `buildComponentDocs.mjs`** to extract the PRIMARY TOKENS section into a structured field in `themes.json`, separating it from the free-form description prose.
- **Omit N/A overlay scope rows** for platforms that don't use overlays, reducing noise and preventing model confusion.
- **Change opening format** from reference-style (`## Design Tokens for...`) to instruction-style (`Implement a theme for...`).

## Capabilities

### New Capabilities

_(none — this restructures existing output, no new capabilities introduced)_

### Modified Capabilities

- `component-theming`: The `get_component_design_tokens` response format changes. Compound component responses now use an instruction-oriented layout with per-platform scope sections (omitting irrelevant scopes), distinct compound vs. simple formats, and trimmed descriptions. Platforms are grouped by theming strategy: Angular alone, and Web Components / React / Blazor together (since React and Blazor wrap WC and share identical selectors, prefixes, and scoping). The compound checklist requirement is preserved but presented as numbered steps. The response structure changes but all data (tokens, scopes, derivations, guidance) remains present.

## Impact

- **`src/mcp/tools/handlers/component-tokens.ts`** — Major rewrite of response builder (lines 84–230).
- **54 SassDoc files** (`sass/themes/components/**/*-theme.scss`) — Trim description blocks to remove verbose derivation lists.
- **`scripts/buildComponentDocs.mjs`** — Parse PRIMARY TOKENS into structured data in `themes.json`.
- **`json/components/themes.json`** — Schema change: `description` field trimmed, new `primaryTokens` field added.
- **`src/mcp/knowledge/component-themes.ts`** — Consume new `primaryTokens` field from themes.json.
- **`src/mcp/__tests__/tools/handlers/component-tokens.test.ts`** — Update assertions for new format.
- **Rollback plan**: Revert the handler changes in `component-tokens.ts` and restore SassDoc descriptions from git history. The `themes.json` schema change is backward-compatible (adding a field), so `buildComponentDocs.mjs` can be reverted independently.
