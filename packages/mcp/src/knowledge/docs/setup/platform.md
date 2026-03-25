# Platform Setup Guide

This document is an instruction resource for AI agents using the Ignite UI Theming MCP. It describes how to detect, configure, and work with target platforms. Follow these rules when helping a user set up theming in their project.

---

## Step 1: Always Detect First

**ALWAYS** call `detect_platform` before generating any theme code. Do not assume a platform; do not skip detection even if the user mentions a framework by name — detection confirms the actual project setup and returns Sass configuration guidance.

```
detect_platform({ packageJsonPath: "./package.json" })
```

The result determines every subsequent tool call's `platform` parameter.

---

## Step 2: Interpret the Detection Result

### High-confidence product detection

When `confidence` is `"high"` and `platform` is one of `angular`, `webcomponents`, `react`, or `blazor`:

- Use the returned `platform` value in all subsequent tool calls.
- Use the `platformInfo.themingModule` value for Sass import guidance.
- If `licensed` is `true` (Angular only), also pass `licensed: true` to theme generation tools.

### Generic (standalone) mode

When `platform` is `"generic"`:

- No Ignite UI product framework was found. The project can still use `igniteui-theming` directly.
- Use `platform: "generic"` in all subsequent tool calls.
- The Sass import is `@use 'igniteui-theming' as *;`.

**Tool eligibility in generic mode:**

| Tool                          | Available | Notes                                  |
| ----------------------------- | --------- | -------------------------------------- |
| `create_palette`              | YES       | Full functionality                     |
| `create_custom_palette`       | YES       | Full functionality                     |
| `create_typography`           | YES       | Full functionality                     |
| `create_elevations`           | YES       | Full functionality                     |
| `create_theme`                | YES       | Full functionality                     |
| `set_size`                    | YES       | Use `scope`, not `component`           |
| `set_spacing`                 | YES       | Use `scope`, not `component`           |
| `set_roundness`               | YES       | Use `scope`, not `component`           |
| `get_color`                   | YES       | Full functionality                     |
| `read_resource`               | YES       | Full functionality                     |
| `create_component_theme`      | **NO**    | Requires Ignite UI component selectors |
| `get_component_design_tokens` | **NO**    | Requires Ignite UI components          |

**IMPORTANT:** For layout tools (`set_size`, `set_spacing`, `set_roundness`) in generic mode, do NOT use the `component` parameter — it resolves Ignite UI component selectors that don't exist in the project. Use `scope` with a custom CSS selector, or omit both for `:root` targeting.

### Ambiguous detection

When `ambiguous` is `true` and `platform` is `null`:

- Multiple Ignite UI products were detected (e.g., both Angular and React packages).
- Do NOT guess. Ask the user which platform to target.
- Present the `alternatives` array from the result so the user can choose.

### Null / error state

When `platform` is `null` and `ambiguous` is not `true`:

- Something went wrong (package.json unreadable, invalid structure).
- Report the `reason` to the user and ask them to specify a platform manually.
- Suggest `"generic"` if they don't use an Ignite UI product.

---

## Step 3: Configure Sass Load Paths

If the user will consume **Sass output** (not CSS), they need `node_modules` in their Sass compiler's load paths so that `@use 'igniteui-theming' as *;` resolves correctly.

The `detect_platform` response includes config-file signals. Use them to give the right guidance:

### Angular (`angular.json` detected)

```json
// In angular.json → architect → build → options:
"stylePreprocessorOptions": {
  "includePaths": ["node_modules"]
}
```

### Vite (`vite.config.*` detected)

```js
// In vite.config.ts/js:
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: ['node_modules'],
      },
    },
  },
});
```

### Next.js (`next.config.*` detected)

```js
// In next.config.js/mjs/ts:
module.exports = {
  sassOptions: {
    loadPaths: ['node_modules'],
  },
};
```

### Other / unknown build tools

If no recognizable config file was detected, instruct the user to add `node_modules` to their Sass compiler's `loadPaths`. Angular CLI is the exception — it uses `includePaths` in `angular.json`. Investigate the project's build configuration to find the right setting.

### When load paths are NOT needed

- **CSS output**: CSS output is compiled server-side by the MCP. No local Sass toolchain or load path configuration is required. The user can paste the CSS output directly.
- **Angular with Ignite UI for Angular**: The `igniteui-angular/theming` module is already resolved by Angular's build system when the package is installed.

---

## Step 4: Handle the igniteui-theming Dependency

Check whether `igniteui-theming` (or a product package like `igniteui-angular`) is in the project's dependencies.

### Package IS installed

- Sass output will work once load paths are configured.
- CSS output works regardless.

### Package is NOT installed

- **CSS output** still works — the MCP compiles it server-side. Recommend this path for quick results.
- **Sass output** requires the package to be resolvable. The user must either:
  - Run `npm install igniteui-theming` (or the product-specific package), OR
  - Ensure the package is available via `loadPaths` from a parent `node_modules`.

When in doubt, suggest CSS output first — it has zero local dependencies.

---

## Step 5: Recommended Workflow

After detection and setup, follow this order for a complete theme:

1. **`detect_platform`** — Determine platform and configuration needs.
2. **`create_palette`** or **`create_custom_palette`** — Define the color system.
   - Read `theming://guidance/colors/rules` first if unsure about surface/gray color choices.
3. **`create_typography`** — Set up the type scale (optional but recommended).
4. **`create_elevations`** — Configure shadows (optional).
5. **`create_theme`** — Generate the complete theme that brings everything together.
6. **Layout tools** — Use `set_size`, `set_spacing`, `set_roundness` if the user wants to customize layout tokens.
7. **`create_component_theme`** — Customize individual component appearances (only for product platforms, NOT generic).

### Output format decision

- Offer **CSS output** when the user wants quick, dependency-free results or is working in a non-Sass environment.
- Offer **Sass output** when the user has a Sass toolchain set up and wants the flexibility of Sass variables and functions.
- When both are viable, mention both options and let the user choose.

---

## Platform-Specific Notes

### Angular

- Uses `igniteui-angular/theming` (free) or `@infragistics/igniteui-angular/theming` (licensed) (not `igniteui-theming` directly).
- Licensed packages use `@infragistics/igniteui-angular/theming` — pass `licensed: true`.
- Requires `core()` mixin before `theme()` mixin.
- Typography requires the `ig-typography` CSS class on the root element.
- Read `theming://platforms/angular` for full platform configuration and usage examples.

### Web Components

- Uses `igniteui-theming` directly.
- Provides runtime theming via `defineComponents()` and `register()` APIs.
- Read `theming://platforms/webcomponents` for configuration and runtime config.

### React

- Uses `igniteui-theming` directly (same as Web Components).
- Read `theming://platforms/react` for configuration and usage examples.

### Blazor

- Uses `igniteui-theming` directly (same as Web Components).
- Detection relies on `.csproj` files with IgniteUI.Blazor references.
- Read `theming://platforms/blazor` for configuration and usage examples.

### Generic (Standalone)

- Uses `igniteui-theming` directly.
- No Ignite UI components — all theme output applies globally via CSS custom properties.
- Component-specific tools are not available.
- Layout tools work only with `:root` or custom `scope` selectors.
- Read `theming://platforms/generic` for presets available in this mode.

### Preset imports for non-Angular platforms

For all non-Angular platforms (Web Components, React, Blazor, Generic), using preset variables such as `$material-type-scale`, `$indigo-type-scale`, `$material-elevations`, or `$indigo-elevations` requires additional `@use` imports beyond the base `@use 'igniteui-theming' as *;`:

```scss
// Base module (always required)
@use 'igniteui-theming' as *;

// Typography presets (required for $<designSystem>-type-scale variables)
@use 'igniteui-theming/sass/typography/presets' as *;

// Elevation presets (required for $material-elevations / $indigo-elevations)
@use 'igniteui-theming/sass/elevations/presets' as *;
```

The MCP tools (`create_typography`, `create_elevations`, `create_theme`) automatically include these imports in their generated Sass output. Angular is not affected — its `igniteui-angular/theming` module re-exports all presets.

---

## Related Resources

| Resource            | URI                                 | When to read                       |
| ------------------- | ----------------------------------- | ---------------------------------- |
| Supported Platforms | `theming://platforms`               | To list all platforms and metadata |
| Color Guidance      | `theming://guidance/colors`         | Before creating palettes           |
| Color Rules         | `theming://guidance/colors/rules`   | For surface/gray color decisions   |
| Spacing & Sizing    | `theming://docs/spacing-and-sizing` | Before using layout tools          |
