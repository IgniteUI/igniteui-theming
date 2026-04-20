## Purpose

Enable importing markdown files as raw string content during the build process using Vite's `?raw` query parameter.

## ADDED Requirements

### Requirement: Markdown files can be imported as strings

The build system SHALL support importing markdown files as raw string content using the `?raw` query parameter suffix.

#### Scenario: Import markdown file as string

- **WHEN** a TypeScript file imports a markdown file with `?raw` suffix
- **THEN** the imported value is a string containing the markdown file's content

#### Scenario: TypeScript recognizes markdown imports

- **WHEN** a TypeScript file imports a markdown file with `?raw` suffix
- **THEN** TypeScript compiler recognizes the import as valid and types it as `string`

### Requirement: Markdown content is embedded at build time

The build system SHALL embed markdown file content into the compiled JavaScript output at build time.

#### Scenario: Markdown content bundled with code

- **WHEN** the build process runs
- **THEN** markdown file content is inlined into the compiled JavaScript output

#### Scenario: No runtime file I/O required

- **WHEN** the compiled code accesses imported markdown content
- **THEN** the content is available as a string constant without filesystem access

### Requirement: Import paths resolve correctly

The build system SHALL resolve markdown file paths relative to the importing TypeScript file.

#### Scenario: Relative path resolution

- **WHEN** a TypeScript file imports `'./docs/example.md?raw'`
- **THEN** the build system resolves the path relative to the importing file's directory

#### Scenario: Deep nested imports

- **WHEN** a TypeScript file imports `'./docs/subfolder/nested.md?raw'`
- **THEN** the build system correctly resolves and imports the nested markdown file
