## Why

The MCP server documentation is currently embedded as TypeScript template string constants, making it difficult to maintain and edit. Markdown files lack syntax highlighting, preview capabilities, and proper tooling support when embedded in TypeScript. Additionally, using `tsc` for the build limits our ability to use modern module features like `?raw` imports. Migrating to external markdown files with Vite as the build system will improve maintainability, enable better editing workflows, and allow documentation to be sourced externally in the future.

## What Changes

- Replace TypeScript compiler (tsc) with Vite 7.x for MCP server build
- Extract 10 markdown documentation constants from TypeScript to organized `.md` files in `src/mcp/knowledge/docs/`
- Use Vite `?raw` imports to load markdown content as strings
- Create custom Vite plugin (`chmodPlugin`) to set executable permissions on MCP server entry point
- Maintain exact same output structure using Vite's `preserveModules` option (no API changes, no consumer impact)
- Generate TypeScript declarations using `vite-plugin-dts`
- Add development dependencies: `vite@^7.0.0`, `vite-plugin-dts@^4.3.0`

## Capabilities

### New Capabilities

- `vite-markdown-imports`: Support for importing markdown files as raw strings using Vite's `?raw` query parameter, enabling external markdown documentation files to be bundled at build time
- `documentation-organization`: Hierarchical directory structure for markdown documentation (`docs/layout/`, `docs/colors/`) that mirrors conceptual organization and improves discoverability

### Modified Capabilities

<!-- No modified capabilities - this is an internal implementation change that doesn't affect spec requirements -->

## Impact

### Build System

- **package.json**: Update `build:mcp` script to use `vite build` instead of `tsc`
- **tsconfig.json**: Add Vite client types
- **vite.config.ts**: New Vite configuration with library mode, preserveModules, and custom chmod plugin
- **src/mcp/vite-env.d.ts**: Type declarations for `*.md` imports

### Knowledge Files (4 files)

- **src/mcp/knowledge/layout-docs.ts**: Replace 7 template strings with markdown imports (~198 lines → ~25 lines)
- **src/mcp/knowledge/colors.ts**: Replace `COLOR_GUIDANCE_MARKDOWN` with markdown import
- **src/mcp/knowledge/color-usage.ts**: Replace `COLOR_USAGE_MARKDOWN` with markdown import
- **src/mcp/knowledge/custom-palettes.ts**: Replace `CUSTOM_PALETTE_GUIDANCE` with markdown import

### New Documentation Files (11 files)

- **src/mcp/knowledge/docs/README.md**: Documentation guidelines for contributors
- **Layout documentation (7 files)**:
  - `docs/layout/overview.md`
  - `docs/layout/functions/pad.md`
  - `docs/layout/functions/sizable.md`
  - `docs/layout/functions/border-radius.md`
  - `docs/layout/mixins/spacing.md`
  - `docs/layout/mixins/sizing.md`
  - `docs/layout/mixins/sizable.md`
- **Color documentation (3 files)**:
  - `docs/colors/guidance.md`
  - `docs/colors/usage.md`
  - `docs/colors/custom-palettes.md`

### Dependencies

- Add `vite@^7.0.0` to devDependencies
- Add `vite-plugin-dts@^4.3.0` to devDependencies
- Runtime dependencies (`sass-embedded`, `zod`, `@modelcontextprotocol/sdk`) remain external (not bundled)

### No Impact On

- **Public API**: All exports remain identical (same constant names, same content)
- **MCP Resources**: Resource URIs and content unchanged
- **Consumers**: No changes required for users of the MCP server
- **Runtime behavior**: Identical functionality, documentation served the same way
