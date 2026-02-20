## Context

The project currently uses Stylelint for SCSS files and Prettier for formatting, but lacks comprehensive linting for TypeScript/JavaScript files in `scripts/` (build scripts using `.mjs` extensions) and `src/mcp/` (MCP server implementation in TypeScript). Biome is a fast, Rust-based linter and formatter that provides:

- Fast performance (10-100x faster than ESLint)
- Built-in import organization with auto-fix
- TypeScript-first design with strong type awareness
- Single tool for both linting and formatting (though we'll use it primarily for linting alongside Prettier)

Current state:

- `package.json` has `lint` and `format` scripts focused on SCSS files
- `lint-staged` only runs formatting on SCSS files
- No linting enforcement for TypeScript/JavaScript files
- No import organization or unused code detection

Constraints:

- Must work alongside existing Prettier configuration
- Must integrate with Husky pre-commit hooks via `lint-staged`
- Should not break existing CI/CD workflows
- Must support both `.mjs` (ESM scripts) and `.ts` (MCP source) files

## Goals / Non-Goals

**Goals:**

- Add Biome linting to TypeScript/JavaScript files in `scripts/` and `src/mcp/`
- Enforce import organization with required `.js` extensions (ESM compatibility)
- Catch unused variables, imports, and function parameters as errors
- Prevent console statements and debugger usage in production code
- Integrate Biome checks into pre-commit workflow via `lint-staged`
- Maintain Prettier for final formatting pass (Biome → Prettier pipeline)

**Non-Goals:**

- Replace Prettier entirely (Biome formatter will be disabled in config)
- Lint SCSS files (Stylelint handles this)
- Migrate existing codebase in this change (linting will catch issues, but fixing is separate)
- Add Biome checks to test files (focus on source code first)
- Configure Biome for potential `src/` directories outside of `src/mcp/`

## Decisions

### 1. Biome Configuration Structure

**Decision:** Use `biome.json` with separate file inclusion patterns for scripts and source code.

**Rationale:**

- `biome.json` is the standard configuration file (JSON schema validation in editors)
- File patterns will target:
  - `scripts/**/*.{js,mjs,cjs}` - Build and utility scripts
  - `src/mcp/**/*.ts` - MCP server source code
- Excludes test files initially to reduce scope

**Alternatives Considered:**

- `biome.jsonc` (JSON with comments): More readable but less standard
- Single global pattern: Would require complex exclusions; explicit inclusion is clearer

### 2. Biome vs. ESLint

**Decision:** Use Biome instead of adding ESLint.

**Rationale:**

- Performance: Biome is significantly faster (relevant for large codebases and pre-commit hooks)
- Simplicity: Single tool installation vs. ESLint + plugins + config complexity
- TypeScript-first: Better TypeScript support out of the box
- Import organization: Built-in with `useImportExtensions` rule for `.js` extension requirements

**Alternatives Considered:**

- ESLint with `@typescript-eslint`: More mature ecosystem but slower and more complex to configure
- TypeScript compiler with strict flags only: Doesn't catch style issues or organize imports

### 3. Biome Rule Configuration

**Decision:** Use the provided rule set with these key features:

- `recommended: true` baseline
- `correctness.useImportExtensions`: Error-level enforcement of `.js` extensions for ESM compatibility
- `correctness.noUnused*`: Error-level for unused variables, imports, function parameters, and private class members
- `suspicious.noConsole` and `noDebugger`: Error-level to prevent debug code in production
- `style.*` rules: Enforce consistent patterns (enum initializers, collapsed else-if, etc.)

**Rationale:**

- Aligns with project's need for ESM compatibility (`.js` extensions)
- Catches common bugs (unused code often indicates dead code paths)
- Prevents accidental console statements in production
- Enforces consistent style without being overly restrictive

**Alternatives Considered:**

- Minimal rule set: Would miss valuable checks like unused imports
- More restrictive rules (e.g., `noExplicitAny: error`): Too strict for migration; kept as `off`

### 4. Biome Formatter vs. Prettier

**Decision:** Disable Biome formatter (`formatter.enabled: false`) and continue using Prettier.

**Rationale:**

- Prettier is already configured and familiar to the team
- Changing formatters mid-project creates unnecessary diff churn
- Biome's formatter is mostly compatible with Prettier, so no major benefit to switching
- Pipeline: `biome check --fix` (linting) → `prettier --write` (formatting)

**Alternatives Considered:**

- Use Biome formatter only: Would require reformatting entire codebase
- Use both formatters in parallel: Redundant and potentially conflicting

### 5. Integration with npm Scripts

**Decision:** Add three script changes:

1. New `lint:biome` script: `biome check --write`
2. Update `format` script: Prepend `biome check --fix` before existing Prettier commands
3. Update `lint` script: Add `npm run lint:biome` alongside existing linters

**Rationale:**

- `lint:biome` allows standalone linting (useful for CI)
- `format` script becomes the "fix everything" command (lint fixes + formatting)
- `lint` script for checking without modifying files (CI validation)

**Alternatives Considered:**

- Only add `lint:biome`: Users would need to remember to run separately
- Add to `lint` script only: Wouldn't auto-fix issues during local development

### 6. lint-staged Integration

**Decision:** Add Biome check to `lint-staged` for `*.{js,ts,cjs,mjs,jsx,tsx}` files:

```json
"*.{js,ts,cjs,mjs,jsx,tsx}": [
  "biome check --fix --no-errors-on-unmatched",
  "prettier --write"
]
```

**Rationale:**

- `--fix` auto-corrects issues before commit (imports, unused code removal)
- `--no-errors-on-unmatched` prevents errors when no matching files in staged set
- Prettier runs after Biome to ensure final formatting consistency
- Catches issues before they reach CI

**Alternatives Considered:**

- Run only on staged files in changed directories: Complex to configure and unnecessary
- Skip `lint-staged` integration: Would miss catching issues early in workflow

### 7. Biome Assist (Import Organization)

**Decision:** Enable `assist.actions.source.organizeImports: "on"` for automatic import sorting.

**Rationale:**

- Reduces manual work organizing imports
- Enforces consistent import order across the codebase
- Works with `useImportExtensions` to add `.js` extensions automatically

**Alternatives Considered:**

- Manual import organization: Error-prone and time-consuming
- Disable assist: Would miss valuable auto-fix capability

## Risks / Trade-offs

**Risk: Biome may report many issues in existing code**  
→ **Mitigation:**

- Initial run will show all violations but won't block development
- Can fix issues incrementally over time or create a follow-up task
- `lint-staged` only checks changed files, reducing friction
- Consider temporary `--no-errors-on-warning` flag during transition

**Risk: Biome and Prettier may have formatting conflicts**  
→ **Mitigation:**

- Biome formatter is disabled (`formatter.enabled: false`)
- Only using Biome for linting, not formatting
- Prettier runs last in the pipeline to ensure final formatting

**Risk: `.js` extension requirement may break existing imports**  
→ **Mitigation:**

- `useImportExtensions` with auto-fix will add extensions automatically
- ESM requires explicit extensions, so this is a necessary fix
- Can be applied incrementally via `biome check --fix`

**Risk: Team unfamiliarity with Biome**  
→ **Mitigation:**

- Biome error messages are clear and actionable
- Most rules are standard linting practices (unused code, console statements)
- Documentation: https://biomejs.dev

**Risk: CI pipeline may fail if not updated**  
→ **Mitigation:**

- Add `npm run lint:biome` to CI lint step
- Document requirement in migration plan
- Rollback plan available if issues arise

**Trade-off: Adding another tool to the stack**  
→ **Justification:**

- Biome provides significant value (performance, TypeScript support, import organization)
- Alternative (ESLint) would also be an additional tool with more complexity
- Biome's speed makes pre-commit checks fast (important for developer experience)

## Migration Plan

**Phase 1: Installation and Configuration** (This change)

1. Install `@biomejs/biome` as dev dependency
2. Create `biome.json` with configured rules
3. Update `package.json` scripts and `lint-staged`
4. Commit changes

**Phase 2: Initial Audit**

1. Run `npm run lint:biome` to see all violations
2. Review output to understand scope of existing issues
3. Decide on incremental fix strategy (optional follow-up)

**Phase 3: CI Integration**

1. Add `npm run lint:biome` to CI lint checks
2. Configure CI to run on pull requests
3. Monitor for false positives or configuration issues

**Phase 4: Developer Communication**

1. Notify team of new pre-commit checks
2. Share documentation on common Biome errors and fixes
3. Provide guidance on running `biome check --fix` locally

**Rollback Strategy:**

- Remove `@biomejs/biome` from `package.json`
- Delete `biome.json`
- Revert `package.json` scripts to previous versions (use `git diff` to identify changes)
- Revert `lint-staged` configuration
- No code changes required (Biome only adds checks, doesn't modify runtime behavior)

**Success Criteria:**

- `npm run lint:biome` runs without errors on new code
- Pre-commit hooks successfully run Biome checks
- No performance degradation in commit times
- CI pipeline includes Biome checks
