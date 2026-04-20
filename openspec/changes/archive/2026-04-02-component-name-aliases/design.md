## Context

`searchComponents` currently relies on substring matching over canonical theme names, which misses common user phrasing like `linear progress` for `progress-linear`. This creates low-quality suggestions in MCP handlers (for example, suggesting `slider` instead of the progress components).

The change must improve recognition without changing tool input/output schemas. The solution should stay deterministic, maintainable, and easy to extend as component metadata evolves.

## Goals / Non-Goals

**Goals:**

- Resolve order and delimiter variation mismatches (`linear progress`, `linear-progress`, `progress linear`)
- Support true synonym naming (`toggle` -> `switch`) without large manual permutation lists
- Improve ranking quality so the best component appears first for ambiguous inputs
- Keep canonical component names unchanged and preserve existing MCP tool contracts

**Non-Goals:**

- Building an NLP or semantic intent model
- Changing canonical component IDs in theme maps or public tool schemas
- Supporting arbitrary misspellings with edit-distance heuristics across all inputs

## Decisions

### 1) Use a normalization pipeline before matching

All query terms and candidate names will be normalized into a common representation:

- lowercased text
- separators normalized (`-`, `_`, and whitespace treated consistently)
- framework prefixes removed where applicable (`igx-`, `igc-`)
- token array extracted for order-independent comparison

Rationale: This addresses formatting noise once, then enables simpler matching logic.

Alternatives considered:

- Regex-only direct matching: easy to start, but difficult to score and rank consistently.
- Levenshtein/fuzzy distance first: handles typos but increases false positives for short component names.

### 2) Build candidate signals from metadata, not permutations

Each component candidate will be represented by a set of searchable signals:

- canonical component name
- metadata keys and selector-derived terms (where available)
- optional explicit `aliases` from `ComponentMetadata`

Rationale: This captures meaningful naming sources while avoiding manual expansion of every word-order permutation.

Alternatives considered:

- Hardcoding permutation aliases for every component: high maintenance and easy to miss cases.

### 3) Use deterministic, tiered ranking

`searchComponents` will score matches in strict tiers:

1. exact normalized string match
2. exact token-set match (order independent)
3. strong token overlap (query tokens fully covered by candidate signals)
4. guarded substring fallback (with minimum threshold)

Tie-breaks are deterministic (score, then stable lexical order), so results are predictable across runs.

Rationale: Tiered scoring gives high precision for exact intent while still recovering near matches.

Alternatives considered:

- Single blended score without tiers: harder to reason about regressions and edge ranking.

### 4) Keep aliases minimal and synonym-focused

`ComponentMetadata` will gain an optional `aliases?: string[]` field, but aliases are only for genuine synonyms/legacy shorthand (for example, `toggle` for `switch`).

Rationale: Synonyms are semantic gaps that normalization cannot infer; permutations are structural and should be handled algorithmically.

Alternatives considered:

- Alias-first strategy for both synonyms and permutations: works initially, but scales poorly and duplicates logic.

### 5) Add focused regression and ranking tests

Tests will cover:

- issue #538 regression (`linear progress` -> `progress-linear`)
- order-independent matches for progress components
- selector-like phrasing (`igx-linear-bar`) resolution
- synonym alias resolution (`toggle` -> `switch`)
- ambiguity/ranking cases to ensure relevant components outrank unrelated ones

Rationale: Ranking logic is behavior-heavy; tests must protect ordering, not just inclusion.

## Risks / Trade-offs

- [Risk] Token overlap may overmatch short generic queries (for example, `bar`) -> Mitigation: require minimum score/coverage thresholds and prefer exact/tiered matches.
- [Risk] Selector-derived signals might bias results toward framework naming -> Mitigation: weight canonical and exact query matches higher than selector-derived tokens.
- [Risk] Alias set can grow inconsistently over time -> Mitigation: document alias policy (synonyms only) and enforce via review + tests.
- [Risk] Ranking changes can surprise users for edge inputs -> Mitigation: add explicit ranking regression tests for known ambiguous terms.

## Migration Plan

1. Add optional `aliases` support to `ComponentMetadata` and seed minimal synonym aliases.
2. Implement normalization helpers and tiered ranking in `searchComponents`.
3. Add/update tests for normalization, ranking tiers, and issue #538 regression.
4. Run MCP/unit test suite and verify handler suggestion behavior remains stable.
5. Rollback path: remove alias field usage and restore prior substring matcher if regressions are severe.

## Open Questions

- Should we normalize additional framework prefixes beyond `igx-`/`igc-` in this change, or defer until a concrete failure case appears?
- Do we want to expose debug scoring in tests only, or keep scoring fully internal?
