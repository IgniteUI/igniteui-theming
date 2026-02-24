## Why

Some components use a theme implemented by another component (e.g., tree-grid uses the grid theme), but `get_component_design_tokens` fails when the requested theme is not in `themes.json`. This forces redundant Sass theme definitions to work around an MCP limitation; we need a metadata-level alias to make theme lookup reliable and reduce duplication.

## What Changes

- Allow component metadata to declare a `theme` field that references another component's theme.
- Update `get_component_design_tokens` to resolve a requested theme via metadata alias when the theme is missing from `themes.json`.
- Preserve existing behavior for components without aliases and keep error handling for invalid references.

## Capabilities

### New Capabilities

- `component-theme-alias`: Support component metadata aliasing for theme resolution in design token tooling.

### Modified Capabilities

- `component-theming`: Add requirements for alias-based theme resolution in `get_component_design_tokens` when a theme is missing from `themes.json`.

## Impact

- Component metadata schema and validation.
- MCP tooling behavior for `get_component_design_tokens` and theme lookup logic.
- Sass theme usage for affected components (e.g., tree-grid).
- Rollback plan: remove the metadata `theme` field usage and revert theme resolution to require entries in `themes.json`.
