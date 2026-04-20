## ADDED Requirements

### Requirement: ComponentMetadata supports childOf field

The `ComponentMetadata` interface SHALL include an optional `childOf` field of type `string` that names the parent component. When `childOf` is present, `selectors` and `theme` SHALL NOT be present — both are resolved from the parent. The `selectors` field on `ComponentMetadata` SHALL be optional to support this.

#### Scenario: Child component entry has only childOf

- **GIVEN** a component metadata entry for `list-item`
- **WHEN** the entry is inspected
- **THEN** `childOf` is `"list"`
- **AND** `selectors` is undefined
- **AND** `theme` is undefined

#### Scenario: childOf and compound are mutually exclusive

- **GIVEN** a component metadata entry with `childOf` set
- **WHEN** the entry is inspected
- **THEN** `compound` SHALL NOT be present on the same entry

#### Scenario: childOf references a valid parent

- **GIVEN** a component metadata entry with `childOf: "list"`
- **WHEN** the metadata is loaded
- **THEN** `COMPONENT_METADATA["list"]` SHALL exist
- **AND** `COMPONENT_METADATA["list"].selectors` SHALL have at least one non-null platform selector

### Requirement: Theme resolution falls back to childOf

The `resolveComponentTheme` function SHALL resolve the theme via `metadata.childOf` when `metadata.theme` is not set. This allows child component entries to omit the `theme` field entirely.

#### Scenario: Child component resolves theme via childOf

- **GIVEN** `COMPONENT_METADATA["list-item"]` has `childOf: "list"` and no `theme` field
- **WHEN** `resolveComponentTheme("list-item")` is called
- **THEN** it returns the `list` theme (same as `resolveComponentTheme("list")`)

#### Scenario: Same-element alias still resolves via theme

- **GIVEN** `COMPONENT_METADATA["textarea"]` has `theme: "input-group"` and no `childOf` field
- **WHEN** `resolveComponentTheme("textarea")` is called
- **THEN** it returns the `input-group` theme (unchanged behavior)

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

The existing `getComponentSelector` function SHALL continue to return the component's own selectors. For child components without selectors, it returns an empty array.

#### Scenario: getComponentSelector returns empty for childOf entries

- **WHEN** `getComponentSelector("list-item", "angular")` is called
- **THEN** it returns `[]` (childOf entries have no own selectors)

### Requirement: Generated theme variable name uses parent

When generating theme code for a child component, the variable name and code comments SHALL use the parent component's name, not the child's. This ensures output is merge-compatible when a user incrementally styles different sub-parts of the same component.

#### Scenario: Child component produces parent-named variable

- **GIVEN** `create_component_theme` is called with `component: "card-actions"`
- **WHEN** no custom `name` is provided
- **THEN** the generated variable is `$custom-card-theme` (not `$custom-card-actions-theme`)
- **AND** comments reference "Custom card theme" (not "Custom card-actions theme")

#### Scenario: Explicit name overrides parent derivation

- **GIVEN** `create_component_theme` is called with `component: "card-actions"` and `name: "my-theme"`
- **WHEN** a custom name is provided
- **THEN** the generated variable is `$my-theme`

### Requirement: Platform availability delegates to parent for child components

Platform availability checks for child components SHALL delegate to the parent component. A child component is available on a platform if the parent component is available.

#### Scenario: Child component available via parent

- **GIVEN** `list-item` has `childOf: "list"` and `list` has `selectors.angular: "igx-list"`
- **WHEN** the `create_component_theme` handler checks platform availability for `list-item` on Angular
- **THEN** it checks `isComponentAvailable("list", "angular")` and returns true

### Requirement: Initial child component entries

The following child component entries SHALL be present in `COMPONENT_METADATA`. Each entry SHALL contain only `childOf` pointing to the parent component.

| Entry                    | `childOf`           | Notes                                              |
| ------------------------ | ------------------- | -------------------------------------------------- |
| `list-item`              | `"list"`            |                                                    |
| `list-header`            | `"list"`            |                                                    |
| `drop-down-item`         | `"drop-down"`       |                                                    |
| `nav-drawer-item`        | `"navdrawer"`       | Fixes naming mismatch (nav-drawer ≠ navdrawer)     |
| `tab-item`               | `"tabs"`            |                                                    |
| `step`                   | `"stepper"`         |                                                    |
| `card-header`            | `"card"`            |                                                    |
| `card-content`           | `"card"`            |                                                    |
| `card-actions`           | `"card"`            |                                                    |
| `expansion-panel-header` | `"expansion-panel"` |                                                    |
| `expansion-panel-body`   | `"expansion-panel"` |                                                    |
| `accordion-header`       | `"accordion"`       | Virtual child (no real element on either platform) |
| `accordion-body`         | `"accordion"`       | Virtual child (no real element on either platform) |

### Requirement: Child entries do not appear in VARIANT_THEME_NAMES

Child component entries SHALL NOT have a `variants` field. The `VARIANT_THEME_NAMES` set SHALL NOT contain any child component names.

#### Scenario: Child entry excluded from variant set

- **WHEN** `isVariantTheme("list-item")` is called
- **THEN** it returns `false`

### Requirement: Tool descriptions document child sub-components

The `get_component_design_tokens` and `create_component_theme` tool descriptions SHALL mention child sub-component names as valid inputs and explain the parent resolution behavior, merge-compatible output, and parent-scoped selectors.

#### Scenario: get_component_design_tokens description mentions child components

- **WHEN** the tool description for `get_component_design_tokens` is read
- **THEN** it lists child sub-component names (e.g., "list-item", "card-header", "accordion-header") as valid inputs
- **AND** explains that they resolve to the parent component's theme

#### Scenario: create_component_theme description explains merge-compatible output

- **WHEN** the tool description for `create_component_theme` is read
- **THEN** it explains that child sub-component output uses the parent's theme function, variable name, and selector
- **AND** recommends merging token arguments into a single theme function call
