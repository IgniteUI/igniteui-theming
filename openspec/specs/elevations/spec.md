## Purpose

Define elevation generation output and design system selection.

## Requirements

### Requirement: Elevations generation emits elevations mixin

The `create_elevations` tool returns a Sass code block containing the `elevations` mixin. For non-Angular platforms, the output SHALL include the `@use` import for the elevations preset module in addition to the base theming module import.

#### Scenario: Default elevations

- **WHEN** no design system is specified
- **THEN** the output uses `$material-elevations`

#### Scenario: Indigo elevations

- **WHEN** `designSystem: indigo` is specified
- **THEN** the output uses `$indigo-elevations`

#### Scenario: Non-Angular platform includes elevations preset import

- **WHEN** `platform` is not `angular` (including `webcomponents`, `react`, `blazor`, or unspecified)
- **THEN** the output MUST include `@use 'igniteui-theming/sass/elevations/presets' as *;`
- **AND** this import MUST appear after the base `@use 'igniteui-theming' as *;` statement

#### Scenario: Angular platform omits elevations preset import

- **WHEN** `platform: angular` is provided
- **THEN** the output MUST NOT include a separate elevations preset `@use` import
- **AND** the output SHALL only include the `@use "igniteui-angular/theming" as *;` statement
