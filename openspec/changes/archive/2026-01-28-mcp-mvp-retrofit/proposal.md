## Why

The MCP server MVP is already implemented, but its behavior exists only in code and tests. We need a baseline specification that captures what the system currently does so future changes can be measured as deliberate deltas instead of rediscovering the same behaviors.

## What Changes

- Document existing MCP tools, resources, and generators as implemented today.
- Capture validation behavior (warnings vs errors) and platform-specific output patterns.
- Establish explicit baseline requirements for future roadmap deltas.

## Capabilities

### New Capabilities

- `mcp-mvp-retrofit`: Formalized baseline specs for existing tools and resources.

### Modified Capabilities

- None. This change records current behavior only.

## Impact

- `openspec/changes/mcp-mvp-retrofit/proposal.md`: Baseline scope and intent.
- `openspec/changes/mcp-mvp-retrofit/design.md`: Architecture and decisions derived from current implementation.
- `openspec/changes/mcp-mvp-retrofit/tasks.md`: Documentation-only checklist.
- `openspec/changes/mcp-mvp-retrofit/specs/*/spec.md`: Requirements for implemented tools and resources.

## Out of Scope (Future Proposals)

- `mcp-color-intelligence`
- `mcp-typography-utilities`
- `mcp-validation-intelligence`
- `mcp-prompt-resources`
