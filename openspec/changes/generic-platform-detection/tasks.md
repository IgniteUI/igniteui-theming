## 1. Core Type System

- [x] 1.1 Add `"generic"` to the `PLATFORMS` array in `src/mcp/utils/types.ts:24` and update the JSDoc comment above it
- [x] 1.2 Add `generic: []` to `IGNITE_PACKAGE_PATTERNS` in `src/mcp/knowledge/platforms/index.ts:128` (fixes compile error)
- [x] 1.3 Add `generic: "ig"` to `PLATFORM_VARIABLE_PREFIX` in `src/mcp/knowledge/platforms/index.ts:415` (fixes compile error)
- [x] 1.4 Add `generic` entry to `PLATFORM_METADATA` in `src/mcp/knowledge/platforms/index.ts:445` with `name: "Ignite UI Theming (Standalone)"`, `shortName: "Generic"`, `packageName: "igniteui-theming"`, `themingModule: "igniteui-theming"`
- [x] 1.5 Rename `default` key to `generic` in `IMPORT_PATHS` in `src/mcp/knowledge/sass-api.ts:31` and update `getImportPath()` default case at line 51 to reference `IMPORT_PATHS.generic`
- [x] 1.6 Verify the build compiles with `npm run build` — all Record and type errors resolved

## 2. Detection Logic

- [x] 2.1 In `detectPlatformFromDependencies()` at `src/mcp/knowledge/platforms/index.ts:322-330`, change the "no signals" return from `platform: null` to `platform: "generic"` with `confidence: "none"`
- [x] 2.2 Update the framework-only detection path (score < 60, single platform) so that when no Ignite UI package was found the result returns `platform: "generic"` with `confidence: "low"` and the detected framework signals
- [x] 2.3 Update the config-file-only detection path (score 60-80 from config files, no Ignite UI package) so that when no Ignite UI package was found the result returns `platform: "generic"` with `confidence: "low"` and the config file signals
- [x] 2.4 Ensure ambiguous detection (multiple Ignite UI products) still returns `platform: null` — no change needed, verify only
- [x] 2.5 Ensure error paths in `handleDetectPlatform()` at `src/mcp/tools/handlers/platform.ts:93-118` still return `platform: null` — no change needed, verify only

## 3. Platform Detection Handler Response

- [x] 3.1 Add a new response branch in `handleDetectPlatform()` at `src/mcp/tools/handlers/platform.ts` for `platform === "generic"` (between the ambiguous and single-platform branches)
- [x] 3.2 In the generic branch, add a "Tool Eligibility" section listing usable tools: `create_palette`, `create_custom_palette`, `create_typography`, `create_elevations`, `create_theme`, `set_size`/`set_spacing`/`set_roundness` (scope only, no component), `get_color`, `read_resource`
- [x] 3.3 In the generic branch, add a "Not Available in Generic Mode" section listing: `create_component_theme`, `get_component_design_tokens` with explanation that they target Ignite UI framework components
- [x] 3.4 In the generic branch, add a "Sass Configuration" section that inspects `result.signals` for config file signals and emits framework-specific `includePaths` guidance (angular.json → stylePreprocessorOptions, vite.config → css.preprocessorOptions.scss.includePaths, next.config → sassOptions.includePaths, fallback → general guidance)
- [x] 3.5 In the generic branch, add an "Installation" note: if `igniteui-theming` is not in dependencies, note CSS output works without local installation; Sass output requires `igniteui-theming` resolvable via `node_modules`
- [x] 3.6 Update the `DetectPlatformResult` interface to add `platformInfo` for `"generic"` from `PLATFORM_METADATA`
- [x] 3.7 Update the "no platform" response branch (lines 228-238) to only render for `platform: null` (error/ambiguous states), not for `"generic"`

## 4. Handler Updates

- [x] 4.1 In `src/mcp/tools/handlers/component-theme.ts`, add a guard near line 35 that rejects `platform === "generic"` with an error explaining component theming requires a specific Ignite UI product platform
- [x] 4.2 In `src/mcp/tools/handlers/layout.ts`, change the `resolveScope()` condition from `if (platform)` to `if (platform && platform !== "generic")` so generic falls through to the undefined/merged-selectors path
- [x] 4.3 In `src/mcp/tools/handlers/theme.ts:85`, add explicit `case "generic":` with `platformNote = "Platform: Ignite UI Theming (Standalone)"`
- [x] 4.4 In `src/mcp/generators/sass.ts:162`, add explicit `case "generic":` before `default:` routing to `generateGenericTheme()`

## 5. Display Name Fixes

- [x] 5.1 Replace binary ternary in `src/mcp/tools/handlers/palette.ts:139` with `PLATFORM_METADATA[platform]?.name` lookup (import PLATFORM_METADATA if not already imported)
- [x] 5.2 Replace binary ternary in `src/mcp/tools/handlers/typography.ts:23` with `PLATFORM_METADATA` lookup
- [x] 5.3 Replace binary ternary in `src/mcp/tools/handlers/elevations.ts:21` with `PLATFORM_METADATA` lookup
- [x] 5.4 Replace binary ternary in `src/mcp/tools/handlers/custom-palette.ts:276` with `PLATFORM_METADATA` lookup
- [x] 5.5 Replace binary ternary in `src/mcp/tools/handlers/component-theme.ts:115` with `PLATFORM_METADATA` lookup
- [x] 5.6 Review `component-theme.ts:203,273` display patterns and update if they produce wrong output for `"generic"` (may be unreachable due to the guard in 4.1)

## 6. Tool Description Updates

- [x] 6.1 Update `FRAGMENTS.PLATFORM` in `src/mcp/tools/descriptions.ts:23` to list `"generic"` as a valid option for platform-agnostic output
- [x] 6.2 Update `detect_platform` tool description in `descriptions.ts:66` to document `"generic"` as a possible return value and what it means for tool usage
- [x] 6.3 Update `set_size` tool description in `descriptions.ts:584` to note that `component` should not be used with `platform: "generic"` — use `scope` instead
- [x] 6.4 Update `set_spacing` tool description in `descriptions.ts:626` with the same generic/scope guidance
- [x] 6.5 Update `set_roundness` tool description in `descriptions.ts:671` with the same generic/scope guidance
- [x] 6.6 Update `get_component_design_tokens` tool description in `descriptions.ts:708` to note it returns tokens for Ignite UI framework components and is not useful with `platform: "generic"`
- [x] 6.7 Update `PARAM_DESCRIPTIONS.layoutComponent` in `descriptions.ts:1124` to note `component` targets Ignite UI components and should not be used with `"generic"` platform

## 7. Resources

- [x] 7.1 Add `PLATFORM_GENERIC` URI constant in `src/mcp/resources/presets.ts:68`
- [x] 7.2 Add resource definition entry for `theming://platforms/generic` in the `RESOURCE_DEFINITIONS` array around line 101
- [x] 7.3 Add `"generic"` to the hardcoded `platforms` array in the PLATFORMS resource handler at line 280
- [x] 7.4 Add a resource handler for `PLATFORM_GENERIC` URI that returns generic platform metadata with common presets (schemas, palettes, typefaces, typography, elevations)

## 8. Tests

- [x] 8.1 Update platform detection tests in `src/mcp/__tests__/knowledge/platform-detection.test.ts` — change assertions from `platform: null, confidence: "none"` to `platform: "generic"` for the "no detection" scenario
- [x] 8.2 Add test: framework-only detection (e.g., `react` in deps, no Ignite UI package) returns `platform: "generic"` with `confidence: "low"`
- [x] 8.3 Add test: config-file-only detection (e.g., `angular.json` exists, no Ignite UI package) returns `platform: "generic"` with `confidence: "low"`
- [x] 8.4 Verify existing test: ambiguous detection still returns `platform: null` with `ambiguous: true`
- [x] 8.5 Add test: `create_component_theme` handler rejects `platform: "generic"` with appropriate error
- [x] 8.6 Add test: layout `resolveScope()` with `platform: "generic"` behaves same as `undefined`
- [x] 8.7 Run full test suite with `npm test` and fix any failures
- [x] 8.8 Run build with `npm run build` to verify no type errors remain
