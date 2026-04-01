## Purpose

Define component theming requirements, validation, and platform-specific output rules.

## Requirements

### Requirement: Component theming requires platform

The `create_component_theme` tool requires a `platform` parameter and SHALL specify compound-component completeness rules to reduce incomplete outputs.

#### Scenario: Missing platform

- **WHEN** `platform` is not provided
- **THEN** the tool returns an error indicating `platform` is required

#### Scenario: Generic platform rejected

- **WHEN** `platform: "generic"` is provided
- **THEN** the tool SHALL return an error stating that `create_component_theme` requires a specific Ignite UI product platform (angular, webcomponents, react, or blazor)
- **AND** the error SHALL explain that component theming requires platform-specific selectors and variable prefixes that do not exist in generic mode

#### Scenario: Compound guidance treated as completeness criteria

- **WHEN** a user requests theming for a compound component
- **THEN** the guidance states the response is incomplete if related theme calls are omitted when selectors are available

#### Scenario: Canonical compound example provided

- **WHEN** a compound component is detected
- **THEN** guidance includes a short canonical example (e.g., combo) demonstrating the full multi-call flow

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

### Requirement: Component variants are enforced

#### Scenario: Base component with variants

- **WHEN** a base component (e.g., `button`, `icon-button`) is provided
- **THEN** the tool returns an error listing available variants

#### Scenario: Specific component variant

- **WHEN** a specific variant (e.g., `flat-button`) is provided
- **THEN** the tool returns Sass output for that variant

### Requirement: Token validation

#### Scenario: Invalid token key

- **WHEN** a token key is not supported by the component schema
- **THEN** the tool returns an error listing the invalid token

### Requirement: CSS output uses platform-specific prefixes

#### Scenario: Web Components CSS output

- **WHEN** `output: css` and `platform: webcomponents` are provided
- **THEN** CSS uses `igc-` selectors and `--ig-` variable prefixes

#### Scenario: Angular CSS output

- **WHEN** `output: css` and `platform: angular` are provided
- **THEN** CSS uses `igx-` selectors and `--igx-` variable prefixes

### Requirement: Defaults for design system and variant

#### Scenario: Defaults

- **WHEN** `designSystem` and `variant` are omitted
- **THEN** the output defaults to `material` and `light`

### Requirement: Compound checklist is ordered and minimal

The compound component response SHALL present related themes in ordered tables grouped by platform, without additional narrative beyond the guidance paragraph.

#### Scenario: Checklist length control

- **WHEN** the compound component response is generated
- **THEN** it lists related themes in platform-specific tables with columns: Theme, Scope, Selector
- **AND** does NOT include additional narrative in the tables themselves

### Requirement: Platform groups reflect theming strategy

The `get_component_design_tokens` response SHALL group platforms into two theming strategies: "Angular" and "Web Components / React / Blazor". React and Blazor wrap Web Components and use identical selectors (`igc-`), variable prefixes (`--ig-`), and inline-only scoping.

#### Scenario: Two platform sections for compound components

- **WHEN** `get_component_design_tokens` is called for a compound component
- **THEN** the response shows exactly two platform sections: "Angular" and "Web Components / React / Blazor"
- **AND** uses `webcomponents` as the representative platform for selector resolution in the WC group

#### Scenario: No duplicate tables for WC-based platforms

- **WHEN** the response includes platform scope tables
- **THEN** React and Blazor do NOT get separate tables
- **AND** are covered by the "Web Components / React / Blazor" section

### Requirement: Irrelevant scope rows are omitted

The response SHALL omit scope rows where the platform group has no selector. This prevents showing misleading N/A entries for scopes that don't apply to a platform.

#### Scenario: Overlay scope omitted for WC-based platforms

- **WHEN** a compound component defines an `overlay` scope with an Angular selector but no `webcomponents` selector
- **THEN** the "Web Components / React / Blazor" scope table does NOT include an overlay row

#### Scenario: All defined scopes shown for Angular

- **WHEN** a compound component defines both `inline` and `overlay` scopes with Angular selectors
- **THEN** the "Angular" scope table includes both rows

### Requirement: PRIMARY TOKENS are structured data

The build pipeline SHALL extract PRIMARY TOKENS from SassDoc descriptions into a structured `primaryTokens` field in `themes.json`, separate from the free-form `description` field.

#### Scenario: themes.json contains primaryTokens field

- **WHEN** `buildComponentDocs.mjs` processes a theme function with a PRIMARY TOKENS block in its SassDoc description
- **THEN** `themes.json` includes a `primaryTokens` array with `{ name, description }` objects for each primary token
- **AND** the `description` field contains only the title line and optional summary (not the PRIMARY TOKENS block)

#### Scenario: Theme function without PRIMARY TOKENS

- **WHEN** a theme function has no PRIMARY TOKENS block in its SassDoc description
- **THEN** `themes.json` includes an empty `primaryTokens` array for that component
- **AND** the `description` field contains the full original description

#### Scenario: Handler renders primary tokens from structured data

- **WHEN** `get_component_design_tokens` renders the response
- **THEN** it reads the `primaryTokens` field from the theme data
- **AND** renders them as a concise bullet list under a **Primary Tokens** section

### Requirement: SassDoc descriptions are concise

The SassDoc description block in `*-theme.scss` files SHALL use concise one-line summaries for PRIMARY TOKENS entries, removing verbose "Auto-derives: X, Y, Z" enumeration lists. Individual `@param` annotations are unchanged.

#### Scenario: Trimmed PRIMARY TOKENS format

- **GIVEN** a theme function SassDoc block with PRIMARY TOKENS
- **WHEN** the description is read
- **THEN** each PRIMARY TOKEN entry is a single line: `- \`$name\` — Summary sentence.`
- **AND** there are no multi-line "Auto-derives:" continuation lines in the PRIMARY TOKENS block

#### Scenario: Param annotations preserved

- **GIVEN** a theme function with `@param` SassDoc annotations
- **WHEN** the SassDoc descriptions are trimmed
- **THEN** all `@param` annotations remain unchanged with their full derivation descriptions

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

### Requirement: Generated theme variable name uses parent for child components

When generating theme code for a child component, the variable name SHALL derive from the parent component's name, not the child's. This ensures merge-compatible output across sub-parts of the same component.

#### Scenario: Child component Sass output uses parent variable name

- **GIVEN** `create_component_theme` is called with `component: "card-actions"` and `platform: "angular"`
- **WHEN** no custom `name` is provided
- **THEN** the generated variable is `$custom-card-theme` and the comment says "Custom card theme"

#### Scenario: Child component CSS output uses parent in description

- **GIVEN** `create_component_theme` is called with `component: "card-actions"` and `output: "css"`
- **WHEN** no custom `name` is provided
- **THEN** the description says "Generated CSS custom properties for card component"

### Requirement: Child component platform availability delegates to parent

When the `create_component_theme` handler checks platform availability for a child component, it SHALL check the parent component's availability instead of the child's.

#### Scenario: Child component passes platform check via parent

- **GIVEN** `create_component_theme` is called with `component: "list-item"` and `platform: "angular"`
- **WHEN** the handler checks platform availability
- **THEN** it checks `isComponentAvailable("list", "angular")` (the parent)
- **AND** the request succeeds
