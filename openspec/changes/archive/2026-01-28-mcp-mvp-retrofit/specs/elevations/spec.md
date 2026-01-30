## ADDED Requirements

### Requirement: Elevations generation emits elevations mixin

The `create_elevations` tool returns a Sass code block containing the `elevations` mixin.

#### Scenario: Default elevations

- **WHEN** no design system is specified
- **THEN** the output uses `$material-elevations`

#### Scenario: Indigo elevations

- **WHEN** `designSystem: indigo` is specified
- **THEN** the output uses `$indigo-elevations`
