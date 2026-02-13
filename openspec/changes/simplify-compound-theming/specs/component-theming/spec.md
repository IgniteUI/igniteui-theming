## MODIFIED Requirements

### Requirement: Component theming requires platform

The `create_component_theme` tool requires a `platform` parameter and SHALL specify compound-component completeness rules to reduce incomplete outputs.

#### Scenario: Missing platform

- **WHEN** `platform` is not provided
- **THEN** the tool returns an error indicating `platform` is required

#### Scenario: Compound guidance treated as completeness criteria

- **WHEN** a user requests theming for a compound component
- **THEN** the guidance states the response is incomplete if related theme calls are omitted
- **AND** the guidance instructs the model to use `@include tokens(child-theme(...))` inside the compound component's selector for each related theme

#### Scenario: Canonical compound example provided

- **WHEN** a compound component is detected
- **THEN** guidance includes a short canonical example demonstrating the multi-call flow using the `tokens` mixin and derivation hints

### Requirement: Component token schemas are exposed

The `get_component_design_tokens` tool SHALL explicitly indicate when a component is compound and provide an actionable checklist with token derivation hints for generating related themes.

#### Scenario: Compound component response includes derivation-aware checklist

- **WHEN** `get_component_design_tokens` is called for a compound component
- **THEN** the response includes a "Related themes and token derivations" section listing each related theme
- **AND** each related theme with derivation rules SHALL show the target token, transform function, and source token
- **AND** the response includes the resolved compound selector for the target platform
- **AND** the response instructs the model to call `get_component_design_tokens` and `create_component_theme` for each related theme using the compound selector

#### Scenario: Token schema lookup

- **WHEN** `get_component_design_tokens` is called with a component name
- **THEN** the response lists supported tokens and variant hints

### Requirement: Sass output uses tokens mixin

The `create_component_theme` tool SHALL generate Sass code using `@include tokens(...)` in global mode instead of `@include css-vars-from-theme(...)`.

#### Scenario: Component theme Sass output

- **WHEN** `create_component_theme` generates Sass code
- **THEN** the output uses `@include tokens($theme-variable)` inside the component selector
- **AND** the output does NOT use `css-vars-from-theme`

#### Scenario: Theme variable has no prefix argument

- **WHEN** `@include tokens(...)` is emitted
- **THEN** it takes only the theme variable as an argument (no variable name prefix)

### Requirement: Compound checklist is ordered and minimal

The checklist SHALL be ordered and concise, including derivation hints inline, to minimize response length while preserving determinism.

#### Scenario: Checklist with derivations

- **WHEN** the checklist is generated for a compound component with token derivations
- **THEN** each related theme is listed with its derivation rules indented beneath it

#### Scenario: Checklist without derivations

- **WHEN** the checklist is generated for a compound component without token derivations
- **THEN** each related theme is listed by name only, without derivation sub-items

## REMOVED Requirements

### Requirement: Inner selector handling

**Reason**: The `tokens` mixin emits `--ig-{component}-{token}` CSS variables that are consumed by child components via `var()` fallback. Inner selectors are no longer needed for scoping child themes within compound components.

**Migration**: Use the compound component's own selector (or `selectorOverrides` from `compound-theming.ts`) as the wrapper for all `@include tokens(...)` calls. Derivation hints from `COMPOUND_THEMING` replace the structural inner-selector table.

The following are removed:

- `CompoundInnerSelectors` interface
- `innerSelectors` property on `CompoundComponentInfo`
- All inner selector data on compound component entries
- Functions: `getPartSelector`, `getAngularInnerSelector`, `getInnerSelector`, `hasPartSelectors`, `hasAngularInnerSelectors`, `hasInnerSelectors`, `getAllPartSelectors`, `getAllAngularInnerSelectors`, `getAllInnerSelectors`
- Handler logic that formats inner selectors into a table
- "Missing selector entries are handled" scenario (selectors are no longer per-child-theme)
