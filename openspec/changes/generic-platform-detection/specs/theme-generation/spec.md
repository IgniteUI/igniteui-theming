## MODIFIED Requirements

### Requirement: Theme generation is platform-aware

The `create_theme` tool generates Sass output that follows platform-specific conventions.

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

#### Scenario: Generic platform output

- **WHEN** `platform: "generic"` is provided
- **THEN** the output SHALL use the generic theme generator (same as the current `undefined` platform path)
- **AND** the output SHALL use `@use 'igniteui-theming' as *;` as the import
- **AND** the response platform note SHALL display `"Platform: Ignite UI Theming (Standalone)"` instead of `"Platform: Not specified (generic output)"`

#### Scenario: Platform hint

- **WHEN** `platform` is not specified (undefined)
- **THEN** the response includes a hint to specify `platform`
- **AND** the hint SHALL mention `"generic"` as a valid option for platform-agnostic output
