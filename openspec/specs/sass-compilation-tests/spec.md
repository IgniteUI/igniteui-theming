## Purpose

Ensure generated Sass code from MCP tools compiles without errors, validating that all necessary `@use` imports are present and correct.

## Requirements

### Requirement: Generated typography Sass compiles without errors

The `create_typography` tool's output SHALL compile as valid Sass for all non-Angular platforms.

#### Scenario: Typography compiles for webcomponents platform

- **GIVEN** `platform: webcomponents` and `fontFamily: 'Roboto'`
- **WHEN** `generateTypography` produces Sass code
- **THEN** the code MUST compile without Sass errors

#### Scenario: Typography compiles for react platform

- **GIVEN** `platform: react` and `fontFamily: 'Roboto'`
- **WHEN** `generateTypography` produces Sass code
- **THEN** the code MUST compile without Sass errors

#### Scenario: Typography compiles for blazor platform

- **GIVEN** `platform: blazor` and `fontFamily: 'Roboto'`
- **WHEN** `generateTypography` produces Sass code
- **THEN** the code MUST compile without Sass errors

#### Scenario: Typography compiles with no platform specified

- **GIVEN** no `platform` is specified and `fontFamily: 'Roboto'`
- **WHEN** `generateTypography` produces Sass code
- **THEN** the code MUST compile without Sass errors

#### Scenario: Typography compiles for all design systems

- **GIVEN** any non-Angular platform
- **WHEN** `generateTypography` is called with each `designSystem` value (`material`, `fluent`, `bootstrap`, `indigo`)
- **THEN** the code MUST compile without Sass errors for every design system

### Requirement: Generated elevations Sass compiles without errors

The `create_elevations` tool's output SHALL compile as valid Sass for all non-Angular platforms.

#### Scenario: Elevations compiles for webcomponents platform

- **GIVEN** `platform: webcomponents`
- **WHEN** `generateElevations` produces Sass code
- **THEN** the code MUST compile without Sass errors

#### Scenario: Elevations compiles for react platform

- **GIVEN** `platform: react`
- **WHEN** `generateElevations` produces Sass code
- **THEN** the code MUST compile without Sass errors

#### Scenario: Elevations compiles for blazor platform

- **GIVEN** `platform: blazor`
- **WHEN** `generateElevations` produces Sass code
- **THEN** the code MUST compile without Sass errors

#### Scenario: Elevations compiles with no platform specified

- **GIVEN** no `platform` is specified
- **WHEN** `generateElevations` produces Sass code
- **THEN** the code MUST compile without Sass errors

#### Scenario: Elevations compiles for indigo design system

- **GIVEN** any non-Angular platform and `designSystem: indigo`
- **WHEN** `generateElevations` produces Sass code
- **THEN** the code MUST compile without Sass errors and reference `$indigo-elevations`

### Requirement: Generated generic theme Sass compiles without errors

The `create_theme` tool's output for the generic (no platform) path SHALL compile as valid Sass.

#### Scenario: Generic theme with typography and elevations compiles

- **GIVEN** no `platform` is specified and `primaryColor` is provided
- **WHEN** `generateTheme` produces Sass code with default options (typography and elevations included)
- **THEN** the code MUST compile without Sass errors

#### Scenario: Generic theme without typography compiles

- **GIVEN** no `platform` is specified and `includeTypography: false`
- **WHEN** `generateTheme` produces Sass code
- **THEN** the code MUST compile without Sass errors
- **AND** the code MUST NOT include a typography preset import

#### Scenario: Generic theme without elevations compiles

- **GIVEN** no `platform` is specified and `includeElevations: false`
- **WHEN** `generateTheme` produces Sass code
- **THEN** the code MUST compile without Sass errors
- **AND** the code MUST NOT include an elevations preset import

### Requirement: Test import rewriting covers all preset paths

The `rewriteImportsForTesting()` utility SHALL rewrite all `@use` import paths from package references to local filesystem paths for test-time compilation.

#### Scenario: Base module import is rewritten

- **WHEN** Sass code contains `@use 'igniteui-theming' as *;`
- **THEN** the rewriter maps it to the local `sass/` directory path

#### Scenario: Typography preset import is rewritten

- **WHEN** Sass code contains `@use 'igniteui-theming/sass/typography/presets/<designSystem>' as *;`
- **THEN** the rewriter maps it to the local `sass/typography/presets/<designSystem>` path

#### Scenario: Elevations preset import is rewritten

- **WHEN** Sass code contains `@use 'igniteui-theming/sass/elevations/presets' as *;`
- **THEN** the rewriter maps it to the local `sass/elevations/presets` path
