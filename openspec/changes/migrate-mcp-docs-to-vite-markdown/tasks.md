## 1. Install Dependencies

- [ ] 1.1 Install vite@^7.0.0 as dev dependency
- [ ] 1.2 Install vite-plugin-dts@^4.3.0 as dev dependency

## 2. Create Vite Configuration

- [ ] 2.1 Create vite.config.ts in project root with library mode settings
- [ ] 2.2 Implement chmodPlugin() for setting executable permissions on dist/mcp/index.js
- [ ] 2.3 Configure rollupOptions with external dependencies (sass-embedded, zod, @modelcontextprotocol/sdk, node:\*)
- [ ] 2.4 Configure preserveModules and preserveModulesRoot for file structure preservation
- [ ] 2.5 Add vite-plugin-dts configuration with copyDtsFiles: true and bundleTypes: false
- [ ] 2.6 Configure assetsInclude for markdown files

## 3. Add TypeScript Support for Markdown

- [ ] 3.1 Create src/mcp/vite-env.d.ts with module declarations for \*.md?raw imports
- [ ] 3.2 Update tsconfig.json to include "vite/client" in types array
- [ ] 3.3 Verify TypeScript recognizes markdown imports without errors

## 4. Create Documentation Directory Structure

- [ ] 4.1 Create src/mcp/knowledge/docs/ base directory
- [ ] 4.2 Create docs/layout/ directory with functions/ and mixins/ subdirectories
- [ ] 4.3 Create docs/colors/ directory
- [ ] 4.4 Create docs/README.md with contributor guidelines

## 5. Extract Layout Documentation

- [ ] 5.1 Extract LAYOUT_OVERVIEW_DOC to docs/layout/overview.md
- [ ] 5.2 Extract PAD_FUNCTION_DOC to docs/layout/functions/pad.md
- [ ] 5.3 Extract SIZABLE_FUNCTION_DOC to docs/layout/functions/sizable.md
- [ ] 5.4 Extract BORDER_RADIUS_FUNCTION_DOC to docs/layout/functions/border-radius.md
- [ ] 5.5 Extract SPACING_MIXIN_DOC to docs/layout/mixins/spacing.md
- [ ] 5.6 Extract SIZING_MIXIN_DOC to docs/layout/mixins/sizing.md
- [ ] 5.7 Extract SIZABLE_MIXIN_DOC to docs/layout/mixins/sizable.md

## 6. Extract Color Documentation

- [ ] 6.1 Extract COLOR_GUIDANCE_MARKDOWN to docs/colors/guidance.md
- [ ] 6.2 Extract COLOR_USAGE_MARKDOWN to docs/colors/usage.md
- [ ] 6.3 Extract CUSTOM_PALETTE_GUIDANCE to docs/colors/custom-palettes.md

## 7. Update Knowledge TypeScript Files

- [ ] 7.1 Replace layout-docs.ts template strings with markdown imports using ?raw suffix
- [ ] 7.2 Replace COLOR_GUIDANCE_MARKDOWN in colors.ts with markdown import
- [ ] 7.3 Replace COLOR_USAGE_MARKDOWN in color-usage.ts with markdown import
- [ ] 7.4 Replace CUSTOM_PALETTE_GUIDANCE in custom-palettes.ts with markdown import
- [ ] 7.5 Verify all export names remain unchanged

## 8. Update Build Scripts

- [ ] 8.1 Update build:mcp script in package.json to use "vite build"
- [ ] 8.2 Remove inline chmod command from build:mcp script (now handled by plugin)

## 9. Build Verification

- [ ] 9.1 Run npm run clean:mcp to clear previous build
- [ ] 9.2 Run npm run build:mcp and verify build completes without errors
- [ ] 9.3 Verify dist/mcp/ directory structure matches previous tsc output
- [ ] 9.4 Verify dist/mcp/index.js has executable permissions (755)
- [ ] 9.5 Verify all .d.ts type declaration files are generated
- [ ] 9.6 Verify markdown content is embedded (no external .md files in dist/)

## 10. Content Verification

- [ ] 10.1 Create scripts/verify-docs-migration.mjs to compare markdown content
- [ ] 10.2 Run verification script to confirm all 10 documentation constants have correct content
- [ ] 10.3 Verify character counts and line counts match original embedded strings
- [ ] 10.4 Check that no escape characters leak through (e.g., \`\`\` should be ```)

## 11. Runtime Testing

- [ ] 11.1 Start MCP server with npm run mcp:inspector
- [ ] 11.2 Test theming://docs/spacing-and-sizing resource loads correctly
- [ ] 11.3 Test all 7 layout function/mixin documentation resources
- [ ] 11.4 Test all 3 color documentation resources (guidance, usage, custom-palettes)
- [ ] 11.5 Verify markdown renders correctly without formatting issues

## 12. Integration Testing

- [ ] 12.1 Run full build pipeline with npm run build
- [ ] 12.2 Verify all existing tests pass with npm test
- [ ] 12.3 Test MCP server responds to basic requests

## 13. Documentation and Commit

- [ ] 13.1 Review all changes for completeness
- [ ] 13.2 Create single comprehensive commit with conventional commit message
- [ ] 13.3 Verify commit includes all necessary files (vite.config.ts, 11 markdown files, 4 updated TS files, updated package.json/tsconfig.json)
