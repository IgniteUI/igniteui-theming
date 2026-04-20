## MODIFIED Requirements

### Requirement: Component token schemas are exposed

The `get_component_design_tokens` tool SHALL use a unified output format across all component types (simple, compound, composed compound, child sub-component). All components SHALL present primary tokens in a prominent table with strict "use only these" instruction, and available (non-primary) tokens as a compact name list with strict "do not use" instruction. Compound and composed compound components SHALL include additional context sections between the primary and available tokens sections. For child sub-components, the response SHALL include a relationship note followed by the full parent theme's tokens.

#### Scenario: Unified primary tokens format

- **WHEN** `get_component_design_tokens` is called for any component with primary tokens
- **THEN** the response SHALL include a primary tokens section with a header indicating these are the tokens to use
- **AND** the section SHALL include an instruction stating that ONLY these tokens should be used for the initial theme and the framework auto-derives all other tokens
- **AND** the primary tokens SHALL be rendered as a table with columns: Token Name, Type, Description
- **AND** the table SHALL include ONLY the tokens listed in the component's `primaryTokens` field

#### Scenario: Unified available tokens format

- **WHEN** `get_component_design_tokens` is called for any component with non-primary tokens
- **THEN** the response SHALL include an available tokens section with a header indicating these should NOT be used unless explicitly requested
- **AND** the available tokens SHALL be rendered as a compact comma-separated name list (not a table)
- **AND** the list SHALL include ONLY tokens NOT in the `primaryTokens` field

#### Scenario: Unified next-step instruction

- **WHEN** `get_component_design_tokens` is called for any component
- **THEN** the next-step instruction SHALL reference **primary tokens** specifically
- **AND** SHALL state that available tokens should NOT be added unless the user explicitly asks

#### Scenario: Composed compound includes additional context

- **WHEN** `get_component_design_tokens` is called for a composed compound component (one with `composed: true`)
- **THEN** the response SHALL include the composed compound explanation between the primary tokens and available tokens sections
- **AND** the explanation SHALL state that the framework auto-derives child themes from primary tokens
- **AND** SHALL list the internally themed children
- **AND** SHALL instruct not to create separate themes for related components

#### Scenario: Compound component response uses instruction-oriented format

- **WHEN** `get_component_design_tokens` is called for a standard compound component (one with `compound` but without `composed: true`)
- **THEN** the response opens with `Implement a theme for the \`<name>\` component using the following guidance.`
- **AND** includes compound-specific context (related themes, scoping selectors, token derivations, guidance) between the primary tokens and available tokens sections

#### Scenario: Simple component response omits compound sections

- **WHEN** `get_component_design_tokens` is called for a non-compound component
- **THEN** the response opens with `Implement a theme for the \`<name>\` component using the following guidance.`
- **AND** includes the theme function name, primary tokens table, and available tokens list
- **AND** does NOT include compound-specific sections (related themes, scoping, derivations, guidance)

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

### Requirement: Composed component theme warns on non-primary tokens

The `create_component_theme` handler SHALL append an informational warning when a composed compound component is themed with non-primary tokens. The warning SHALL NOT prevent code generation — the theme code SHALL still be produced normally. This provides a feedback signal without breaking backward compatibility.

#### Scenario: Warning appended for non-primary tokens on composed component

- **GIVEN** `create_component_theme` is called for a composed compound component
- **WHEN** the provided tokens include tokens not in the component's `primaryTokens` field
- **THEN** the response SHALL include the generated theme code (Sass or CSS) as normal
- **AND** the response SHALL append a warning noting that only primary tokens are needed
- **AND** the warning SHALL list the primary token names
- **AND** the warning SHALL state that non-primary tokens override auto-derived values and may cause visual inconsistencies

#### Scenario: No warning for primary-only tokens on composed component

- **GIVEN** `create_component_theme` is called for a composed compound component
- **WHEN** all provided tokens are in the component's `primaryTokens` field
- **THEN** the response SHALL include the generated theme code without any composed component warning

#### Scenario: No warning for non-composed components

- **GIVEN** `create_component_theme` is called for a non-composed component (simple or standard compound)
- **WHEN** any valid tokens are provided
- **THEN** the response SHALL NOT include a composed component warning
