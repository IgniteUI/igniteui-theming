## Why

Users reference components using names that differ from the internal theme names — "linear progress" vs `progress-linear`, "circular progress" vs `progress-circular`, "nav drawer" vs `navdrawer`, "toggle" vs `switch`, "datepicker" vs `date-picker`, etc. The current `searchComponents` function uses simple substring matching against theme names, which fails when the user's name doesn't appear as a substring (e.g., `"linear-progress".includes("progress-linear")` is false). This causes incorrect suggestions (e.g., "slider" instead of "progress-linear") and forces extra round-trips. Issue: https://github.com/IgniteUI/igniteui-theming/issues/538

## What Changes

- Normalize user input and component names into comparable tokens (case-insensitive, delimiter-agnostic, and with framework prefixes like `igx-`/`igc-` removed)
- Rework `searchComponents` to use deterministic ranking: exact normalized match first, then order-independent token-set matches, then strong partial overlaps/substring fallbacks with thresholds
- Add a small, explicit alias list in `COMPONENT_METADATA` only for true synonyms and legacy shorthand (for example, `toggle` -> `switch`), not for word-order permutations
- Use selector-derived terms and metadata keys as additional search signals where helpful, while keeping canonical component names unchanged

## Capabilities

### New Capabilities

- `component-name-aliases`: Defines the alias data structure on `ComponentMetadata`, the improved search algorithm, and the initial set of aliases

### Modified Capabilities

- `component-metadata-unification`: The `ComponentMetadata` interface gains a new optional `aliases` field for synonym support. The search function is enhanced to use normalized token matching across metadata keys and aliases.

## Impact

- **Code**: `component-themes.ts` (normalization + token-based ranking in `searchComponents`), `component-metadata.ts` (small synonym alias support), both handler files (already use `searchComponents`, no changes needed)
- **Tests**: New tests for order-independent matching, normalization behavior, synonym alias resolution, ranking quality, and edge cases
- **APIs**: No tool schema changes — the MCP tools accept the same `component` parameter. Improved search is transparent.
- **Rollback**: Remove the `aliases` field and revert `searchComponents` to the original substring match. All existing functionality is unaffected.
