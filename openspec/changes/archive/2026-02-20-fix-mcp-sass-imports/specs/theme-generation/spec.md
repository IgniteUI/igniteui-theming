## MODIFIED Requirements

### Requirement: Theme generation is platform-aware

The `create_theme` tool generates Sass output that follows platform-specific conventions. When no platform is specified (generic path), the output SHALL include the necessary preset imports for typography and elevation variables.

#### Scenario: Angular output

- **WHEN** `platform: angular` is provided
- **THEN** the output includes `@include core()`
- **AND** the output includes `@include theme(` with schema and palette

#### Scenario: Web Components output

- **WHEN** `platform: webcomponents` is provided
- **THEN** the output uses `palette`, `typography`, and `elevations` mixins
- **AND** spacing is included by default

#### Scenario: React/Blazor output

- **WHEN** `platform: react` or `platform: blazor` is provided
- **THEN** the output uses the Web Components mixin pattern
- **AND** `core()` and Angular `theme()` mixins are not used

#### Scenario: Platform hint

- **WHEN** `platform` is not specified
- **THEN** the response includes a hint to specify `platform`

#### Scenario: Generic output includes typography preset import

- **WHEN** `platform` is not specified (generic path)
- **AND** `includeTypography` is not `false`
- **THEN** the output MUST include `@use 'igniteui-theming/sass/typography/presets/<designSystem>' as *;`
- **AND** this import MUST appear after the base `@use 'igniteui-theming' as *;` statement

#### Scenario: Generic output includes elevations preset import

- **WHEN** `platform` is not specified (generic path)
- **AND** `includeElevations` is not `false`
- **THEN** the output MUST include `@use 'igniteui-theming/sass/elevations/presets' as *;`
- **AND** this import MUST appear after the base `@use 'igniteui-theming' as *;` statement

#### Scenario: Generic output omits typography preset import when excluded

- **WHEN** `platform` is not specified (generic path)
- **AND** `includeTypography: false` is provided
- **THEN** the output MUST NOT include a typography preset `@use` import

#### Scenario: Generic output omits elevations preset import when excluded

- **WHEN** `platform` is not specified (generic path)
- **AND** `includeElevations: false` is provided
- **THEN** the output MUST NOT include an elevations preset `@use` import
