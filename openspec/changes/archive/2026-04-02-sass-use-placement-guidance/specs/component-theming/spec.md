## MODIFIED Requirements

### Requirement: Component theming requires platform

The `create_component_theme` tool requires a `platform` parameter and SHALL specify compound-component completeness rules to reduce incomplete outputs. Generated Sass SHALL include an inline `@use` placement comment, and the handler response text SHALL include an assembly note about `@use` top-of-file placement and deduplication.

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

#### Scenario: Inline placement comment in Sass

- **WHEN** `create_component_theme` returns Sass output
- **THEN** the Sass code block SHALL contain a comment above the first `@use` about top-of-file placement and deduplication

#### Scenario: Assembly note in response

- **WHEN** `create_component_theme` returns Sass output
- **THEN** the handler response text SHALL include a placement note after the code block about `@use` top-of-file and deduplication
