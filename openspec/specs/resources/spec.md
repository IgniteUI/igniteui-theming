## Purpose

Define the MCP resource URIs and the content they return.

## Requirements

### Requirement: Platform resources are exposed

The server exposes platform metadata via `theming://platforms` and platform-specific resource URIs.

#### Scenario: Platform listing

- **WHEN** `theming://platforms` is requested
- **THEN** the response lists supported platforms with metadata

#### Scenario: Platform detail

- **WHEN** `theming://platforms/<platform>` is requested
- **THEN** the response provides the platform configuration and usage hints

### Requirement: Preset resources are exposed

#### Scenario: Preset palettes

- **WHEN** `theming://presets/palettes` is requested
- **THEN** the response includes preset palette configurations

#### Scenario: Preset typography

- **WHEN** `theming://presets/typography` is requested
- **THEN** the response includes typography presets

#### Scenario: Preset elevations

- **WHEN** `theming://presets/elevations` is requested
- **THEN** the response includes elevation presets

### Requirement: Guidance resources are exposed

#### Scenario: Color guidance

- **WHEN** `theming://guidance/colors` is requested
- **THEN** the response provides color usage guidance content

### Requirement: Layout documentation resources are exposed

#### Scenario: Layout documentation

- **WHEN** `theming://docs/spacing-and-sizing` is requested
- **THEN** the response provides layout scale documentation
