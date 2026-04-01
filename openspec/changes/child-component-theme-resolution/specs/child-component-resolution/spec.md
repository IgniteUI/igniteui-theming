## ADDED Requirements

### Requirement: ComponentMetadata supports childOf field

The `ComponentMetadata` interface SHALL include an optional `childOf` field of type `string` that names the parent component whose selectors are used for theming scope. When `childOf` is present, `theme` MUST also be present on the same entry.

#### Scenario: Child component entry has both childOf and theme

- **GIVEN** a component metadata entry for `list-item`
- **WHEN** the entry is inspected
- **THEN** `childOf` is `"list"` and `theme` is `"list"`
- **AND** `selectors` contains the child's own platform selectors (e.g., `angular: "igx-list-item"`)

#### Scenario: childOf and compound are mutually exclusive

- **GIVEN** a component metadata entry with `childOf` set
- **WHEN** the entry is inspected
- **THEN** `compound` SHALL NOT be present on the same entry

#### Scenario: childOf references a valid parent

- **GIVEN** a component metadata entry with `childOf: "list"`
- **WHEN** the metadata is loaded
- **THEN** `COMPONENT_METADATA["list"]` SHALL exist
- **AND** `COMPONENT_METADATA["list"].selectors` SHALL have at least one non-null platform selector

### Requirement: Theming selector resolution uses parent for child components

A `getThemingSelector(componentName, platform)` accessor function SHALL return the selector to use for scoping generated theme code. For child components (where `childOf` is set), it SHALL return the parent's selectors. For all other components, it SHALL return the component's own selectors.

#### Scenario: Child component resolves to parent selector

- **WHEN** `getThemingSelector("list-item", "angular")` is called
- **THEN** it returns `["igx-list"]` (the parent `list` component's Angular selector)

#### Scenario: Child component resolves to parent selector on Web Components

- **WHEN** `getThemingSelector("nav-drawer-item", "webcomponents")` is called
- **THEN** it returns `["igc-nav-drawer"]` (the parent `navdrawer` component's WC selector)

#### Scenario: Non-child component resolves to own selector

- **WHEN** `getThemingSelector("avatar", "angular")` is called
- **THEN** it returns `["igx-avatar"]` (the component's own selector, same as `getComponentSelector`)

#### Scenario: Same-element alias resolves to own selector

- **WHEN** `getThemingSelector("textarea", "angular")` is called
- **THEN** it returns `[".igx-input-group--textarea-group"]` (the component's own selector, not the aliased `input-group` selector)

#### Scenario: Unknown component returns empty

- **WHEN** `getThemingSelector("nonexistent", "angular")` is called
- **THEN** it returns `[]`

### Requirement: getComponentSelector is unchanged

The existing `getComponentSelector` function SHALL continue to return the component's own selectors regardless of `childOf`. It is NOT affected by the child component resolution.

#### Scenario: getComponentSelector ignores childOf

- **WHEN** `getComponentSelector("list-item", "angular")` is called
- **THEN** it returns `["igx-list-item"]` (the child's own selector, not the parent's)

### Requirement: Initial child component entries

The following child component entries SHALL be present in `COMPONENT_METADATA`. Each entry SHALL include `selectors` with real platform values, `theme` pointing to the parent's theme, and `childOf` pointing to the parent component.

#### Scenario: list-item entry

- **WHEN** `COMPONENT_METADATA["list-item"]` is inspected
- **THEN** `selectors.angular` is `"igx-list-item"` and `selectors.webcomponents` is `"igc-list-item"`
- **AND** `theme` is `"list"` and `childOf` is `"list"`

#### Scenario: list-header entry

- **WHEN** `COMPONENT_METADATA["list-header"]` is inspected
- **THEN** `selectors.angular` is `"igx-list-header"` or the appropriate Angular selector
- **AND** `selectors.webcomponents` is `"igc-list-header"`
- **AND** `theme` is `"list"` and `childOf` is `"list"`

#### Scenario: drop-down-item entry

- **WHEN** `COMPONENT_METADATA["drop-down-item"]` is inspected
- **THEN** `selectors.angular` is `"igx-drop-down-item"` and `selectors.webcomponents` is `"igc-dropdown-item"`
- **AND** `theme` is `"drop-down"` and `childOf` is `"drop-down"`

#### Scenario: nav-drawer-item entry

- **WHEN** `COMPONENT_METADATA["nav-drawer-item"]` is inspected
- **THEN** `selectors.angular` is `"igx-nav-drawer"` or the appropriate Angular selector
- **AND** `selectors.webcomponents` is `"igc-nav-drawer-item"`
- **AND** `theme` is `"navdrawer"` and `childOf` is `"navdrawer"`

#### Scenario: tab-item entry

- **WHEN** `COMPONENT_METADATA["tab-item"]` is inspected
- **THEN** `selectors.angular` is `"igx-tab-item"` and `selectors.webcomponents` is `"igc-tab"`
- **AND** `theme` is `"tabs"` and `childOf` is `"tabs"`

#### Scenario: step entry

- **WHEN** `COMPONENT_METADATA["step"]` is inspected
- **THEN** `selectors.angular` is `"igx-step"` and `selectors.webcomponents` is `"igc-step"`
- **AND** `theme` is `"stepper"` and `childOf` is `"stepper"`

#### Scenario: card-header entry

- **WHEN** `COMPONENT_METADATA["card-header"]` is inspected
- **THEN** `selectors.angular` is `"igx-card-header"` and `selectors.webcomponents` is `"igc-card-header"`
- **AND** `theme` is `"card"` and `childOf` is `"card"`

#### Scenario: card-content entry

- **WHEN** `COMPONENT_METADATA["card-content"]` is inspected
- **THEN** `selectors.angular` is `"igx-card-content"` and `selectors.webcomponents` is `"igc-card-content"`
- **AND** `theme` is `"card"` and `childOf` is `"card"`

#### Scenario: card-actions entry

- **WHEN** `COMPONENT_METADATA["card-actions"]` is inspected
- **THEN** `selectors.angular` is `"igx-card-actions"` and `selectors.webcomponents` is `"igc-card-actions"`
- **AND** `theme` is `"card"` and `childOf` is `"card"`

#### Scenario: expansion-panel-header entry

- **WHEN** `COMPONENT_METADATA["expansion-panel-header"]` is inspected
- **THEN** `selectors.angular` is `"igx-expansion-panel-header"` and `selectors.webcomponents` is a valid WC selector or `null`
- **AND** `theme` is `"expansion-panel"` and `childOf` is `"expansion-panel"`

#### Scenario: expansion-panel-body entry

- **WHEN** `COMPONENT_METADATA["expansion-panel-body"]` is inspected
- **THEN** `selectors.angular` is `"igx-expansion-panel-body"` and `selectors.webcomponents` is a valid WC selector or `null`
- **AND** `theme` is `"expansion-panel"` and `childOf` is `"expansion-panel"`

### Requirement: Child entries do not appear in VARIANT_THEME_NAMES

Child component entries SHALL NOT have a `variants` field. The `VARIANT_THEME_NAMES` set SHALL NOT contain any child component names.

#### Scenario: Child entry excluded from variant set

- **WHEN** `isVariantTheme("list-item")` is called
- **THEN** it returns `false`
