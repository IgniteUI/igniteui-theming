## ADDED Requirements

### Requirement: Component theming requires platform

The `create_component_theme` tool requires a `platform` parameter.

#### Scenario: Missing platform

- **WHEN** `platform` is not provided
- **THEN** the tool returns an error indicating `platform` is required

### Requirement: Component token schemas are exposed

#### Scenario: Token schema lookup

- **WHEN** `get_component_design_tokens` is called with a component name
- **THEN** the response lists supported tokens and variant hints

### Requirement: Component variants are enforced

#### Scenario: Base component with variants

- **WHEN** a base component (e.g., `button`, `icon-button`) is provided
- **THEN** the tool returns an error listing available variants

#### Scenario: Specific component variant

- **WHEN** a specific variant (e.g., `flat-button`) is provided
- **THEN** the tool returns Sass output for that variant

### Requirement: Token validation

#### Scenario: Invalid token key

- **WHEN** a token key is not supported by the component schema
- **THEN** the tool returns an error listing the invalid token

### Requirement: CSS output uses platform-specific prefixes

#### Scenario: Web Components CSS output

- **WHEN** `output: css` and `platform: webcomponents` are provided
- **THEN** CSS uses `igc-` selectors and `--ig-` variable prefixes

#### Scenario: Angular CSS output

- **WHEN** `output: css` and `platform: angular` are provided
- **THEN** CSS uses `igx-` selectors and `--igx-` variable prefixes

### Requirement: Defaults for design system and variant

#### Scenario: Defaults

- **WHEN** `designSystem` and `variant` are omitted
- **THEN** the output defaults to `material` and `light`
