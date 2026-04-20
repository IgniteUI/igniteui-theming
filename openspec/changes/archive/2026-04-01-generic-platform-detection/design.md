## Context

The `detect_platform` tool currently returns `platform: null` with `confidence: "none"` when no Ignite UI product framework is found. This treats all non-Ignite-UI projects as unsupported, even though the majority of MCP tools produce valid platform-agnostic output (palette, typography, elevations, theme generation, color references, layout tokens). The `"generic"` platform value fills this gap.

The `Platform` type is defined in `src/mcp/utils/types.ts` as a union derived from the `PLATFORMS` const array. This type flows through the entire codebase: Zod schemas, detection logic, code generators, tool handlers, resource definitions, and display formatting. Two `Record<Platform, ...>` objects enforce compile-time completeness (`IGNITE_PACKAGE_PATTERNS`, `PLATFORM_VARIABLE_PREFIX`), while others (`PLATFORM_METADATA`, `IMPORT_PATHS`) use `as const` and require manual addition.

The codebase has a binary display name pattern (`=== "angular" ? "Ignite UI for Angular" : "Ignite UI for Web Components"`) in ~5 handlers that will silently produce wrong output for `"generic"`. The component metadata system (`component-metadata.ts`) is fundamentally binary (angular/webcomponents selectors), making component-specific tools incompatible with generic mode by design.

## Goals / Non-Goals

**Goals:**

- Make `"generic"` a first-class `Platform` member so TypeScript enforces handling across the codebase
- Return `"generic"` from detection when no Ignite UI product is found, reserving `null` for error states only
- Communicate tool eligibility clearly in the detection response (what works in generic mode, what doesn't)
- Surface Sass load path guidance based on detected framework config files
- Note the CSS-output-works-without-installation path for users who don't have `igniteui-theming` locally
- Update tool descriptions so that LLMs using the MCP behave correctly with `"generic"` platform

**Non-Goals:**

- Deep detection for non-Ignite-UI frameworks (Vue, Svelte, Solid, etc.) — these naturally fall into `"generic"`
- Changes to the component metadata system — it remains binary (angular/webcomponents)
- Adding CSS output support to Sass-only tools (`create_theme`, `create_typography`, `create_elevations`)
- Making `create_component_theme` or `get_component_design_tokens` work in generic mode — they are inherently Ignite UI product-specific

## Decisions

### Decision 1: Add `"generic"` to the `PLATFORMS` array (compile-enforced ripple)

Add `"generic"` to `src/mcp/utils/types.ts:24`. This causes compile errors in the two `Record<Platform, ...>` objects, which is the desired forcing function. All other locations need manual review and addition.

**Alternative considered:** Keep `Platform` as the 4 product platforms and handle generic as a separate code path only in the detection handler. Rejected because it leaves every downstream handler unaware of generic mode, causing silent fallthrough to incorrect behavior in switch statements and ternary expressions. The compile-enforced approach ensures nothing is missed.

### Decision 2: Detection returns `"generic"` instead of `null` for non-error cases

In `detectPlatformFromDependencies()` (`platforms/index.ts:322-330`), the "no signals" path and the "framework-only" path now return `platform: "generic"` instead of `platform: null`. The `null` return is reserved for:

- `package.json` read/parse errors (handler level, `platform.ts:108-118`)
- Invalid `package.json` structure (handler level, `platform.ts:93-99`)
- Ambiguous detection with multiple Ignite UI products (detection level, `platforms/index.ts:344-379`)

**Why this split:** `null` means "we can't determine anything, something went wrong or is ambiguous." `"generic"` means "we successfully determined no Ignite UI product is in use; the theming library can still be used standalone."

The confidence level for `"generic"` carries context:

- Framework/config file detected but no Ignite UI product → `"low"` (we know the ecosystem, just no product)
- Nothing detected at all → `"none"` (bare project or global installation scenario)

### Decision 3: Rename `IMPORT_PATHS.default` to `IMPORT_PATHS.generic`

In `src/mcp/knowledge/sass-api.ts`, the `IMPORT_PATHS` object has a `default` key that serves the same purpose as `"generic"`. Rename it for consistency with the type system. The `getImportPath()` switch `default:` case continues to reference `IMPORT_PATHS.generic`, so `undefined` platform still resolves correctly.

**Alternative considered:** Keep `default` and add a separate `generic` key with the same value. Rejected because it's redundant and the naming inconsistency is confusing.

### Decision 4: `PLATFORM_METADATA` entry for `"generic"`

Add to `platforms/index.ts`:

```
generic: {
    id: "generic",
    name: "Ignite UI Theming (Standalone)",
    shortName: "Generic",
    packageName: "igniteui-theming",
    themingModule: "igniteui-theming",
    description: "Platform-agnostic output using igniteui-theming directly. ..."
}
```

This enables `PLATFORM_METADATA[platform]?.name` lookups to replace all binary ternary display name patterns. The name "Ignite UI Theming (Standalone)" communicates that it's the theming library used independently of any product framework.

### Decision 5: Replace binary display name ternaries with `PLATFORM_METADATA` lookups

The pattern `platform === "angular" ? "Ignite UI for Angular" : "Ignite UI for Web Components"` appears in `palette.ts:139`, `typography.ts:23`, `elevations.ts:21`, `custom-palette.ts:276`, and `component-theme.ts:115`. Replace all with:

```typescript
const displayName = platform ? (PLATFORM_METADATA[platform]?.name ?? platform) : 'Not specified (generic output)';
```

This handles all 5 platform values plus `undefined` correctly without a switch or if-chain.

### Decision 6: `create_component_theme` rejects `"generic"` at handler level, not schema level

The `createComponentThemeSchema` uses `z.enum(PLATFORMS)` (required, not optional) at `schemas.ts:366`. Adding `"generic"` to `PLATFORMS` means the schema accepts it. Rather than creating a separate `PRODUCT_PLATFORMS` array to exclude `"generic"` from this schema, reject it in the handler with a clear error message.

**Rationale:** Keeping a single `PLATFORMS` source of truth is simpler. The handler already has a guard for missing platform (`component-theme.ts:35`). Adding a `"generic"` guard next to it is consistent and produces better error messages than a Zod validation error would.

### Decision 7: Layout tools treat `"generic"` like `undefined` for scope resolution

In `layout.ts`, the `resolveScope()` function uses `if (platform)` to decide whether to resolve platform-specific component selectors. Change the condition to `if (platform && platform !== "generic")` so that `"generic"` falls through to the `undefined` path, which merges both Angular and Web Components selectors.

This is the correct behavior because the `component` parameter on layout tools targets Ignite UI component selectors, which don't exist in a generic project. The tool descriptions will guide LLMs to use `scope` instead, but the handler should still produce reasonable output if `component` is passed with `"generic"` anyway.

### Decision 8: `detect_platform` response for `"generic"` includes tool eligibility and load path guidance

The `handleDetectPlatform()` function in `platform.ts` builds the response text. Add a new branch for `platform === "generic"` (alongside the existing branches for ambiguous, single platform detected, and null/error). This branch produces:

1. **Tool eligibility section** — lists usable tools and non-usable tools (with reasons)
2. **Sass configuration section** — based on detected config file signals:
   - `angular.json` → `stylePreprocessorOptions.includePaths` (Angular CLI's own API)
   - `vite.config.*` → `css.preprocessorOptions.scss.loadPaths`
   - `next.config.*` → `sassOptions.loadPaths`
   - No config file → general `loadPaths` guidance
3. **Installation note** — if `igniteui-theming` is not in dependencies, note CSS output works without it; Sass output requires it resolvable via `node_modules`

The config file signals are already collected by `detectConfigFiles()` and included in the result's `signals` array, so the handler can inspect them to determine which guidance to show.

### Decision 9: Generic platform resource at `theming://platforms/generic`

Add a resource handler in `resources/presets.ts` following the pattern of the existing platform resources. The generic resource returns the common presets (schemas, palettes, typefaces, typography, elevations) without platform-specific config. Also add `"generic"` to the hardcoded `platforms` array at line 280.

### Decision 10: `generateTheme()` adds explicit `"generic"` case

In `generators/sass.ts:162`, the switch currently falls through `default` to `generateGenericTheme()`. Add an explicit `case "generic":` before `default:` for clarity and to prevent accidental breakage if the default semantics ever change.

In `handlers/theme.ts:85`, add a case for `"generic"` with `platformNote = "Platform: Ignite UI Theming (Standalone)"` to distinguish it from the `undefined` ("Not specified") case.

## Risks / Trade-offs

**[Risk] `as const` objects missing `generic` entry cause runtime undefined access**
→ Mitigation: The `PLATFORM_METADATA` and `IMPORT_PATHS` objects are typed with `as const`, so the compiler won't flag a missing `generic` key. Review all `as const` platform-keyed objects during implementation and add entries. The tasks checklist will enumerate each one.

**[Risk] `z.enum(PLATFORMS)` makes `"generic"` valid for `create_component_theme` schema**
→ Mitigation: The handler rejects `"generic"` with a clear error (Decision 6). This produces a better UX than a Zod validation error since it can explain _why_ component theming needs a specific platform.

**[Risk] Existing tests assert `platform: null` for "no detection" case**
→ Mitigation: Update tests to assert `platform: "generic"` instead. The ambiguous and error cases still return `null`, so those test paths remain valid.

**[Risk] LLMs may still pass `component` with `platform: "generic"` on layout tools**
→ Mitigation: The handler produces a reasonable fallback (merged selectors, same as undefined). The updated tool descriptions guide the model to use `scope` instead, reducing this case over time.

**[Trade-off] `"generic"` is in `PLATFORMS` but not a real product**
→ Unlike the other 4 members, `"generic"` doesn't correspond to an Ignite UI product package, doesn't ship components, and doesn't have unique selectors. This means every platform-aware code path must consider whether `"generic"` applies or should be excluded. The compile-enforced approach (Decision 1) ensures this consideration happens, but it does add implementation burden for future platform-dependent features.

## Migration Plan

1. Add `"generic"` to `PLATFORMS` — triggers compile errors
2. Fix compile errors (Record objects) — straightforward additions
3. Add `PLATFORM_METADATA`, `IMPORT_PATHS` entries — manual additions
4. Update detection logic — change the `null`/`"none"` return paths
5. Update handlers — display names, scope resolution, component-theme guard
6. Update descriptions — FRAGMENTS.PLATFORM, layout tools, component tokens, detect_platform
7. Add resource — `theming://platforms/generic` in presets.ts
8. Update tests — change assertions from `null`/`"none"` to `"generic"` for non-error cases

**Rollback:** Remove `"generic"` from the `PLATFORMS` array. The resulting compile errors trace every location that was modified, guiding complete rollback. No database, API, or external dependency changes are involved.

## Open Questions

- Should `PLATFORM_METADATA` be re-typed as `Record<Platform, PlatformMetadataEntry>` (instead of `as const`) to get compile-time enforcement? This would lose the literal type inference on the values but gain safety against missing entries.
