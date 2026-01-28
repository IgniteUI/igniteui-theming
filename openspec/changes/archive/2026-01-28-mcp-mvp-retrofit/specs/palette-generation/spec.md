## ADDED Requirements

### Requirement: Palette generation returns Sass by default

The `create_palette` tool returns an MCP text response with a Sass code block when `output` is not specified.

#### Scenario: Required colors

- **WHEN** `primary`, `secondary`, and `surface` are provided
- **THEN** the response includes a Sass block containing `palette(`
- **AND** the Sass block includes `$primary`, `$secondary`, and `$surface` values

#### Scenario: Optional colors

- **WHEN** `gray`, `info`, `success`, `warn`, or `error` are provided
- **THEN** the Sass block includes those arguments in the palette definition

#### Scenario: Named palette variable

- **WHEN** `name` is provided
- **THEN** the Sass block uses `$<name>-palette` as the variable name

#### Scenario: Platform info

- **WHEN** `platform` is specified
- **THEN** the response includes the platform label
- **WHEN** `platform` is not specified
- **THEN** the response includes a hint to specify `platform`

#### Scenario: Suitability warnings

- **WHEN** `surface` conflicts with `variant` (light vs dark)
- **THEN** the response includes a warning but still returns code

### Requirement: Palette CSS output uses Sass compilation

The `create_palette` tool can emit CSS custom properties when `output: css` is requested.

#### Scenario: CSS output includes theme variables

- **WHEN** `output: css` is provided
- **THEN** the response contains a CSS block
- **AND** the CSS block includes `--ig-<color>-<shade>` variables
- **AND** the CSS includes WCAG and contrast variables
