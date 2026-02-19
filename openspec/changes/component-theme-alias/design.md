## Context

Component metadata currently assumes each component has its own theme definition present in `themes.json`. Some components (e.g., tree-grid) style themselves using another component's Sass theme function, which causes `get_component_design_tokens` to fail when the requested theme is missing from `themes.json`. The proposal introduces a metadata-level alias to resolve these shared themes and avoid redundant Sass definitions.

## Goals / Non-Goals

**Goals:**

- Allow component metadata to declare a `theme` alias pointing to another component's theme.
- Resolve theme lookups in `get_component_design_tokens` via alias when the theme entry is missing.
- Preserve current behavior and error handling for components without aliases or with invalid references.

**Non-Goals:**

- Redesigning the `themes.json` format or theming system overall.
- Changing how Sass theme functions are implemented or generated.
- Adding new theming variants beyond alias resolution.

## Decisions

- Add optional `theme` field to component metadata entries. Rationale: keeps aliasing colocated with component definition and avoids duplicating theme records.
  - Alternative: duplicate theme entries in `themes.json` for each alias. Rejected because it perpetuates redundancy and requires manual syncing.
- Update `get_component_design_tokens` to resolve the effective theme in this order: direct theme match, metadata alias, then error. Rationale: preserves backward compatibility while enabling alias resolution.
  - Alternative: always resolve through metadata regardless of `themes.json`. Rejected to avoid breaking existing theme lookups and to keep `themes.json` authoritative when present.
- Validate alias references during metadata loading. Rationale: early detection of invalid component references prevents confusing runtime errors in the MCP tool.
  - Alternative: resolve lazily at lookup time only. Rejected due to poorer diagnostics and harder troubleshooting.

## Risks / Trade-offs

- Alias cycles or invalid references could cause confusing errors → Mitigation: add validation with clear error messages for unknown or self-referential aliases.
- Tooling behavior changes could affect consumers expecting failures for missing themes → Mitigation: only apply alias when explicitly configured; keep current errors otherwise.
- Additional metadata field increases schema complexity → Mitigation: make `theme` optional and document clearly in component metadata schema.

## Migration Plan

1. Introduce optional `theme` field in component metadata schema and validators.
2. Add alias entries for affected components (e.g., tree-grid -> grid) in metadata.
3. Update `get_component_design_tokens` to resolve alias and adjust error reporting.
4. Verify existing components without aliases behave unchanged.
5. Rollback: remove alias field usage and revert lookup to `themes.json` only.

## Open Questions

- Should alias resolution also apply when a theme exists but is incomplete compared to the referenced theme?
- Do we need a lint or CI check to prevent alias cycles and enforce allowed targets?
