## MODIFIED Requirements

### Requirement: Layout overrides emit CSS variable blocks

The `set_size`, `set_spacing`, and `set_roundness` tools emit CSS variable overrides scoped to component selectors or custom scopes.

#### Scenario: Size override with component selector

- **WHEN** `set_size` is called with `component` and a product `platform` (angular, webcomponents, react, or blazor)
- **THEN** the response includes a platform-specific selector
- **AND** the block sets `--ig-size`

#### Scenario: Spacing override requires spacing

- **WHEN** `set_spacing` is called without `spacing`
- **THEN** validation fails

#### Scenario: Spacing override emits custom scope

- **WHEN** `set_spacing` is called with `scope`
- **THEN** the response includes the scope selector
- **AND** the block sets `--ig-spacing`

#### Scenario: Roundness override bounds

- **WHEN** `radiusFactor` is outside `0..1`
- **THEN** validation fails

#### Scenario: Roundness override emits platform selector

- **WHEN** `set_roundness` is called with `component` and a product `platform` (angular, webcomponents, react, or blazor)
- **THEN** the response includes a platform-specific selector
- **AND** the block sets `--ig-radius-factor`

#### Scenario: Generic platform treats scope resolution like undefined

- **WHEN** any layout tool is called with `platform: "generic"` and `component` is provided
- **THEN** the tool SHALL treat the scope resolution the same as when `platform` is `undefined`
- **AND** the response SHALL merge both Angular and Web Components selectors for the component

#### Scenario: Generic platform with scope only

- **WHEN** any layout tool is called with `platform: "generic"` and `scope` but no `component`
- **THEN** the response SHALL use the provided `scope` selector
- **AND** the block SHALL set the appropriate CSS variable

#### Scenario: Generic platform with no component or scope

- **WHEN** any layout tool is called with `platform: "generic"` and neither `component` nor `scope`
- **THEN** the response SHALL use `:root` as the selector
