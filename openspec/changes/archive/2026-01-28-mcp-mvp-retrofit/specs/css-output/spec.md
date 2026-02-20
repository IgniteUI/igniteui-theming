## ADDED Requirements

### Requirement: Palette CSS output includes key variables

#### Scenario: Palette CSS variables

- **WHEN** palette CSS is generated
- **THEN** output includes `--ig-<color>-<shade>` variables
- **AND** output includes `--ig-<color>-<shade>-contrast` variables
- **AND** output includes WCAG and contrast level variables

### Requirement: CSS output includes generated header

#### Scenario: CSS header

- **WHEN** CSS output is formatted
- **THEN** the output includes the generated header comment

### Requirement: Component CSS output is plain CSS

#### Scenario: Component CSS contains no Sass syntax

- **WHEN** component CSS output is generated
- **THEN** the output does not include Sass directives (`@use`, `@include`, or `$` variables)
