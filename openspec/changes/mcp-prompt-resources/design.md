## Context

Prompts are currently implicit in usage examples but not exposed as resources. The roadmap expects structured prompts for common theming tasks.

## Goals / Non-Goals

Goals:

- Define prompt resource URIs and content types.
- Provide consistent structure for prompt content.

Non-Goals:

- Implement new tool behaviors.

## Decisions

### Decision 1: Prompt resources are read-only

Prompts are delivered as static content for clients to use or adapt.

### Decision 2: Prompts live under the theming://docs or theming://prompts namespace

Final URI scheme will be selected during spec definition.
