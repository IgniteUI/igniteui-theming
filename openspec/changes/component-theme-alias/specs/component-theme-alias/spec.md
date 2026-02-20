## ADDED Requirements

### Requirement: Component metadata supports theme alias

Component metadata SHALL allow an optional `theme` field that names another component whose theme implementation is used for styling.

#### Scenario: Alias field is present

- **GIVEN** a component metadata entry includes `theme: "grid"`
- **WHEN** component metadata is loaded
- **THEN** the component is treated as using the `grid` theme implementation

### Requirement: Theme alias references must be valid

Theme alias values MUST reference an existing component metadata entry and MUST NOT be self-referential.

#### Scenario: Alias references unknown component

- **GIVEN** component metadata sets `theme: "missing-component"`
- **WHEN** metadata is validated
- **THEN** validation fails with an error indicating the alias target is unknown

#### Scenario: Alias references itself

- **GIVEN** component metadata sets `theme` equal to its own component name
- **WHEN** metadata is validated
- **THEN** validation fails with an error indicating the alias is self-referential
