## ADDED Requirements

### Requirement: Theme resolution uses metadata alias

When a component's requested theme is missing from `themes.json`, `get_component_design_tokens` SHALL resolve the effective theme using the component metadata `theme` alias if present.

#### Scenario: Missing theme resolved by alias

- **GIVEN** component metadata defines `theme: "grid"` for `tree-grid`
- **AND** `themes.json` does not include `tree-grid`
- **WHEN** `get_component_design_tokens` is called for `tree-grid` with `theme: "tree-grid"`
- **THEN** the tool resolves tokens using the `grid` theme definition

#### Scenario: Missing theme without alias

- **GIVEN** component metadata has no `theme` alias
- **AND** the requested theme is not present in `themes.json`
- **WHEN** `get_component_design_tokens` is called
- **THEN** the tool returns the existing missing-theme error

#### Scenario: Alias target is invalid

- **GIVEN** component metadata defines `theme: "missing-component"`
- **WHEN** `get_component_design_tokens` is called for that component
- **THEN** the tool returns an error indicating the alias target is invalid
