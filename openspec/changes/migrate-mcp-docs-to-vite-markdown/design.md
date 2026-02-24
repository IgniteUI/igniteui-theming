## Context

The MCP server is currently built using the TypeScript compiler (`tsc`) which compiles TypeScript source files to JavaScript while preserving the directory structure. Documentation is embedded as template string constants within TypeScript files, making editing difficult without proper markdown tooling.

**Current build process:**

```bash
npm run build:mcp → npm run build:json && tsc -p tsconfig.json && chmod 755 dist/mcp/index.js
```

**Current state:**

- 10 markdown documentation constants embedded in 4 TypeScript files
- Documentation lacks syntax highlighting and preview capabilities
- Total ~1,800 lines of embedded markdown in TypeScript strings
- Build outputs to `dist/mcp/` with preserved directory structure
- Entry point `dist/mcp/index.js` requires executable permissions for CLI usage

**Constraints:**

- Must maintain exact same output structure (consumers depend on file paths)
- Must preserve executable permissions on `dist/mcp/index.js`
- Must generate TypeScript declarations (`.d.ts` files)
- Must not bundle runtime dependencies (`sass-embedded` has native binaries, `zod` and `@modelcontextprotocol/sdk` needed at runtime)
- Must work with ES modules (`"type": "module"` in package.json)

**Stakeholders:**

- MCP server consumers (AI assistants using the theming server)
- Documentation maintainers (developers editing theming docs)
- CI/CD pipeline (build process must remain reliable)

## Goals / Non-Goals

**Goals:**

- Replace `tsc` with Vite 7.x for building the MCP server
- Extract all markdown documentation to external `.md` files
- Enable markdown editing with proper tooling (syntax highlighting, preview, linting)
- Maintain identical output structure and API surface
- Support `?raw` imports for loading markdown as strings
- Automate setting executable permissions on entry point

**Non-Goals:**

- Bundling runtime dependencies (keep them external)
- Changing the MCP server API or resource URIs
- Dynamic markdown loading (files are embedded at build time)
- Hot module replacement or dev server (MCP server runs as CLI tool)
- Markdown processing or transformation (serve as plain text)
- Multiple output formats (ES modules only)

## Decisions

### Decision 1: Use Vite over other build tools

**Choice:** Vite 7.x

**Rationale:**

- Native support for `?raw` imports (standard feature, no plugins needed)
- Fast builds with Rollup under the hood
- Library mode with `preserveModules` option matches `tsc` output structure
- Built-in TypeScript support
- Extensive plugin ecosystem (vite-plugin-dts for declarations)

**Alternatives considered:**

- **esbuild**: No native `?raw` support, would need custom plugin
- **Rollup directly**: More configuration needed, Vite provides better DX
- **webpack**: Heavier, requires markdown-loader plugin, slower builds
- **Keep tsc + add markdown-loader**: Would require webpack anyway, doesn't solve tooling issue

### Decision 2: External dependencies remain unbundled

**Choice:** Keep `sass-embedded`, `zod`, and `@modelcontextprotocol/sdk` external

**Rationale:**

- **sass-embedded**: Contains platform-specific native binaries installed via postinstall scripts; bundling would break cross-platform compatibility
- **zod**: Runtime validation library, consumers may use same version (avoid duplication)
- **@modelcontextprotocol/sdk**: Protocol implementation, should match client expectations
- MCP server is published as npm package, not standalone binary
- Dependencies resolved from `node_modules` at runtime

**Alternatives considered:**

- **Bundle all dependencies**: Would break sass-embedded native binaries, increase bundle size unnecessarily
- **Bundle only zod**: Inconsistent approach, no significant benefit

### Decision 3: Preserve file structure with `preserveModules`

**Choice:** Use Rollup's `preserveModules: true` option

**Rationale:**

- Maintains same directory structure as `tsc` output
- Each TypeScript file becomes one JavaScript file
- Easier debugging (files match source structure)
- No breaking changes for consumers importing specific modules
- Familiar output for developers

**Alternatives considered:**

- **Single bundle**: Would change output structure, break imports, harder to debug
- **Manual chunking**: More complex, unnecessary for this use case

### Decision 4: Custom Vite plugin for executable permissions

**Choice:** Create `chmodPlugin()` that runs in `closeBundle` hook

**Rationale:**

- Clean separation of concerns (no inline shell commands)
- Runs after all files are written
- Can be reused if more post-build steps are needed
- Better error handling than inline script

**Alternatives considered:**

- **Inline node script**: Hard to read, difficult to maintain (current approach)
- **Separate shell script**: Extra file, needs to be called separately
- **npm postbuild script**: Less integrated, harder to debug

### Decision 5: Organized documentation directory structure

**Choice:** Hierarchical structure: `docs/layout/`, `docs/colors/` with subdirectories for functions/mixins

**Rationale:**

- Mirrors conceptual organization (layout → functions/mixins)
- Easy to find specific documentation
- Scalable for future additions
- Standard approach other developers will understand

**Alternatives considered:**

- **Flat structure**: All files in `docs/` - harder to navigate with more files
- **One file per module**: Couples docs to code structure, less flexible
- **Separate docs/ at root**: Separates from code, but complicates import paths

### Decision 6: Use vite-plugin-dts for type declarations

**Choice:** `vite-plugin-dts` with `copyDtsFiles: true` and `bundleTypes: false`

**Rationale:**

- Maintains individual `.d.ts` files (matches `tsc` output)
- Works seamlessly with Vite
- Supports `preserveModules` mode
- Actively maintained

**Alternatives considered:**

- **Manual tsc for declarations**: Duplicate tooling, synchronization issues
- **rollup-plugin-dts**: Less integrated with Vite
- **Bundle types**: Would change type export structure

## Risks / Trade-offs

### Risk: Vite may not preserve shebang in entry file

**Mitigation:** Vite preserves shebangs by default in library mode (verified in v7 docs). Test in build verification step.

### Risk: Build output differs from tsc in subtle ways

**Mitigation:** Use `preserveModules: true` and create verification script to compare file structure. Test with MCP inspector to ensure runtime behavior unchanged.

### Risk: New dependency on Vite increases maintenance burden

**Trade-off:** Accepted. Vite is widely adopted, well-maintained, and provides significant DX improvements. Benefits outweigh maintenance cost.

### Risk: Markdown imports fail at runtime

**Mitigation:** `?raw` is standard Vite feature, well-tested. Type declarations in `vite-env.d.ts` provide compile-time safety.

### Risk: File permissions not set on all platforms

**Mitigation:** Use Node.js `fs.chmodSync()` which works on Unix/Mac. Windows doesn't use execute bits (npm handles entry point execution).

### Risk: Breaking changes in future Vite versions

**Trade-off:** Accepted. Pin to `^7.0.0` and test upgrades. Vite has stable API and strong semantic versioning practices.

### Trade-off: Markdown embedded at build time (not dynamic)

**Explanation:** Documentation is bundled during build, not loaded from filesystem at runtime. Changes require rebuild. This is acceptable because:

- Consistent with current behavior (TypeScript strings are also embedded)
- Simplifies deployment (no external files to manage)
- Better performance (no I/O at runtime)

## Migration Plan

### Prerequisites

- Clean working directory (no uncommitted changes)
- All tests passing on current branch

### Implementation Steps

**Phase 1: Install Dependencies**

```bash
npm install --save-dev vite@^7.0.0 vite-plugin-dts@^4.3.0
```

**Phase 2: Create Vite Configuration**

- Create `vite.config.ts` with library mode settings
- Implement `chmodPlugin()` for executable permissions
- Configure `rollupOptions` with external dependencies
- Set up `preserveModules` for file structure

**Phase 3: Add TypeScript Support for Markdown**

- Create `src/mcp/vite-env.d.ts` with `*.md?raw` module declarations
- Update `tsconfig.json` to include `"types": ["vite/client", "node"]`

**Phase 4: Create Documentation Structure**

- Create `src/mcp/knowledge/docs/` directory hierarchy
- Extract markdown from TypeScript to organized `.md` files
- Create `docs/README.md` with guidelines

**Phase 5: Update Knowledge Files**

- Replace template strings with `import X from './docs/path.md?raw'` in 4 files
- Maintain same export names and structure

**Phase 6: Update Build Scripts**

- Change `build:mcp` script to use `vite build`
- Remove inline chmod command (handled by plugin)

**Phase 7: Verification**

- Run `npm run build:mcp` and verify output structure
- Check executable permissions on `dist/mcp/index.js`
- Test with `npm run mcp:inspector`
- Verify all resource URIs return correct content
- Run test suite

**Phase 8: Commit**

- Single comprehensive commit with all changes
- Conventional commit format: `feat: migrate MCP build to Vite with external markdown docs`

### Rollback Strategy

Not applicable - MCP server not yet released. If build fails:

1. Fix build errors immediately
2. If unfixable, revert commit and investigate

### Testing Strategy

**Build Verification:**

- Output directory structure matches previous build
- All `.js` files present
- All `.d.ts` files generated
- `index.js` has executable permissions (755)

**Content Verification:**

- Create script to compare markdown content before/after
- Verify character counts and line counts match

**Runtime Verification:**

- MCP inspector successfully loads all resources
- All 10 documentation resources return correct content
- No escape character issues in markdown
- Code blocks render properly

**Integration Testing:**

- Full build pipeline: `npm run build`
- All existing tests pass
- MCP server responds to requests

## Open Questions

<!-- None - all technical decisions have been made through discussion -->
