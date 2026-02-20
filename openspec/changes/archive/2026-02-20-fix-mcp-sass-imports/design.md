## Context

The MCP Sass code generators in `src/mcp/generators/sass.ts` produce `@use` import statements through a single utility function, `generateUseStatement()` (`src/mcp/utils/sass.ts:106`), which emits only the base module import:

- Angular: `@use "igniteui-angular/theming" as *;`
- All others: `@use 'igniteui-theming' as *;`

For Angular this is sufficient because `igniteui-angular/theming` re-exports all preset variables (type scales, elevations, typefaces). For non-Angular platforms, preset variables like `$material-type-scale` and `$material-elevations` are defined in separate sub-modules that must be explicitly imported:

- `@use 'igniteui-theming/sass/typography/presets/<designSystem>' as *;`
- `@use 'igniteui-theming/sass/elevations/presets' as *;`

The `create_theme` tool for Web Components/React/Blazor already handles this correctly via `generateWCImports()` in `src/mcp/knowledge/platforms/webcomponents.ts:98`, which adds the extra imports. However, the standalone `generateTypography()`, `generateElevations()`, and `generateGenericTheme()` functions lack equivalent logic.

The existing test suite (`src/mcp/__tests__/generators/sass.test.ts`) only has Sass compilation tests for `generatePalette` (which works because `palette()` is defined in the base module). The `rewriteImportsForTesting()` helper only rewrites the base `@use 'igniteui-theming'` import, not the preset sub-module paths.

## Goals / Non-Goals

**Goals:**

- All Sass code produced by standalone tools (`create_typography`, `create_elevations`) and generic theme generation compiles without errors on non-Angular platforms
- Compilation tests cover all generator functions across all platform variants, catching import regressions
- The `rewriteImportsForTesting()` utility correctly maps all `@use` paths (base + presets) to local filesystem paths for test-time compilation
- Platform setup guidance (`src/mcp/knowledge/docs/setup/platform.md`) documents the additional preset imports

**Non-Goals:**

- Changing Angular import behavior (it works correctly)
- Changing the Web Components/React/Blazor `create_theme` path (already correct via `generateWCImports()`)
- Modifying MCP tool schemas or input parameters
- Restructuring the `igniteui-theming` Sass package to auto-export presets from the base module
- Adding compilation tests for platform-specific theme generators (WC/React/Blazor) — these already work and are tested structurally

## Decisions

### 1. Add a `generatePresetImports()` utility function in `src/mcp/utils/sass.ts`

**Decision**: Create a new utility function that generates the additional `@use` statements for typography and/or elevation presets based on platform and design system.

**Rationale**: The existing `generateWCImports()` in `webcomponents.ts` handles this for the WC theme path but is tightly coupled to theme generation (it also handles palette presets, custom color logic, etc.). A focused utility that only handles preset imports is more reusable for standalone tools and the generic theme path.

**Signature**:

```typescript
function generatePresetImports(options: {
  platform?: Platform;
  designSystem?: DesignSystem;
  includeTypography?: boolean;
  includeElevations?: boolean;
}): string[];
```

**Behavior**:

- Returns an empty array for Angular (presets are re-exported by `igniteui-angular/theming`)
- Returns the appropriate `@use` statements for non-Angular platforms based on which presets are needed
- Uses `TYPOGRAPHY_PRESETS_PATHS` and the elevations preset path from `common.ts`

**Alternative considered**: Extending `generateUseStatement()` to accept preset options. Rejected because `generateUseStatement()` is used broadly and returning a single string (one `@use` line); changing its signature or return type would be a larger refactor with more risk.

### 2. Update generators to call `generatePresetImports()` after `generateUseStatement()`

**Decision**: Modify `generateTypography()`, `generateElevations()`, and `generateGenericTheme()` in `src/mcp/generators/sass.ts` to insert preset imports between the base `@use` and the mixin calls.

**Rationale**: Minimal, surgical change — each function gets 1-3 additional lines calling the new utility.

**Generated output order**:

```scss
// 1. Header comment
// 2. Base @use statement (from generateUseStatement)
// 3. Preset @use statements (from generatePresetImports) — NEW
// 4. Mixin call(s)
```

### 3. Expand `rewriteImportsForTesting()` to handle preset import paths

**Decision**: Update the regex replacements in `rewriteImportsForTesting()` to also rewrite preset module paths to local filesystem paths.

**Mapping**:
| Package path | Local path |
|---|---|
| `@use 'igniteui-theming' as *;` | `@use 'sass' as *;` (existing) |
| `@use 'igniteui-theming/sass/typography/presets/<ds>' as *;` | `@use 'sass/typography/presets/<ds>' as *;` |
| `@use 'igniteui-theming/sass/elevations/presets' as *;` | `@use 'sass/elevations/presets' as *;` |

**Rationale**: The test compilation uses `loadPaths: [PACKAGE_ROOT]` where `PACKAGE_ROOT` is the repo root. Local Sass files live under `sass/` at the repo root. Stripping the `igniteui-theming/` prefix maps to the correct local paths.

### 4. Add compilation tests for all generator functions across platforms

**Decision**: Add `isValidSass()` / `compileSass()` tests for:

- `generateTypography` — all non-Angular platforms (webcomponents, react, blazor, generic/undefined)
- `generateElevations` — all non-Angular platforms
- `generateTheme` (generic path) — no platform specified, with typography and elevations enabled

**Rationale**: These are the exact code paths that are currently broken. The tests will fail before the fix and pass after, providing regression protection.

**Test structure**: Follow the existing pattern from `generatePalette` tests — call the generator, then verify `await isValidSass(result.code)` is `true`.

### 5. Update platform setup guidance

**Decision**: Update `src/mcp/knowledge/docs/setup/platform.md` to mention that standalone typography/elevation tools on non-Angular platforms require additional `@use` imports for preset modules.

**Rationale**: The guidance currently only references `@use 'igniteui-theming' as *;` for generic mode. While the generators will now produce the correct imports automatically, the guidance should accurately document what imports are needed so the AI and users understand the dependency.

## Risks / Trade-offs

**[Risk] Existing tests may break if they assert exact code strings** → The fix adds new `@use` lines to generator output. Any tests doing exact string matching on the full output will fail. Mitigation: Review existing structural tests and update expected strings. The current tests mostly use `toContain()` checks which are additive-safe.

**[Risk] `rewriteImportsForTesting()` regex may not cover all import variations** → Different quote styles (single vs double) or future import paths could be missed. Mitigation: Use a broad regex pattern like `@use ['"]igniteui-theming/(.+?)['"]` that captures the sub-path generically rather than matching each preset path individually.

**[Trade-off] New utility vs reusing `generateWCImports()`** → Creating `generatePresetImports()` introduces a second function that partially overlaps with `generateWCImports()`. However, `generateWCImports()` does significantly more (palette imports, custom color branching, comments) and refactoring it to be reusable would be a larger change. The focused utility is the lower-risk path.
