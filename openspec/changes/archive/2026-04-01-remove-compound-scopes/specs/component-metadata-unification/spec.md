## MODIFIED Requirements

### Requirement: Single unified component metadata map

All component metadata (selectors, variants, compound info) SHALL be stored in a single `COMPONENT_METADATA` map exported from `component-metadata.ts`. Each component SHALL have exactly one entry keyed by its theme name.

#### Scenario: Simple component lookup

- **WHEN** a simple component (e.g., `avatar`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains a `selectors` field with `angular` and `webcomponents` keys
- **AND** no `compound` or `variants` fields are present

#### Scenario: Compound component lookup

- **WHEN** a compound component (e.g., `combo`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors` and a `compound` field
- **AND** `compound` includes `description`, `relatedThemes`, and optionally `tokenDerivations` and `guidance`
- **AND** `compound` SHALL NOT contain `additionalScopes` or `childScopes` fields

#### Scenario: Variant component lookup

- **WHEN** a base component with variants (e.g., `button`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors` and a `variants` field listing variant theme names

### Requirement: Inline scope derived from base selectors

The scope for compound component child theming SHALL always be derived from the parent component's `selectors` field. All child themes scope under the parent component selector.

#### Scenario: Handler resolves child scope for Angular

- **WHEN** the handler needs the scoping selector for any child theme of `combo` on Angular
- **THEN** it reads `COMPONENT_METADATA['combo'].selectors.angular` (which is `'igx-combo'`)
- **AND** uses that value as the scoping selector for all child themes

#### Scenario: Handler resolves child scope for Web Components

- **WHEN** the handler needs the scoping selector for any child theme of `combo` on Web Components
- **THEN** it reads `COMPONENT_METADATA['combo'].selectors.webcomponents` (which is `'igc-combo'`)
- **AND** uses that value as the scoping selector for all child themes

#### Scenario: No scope indirection in data

- **WHEN** any compound component's metadata is inspected
- **THEN** there SHALL be no `additionalScopes` field
- **AND** there SHALL be no `childScopes` field
- **AND** there SHALL be no `ScopeSelectors` interface in the codebase

### Requirement: Accessor functions preserve existing signatures

All public accessor functions SHALL maintain their existing call signatures and return types. Functions that are eliminated SHALL have no callers in production code.

#### Scenario: getComponentSelector unchanged

- **WHEN** `getComponentSelector(name, platform)` is called
- **THEN** it returns the same value as before, read from `COMPONENT_METADATA[name].selectors[platform]`

#### Scenario: isCompoundComponent uses unified map

- **WHEN** `isCompoundComponent(name)` is called
- **THEN** it returns `true` if and only if `COMPONENT_METADATA[name]?.compound` is defined

#### Scenario: hasVariants uses embedded field

- **WHEN** `hasVariants(name)` is called
- **THEN** it returns `true` if and only if `COMPONENT_METADATA[name]?.variants` is defined and non-empty

#### Scenario: getCompoundComponentInfo returns compound data without scope fields

- **WHEN** `getCompoundComponentInfo(name)` is called for a compound component
- **THEN** it returns the `CompoundInfo` object including `description`, `relatedThemes`, and optionally `tokenDerivations` and `guidance`
- **AND** the returned object SHALL NOT contain `additionalScopes` or `childScopes`

## REMOVED Requirements

### Requirement: Additional scopes for non-inline contexts

**Reason**: The popover API migration in Ignite UI for Angular eliminated overlay rendering outside the host DOM. All child components now render inside the parent component's DOM tree, making additional scopes unnecessary.

**Migration**: Remove all `additionalScopes` and `childScopes` entries from component metadata. All child themes scope under the parent component's base selector.
