## MODIFIED Requirements

### Requirement: Component theming requires platform

The `create_component_theme` tool requires a `platform` parameter and SHALL specify compound-component completeness rules to reduce incomplete outputs.

#### Scenario: Missing platform

- **WHEN** `platform` is not provided
- **THEN** the tool returns an error indicating `platform` is required

#### Scenario: Generic platform rejected

- **WHEN** `platform: "generic"` is provided
- **THEN** the tool SHALL return an error stating that `create_component_theme` requires a specific Ignite UI product platform (angular, webcomponents, react, or blazor)
- **AND** the error SHALL explain that component theming requires platform-specific selectors and variable prefixes that do not exist in generic mode

#### Scenario: Compound guidance treated as completeness criteria

- **WHEN** a user requests theming for a compound component
- **THEN** the guidance states the response is incomplete if related theme calls are omitted when selectors are available

#### Scenario: Canonical compound example provided

- **WHEN** a compound component is detected
- **THEN** guidance includes a short canonical example (e.g., combo) demonstrating the full multi-call flow
