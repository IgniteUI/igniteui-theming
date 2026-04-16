## MODIFIED Requirements

### Requirement: Single unified component metadata map

All component metadata (selectors, variants, compound info, child-of-parent relationships, and optional synonym aliases) SHALL be stored in a single `COMPONENT_METADATA` map exported from `component-metadata.ts`. Each component SHALL have exactly one entry keyed by its canonical theme name or child component name. The `selectors` field SHALL be optional — `childOf` entries omit it. The `aliases` field SHALL be optional and, when present, SHALL contain synonym terms that resolve to the canonical key.

#### Scenario: Simple component lookup

- **WHEN** a simple component (e.g., `avatar`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains a `selectors` field with `angular` and `webcomponents` keys
- **AND** no `compound`, `variants`, or `childOf` fields are present

#### Scenario: Child component lookup

- **WHEN** a child component (e.g., `list-item`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains only a `childOf` field
- **AND** `selectors`, `theme`, `compound`, and `variants` fields are absent

#### Scenario: Compound component lookup

- **WHEN** a compound component (e.g., `combo`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors` and a `compound` field
- **AND** `compound` includes `description`, `relatedThemes`, and optionally `tokenDerivations`, `guidance`, `additionalScopes`, and `childScopes`

#### Scenario: Variant component lookup

- **WHEN** a base component with variants (e.g., `button`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors` and a `variants` field listing variant theme names

#### Scenario: Synonym aliases are optional metadata

- **GIVEN** `switch` includes an `aliases` field with `toggle`
- **WHEN** `COMPONENT_METADATA["switch"]` is inspected
- **THEN** the canonical key remains `switch`
- **AND** `aliases` is present as optional metadata for search resolution
