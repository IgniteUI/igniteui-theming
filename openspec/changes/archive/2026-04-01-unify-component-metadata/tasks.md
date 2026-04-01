## 1. Create unified data structure

- [x] 1.1 Create `src/mcp/knowledge/component-metadata.ts` with `ComponentMetadata`, `CompoundInfo`, `TokenDerivation`, and `ScopeSelectors` interfaces
- [x] 1.2 Build the `COMPONENT_METADATA` map: migrate all entries from `COMPONENT_SELECTORS` into the new shape (selectors-only for simple components)
- [x] 1.3 Embed `variants` arrays on `button` and `icon-button` entries (from `COMPONENT_VARIANTS`)
- [x] 1.4 Embed `compound` fields on all compound components: merge data from `COMPOUND_COMPONENTS` (description, relatedThemes) and `COMPOUND_THEMING` (tokenDerivations, guidance, childScopes, scopes→additionalScopes)
- [x] 1.5 Convert explicit inline scopes to derived: remove inline scope declarations, keep only `additionalScopes` for non-inline contexts (e.g., `overlay`)
- [x] 1.6 Remove the stray `shit` scope entry from date-picker
- [x] 1.7 Derive `VARIANT_THEME_NAMES` set from `COMPONENT_METADATA` at module init

## 2. Migrate accessor functions

- [x] 2.1 Migrate `getComponentSelector()` to read from `COMPONENT_METADATA[name].selectors`
- [x] 2.2 Migrate `isComponentAvailable()`, `getComponentsForPlatform()`, `getComponentPlatformAvailability()` to use `COMPONENT_METADATA`
- [x] 2.3 Migrate `hasVariants()` and `getVariants()` to use `.variants` field
- [x] 2.4 Migrate `isVariantTheme()` to use the derived `VARIANT_THEME_NAMES` set
- [x] 2.5 Migrate `isCompoundComponent()` to check `.compound` presence
- [x] 2.6 Migrate `getCompoundComponentInfo()` to return the full `CompoundInfo` from `.compound`
- [x] 2.7 Migrate `getTokenDerivationsForChild()` to read from `.compound?.tokenDerivations`
- [x] 2.8 Remove `getCompoundThemingInfo()` — no longer needed
- [x] 2.9 Remove `getCompoundSelector()` — unused in production code

## 3. Update barrel exports and consumers

- [x] 3.1 Update `src/mcp/knowledge/index.ts`: replace `component-selectors` and `compound-theming` exports with `component-metadata`
- [x] 3.2 Update `src/mcp/tools/handlers/component-tokens.ts`: replace dual lookup (getCompoundComponentInfo + getCompoundThemingInfo) with single unified lookup; build inline scope from `metadata.selectors`
- [x] 3.3 Update `src/mcp/tools/handlers/layout.ts`: change `COMPONENT_SELECTORS` import to `COMPONENT_METADATA`, access `.selectors` where needed
- [x] 3.4 Update `src/mcp/tools/handlers/component-theme.ts`: update import paths

## 4. Delete old files

- [x] 4.1 Delete `src/mcp/knowledge/compound-theming.ts`
- [x] 4.2 Delete `src/mcp/__tests__/knowledge/compound-theming.test.ts`

## 5. Update and merge tests

- [x] 5.1 Create `src/mcp/__tests__/knowledge/component-metadata.test.ts` with merged validation tests from both old test files
- [x] 5.2 Add test: every component has valid selectors structure
- [x] 5.3 Add test: compound components have required CompoundInfo fields
- [x] 5.4 Add test: childScopes references are valid ('inline' or key in additionalScopes)
- [x] 5.5 Add test: no inline scope appears in additionalScopes
- [x] 5.6 Add test: VARIANT_THEME_NAMES is correctly derived
- [x] 5.7 Delete `src/mcp/__tests__/knowledge/component-selectors.test.ts`

## 6. Verify

- [x] 6.1 Run TypeScript check (`npx tsc --noEmit`) — zero errors
- [x] 6.2 Run full test suite (`npx vitest run`) — all tests pass
- [x] 6.3 Spot-check handler output for date-picker, combo, grid, avatar, button — identical to pre-refactor
