## 1. Add `generatePresetImports()` utility

- [x] 1.1 Create `generatePresetImports()` function in `src/mcp/utils/sass.ts` that returns `@use` statements for typography and/or elevation presets based on platform and design system. Returns empty array for Angular. Uses `TYPOGRAPHY_PRESETS_PATHS` and elevations preset path from `common.ts`.
- [x] 1.2 Export `generatePresetImports` from `src/mcp/utils/sass.ts` and re-export from `src/mcp/generators/sass.ts` if needed by other modules.

## 2. Fix `generateTypography()` imports

- [x] 2.1 Update `generateTypography()` in `src/mcp/generators/sass.ts` to call `generatePresetImports()` with `includeTypography: true` and insert the returned lines after the base `@use` statement.
- [x] 2.2 Verify existing structural tests in `generateTypography` describe block still pass (they use `toContain()` so should be additive-safe).

## 3. Fix `generateElevations()` imports

- [x] 3.1 Update `generateElevations()` in `src/mcp/generators/sass.ts` to call `generatePresetImports()` with `includeElevations: true` and insert the returned lines after the base `@use` statement.
- [x] 3.2 Verify existing structural tests in `generateElevations` describe block still pass.

## 4. Fix `generateGenericTheme()` imports

- [x] 4.1 Update `generateGenericTheme()` in `src/mcp/generators/sass.ts` to call `generatePresetImports()` with both `includeTypography` and `includeElevations` flags (respecting the `includeTypography`/`includeElevations` input options) and insert the returned lines after the base `@use` statement.
- [x] 4.2 Verify existing structural tests in the `platform-agnostic` describe block still pass.

## 5. Expand `rewriteImportsForTesting()`

- [x] 5.1 Update `rewriteImportsForTesting()` in `src/mcp/__tests__/generators/sass.test.ts` to add a regex that rewrites `@use 'igniteui-theming/sass/...'` paths to `@use 'sass/...'` (strip the `igniteui-theming/` prefix). Use a broad pattern like `@use ['"]igniteui-theming/(.+?)['"]` to handle all sub-module paths generically.

## 6. Add Sass compilation tests

- [x] 6.1 Add compilation tests for `generateTypography`: test `isValidSass()` for `webcomponents`, `react`, `blazor`, and undefined platform. Also test all four design systems (`material`, `fluent`, `bootstrap`, `indigo`).
- [x] 6.2 Add compilation tests for `generateElevations`: test `isValidSass()` for `webcomponents`, `react`, `blazor`, and undefined platform. Include `indigo` design system variant.
- [x] 6.3 Add compilation tests for `generateTheme` generic path: test `isValidSass()` with default options (typography + elevations), with `includeTypography: false`, and with `includeElevations: false`.
- [x] 6.4 Add structural assertion that Angular platform output does NOT contain preset `@use` imports for both `generateTypography` and `generateElevations`.

## 7. Update guidance documentation

- [x] 7.1 Update `src/mcp/knowledge/docs/setup/platform.md` to document that non-Angular platforms require additional `@use` imports for typography and elevation preset modules when using preset variables.

## 8. Verify all tests pass

- [x] 8.1 Run the full test suite (`npx vitest run`) and confirm all existing and new tests pass.
