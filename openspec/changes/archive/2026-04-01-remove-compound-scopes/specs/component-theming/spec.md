## MODIFIED Requirements

### Requirement: Component token schemas are exposed

The `get_component_design_tokens` tool SHALL use an instruction-oriented output format that varies based on whether the component is compound or simple. For compound components, the response SHALL include a flat related-themes list, parent selector per available platform, token derivations, and guidance. For simple components, the response SHALL include the theme function, primary tokens, and the token table without compound sections.

#### Scenario: Compound component response uses simplified format

- **WHEN** `get_component_design_tokens` is called for a compound component
- **THEN** the response opens with `Implement a theme for the `<name>` component using the following guidance.`
- **AND** includes a **Related themes** line listing all child theme names as inline code spans
- **AND** includes a scoping instruction stating all related themes scope under the parent component selector
- **AND** lists the parent selector for each available platform (Angular, Web Components / React / Blazor)
- **AND** does NOT include numbered Steps, per-platform scope tables, or per-platform related-themes tables

#### Scenario: Simple component response omits compound sections

- **WHEN** `get_component_design_tokens` is called for a non-compound component
- **THEN** the response opens with `Implement a theme for the `<name>` component using the following guidance.`
- **AND** includes the theme function name, primary tokens, and available tokens table
- **AND** does NOT include related themes, scoping instructions, token derivations, or guidance sections

#### Scenario: Token schema lookup

- **WHEN** `get_component_design_tokens` is called with a component name
- **THEN** the response lists supported tokens and variant hints

### Requirement: Compound checklist is ordered and minimal

The compound component response SHALL present related themes as a flat inline-code list, followed by a single scoping instruction with per-platform parent selectors.

#### Scenario: Related themes list format

- **WHEN** the compound component response is generated
- **THEN** it lists related themes as inline code spans on a single **Related themes** line (e.g., `` `calendar`, `flat-button`, `input-group` ``)
- **AND** does NOT use tables for the related themes list

#### Scenario: Scoping instruction format

- **WHEN** the compound component response includes platform selectors
- **THEN** it states "Scope all related themes under the parent component selector:" followed by a bullet per available platform
- **AND** each bullet shows the platform name in bold and the selector in backticks

### Requirement: Platform groups reflect theming strategy

The `get_component_design_tokens` response SHALL group platforms into two theming strategies: "Angular" and "Web Components / React / Blazor". React and Blazor wrap Web Components and use identical selectors (`igc-`), variable prefixes (`--ig-`), and scoping.

#### Scenario: Two platform lines for compound components

- **WHEN** `get_component_design_tokens` is called for a compound component available on both Angular and Web Components
- **THEN** the scoping instruction shows exactly two bullet lines: one for "Angular" and one for "Web Components / React / Blazor"
- **AND** uses `webcomponents` as the representative platform for selector resolution in the WC group

#### Scenario: Angular-only component omits WC line

- **WHEN** `get_component_design_tokens` is called for a compound component with `webcomponents: null` (e.g., `time-picker`)
- **THEN** the scoping instruction shows only one bullet line for "Angular"
- **AND** does NOT show a "Web Components / React / Blazor" line

### Requirement: Irrelevant platform entries are omitted

The response SHALL omit platform lines where the component has no selector. This prevents showing misleading N/A entries for platforms where the component is not available.

#### Scenario: Unavailable platform omitted

- **WHEN** a compound component has `null` for a platform's selector
- **THEN** the scoping instruction does NOT include a bullet line for that platform

#### Scenario: All available platforms shown

- **WHEN** a compound component has non-null selectors for both Angular and Web Components
- **THEN** the scoping instruction includes bullet lines for both "Angular" and "Web Components / React / Blazor"

## REMOVED Requirements

### Requirement: Irrelevant scope rows are omitted

**Reason**: The scope concept (inline vs overlay) has been removed entirely. There are no scope rows to omit — all children scope under the parent selector. The "omit N/A scope rows" behavior is subsumed by the new "omit unavailable platform lines" requirement.

**Migration**: No migration needed. The replacement requirement "Irrelevant platform entries are omitted" covers the same intent (don't show N/A entries) but at the platform level rather than the scope level.
