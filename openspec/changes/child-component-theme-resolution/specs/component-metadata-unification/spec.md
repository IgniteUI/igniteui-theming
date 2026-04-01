## MODIFIED Requirements

### Requirement: Single unified component metadata map

All component metadata (selectors, variants, compound info, child-of-parent relationships) SHALL be stored in a single `COMPONENT_METADATA` map exported from `component-metadata.ts`. Each component SHALL have exactly one entry keyed by its theme name or child component name.

#### Scenario: Simple component lookup

- **WHEN** a simple component (e.g., `avatar`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains a `selectors` field with `angular` and `webcomponents` keys
- **AND** no `compound`, `variants`, or `childOf` fields are present

#### Scenario: Compound component lookup

- **WHEN** a compound component (e.g., `combo`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors` and a `compound` field
- **AND** `compound` includes `description`, `relatedThemes`, and optionally `tokenDerivations`, `guidance`, `additionalScopes`, and `childScopes`

#### Scenario: Variant component lookup

- **WHEN** a base component with variants (e.g., `button`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors` and a `variants` field listing variant theme names

#### Scenario: Child component lookup

- **WHEN** a child component (e.g., `list-item`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors`, `theme`, and `childOf` fields
- **AND** `childOf` names the parent component whose selectors are used for theming scope
- **AND** no `compound` or `variants` fields are present

### Requirement: Accessor functions preserve existing signatures

All public accessor functions SHALL maintain their existing call signatures and return types. New accessor functions MAY be added for child component resolution.

#### Scenario: getComponentSelector unchanged

- **WHEN** `getComponentSelector(name, platform)` is called
- **THEN** it returns the same value as before, read from `COMPONENT_METADATA[name].selectors[platform]`

#### Scenario: isCompoundComponent uses unified map

- **WHEN** `isCompoundComponent(name)` is called
- **THEN** it returns `true` if and only if `COMPONENT_METADATA[name]?.compound` is defined

#### Scenario: hasVariants uses embedded field

- **WHEN** `hasVariants(name)` is called
- **THEN** it returns `true` if and only if `COMPONENT_METADATA[name]?.variants` is defined and non-empty

#### Scenario: getCompoundComponentInfo returns full compound data

- **WHEN** `getCompoundComponentInfo(name)` is called for a compound component
- **THEN** it returns the full `CompoundInfo` object including `description`, `relatedThemes`, `tokenDerivations`, `guidance`, `additionalScopes`, and `childScopes`

#### Scenario: getCompoundThemingInfo is eliminated

- **WHEN** the codebase is searched for `getCompoundThemingInfo`
- **THEN** no references exist — the function has been removed along with all call sites

#### Scenario: getCompoundSelector is eliminated

- **WHEN** the codebase is searched for `getCompoundSelector`
- **THEN** no references exist — the function has been removed (it had no production callers)

#### Scenario: New getThemingSelector accessor added

- **WHEN** `getThemingSelector(name, platform)` is called
- **THEN** it returns the parent's selectors if `childOf` is set, or the component's own selectors otherwise
