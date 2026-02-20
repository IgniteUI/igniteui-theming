## ADDED Requirements

### Requirement: Biome configuration file exists

The system SHALL provide a `biome.json` configuration file at the project root that defines linting rules and file inclusion patterns.

#### Scenario: Configuration file is present

- **WHEN** the project root is examined
- **THEN** a `biome.json` file SHALL exist

#### Scenario: Configuration targets TypeScript and JavaScript files

- **WHEN** the Biome configuration is read
- **THEN** the file inclusion patterns SHALL include `scripts/**/*.{js,mjs,cjs}` and `src/mcp/**/*.ts`

### Requirement: Biome linting rules are configured

The system SHALL configure Biome with specific linting rules that enforce code quality standards.

#### Scenario: Recommended rules are enabled

- **WHEN** Biome configuration is loaded
- **THEN** the `linter.rules.recommended` SHALL be set to `true`

#### Scenario: Import extensions are required

- **WHEN** Biome lints TypeScript/JavaScript files
- **THEN** the `correctness.useImportExtensions` rule SHALL enforce `.js` extensions with error level

#### Scenario: Unused code is detected

- **WHEN** Biome lints files with unused variables, imports, or function parameters
- **THEN** the `correctness.noUnusedVariables`, `correctness.noUnusedImports`, and `correctness.noUnusedFunctionParameters` rules SHALL report errors

#### Scenario: Console statements are prevented

- **WHEN** Biome lints files containing console statements or debugger keywords
- **THEN** the `suspicious.noConsole` and `suspicious.noDebugger` rules SHALL report errors

#### Scenario: Style rules are enforced

- **WHEN** Biome lints files
- **THEN** style rules SHALL enforce patterns including namespace prevention, collapsed else-if, enum initializers, self-closing elements, single variable declarators, number namespace usage, and redundant type annotations removal

### Requirement: Biome formatter is disabled

The system SHALL disable Biome's formatting capabilities in favor of Prettier.

#### Scenario: Formatter is disabled in configuration

- **WHEN** the Biome configuration is read
- **THEN** the `formatter.enabled` field SHALL be set to `false`

### Requirement: Import organization is enabled

The system SHALL enable automatic import organization through Biome's assist feature.

#### Scenario: Assist organizes imports automatically

- **WHEN** Biome processes TypeScript files with the assist feature
- **THEN** the `assist.actions.source.organizeImports` SHALL be set to `"on"`

#### Scenario: Assist targets source files

- **WHEN** the Biome assist configuration is read
- **THEN** the assist includes pattern SHALL target source files in `src/mcp/**/*.ts` and `scripts/**/*.{js,mjs,cjs}`

### Requirement: VCS integration is configured

The system SHALL integrate with Git to respect ignore patterns.

#### Scenario: Git client is specified

- **WHEN** the Biome configuration is read
- **THEN** the `vcs.clientKind` SHALL be set to `"git"`

#### Scenario: Gitignore patterns are respected

- **WHEN** Biome runs linting checks
- **THEN** the `vcs.useIgnoreFile` SHALL be set to `true` to exclude files listed in `.gitignore`

### Requirement: Biome CLI command is available

The system SHALL provide an npm script to run Biome linting checks.

#### Scenario: lint:biome script exists

- **WHEN** `package.json` scripts are examined
- **THEN** a `lint:biome` script SHALL exist

#### Scenario: lint:biome script runs Biome checks

- **WHEN** `npm run lint:biome` is executed
- **THEN** the script SHALL execute `biome check --write` to lint files and apply fixes

### Requirement: Biome is integrated into format workflow

The system SHALL include Biome checks in the format script before Prettier.

#### Scenario: Format script includes Biome

- **WHEN** the `format` npm script is examined
- **THEN** it SHALL include `biome check --fix` before any Prettier commands

#### Scenario: Format script maintains Prettier integration

- **WHEN** the `format` npm script is executed
- **THEN** it SHALL run Prettier formatting after Biome checks complete

### Requirement: Biome is integrated into lint workflow

The system SHALL include Biome checks in the main lint script.

#### Scenario: Lint script includes Biome

- **WHEN** the `lint` npm script is examined
- **THEN** it SHALL include `npm run lint:biome` alongside other linting commands

### Requirement: Biome package is installed

The system SHALL include Biome as a development dependency.

#### Scenario: Biome is in devDependencies

- **WHEN** `package.json` dependencies are examined
- **THEN** `@biomejs/biome` SHALL be listed in `devDependencies`

### Requirement: Biome auto-fixes linting issues

The system SHALL automatically fix correctable linting violations when using fix flags.

#### Scenario: Auto-fix adds missing import extensions

- **WHEN** Biome runs with `--fix` flag on files with imports missing `.js` extensions
- **THEN** the extensions SHALL be added automatically

#### Scenario: Auto-fix removes unused imports

- **WHEN** Biome runs with `--fix` flag on files with unused imports
- **THEN** the unused imports SHALL be removed automatically

#### Scenario: Auto-fix organizes imports

- **WHEN** Biome runs with `--fix` flag on files with disorganized imports
- **THEN** the imports SHALL be sorted and organized according to configured rules
