## Purpose

Document size, spacing, and roundness overrides emitted by layout tools.

## Requirements

### Requirement: Layout overrides emit CSS variable blocks

The `set_size`, `set_spacing`, and `set_roundness` tools emit CSS variable overrides scoped to component selectors or custom scopes.

#### Scenario: Size override with component selector

- **WHEN** `set_size` is called with `component` and `platform`
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

- **WHEN** `set_roundness` is called with `component` and `platform`
- **THEN** the response includes a platform-specific selector
- **AND** the block sets `--ig-radius-factor`
