## Purpose

Define the `get_color` tool output for CSS variable references and opacity handling.

## Requirements

### Requirement: Color reference returns CSS variable

The `get_color` tool returns a CSS variable reference for the requested palette color.

#### Scenario: Basic color reference

- **WHEN** `color` and `variant` are provided
- **THEN** the response includes a `var(--ig-<color>-<shade>)` reference

#### Scenario: Contrast color

- **WHEN** `contrast: true` is provided
- **THEN** the response includes the `-contrast` variant of the variable

#### Scenario: Opacity

- **WHEN** `opacity` is provided
- **THEN** the response uses CSS relative color syntax to apply opacity
