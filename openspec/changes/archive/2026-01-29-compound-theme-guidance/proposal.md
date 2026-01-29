## Why

Some models ignore compound-component cues and only generate a single theme, which produces incomplete theming guidance for components like combo. We need deterministic prompting cues so compound-related themes are generated reliably without changing tool behavior.

## What Changes

- Update `get_component_design_tokens` response template to include a required compound checklist and scoped-selector table when applicable.
- Add explicit procedural guidance and failure criteria in `create_component_theme` tool description for compound workflows.
- Provide a canonical compound example (combo) in guidance to reinforce the expected multi-call flow.
- Rollback plan: revert the response template and tool description updates to the previous wording if the guidance causes regressions or confusion.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `component-theming`: Add requirements for compound-component guidance and checklist output in tool responses.

## Impact

- MCP tool descriptions and response templates for `get_component_design_tokens` and `create_component_theme`.
- Documentation/guidance that models read when deciding how to chain tool calls for compound components.
