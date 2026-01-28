## Purpose

Document theme generation behavior and platform-specific output patterns.

## Requirements

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

#### Scenario: Platform hint

- **WHEN** `platform` is not specified
- **THEN** the response includes a hint to specify `platform`

### Requirement: Theme includes optional sections by flags

The `create_theme` tool includes typography, elevations, and spacing by default and can exclude them.

#### Scenario: Excluding typography

- **WHEN** `includeTypography: false` is provided
- **THEN** the output does not include `@include typography(`

#### Scenario: Excluding elevations

- **WHEN** `includeElevations: false` is provided
- **THEN** the output does not include `@include elevations(`

#### Scenario: Excluding spacing

- **WHEN** `includeSpacing: false` is provided for Web Components/React/Blazor
- **THEN** the output does not include `@include spacing(`

### Requirement: Theme generation warns about unsuitable colors

#### Scenario: Primary color too light or dark

- **WHEN** provided colors are unsuitable for the chosen variant
- **THEN** the response includes a warning message
- **AND** the response still returns generated code
