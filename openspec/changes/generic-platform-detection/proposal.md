## Why

The `detect_platform` tool treats platform detection as strictly an "Ignite UI product detection" problem. When no Ignite UI product framework is found, it returns `platform: null` with `confidence: "none"` and only recommends specifying one of the four Ignite UI platforms. This makes the MCP unusable for projects that don't use Ignite UI Angular, Web Components, React, or Blazor — even though most tools (palette generation, typography, elevations, full theme generation, color references, layout tokens) work perfectly in a platform-agnostic mode. Adding a first-class `"generic"` platform value fixes this gap and also surfaces project configuration guidance (Sass `includePaths`) that is currently missing entirely.

## What Changes

- Add `"generic"` to the `PLATFORMS` array as a first-class platform value, rippling through the type system so every platform-dependent location must explicitly handle it
- Update platform detection to return `platform: "generic"` instead of `platform: null` when no Ignite UI product is found — reserving `null` for genuine error states only
- Add `PLATFORM_METADATA` entry for `"generic"` describing it as standalone usage of `igniteui-theming`
- Rename `IMPORT_PATHS.default` to `IMPORT_PATHS.generic` for consistency with the type system
- Revamp the `detect_platform` handler response for `"generic"` to list which tools are usable (and which are not) and provide project configuration guidance
- Reject `"generic"` explicitly in `create_component_theme` with a clear error — component theming requires platform-specific selectors
- Treat `"generic"` like `undefined` in layout tool scope resolution so it doesn't attempt to resolve Ignite UI component selectors
- Fix binary display name ternaries (`=== "angular" ? ... : "Ignite UI for Web Components"`) across all handlers to use `PLATFORM_METADATA` lookups
- Update tool descriptions for `detect_platform`, layout tools (`set_size`, `set_spacing`, `set_roundness`), and `get_component_design_tokens` to guide the model on generic-mode behavior — specifically that `component` should not be used with `"generic"` platform (use `scope` instead), and that component-specific tools are not useful without an Ignite UI product
- Add Sass `includePaths` configuration guidance to the detection response based on detected framework config files (angular.json, vite.config, next.config, etc.)
- Add a `"generic"` platform resource in `resources/presets.ts`

## Capabilities

### New Capabilities

- `generic-platform`: Defines the behavior of the `"generic"` platform value — detection rules, tool eligibility, project configuration guidance, and Sass `includePaths` surfacing

### Modified Capabilities

- `platform-detection`: The detection result changes from returning `null`/`"none"` to returning `"generic"` when no Ignite UI product is found. New detection scenarios for generic fallback, framework config guidance, and global installation
- `layout-overrides`: Layout tools must treat `"generic"` platform like `undefined` for scope resolution. Descriptions updated to guide against using `component` with generic platform
- `component-theming`: Must explicitly reject `"generic"` platform with a clear error message
- `theme-generation`: Must handle `"generic"` as an explicit case routing to the generic theme generator, with proper display name

## Impact

- **Type system**: `Platform` union type expands from 4 to 5 members. All `Record<Platform, ...>` objects require a new entry (compile-enforced). All `as const` objects need manual addition (runtime risk if omitted).
- **Detection logic**: `detectPlatformFromDependencies()` return contract changes — `platform: null` becomes reserved for errors; `"generic"` replaces the "nothing detected" case.
- **Tool schemas**: `z.enum(PLATFORMS)` automatically includes `"generic"` as valid for all tools that accept `platform`. The `create_component_theme` schema accepts it but the handler rejects it.
- **Tool descriptions**: `detect_platform`, `set_size`, `set_spacing`, `set_roundness`, `get_component_design_tokens` descriptions updated with generic-mode guidance.
- **Display strings**: ~5 handlers with binary ternary display names need updating to handle 5 platforms correctly.
- **Resources**: New `theming://platforms/generic` resource URI.
- **Tests**: Platform detection tests need new scenarios for generic fallback. Existing tests that assert `platform: null` / `confidence: "none"` for the "nothing found" case need updating.
- **Rollback**: Revert the `"generic"` entry from `PLATFORMS` array. All downstream compile errors guide the rollback of every other change. No database migrations or external API changes involved.
