## 1. Metadata and Search Inputs

- [x] 1.1 Add optional `aliases` to `ComponentMetadata` and seed synonym-only aliases (for example, `switch` includes `toggle`)
- [x] 1.2 Add or expose candidate search signals from metadata (canonical name, metadata keys, selector-derived terms) for `searchComponents`
- [x] 1.3 Ensure alias policy is documented in code comments or nearby docs as "synonyms only, not permutations"

## 2. Normalization and Ranking Engine

- [x] 2.1 Implement normalization helpers for case-insensitive matching, delimiter equivalence, and `igx-`/`igc-` prefix stripping
- [x] 2.2 Rework `searchComponents` to use deterministic tiered ranking (exact normalized, token-set, strong overlap, guarded substring)
- [x] 2.3 Add deterministic tie-breaking and minimum confidence filtering so low-signal matches are excluded

## 3. Regression and Ranking Tests

- [x] 3.1 Add regression test for issue #538 (`linear progress` resolves to `progress-linear` as top result)
- [x] 3.2 Add tests for order-independent matching and selector-like inputs (`igx-linear-bar`)
- [x] 3.3 Add tests for explicit synonym resolution (`toggle` resolves to `switch`) and verify permutations work without alias entries
- [x] 3.4 Add ranking determinism tests to validate exact matches outrank partial overlaps and ties are stable

## 4. Validation and Integration Checks

- [x] 4.1 Verify MCP handlers that consume `searchComponents` return improved suggestions without schema changes
- [x] 4.2 Run relevant test suites (knowledge + handler tests) and fix any regressions
- [x] 4.3 Confirm no canonical component names or public tool contracts changed
