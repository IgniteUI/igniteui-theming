## MODIFIED Requirements

### Requirement: Component token schemas are exposed

The `get_component_design_tokens` tool SHALL explicitly indicate when a component is compound and provide an actionable checklist for generating related themes.

#### Scenario: Compound component response includes required checklist

- **WHEN** `get_component_design_tokens` is called for a compound component
- **THEN** the response includes a "Compound checklist (required)" section listing each related theme and its scoped selector
- **AND** the checklist instructs the model to call `get_component_design_tokens` and `create_component_theme` for each related theme using the provided selector

#### Scenario: Missing selector entries are handled

- **WHEN** a compound component has related themes without scoped selectors (e.g., selector is `TODO`)
- **THEN** the checklist marks those related themes as skipped and explains that selector data is missing

### Requirement: Component theming requires platform

The `create_component_theme` tool description SHALL specify compound-component completeness rules to reduce incomplete outputs.

#### Scenario: Compound guidance treated as completeness criteria

- **WHEN** a user requests theming for a compound component
- **THEN** the guidance states the response is incomplete if related theme calls are omitted when selectors are available

#### Scenario: Canonical compound example provided

- **WHEN** a compound component is detected
- **THEN** guidance includes a short canonical example (e.g., combo) demonstrating the full multi-call flow

## ADDED Requirements

### Requirement: Compound checklist is ordered and minimal

The checklist SHALL be ordered and concise to minimize response length while preserving determinism.

#### Scenario: Checklist length control

- **WHEN** the checklist is generated
- **THEN** it lists only related themes and their selectors, without additional narrative
