## MODIFIED Requirements

### Requirement: Component token schemas are exposed

The `get_component_design_tokens` tool SHALL explicitly indicate when a component is compound, display named scopes with resolved selectors, and provide a per-child checklist with scope assignments and derivation hints.

#### Scenario: Compound component response includes scopes legend

- **WHEN** `get_component_design_tokens` is called for a compound component that has `scopes` defined
- **THEN** the response includes a "Scopes" section listing each scope name and its resolved selector(s)
- **AND** array scope values SHALL be displayed joined with `|`

#### Scenario: Compound component response includes per-child scope assignments

- **WHEN** `get_component_design_tokens` is called for a compound component
- **THEN** the response includes a "Related themes" section where each child theme shows its scope name and resolved selector in the format `child — scope: <scope-name> (<resolved selector>)`
- **AND** derivation hints, if present, SHALL appear directly under the child entry

#### Scenario: Child scope resolution uses childScopes then falls back to inline

- **WHEN** a child theme name exists in `childScopes`
- **THEN** the resolved selector for that child SHALL be `scopes[childScopes[childName]]`
- **WHEN** a child theme name does NOT exist in `childScopes`
- **THEN** the resolved selector SHALL fall back to `scopes.inline`

#### Scenario: Compound without scopes falls back to COMPONENT_SELECTORS

- **WHEN** `get_component_design_tokens` is called for a compound component that has no `scopes` defined
- **THEN** the resolved selector SHALL fall back to the compound's entry in `COMPONENT_SELECTORS` for the target platform

#### Scenario: Token schema lookup (legacy)

- **WHEN** `get_component_design_tokens` is called with a component name
- **THEN** the response lists supported tokens and variant hints

### Requirement: Compound checklist is ordered and minimal

The checklist SHALL be ordered and concise. Each child theme entry SHALL include its scope name and resolved selector to minimize ambiguity for tool-calling models.

#### Scenario: Checklist length control

- **WHEN** the checklist is generated
- **THEN** it lists only related themes with their scope assignment and resolved selector, plus derivation hints where available, without additional narrative

#### Scenario: Checklist shows explicit selectors for overlay children

- **WHEN** a compound component has children assigned to an `overlay` scope (e.g., date-picker's calendar and flat-button)
- **THEN** those children SHALL display the overlay scope name and its resolved selector (e.g., `scope: overlay (.igx-date-picker)`)
- **AND** children assigned to `inline` SHALL display the inline scope name and its resolved selector (e.g., `scope: inline (igx-date-picker)`)

### Requirement: Component theming requires platform

The `create_component_theme` tool requires a `platform` parameter and SHALL specify compound-component completeness rules to reduce incomplete outputs.

#### Scenario: Missing platform

- **WHEN** `platform` is not provided
- **THEN** the tool returns an error indicating `platform` is required

#### Scenario: Compound guidance treated as completeness criteria

- **WHEN** a user requests theming for a compound component
- **THEN** the guidance states the response is incomplete if related theme calls are omitted when selectors are available

#### Scenario: Canonical compound example uses scoped selectors

- **WHEN** a compound component is detected in tool descriptions
- **THEN** the compound example SHALL show per-child selectors based on scope assignments from `get_component_design_tokens`, rather than a single compound selector for all children
