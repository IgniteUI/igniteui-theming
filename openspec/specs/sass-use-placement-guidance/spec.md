## Purpose

Ensure all Sass-generating tools include inline `@use` placement comments and assembly notes to guide users on correct file assembly.

## Requirements

### Requirement: Generated Sass includes inline @use placement comment

All Sass output that contains `@use` statements SHALL include a single-line comment above the first `@use` rule reminding that `@use` must appear at the top of the file and be deduplicated when combining multiple tool outputs.

#### Scenario: Inline comment present in generated Sass

- **GIVEN** a Sass-generating tool is called with default (Sass) output
- **WHEN** the tool returns a Sass code block
- **THEN** the code block SHALL contain a comment line above the first `@use` that mentions top-of-file placement and deduplication

#### Scenario: CSS output is unaffected

- **GIVEN** a tool is called with `output: "css"`
- **WHEN** the tool returns CSS custom properties
- **THEN** no `@use` placement comment SHALL be present

### Requirement: Handler response text includes assembly note after Sass code

Every Sass-generating handler SHALL append an assembly note after the Sass code block in its response text. The note SHALL instruct that `@use` rules must appear at the top of the `.scss` file and be deduplicated when combining outputs from multiple tools.

#### Scenario: Assembly note present for palette handler

- **GIVEN** `create_palette` is called with Sass output
- **WHEN** the handler returns its response text
- **THEN** the text after the Sass code fence SHALL contain a placement note mentioning `@use` top-of-file and deduplication

#### Scenario: Assembly note present for component theme handler

- **GIVEN** `create_component_theme` is called with Sass output
- **WHEN** the handler returns its response text
- **THEN** the text after the Sass code fence SHALL contain a placement note mentioning `@use` top-of-file and deduplication

#### Scenario: Assembly note present for theme handler

- **GIVEN** `create_theme` is called with Sass output
- **WHEN** the handler returns its response text
- **THEN** the text after the Sass code fence SHALL contain a placement note mentioning `@use` top-of-file and deduplication

### Requirement: Sass-generating tool descriptions include @use guidance

Each Sass-generating tool description SHALL include a brief note about `@use` placement and deduplication when combining outputs into a single file. The note SHALL be within the tool's `<important_notes>` or equivalent section.

#### Scenario: create_palette description includes guidance

- **WHEN** the `create_palette` tool description is inspected
- **THEN** it SHALL contain text about `@use` placement at the top and deduplication

#### Scenario: create_theme description includes guidance

- **WHEN** the `create_theme` tool description is inspected
- **THEN** it SHALL contain text about `@use` placement at the top and deduplication

#### Scenario: create_component_theme description includes guidance

- **WHEN** the `create_component_theme` tool description is inspected
- **THEN** it SHALL contain text about `@use` placement at the top and deduplication

### Requirement: Assembly note text is centralised

The assembly note string SHALL be defined once and imported by all handlers that emit Sass output, rather than duplicated across handler files.

#### Scenario: Single source of truth for note text

- **GIVEN** the assembly note wording is updated
- **WHEN** only one source definition is changed
- **THEN** all handlers SHALL reflect the updated wording
