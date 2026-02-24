## Context

Sass compilation utilities are already used for CSS output, but there is no tool that validates theme code or interprets errors. Documentation exists in knowledge catalogs but is not exposed via a tool.

## Goals / Non-Goals

Goals:

- Validate Sass input and return diagnostics.
- Provide function explanations from the theming API knowledge base.

Non-Goals:

- Replace existing generation tools.

## Decisions

### Decision 1: Validation returns structured diagnostics

Diagnostics should include severity, summary, and location if available so clients can render helpful messages.

### Decision 2: Function explanations are read-only

The explain tool returns curated documentation and does not modify the codebase.
