## ADDED Requirements

### Requirement: Custom palette supports shades and explicit modes

The `create_custom_palette` tool supports both `shades` and `explicit` modes for each color group.

#### Scenario: Shades mode

- **WHEN** colors are provided with `mode: shades` and `baseColor`
- **THEN** the response contains a Sass block that includes `shades(`
- **AND** the response labels which colors use the shades function

#### Scenario: Explicit mode

- **WHEN** a color group uses `mode: explicit` with complete shade maps
- **THEN** the response includes the explicit shade map in the Sass output

#### Scenario: Invalid color values

- **WHEN** any provided color value is invalid
- **THEN** the response is an error with `Validation Failed`

### Requirement: Custom palette supports CSS output

The `create_custom_palette` tool can emit CSS custom properties when `output: css` is requested.

#### Scenario: CSS output

- **WHEN** `output: css` is provided
- **THEN** the response contains a CSS block with `--ig-<color>-<shade>` variables
