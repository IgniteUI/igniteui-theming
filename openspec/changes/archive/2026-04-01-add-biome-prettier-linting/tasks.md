## 1. Package Installation

- [x] 1.1 Install `@biomejs/biome` as a dev dependency using npm

## 2. Biome Configuration

- [x] 2.1 Create `biome.json` file at project root
- [x] 2.2 Configure `files.includes` with patterns: `scripts/**/*.{js,mjs,cjs}` and `src/mcp/**/*.ts`
- [x] 2.3 Configure `vcs.clientKind` to `"git"` and `vcs.useIgnoreFile` to `true`
- [x] 2.4 Configure `assist.includes` to target source files and enable import organization
- [x] 2.5 Set `assist.actions.source.organizeImports` to `"on"`
- [x] 2.6 Set `formatter.enabled` to `false` to disable Biome formatter
- [x] 2.7 Enable linter with `linter.enabled: true`
- [x] 2.8 Set `linter.rules.recommended` to `true`
- [x] 2.9 Configure complexity rules: disable `noForEach` and `noStaticOnlyClass`
- [x] 2.10 Configure correctness rules: set `noUnusedVariables`, `noUnusedImports`, `noUnusedFunctionParameters` to error level
- [x] 2.11 Configure correctness rule: disable `noUnusedPrivateClassMembers`
- [x] 2.12 Configure correctness rule: set `useImportExtensions` to error level with `forceJsExtensions: true`
- [x] 2.13 Configure style rules: set `noNamespace`, `useCollapsedElseIf`, `noParameterAssign`, `useAsConstAssertion`, `useDefaultParameterLast`, `useEnumInitializers`, `useSelfClosingElements`, `useSingleVarDeclarator`, `noUnusedTemplateLiteral`, `useNumberNamespace`, `noInferrableTypes`, `noUselessElse` to error level
- [x] 2.14 Configure style rule: disable `noNonNullAssertion`
- [x] 2.15 Configure suspicious rules: set `noConsole` and `noDebugger` to error level
- [x] 2.16 Configure suspicious rule: disable `noExplicitAny`

## 3. npm Scripts Configuration

- [x] 3.1 Add new `lint:biome` script with command `biome check --write`
- [x] 3.2 Update `format` script to prepend `biome check --fix` before existing Stylelint and Prettier commands
- [x] 3.3 Update `lint` script to include `npm run lint:biome` alongside existing lint commands

## 4. lint-staged Integration

- [x] 4.1 Add new lint-staged configuration entry for pattern `*.{js,ts,cjs,mjs,jsx,tsx}`
- [x] 4.2 Configure the entry to run `biome check --fix --no-errors-on-unmatched` as first command
- [x] 4.3 Configure the entry to run `prettier --write` as second command
- [x] 4.4 Verify existing SCSS lint-staged configuration (`sass/**/*.{scss,css}`) remains intact

## 5. Verification

- [x] 5.1 Run `npm run lint:biome` to verify Biome checks execute successfully
- [x] 5.2 Run `npm run format` to verify both Biome and Prettier run in sequence
- [x] 5.3 Run `npm run lint` to verify all linters execute including Biome
- [x] 5.4 Test pre-commit hook by staging a TypeScript/JavaScript file and attempting a commit
- [x] 5.5 Verify that Biome auto-fixes are applied and Prettier formatting follows

## 6. Documentation

- [x] 6.1 Document the new `lint:biome` script usage in project documentation (if applicable)
- [x] 6.2 Document the updated pre-commit workflow with Biome integration
