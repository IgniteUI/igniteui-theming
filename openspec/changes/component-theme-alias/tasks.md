## 1. Metadata schema and validation

- [x] 1.1 Locate component metadata schema/loader and document current shape
- [x] 1.2 Add optional `theme` field to the metadata schema/types
- [x] 1.3 Implement validation for alias targets (exists, not self-referential, no cycles if applicable)
- [x] 1.4 Add or update metadata fixtures for an alias example (e.g., tree-grid -> grid)

## 2. Theme resolution behavior

- [x] 2.1 Identify `get_component_design_tokens` theme lookup path and error behavior
- [x] 2.2 Implement resolution order: direct `themes.json` match, metadata alias, then error
- [x] 2.3 Ensure invalid alias surfaces a clear error distinct from missing theme
- [x] 2.4 Verify non-aliased components preserve existing behavior

## 3. Tests and verification

- [x] 3.1 Add tests for alias resolution when theme is missing
- [x] 3.2 Add tests for invalid alias targets and self-references
- [x] 3.3 Update or add snapshots/fixtures if required by test harness
- [x] 3.4 Run relevant test suite (vitest) for component theming tools
