## MODIFIED Requirements

### Requirement: Component token schemas are exposed

The `get_component_design_tokens` tool SHALL use an instruction-oriented output format that varies based on whether the component is compound, simple, or a child sub-component. For compound components, the response SHALL include numbered steps, per-platform scope tables, related theme tables, token derivations, and guidance. For simple components, the response SHALL include the theme function, primary tokens, and the token table without compound sections. For child sub-components, the response SHALL include a relationship note followed by the full parent theme's tokens.

#### Scenario: Compound component response uses instruction-oriented format

- **WHEN** `get_component_design_tokens` is called for a compound component
- **THEN** the response opens with `Implement a theme for the \`<name>\` component using the following guidance.`
- **AND** includes a numbered **Steps** section instructing the model to identify the platform, call `get_component_design_tokens` for each related theme, and apply themes to scopes
- **AND** includes per-platform sections with scope tables and related theme tables

#### Scenario: Simple component response omits compound sections

- **WHEN** `get_component_design_tokens` is called for a non-compound component
- **THEN** the response opens with `Implement a theme for the \`<name>\` component using the following guidance.`
- **AND** includes the theme function name, primary tokens, and available tokens table
- **AND** does NOT include steps, scope tables, related theme tables, token derivations, or guidance sections

#### Scenario: Child component response includes relationship note

- **WHEN** `get_component_design_tokens` is called for a child component (one with `childOf` set in metadata)
- **THEN** the response includes a note stating that the component is a child of the parent component
- **AND** the note states that styling is controlled through the parent's theme
- **AND** the response shows the full parent theme's tokens (unfiltered)
- **AND** the theme function name shown is the parent's theme function (e.g., `list-theme()` for `list-item`)

#### Scenario: Child component relationship note format

- **WHEN** `get_component_design_tokens` is called for `list-item`
- **THEN** the response includes text indicating `list-item` is a child of `list`
- **AND** indicates that tokens apply at the list level

#### Scenario: Missing selector entries are handled

- **WHEN** a compound component has related themes without scoped selectors (e.g., selector is `TODO`)
- **THEN** the checklist marks those related themes as skipped and explains that selector data is missing

#### Scenario: Token schema lookup

- **WHEN** `get_component_design_tokens` is called with a component name
- **THEN** the response lists supported tokens and variant hints

### Requirement: Generated theme code uses parent selector for child components

The `create_component_theme` tool SHALL scope generated theme code to the parent component's selector when the component has a `childOf` field. This applies to both Sass and CSS output.

#### Scenario: Sass output for child component uses parent selector

- **GIVEN** `create_component_theme` is called with `component: "list-item"` and `platform: "angular"`
- **WHEN** no custom `selector` is provided
- **THEN** the generated Sass code scopes the `@include tokens(...)` call to `igx-list` (the parent's selector)
- **AND** the theme function call uses `list-theme()`

#### Scenario: CSS output for child component uses parent selector

- **GIVEN** `create_component_theme` is called with `component: "list-item"`, `platform: "webcomponents"`, and `output: "css"`
- **WHEN** no custom `selector` is provided
- **THEN** the generated CSS scopes custom properties to `igc-list` (the parent's selector)

#### Scenario: Custom selector overrides parent selector for child component

- **GIVEN** `create_component_theme` is called with `component: "list-item"` and `selector: ".my-custom-list"`
- **WHEN** a custom selector is provided
- **THEN** the generated code uses `.my-custom-list` as the scope
- **AND** the parent selector resolution is bypassed

#### Scenario: Same-element alias continues to use own selector

- **GIVEN** `create_component_theme` is called with `component: "textarea"` and `platform: "angular"`
- **WHEN** no custom `selector` is provided
- **THEN** the generated code scopes to `.igx-input-group--textarea-group` (textarea's own selector)
- **AND** NOT to `igx-input-group` (the aliased theme's selector)

#### Scenario: Direct component continues to use own selector

- **GIVEN** `create_component_theme` is called with `component: "avatar"` and `platform: "angular"`
- **WHEN** no custom `selector` is provided
- **THEN** the generated code scopes to `igx-avatar` (the component's own selector)

### Requirement: Child component platform availability uses own selectors

Platform availability checks for child components SHALL use the child's own selectors, not the parent's. A child component is available on a platform if its own `selectors` entry for that platform is non-null.

#### Scenario: Child component available on both platforms

- **GIVEN** `list-item` has selectors `{ angular: "igx-list-item", webcomponents: "igc-list-item" }`
- **WHEN** `isComponentAvailable("list-item", "angular")` is called
- **THEN** it returns `true`

#### Scenario: Child component not available on a platform

- **GIVEN** `expansion-panel-body` has `selectors.webcomponents` set to `null`
- **WHEN** `isComponentAvailable("expansion-panel-body", "webcomponents")` is called
- **THEN** it returns `false`
