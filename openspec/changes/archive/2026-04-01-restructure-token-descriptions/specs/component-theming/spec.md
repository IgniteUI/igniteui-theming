## MODIFIED Requirements

### Requirement: Component token schemas are exposed

The `get_component_design_tokens` tool SHALL use an instruction-oriented output format that varies based on whether the component is compound or simple. For compound components, the response SHALL include numbered steps, per-platform scope tables, related theme tables, token derivations, and guidance. For simple components, the response SHALL include the theme function, primary tokens, and the token table without compound sections.

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

#### Scenario: Missing selector entries are handled

- **WHEN** a compound component has related themes without scoped selectors (e.g., selector is `TODO`)
- **THEN** the checklist marks those related themes as skipped and explains that selector data is missing

#### Scenario: Token schema lookup

- **WHEN** `get_component_design_tokens` is called with a component name
- **THEN** the response lists supported tokens and variant hints

### Requirement: Compound checklist is ordered and minimal

The compound component response SHALL present related themes in ordered tables grouped by platform, without additional narrative beyond the guidance paragraph.

#### Scenario: Checklist length control

- **WHEN** the compound component response is generated
- **THEN** it lists related themes in platform-specific tables with columns: Theme, Scope, Selector
- **AND** does NOT include additional narrative in the tables themselves

## ADDED Requirements

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
