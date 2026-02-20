## Purpose

Define typography generation outputs and handling of font stacks.

## Requirements

### Requirement: Typography generation emits typography mixin

The `create_typography` tool returns a Sass code block containing the `typography` mixin. For non-Angular platforms, the output SHALL include the `@use` import for the typography preset module in addition to the base theming module import.

#### Scenario: Default typography output

- **WHEN** `fontFamily` is provided
- **THEN** the output includes `@include typography(`
- **AND** the font family is quoted

#### Scenario: Design system type scale

- **WHEN** `designSystem` is provided
- **THEN** the output uses the matching `$<designSystem>-type-scale` variable

#### Scenario: Non-Angular platform includes typography preset import

- **WHEN** `platform` is not `angular` (including `webcomponents`, `react`, `blazor`, or unspecified)
- **AND** `designSystem` is provided (or defaults to `material`)
- **THEN** the output MUST include `@use 'igniteui-theming/sass/typography/presets/<designSystem>' as *;`
- **AND** this import MUST appear after the base `@use 'igniteui-theming' as *;` statement

#### Scenario: Angular platform omits typography preset import

- **WHEN** `platform: angular` is provided
- **THEN** the output MUST NOT include a separate typography preset `@use` import
- **AND** the output SHALL only include the `@use "igniteui-angular/theming" as *;` statement

### Requirement: Font stacks are preserved

#### Scenario: Font stack quoting

- **WHEN** `fontFamily` contains a comma-separated stack
- **THEN** the stack is wrapped in quotes to preserve it as a single value
