## ADDED Requirements

### Requirement: lint-staged configuration includes Biome checks

The system SHALL configure lint-staged to run Biome checks on TypeScript and JavaScript files before Prettier.

#### Scenario: lint-staged targets JS/TS file types

- **WHEN** `package.json` lint-staged configuration is examined
- **THEN** a configuration entry SHALL exist for pattern `*.{js,ts,cjs,mjs,jsx,tsx}`

#### Scenario: Biome runs before Prettier in lint-staged

- **WHEN** lint-staged processes TypeScript or JavaScript files
- **THEN** `biome check --fix --no-errors-on-unmatched` SHALL execute before `prettier --write`

### Requirement: Biome uses no-errors-on-unmatched flag

The system SHALL prevent lint-staged failures when Biome has no matching files to process.

#### Scenario: Biome command includes no-errors-on-unmatched

- **WHEN** the lint-staged Biome command is examined
- **THEN** it SHALL include the `--no-errors-on-unmatched` flag

#### Scenario: No error when staged files don't match Biome patterns

- **WHEN** staged files exist but none match Biome's inclusion patterns
- **THEN** lint-staged SHALL complete successfully without Biome errors

### Requirement: Biome auto-fixes issues during pre-commit

The system SHALL automatically fix linting violations on staged files before commit.

#### Scenario: Biome fixes are applied to staged files

- **WHEN** a file with fixable Biome violations is staged
- **THEN** Biome SHALL apply fixes during the pre-commit hook

#### Scenario: Fixed files remain staged

- **WHEN** Biome applies fixes to a staged file
- **THEN** the fixed version SHALL be included in the commit

### Requirement: Prettier runs after Biome in pre-commit workflow

The system SHALL ensure Prettier formatting occurs after Biome linting and fixes.

#### Scenario: Prettier receives Biome-fixed code

- **WHEN** lint-staged executes on staged TypeScript/JavaScript files
- **THEN** Prettier SHALL run on files after Biome fixes have been applied

#### Scenario: Prettier formatting is final

- **WHEN** both Biome and Prettier complete in lint-staged
- **THEN** the committed files SHALL have Prettier's formatting as the final state

### Requirement: Pre-commit hook runs Biome checks

The system SHALL execute Biome linting checks during Git pre-commit hooks via lint-staged.

#### Scenario: Pre-commit triggers lint-staged with Biome

- **WHEN** a Git commit is attempted with staged TypeScript or JavaScript files
- **THEN** the pre-commit hook SHALL invoke lint-staged which runs Biome checks

#### Scenario: Commit is blocked on Biome errors

- **WHEN** Biome detects unfixable errors in staged files
- **THEN** the pre-commit hook SHALL fail and prevent the commit

#### Scenario: Commit succeeds after Biome auto-fixes

- **WHEN** Biome successfully fixes all violations in staged files
- **THEN** the pre-commit hook SHALL complete and allow the commit

### Requirement: lint-staged targets only staged changes

The system SHALL run Biome checks only on files that are staged for commit.

#### Scenario: Unstaged files are not checked

- **WHEN** TypeScript files exist but are not staged
- **THEN** Biome SHALL NOT check those files during pre-commit

#### Scenario: Only staged portions are checked

- **WHEN** a file has both staged and unstaged changes
- **THEN** Biome SHALL check only the staged version of the file

### Requirement: Multiple file types are supported in lint-staged

The system SHALL process various JavaScript and TypeScript file extensions through lint-staged.

#### Scenario: Standard TypeScript files are processed

- **WHEN** `.ts` files are staged
- **THEN** lint-staged SHALL run Biome and Prettier on them

#### Scenario: JavaScript module files are processed

- **WHEN** `.js`, `.mjs`, or `.cjs` files are staged
- **THEN** lint-staged SHALL run Biome and Prettier on them

#### Scenario: React files are supported

- **WHEN** `.jsx` or `.tsx` files are staged
- **THEN** lint-staged SHALL run Biome and Prettier on them

### Requirement: Existing SCSS lint-staged configuration is preserved

The system SHALL maintain existing lint-staged configuration for SCSS files alongside new TypeScript/JavaScript configuration.

#### Scenario: SCSS files continue to be formatted

- **WHEN** SCSS files are staged
- **THEN** the existing format script SHALL still execute for those files

#### Scenario: Both JS and SCSS configurations coexist

- **WHEN** `package.json` lint-staged configuration is examined
- **THEN** both `*.{js,ts,cjs,mjs,jsx,tsx}` and `sass/**/*.{scss,css}` patterns SHALL be configured
