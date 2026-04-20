## Context

Typography presets and scales exist in the knowledge catalog, but there are no direct utilities for creating type styles, extracting categories, or converting units.

## Goals / Non-Goals

Goals:

- Expose type style creation in a tool-friendly format.
- Allow category lookup from a type scale.
- Provide unit conversion helpers for px/rem/em.

Non-Goals:

- Replace or modify existing typography generation output.

## Decisions

### Decision 1: Type style output matches Sass map shape

Return values should align with existing Sass type-style structures to enable direct use in theme mixins.

### Decision 2: Unit conversion is deterministic

Conversion requires a base context and returns a plain numeric string with unit suffix.
