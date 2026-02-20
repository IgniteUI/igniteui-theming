## MODIFIED Requirements

### Requirement: Platform detection provides confidence and signals

The system detects a target platform using package dependencies, config files, and framework fallbacks, returning confidence and contributing signals.

#### Scenario: Ignite UI package detected

- **WHEN** `igniteui-angular`, `igniteui-webcomponents`, `igniteui-react`, or commercial equivalents are found in dependencies
- **THEN** the platform is set to the matching target
- **AND** confidence is `high` with an `ignite_package` signal

#### Scenario: Config files detected

- **WHEN** `angular.json`, `vite.config.*` with React plugin, `next.config.js`, or `.csproj` with IgniteUI.Blazor is detected
- **THEN** the platform is set to the matching target
- **AND** confidence is `high` with a `config_file` signal

#### Scenario: Framework fallback detection

- **WHEN** only framework packages are detected (`@angular/core`, `react`, `lit`, Blazor SDK) without any Ignite UI product package
- **THEN** the platform is set to `"generic"`
- **AND** confidence is `low` with the detected `framework_package` signal(s) included

#### Scenario: Config file detected without Ignite UI product

- **WHEN** a framework config file is detected (e.g., `angular.json`, `vite.config.*`, `next.config.*`) but no Ignite UI product package is found
- **THEN** the platform is set to `"generic"`
- **AND** confidence is `low` with the `config_file` signal included
- **AND** the response SHALL include Sass `includePaths` guidance specific to the detected config file

#### Scenario: Ambiguous detection

- **WHEN** multiple Ignite UI product platforms are detected with high-confidence signals
- **THEN** `platform` is `null`
- **AND** `ambiguous` is `true` with `alternatives` and a helpful reason

#### Scenario: No detection

- **WHEN** no matching packages or config files exist
- **THEN** the platform is set to `"generic"`
- **AND** confidence is `"none"` with an empty signals list

#### Scenario: Error reading package.json

- **WHEN** `package.json` cannot be read or parsed
- **THEN** `platform` is `null`
- **AND** confidence is `"none"` with a reason describing the error

#### Scenario: Invalid package.json structure

- **WHEN** `package.json` is readable but has an invalid structure
- **THEN** `platform` is `null`
- **AND** confidence is `"none"` with a reason describing the validation failure
