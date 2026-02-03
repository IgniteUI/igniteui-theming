## ADDED Requirements

### Requirement: Typography generation emits typography mixin

The `create_typography` tool returns a Sass code block containing the `typography` mixin.

#### Scenario: Default typography output

- **WHEN** `fontFamily` is provided
- **THEN** the output includes `@include typography(`
- **AND** the font family is quoted

#### Scenario: Design system type scale

- **WHEN** `designSystem` is provided
- **THEN** the output uses the matching `$<designSystem>-type-scale` variable

### Requirement: Font stacks are preserved

#### Scenario: Font stack quoting

- **WHEN** `fontFamily` contains a comma-separated stack
- **THEN** the stack is wrapped in quotes to preserve it as a single value
