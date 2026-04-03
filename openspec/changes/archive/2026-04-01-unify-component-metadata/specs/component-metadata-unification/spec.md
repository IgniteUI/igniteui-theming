## ADDED Requirements

### Requirement: Single unified component metadata map

All component metadata (selectors, variants, compound info) SHALL be stored in a single `COMPONENT_METADATA` map exported from `component-metadata.ts`. Each component SHALL have exactly one entry keyed by its theme name.

#### Scenario: Simple component lookup

- **WHEN** a simple component (e.g., `avatar`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains a `selectors` field with `angular` and `webcomponents` keys
- **AND** no `compound` or `variants` fields are present

#### Scenario: Compound component lookup

- **WHEN** a compound component (e.g., `combo`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors` and a `compound` field
- **AND** `compound` includes `description`, `relatedThemes`, and optionally `tokenDerivations`, `guidance`, `additionalScopes`, and `childScopes`

#### Scenario: Variant component lookup

- **WHEN** a base component with variants (e.g., `button`) is looked up in `COMPONENT_METADATA`
- **THEN** the entry contains `selectors` and a `variants` field listing variant theme names

### Requirement: Inline scope derived from base selectors

The inline scope for compound component child theming SHALL always be derived from the component's `selectors` field. Inline scopes SHALL NOT be declared explicitly in any data structure.

#### Scenario: Handler resolves inline scope for Angular

- **WHEN** the handler needs the inline scope for `combo` on Angular
- **THEN** it reads `COMPONENT_METADATA['combo'].selectors.angular` (which is `'igx-combo'`)
- **AND** uses that value directly as the scoping selector

#### Scenario: Handler resolves inline scope for Web Components

- **WHEN** the handler needs the inline scope for `combo` on Web Components
- **THEN** it reads `COMPONENT_METADATA['combo'].selectors.webcomponents` (which is `'igc-combo'`)
- **AND** uses that value directly as the scoping selector

#### Scenario: No explicit inline scope in data

- **WHEN** any component's metadata is inspected
- **THEN** there SHALL be no `inline` key in `additionalScopes`
- **AND** no scope field that duplicates the base selector value

### Requirement: Additional scopes for non-inline contexts

Compound components that require scoping beyond their base selector SHALL declare those scopes in `additionalScopes`. The `childScopes` map SHALL reference either `'inline'` or a key from `additionalScopes`.

#### Scenario: Compound with overlay scope

- **WHEN** `date-picker` metadata is inspected
- **THEN** `compound.additionalScopes` contains an `overlay` key with platform-specific selectors
- **AND** `compound.childScopes` references `'overlay'` for children rendered in the overlay

#### Scenario: Compound with inline-only scoping

- **WHEN** `combo` metadata is inspected
- **THEN** `compound.additionalScopes` is either absent or empty
- **AND** `compound.childScopes` references `'inline'` for all children (or `childScopes` is absent)

#### Scenario: childScopes reference validity

- **WHEN** any compound component's `childScopes` is inspected
- **THEN** every value SHALL be either `'inline'` or a key that exists in `additionalScopes`

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

#### Scenario: getCompoundComponentInfo returns full compound data

- **WHEN** `getCompoundComponentInfo(name)` is called for a compound component
- **THEN** it returns the full `CompoundInfo` object including `description`, `relatedThemes`, `tokenDerivations`, `guidance`, `additionalScopes`, and `childScopes`

#### Scenario: getCompoundThemingInfo is eliminated

- **WHEN** the codebase is searched for `getCompoundThemingInfo`
- **THEN** no references exist — the function has been removed along with all call sites

#### Scenario: getCompoundSelector is eliminated

- **WHEN** the codebase is searched for `getCompoundSelector`
- **THEN** no references exist — the function has been removed (it had no production callers)

### Requirement: VARIANT_THEME_NAMES derived at init

The set of all variant theme names SHALL be derived from `COMPONENT_METADATA` at module initialization time, not maintained as a separate data structure.

#### Scenario: Variant set computed from metadata

- **WHEN** the module initializes
- **THEN** `VARIANT_THEME_NAMES` is a `Set<string>` containing every string from every component's `variants` array
- **AND** `isVariantTheme(name)` checks membership in this derived set

### Requirement: No stale or test data in production metadata

The `COMPONENT_METADATA` map SHALL contain only valid, production-ready data. No test fixtures, placeholder values, or debugging artifacts.

#### Scenario: No stray scope entries

- **WHEN** the metadata for `date-picker` is inspected
- **THEN** there is no scope entry named `shit` or any other non-production key
- **AND** all scope keys correspond to real UI contexts (e.g., `inline`, `overlay`)

### Requirement: Handler output is byte-for-byte identical

The refactored knowledge layer SHALL produce identical handler output for all components across all platforms.

#### Scenario: Simple component output unchanged

- **WHEN** `get_component_design_tokens` is called for `avatar` on Angular
- **THEN** the response text is identical to the pre-refactor output

#### Scenario: Compound component output unchanged

- **WHEN** `get_component_design_tokens` is called for `date-picker` on Angular
- **THEN** the response text is identical to the pre-refactor output, including all scope selectors, checklists, and guidance

#### Scenario: Variant error output unchanged

- **WHEN** `get_component_design_tokens` is called for `button` (base with variants)
- **THEN** the error response listing available variants is identical to the pre-refactor output

### Requirement: Old files and exports are removed

After the refactor, the old file structure and removed exports SHALL not exist in the codebase.

#### Scenario: compound-theming.ts deleted

- **WHEN** the file system is checked
- **THEN** `src/mcp/knowledge/compound-theming.ts` does not exist

#### Scenario: compound-theming.test.ts deleted

- **WHEN** the file system is checked
- **THEN** `src/mcp/__tests__/knowledge/compound-theming.test.ts` does not exist

#### Scenario: Old imports resolved

- **WHEN** the codebase is searched for imports from `compound-theming`
- **THEN** no import statements reference the deleted module
