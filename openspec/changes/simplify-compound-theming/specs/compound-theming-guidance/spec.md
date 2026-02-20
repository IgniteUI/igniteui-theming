## Purpose

Define the data structures, accessors, and model-facing output for compound component token derivation rules and theming guidance.

## Requirements

### Requirement: Compound theming data is stored separately from structural data

The compound theming knowledge (token derivations, selector overrides, guidance) SHALL be stored in a dedicated `compound-theming.ts` file, separate from the structural data in `component-selectors.ts`.

#### Scenario: Compound theming file exists

- **WHEN** the knowledge layer is loaded
- **THEN** `src/mcp/knowledge/compound-theming.ts` exports a `COMPOUND_THEMING` record keyed by compound component name

#### Scenario: Keys align with COMPOUND_COMPONENTS

- **WHEN** a key exists in `COMPOUND_THEMING`
- **THEN** that key also exists in `COMPOUND_COMPONENTS`

### Requirement: Token derivation rules map child tokens to source tokens with transforms

Each compound component MAY define `tokenDerivations` that describe how child component tokens are derived from sibling or parent component tokens.

#### Scenario: Derivation rule structure

- **WHEN** a `tokenDerivations` entry exists
- **THEN** the key SHALL be in the format `'childTheme.childToken'` (e.g., `'flat-button.foreground'`)
- **AND** the value SHALL contain a `from` field in the format `'sourceComponent.sourceToken'` (e.g., `'calendar.content-background'`)
- **AND** the value SHALL contain a `transform` field with one of: `'identity'`, `'adaptive-contrast'`, `'dynamic-shade'`

#### Scenario: Identity transform

- **WHEN** a derivation has `transform: 'identity'`
- **THEN** the derived token value is the same as the source token value

#### Scenario: Adaptive-contrast transform

- **WHEN** a derivation has `transform: 'adaptive-contrast'`
- **THEN** the derived token value is `adaptive-contrast(<source-value>)`, producing a contrasting foreground color

#### Scenario: Dynamic-shade transform

- **WHEN** a derivation has `transform: 'dynamic-shade'`
- **THEN** the derivation SHALL include an `args` field with shade parameters
- **AND** the derived token value uses `dynamic-shade(<source-value>, <args>)`

### Requirement: Compound selector overrides handle edge cases

A compound component MAY define `selectorOverrides` when its theming wrapper selector differs from the standard `COMPONENT_SELECTORS` entry.

#### Scenario: Selector override present

- **WHEN** a compound component has `selectorOverrides` for the target platform
- **THEN** the override selector SHALL be used as the wrapper for all `@include tokens(...)` calls

#### Scenario: No selector override

- **WHEN** a compound component has no `selectorOverrides` for the target platform
- **THEN** the selector from `COMPONENT_SELECTORS` SHALL be used as the wrapper

### Requirement: Guidance prose provides context for edge cases

A compound component MAY define a `guidance` string with natural-language context about theming relationships that cannot be fully expressed as token derivation rules.

#### Scenario: Guidance present

- **WHEN** a compound component has a `guidance` field
- **THEN** the handler output SHALL include the guidance text in the compound component section

#### Scenario: No guidance

- **WHEN** a compound component has no `guidance` field
- **THEN** the handler output SHALL omit the guidance section without error

### Requirement: Handler merges structural and semantic data for model output

The `get_component_design_tokens` handler SHALL merge data from `COMPOUND_COMPONENTS` (structural) and `COMPOUND_THEMING` (semantic) into a unified output for the model.

#### Scenario: Compound component with derivations

- **WHEN** `get_component_design_tokens` is called for a compound component that has `tokenDerivations`
- **THEN** the response SHALL include a "Related themes and token derivations" section
- **AND** each related theme SHALL be listed with any associated derivation rules showing the target token, transform, and source token

#### Scenario: Compound component without derivations

- **WHEN** `get_component_design_tokens` is called for a compound component that has no entry in `COMPOUND_THEMING` or no `tokenDerivations`
- **THEN** the response SHALL list related themes without derivation hints
- **AND** the response SHALL still include the compound selector and theming approach

#### Scenario: Compound selector is included in output

- **WHEN** `get_component_design_tokens` is called for a compound component
- **THEN** the response SHALL include the resolved compound selector for the target platform (using override if present, otherwise from `COMPONENT_SELECTORS`)

### Requirement: Accessor functions provide programmatic access to compound theming data

#### Scenario: Get compound theming info

- **WHEN** `getCompoundThemingInfo(componentName)` is called with a valid compound component name
- **THEN** it returns the `CompoundThemingInfo` for that compound, or `undefined` if no entry exists

#### Scenario: Get resolved compound selector

- **WHEN** `getCompoundSelector(componentName, platform)` is called
- **THEN** it returns the `selectorOverrides[platform]` value if present, otherwise the `COMPONENT_SELECTORS[componentName][platform]` value

#### Scenario: Get token derivations for a child theme

- **WHEN** `getTokenDerivationsForChild(compoundName, childThemeName)` is called
- **THEN** it returns all derivation entries where the key starts with `'childThemeName.'`, or an empty record if none exist
