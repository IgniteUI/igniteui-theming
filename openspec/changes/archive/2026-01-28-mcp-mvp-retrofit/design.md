## Context

The MVP MCP server is implemented with tool handlers that produce Sass/CSS outputs using shared generators and knowledge catalogs. Tests encode expected output patterns and validation behavior. This design document captures the current architecture and the decisions already baked into the implementation.

```
MCP Tool Handler
  -> Generator (Sass/CSS)
  -> Knowledge Catalogs (presets, schemas, metadata)
  -> Validators (surface/gray, custom palette)
  -> MCP Response (text with fenced code)
```

## Goals / Non-Goals

Goals:

- Describe the MVP behavior that already exists in code and tests.
- Record platform-specific output paths and default behaviors.
- Clarify which validations are warnings vs hard errors.

Non-Goals:

- Add or change runtime behavior.
- Define future roadmap tools in this change.

## Decisions

### Decision 1: Platform-specific output is handled in generators

Angular output uses `core()` and `theme()` mixins with schema variables, while Web Components/React/Blazor share the Web Components generator that uses individual mixins (`palette`, `typography`, `elevations`, `spacing`). This keeps platform logic centralized in the generators and keeps handlers thin.

### Decision 2: Validation is non-blocking for palette suitability

Palette and theme generation emit warnings for surface/gray suitability but still return code. Only schema-level validation or invalid color values result in errors.

### Decision 3: Component theme output defaults to platform selectors

Component theme outputs use platform-specific selectors and variable prefixes (e.g., `igc-` for Web Components, `igx-` for Angular), and default to material/light when not specified.
