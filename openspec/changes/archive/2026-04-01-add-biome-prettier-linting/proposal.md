## Why

The project currently lacks comprehensive linting for TypeScript/JavaScript files in the `scripts/` and `src/mcp/` directories. Adding Biome provides fast, performant linting with auto-fix capabilities, while maintaining Prettier integration ensures consistent code formatting across the codebase.

## What Changes

- Add Biome configuration file (`biome.json` or `biome.jsonc`) with rules targeting TypeScript files in `scripts/**/*.{ts,js,mjs,cjs}` and `src/**/*.ts`
- Configure Biome linting rules including:
  - Import organization and required `.js` extensions
  - Unused variable/import/function parameter detection (errors)
  - Console/debugger statement prevention (errors)
  - Style enforcement (enum initializers, collapsed else-if, default parameter ordering, etc.)
- Add `lint:biome` npm script to run Biome checks
- Update `format` npm script to include `biome check --fix` before Prettier
- Update `lint-staged` configuration to run Biome checks on staged `.{js,ts,cjs,mjs,jsx,tsx}` files before Prettier
- Add `@biomejs/biome` as a dev dependency

## Capabilities

### New Capabilities

- `biome-linting`: Biome-based linting for TypeScript and JavaScript files with configured rule sets, import organization, and auto-fix capabilities
- `lint-staged-integration`: Integrated pre-commit workflow that runs Biome checks followed by Prettier formatting on staged files

### Modified Capabilities

None - this change adds new linting capabilities without modifying existing spec requirements.

## Impact

**Affected Files:**

- `package.json` - new scripts (`lint:biome`), updated `format` script, updated `lint-staged` configuration, new dev dependency
- New `biome.json` or `biome.jsonc` - Biome configuration file
- TypeScript/JavaScript files in `scripts/` and `src/mcp/` - will be checked and auto-fixed by Biome on commit

**Affected Systems:**

- Development workflow - developers will see Biome checks during commits via `lint-staged`
- CI/CD pipeline - should integrate `npm run lint:biome` into existing lint checks
- Code quality - enforces consistent import patterns, catches unused code, prevents console statements

**Dependencies:**

- Requires `@biomejs/biome` package installation
- Works alongside existing Prettier and Stylelint configurations

**Rollback Plan:**

- Remove `@biomejs/biome` from `devDependencies`
- Remove `biome.json`/`biome.jsonc` configuration file
- Remove `lint:biome` script from `package.json`
- Revert `format` script to original (without `biome check --fix`)
- Revert `lint-staged` configuration to original
