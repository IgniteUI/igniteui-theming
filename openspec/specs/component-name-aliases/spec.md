# component-name-aliases Specification

## Purpose

Defines the search, normalization, matching, and alias resolution behavior for component name lookups. Ensures users can find components regardless of casing, delimiter style, token order, or framework prefix, and supports explicit synonym aliases for true semantic equivalences.

## Requirements

### Requirement: Component search normalizes query and candidate names

The `searchComponents` capability SHALL normalize user queries and candidate search signals before matching. Normalization SHALL be case-insensitive, treat hyphens/underscores/spaces as equivalent separators, and remove known framework element prefixes (`igx-`, `igc-`) from searchable terms.

#### Scenario: Delimiter and case normalization

- **GIVEN** canonical component metadata includes `progress-linear`
- **WHEN** the user searches for `Linear_Progress`
- **THEN** `searchComponents` treats it as equivalent to `linear progress`
- **AND** `progress-linear` is included in results

#### Scenario: Framework prefix normalization

- **GIVEN** searchable signals include selector-like terms for progress components
- **WHEN** the user searches for `igx-linear-bar`
- **THEN** the `igx-` prefix is ignored for matching purposes
- **AND** the best-matching progress component is returned

### Requirement: Order-independent token matching

The matching algorithm SHALL compare normalized tokens independent of order. Queries that use the same token set as a component signal SHALL be treated as high-confidence matches even when word order differs.

#### Scenario: Reversed token order resolves correctly

- **GIVEN** the component `progress-linear` is available
- **WHEN** the user searches for `linear progress`
- **THEN** `progress-linear` is returned as a top-ranked match

#### Scenario: Canonical order still matches

- **GIVEN** the component `progress-linear` is available
- **WHEN** the user searches for `progress linear`
- **THEN** `progress-linear` is returned as a top-ranked match

### Requirement: Deterministic ranked matching

`searchComponents` SHALL rank matches deterministically using tiered confidence signals in this order: exact normalized string match, exact token-set match, strong token overlap, and guarded substring fallback. Results with insufficient confidence SHALL be excluded.

#### Scenario: Exact normalized match outranks partial overlap

- **GIVEN** candidates include one exact normalized match and one partial token-overlap match
- **WHEN** `searchComponents` ranks results
- **THEN** the exact normalized match appears before the partial overlap candidate

#### Scenario: Stable ordering for tied results

- **GIVEN** two candidates receive the same confidence tier and score
- **WHEN** `searchComponents` returns results
- **THEN** the tie is resolved using a stable deterministic rule
- **AND** repeated calls return the same order

### Requirement: Synonym aliases are explicit and minimal

The system SHALL support optional explicit aliases for true semantic synonyms and legacy shorthand that normalization cannot infer. Alias coverage SHALL NOT be used to encode mechanical word-order permutations.

#### Scenario: Semantic synonym resolves to canonical component

- **GIVEN** metadata defines `toggle` as an alias for `switch`
- **WHEN** the user searches for `toggle`
- **THEN** `switch` is returned as a high-confidence match

#### Scenario: Permutation is handled algorithmically, not via alias list

- **GIVEN** `progress-linear` is available with no alias for `linear-progress`
- **WHEN** the user searches for `linear-progress`
- **THEN** `progress-linear` is still matched via normalization and token ranking
