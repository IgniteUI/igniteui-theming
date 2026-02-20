## Why

MCP tools that generate Sass code for non-Angular platforms produce broken output. The `create_typography`, `create_elevations`, and `create_theme` (generic platform) tools emit references to preset variables (e.g., `$material-type-scale`, `$material-elevations`) without the corresponding `@use` imports that define them. The generated Sass fails to compile. Angular is unaffected because its `igniteui-angular/theming` module re-exports all presets; Web Components/React/Blazor are partially unaffected for `create_theme` because `generateWCImports()` correctly adds the extra imports. However, the standalone `create_typography` and `create_elevations` tools are broken for **all** non-Angular platforms, and `create_theme` is broken for the generic/unspecified platform path.

## What Changes

- Fix `generateTypography()` in `src/mcp/generators/sass.ts` to include the typography preset import (`@use 'igniteui-theming/sass/typography/presets/<designSystem>' as *;`) for non-Angular platforms
- Fix `generateElevations()` in `src/mcp/generators/sass.ts` to include the elevations preset import (`@use 'igniteui-theming/sass/elevations/presets' as *;`) for non-Angular platforms
- Fix `generateGenericTheme()` in `src/mcp/generators/sass.ts` to include both typography and elevations preset imports when those sections are enabled
- Add Sass compilation tests for `generateTypography`, `generateElevations`, and `generateTheme` (generic path) to verify produced Sass compiles without errors across all platform variants
- Update `rewriteImportsForTesting()` in the test utilities to handle rewriting the additional preset import paths for test-time compilation
- Update any MCP guidance/knowledge content that instructs users to reference presets without the required imports for non-Angular platforms

## Capabilities

### New Capabilities

- `sass-compilation-tests`: Sass compilation verification tests for all MCP tool outputs across all platform variants, ensuring generated code actually compiles

### Modified Capabilities

- `typography`: The `create_typography` tool must emit correct `@use` imports for typography presets on non-Angular platforms, not just the base module import
- `elevations`: The `create_elevations` tool must emit correct `@use` imports for elevation presets on non-Angular platforms, not just the base module import
- `theme-generation`: The `create_theme` tool's generic/unspecified platform path must emit correct `@use` imports for both typography and elevation presets

## Impact

- **Code**: `src/mcp/generators/sass.ts` (core fix), `src/mcp/utils/sass.ts` (may need new utility for preset import generation), `src/mcp/__tests__/generators/sass.test.ts` (new compilation tests)
- **APIs**: No changes to tool schemas or MCP protocol; tool inputs remain the same, only the generated Sass output is corrected
- **Dependencies**: None; the preset modules already exist in the `igniteui-theming` package
- **Rollback plan**: Revert the generator changes in `sass.ts`; the compilation tests can remain as they validate correctness regardless
