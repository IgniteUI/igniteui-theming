## ADDED Requirements

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

- **WHEN** only framework packages are detected (`@angular/core`, `react`, `lit`, Blazor SDK)
- **THEN** the platform is set to the matching target
- **AND** confidence is `low` with a `framework_package` signal

#### Scenario: Ambiguous detection

- **WHEN** multiple platforms are detected with high-confidence signals
- **THEN** `platform` is `null`
- **AND** `ambiguous` is `true` with `alternatives` and a helpful reason

#### Scenario: No detection

- **WHEN** no matching packages or config files exist
- **THEN** `platform` is `null`
- **AND** confidence is `none` with an empty signals list
