## 1. Baseline Specs

- [x] 1.1 Document platform detection behavior and confidence rules
- [x] 1.2 Document palette generation (Sass + CSS) behavior and warnings
- [x] 1.3 Document custom palette modes and validation outcomes
- [x] 1.4 Document theme generation by platform and inclusion flags
- [x] 1.5 Document typography and elevations generation
- [x] 1.6 Document color reference (`get_color`) output behavior
- [x] 1.7 Document layout overrides (size/spacing/roundness)
- [x] 1.8 Document component theming rules and error handling
- [x] 1.9 Document CSS output formatting and validation constraints
- [x] 1.10 Document resources exposed by the server

## 2. Verify

- [x] 2.1 Cross-check each spec scenario against tests for accuracy
  - Platform detection: `src/mcp/__tests__/knowledge/platform-detection.test.ts`
  - Palette generation: `src/mcp/__tests__/tools/handlers/handlers.test.ts`, `src/mcp/__tests__/generators/sass.test.ts`, `src/mcp/__tests__/generators/css.test.ts`
  - Custom palette: `src/mcp/__tests__/tools/handlers/handlers.test.ts`, `src/mcp/__tests__/generators/css.test.ts`, `src/mcp/__tests__/tools/schemas.test.ts`
  - Theme generation: `src/mcp/__tests__/tools/handlers/handlers.test.ts`, `src/mcp/__tests__/generators/sass.test.ts`, `src/mcp/__tests__/knowledge/angular.test.ts`, `src/mcp/__tests__/knowledge/webcomponents.test.ts`
  - Typography/elevations: `src/mcp/__tests__/tools/handlers/handlers.test.ts`, `src/mcp/__tests__/generators/sass.test.ts`, `src/mcp/__tests__/knowledge/angular.test.ts`
  - Color reference: `src/mcp/__tests__/utils/color.test.ts`
  - Layout overrides: `src/mcp/__tests__/tools/handlers/handlers.test.ts`, `src/mcp/__tests__/tools/schemas.test.ts`
  - Component theming: `src/mcp/__tests__/tools/handlers/handlers.test.ts`, `src/mcp/__tests__/generators/css.test.ts`
  - CSS output: `src/mcp/__tests__/generators/css.test.ts`
  - Resources: no dedicated tests found (coverage gap)
- [x] 2.2 Note any missing coverage to feed future proposals
  - Added tests for `handleGetColor` and resource URIs
