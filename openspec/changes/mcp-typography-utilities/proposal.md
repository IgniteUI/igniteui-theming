## Why

The MVP supports typography generation but lacks utilities for type styles, category lookups, and unit conversion. This change adds the missing typography tools from the roadmap.

## What Changes

- Add `create_type_style`, `get_type_scale_category`, and `convert_units` tools.
- Formalize typography utility outputs and usage examples.

## Capabilities

### New Capabilities

- `create_type_style`: Build a custom typography style map.
- `get_type_scale_category`: Return a category from a type scale.
- `convert_units`: Convert between px, rem, and em.

### Modified Capabilities

- None.

## Impact

- New tool handlers and schemas.
- Additional tests for typography utilities.
