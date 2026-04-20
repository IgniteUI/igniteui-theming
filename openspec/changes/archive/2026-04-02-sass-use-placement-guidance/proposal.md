## Why

LLM agents sometimes place `@use` rules in the middle of generated `.scss` files when combining outputs from multiple MCP tool calls (e.g. palette + component theme). Sass requires `@use` before any other statements, so misplacement breaks compilation. The MCP server currently provides no guidance about this constraint — each tool emits standalone code with its own `@use`, and there is no instruction on how to merge them.

## What Changes

- Add an inline comment above `@use` lines in all generated Sass output reminding that `@use` must appear at the top of the file and be deduplicated when combining outputs
- Add a placement/assembly note after each Sass code block in handler response text explaining the file-level `@use` constraint
- Add brief `@use` placement guidance to Sass-generating tool descriptions so the constraint is visible in tool metadata

## Capabilities

### New Capabilities

- `sass-use-placement-guidance`: Defines the `@use` placement guidance that Sass-generating tools must include in their output (inline comments, assembly notes, description text)

### Modified Capabilities

- `theme-generation`: Tool output now includes `@use` placement guidance in generated Sass and response text
- `palette-generation`: Tool output now includes `@use` placement guidance in generated Sass and response text
- `component-theming`: Tool output now includes `@use` placement guidance in generated Sass and response text

## Impact

- **Code**: `utils/sass.ts` (inline comment in `generateUseStatement`), all Sass-generating handlers (assembly note appended to response text), `tools/descriptions.ts` (brief `@use` note added to relevant tool descriptions)
- **Tests**: Verify inline comment and assembly note presence in handler output
- **Rollback**: Remove inline comments, assembly notes, and description additions; revert to current output format
