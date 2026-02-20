## Purpose

Define component theming requirements, validation, and platform-specific output rules.

## Requirements

### Requirement: Component theming requires platform

The `create_component_theme` tool requires a `platform` parameter and SHALL specify compound-component completeness rules to reduce incomplete outputs.

#### Scenario: Missing platform

- **WHEN** `platform` is not provided
- **THEN** the tool returns an error indicating `platform` is required

#### Scenario: Compound guidance treated as completeness criteria

- **WHEN** a user requests theming for a compound component
- **THEN** the guidance states the response is incomplete if related theme calls are omitted when selectors are available

#### Scenario: Canonical compound example provided

- **WHEN** a compound component is detected
- **THEN** guidance includes a short canonical example (e.g., combo) demonstrating the full multi-call flow

### Requirement: Component token schemas are exposed

The `get_component_design_tokens` tool SHALL explicitly indicate when a component is compound and provide an actionable checklist for generating related themes.

#### Scenario: Compound component response includes required checklist

- **WHEN** `get_component_design_tokens` is called for a compound component
- **THEN** the response includes a "Compound checklist (required)" section listing each related theme and its scoped selector
- **AND** the checklist instructs the model to call `get_component_design_tokens` and `create_component_theme` for each related theme using the provided selector

#### Scenario: Missing selector entries are handled

- **WHEN** a compound component has related themes without scoped selectors (e.g., selector is `TODO`)
- **THEN** the checklist marks those related themes as skipped and explains that selector data is missing

#### Scenario: Token schema lookup (legacy)

- **WHEN** `get_component_design_tokens` is called with a component name
- **THEN** the response lists supported tokens and variant hints

### Requirement: Component variants are enforced

#### Scenario: Base component with variants

- **WHEN** a base component (e.g., `button`, `icon-button`) is provided
- **THEN** the tool returns an error listing available variants

#### Scenario: Specific component variant

- **WHEN** a specific variant (e.g., `flat-button`) is provided
- **THEN** the tool returns Sass output for that variant

### Requirement: Token validation

#### Scenario: Invalid token key

- **WHEN** a token key is not supported by the component schema
- **THEN** the tool returns an error listing the invalid token

### Requirement: CSS output uses platform-specific prefixes

#### Scenario: Web Components CSS output

- **WHEN** `output: css` and `platform: webcomponents` are provided
- **THEN** CSS uses `igc-` selectors and `--ig-` variable prefixes

#### Scenario: Angular CSS output

- **WHEN** `output: css` and `platform: angular` are provided
- **THEN** CSS uses `igx-` selectors and `--igx-` variable prefixes

### Requirement: Defaults for design system and variant

#### Scenario: Defaults

- **WHEN** `designSystem` and `variant` are omitted
- **THEN** the output defaults to `material` and `light`

### Requirement: Compound checklist is ordered and minimal

The checklist SHALL be ordered and concise to minimize response length while preserving determinism.

#### Scenario: Checklist length control

- **WHEN** the checklist is generated
- **THEN** it lists only related themes and their selectors, without additional narrative
