## Why

The MVP provides palette generation and basic color guidance, but does not yet include palette suggestions or contrast checking. This change introduces color intelligence tools to help users pick palettes and validate accessibility.

## What Changes

- Add `suggest_palette` and `check_contrast` tools.
- Expose schema resources referenced in the roadmap for color guidance.
- Define inputs, outputs, and user-facing guidance for color intelligence.

## Capabilities

### New Capabilities

- `suggest_palette`: Recommend palette colors from descriptive inputs.
- `check_contrast`: Report WCAG contrast ratio and pass/fail status.

### Modified Capabilities

- Color guidance resources extended with schema access.

## Impact

- New tool handlers and schemas for color intelligence.
- Updated resource registry for schema resources.
- Additional tests for suggestion and contrast behaviors.
