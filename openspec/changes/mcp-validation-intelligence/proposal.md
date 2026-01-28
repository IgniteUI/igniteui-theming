## Why

The MVP can generate Sass/CSS and emits warnings, but does not provide a formal validation tool or explain function behavior. This change adds validation and explanation utilities.

## What Changes

- Add `validate_theme` for Sass validation with structured errors.
- Add `explain_function` for theming API documentation.

## Capabilities

### New Capabilities

- `validate_theme`: Validate theme code and return diagnostics.
- `explain_function`: Provide documentation for theming functions.

### Modified Capabilities

- None.

## Impact

- New validation tooling with Sass compilation.
- Documentation access via a dedicated tool.
