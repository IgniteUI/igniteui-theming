## 1. Extract PRIMARY TOKENS into structured data

- [x] 1.1 Add `parsePrimaryTokens(description)` function to `scripts/buildComponentDocs.mjs` that splits description on the `PRIMARY TOKENS` marker and parses `- \`$name\` - description`lines into`{ name, description }` objects
- [x] 1.2 Update the component output in `buildComponentDocs.mjs` to emit `primaryTokens` array and trimmed `description` (title + optional summary only) in `themes.json`
- [x] 1.3 Add optional `primaryTokens` field to the `ComponentTheme` interface in `src/mcp/knowledge/component-themes.ts`
- [x] 1.4 Run `node scripts/buildComponentDocs.mjs` and verify `json/components/themes.json` has structured `primaryTokens` for components like `calendar`, `avatar`, `button`

## 2. Trim SassDoc descriptions in Sass source

- [x] 2.1 Write a helper script or manually edit all 54 `*-theme.scss` files to shorten PRIMARY TOKENS entries to single-line summaries (remove multi-line "Auto-derives:" lists)
- [x] 2.2 Change the `PRIMARY TOKENS (set these first for quick theming):` header to `PRIMARY TOKENS:` across all files
- [x] 2.3 Remove verbose follow-up prose (e.g., "Setting just `$header-background` will theme all accent/selection states consistently.") and replace with one-line summary where needed
- [x] 2.4 Verify all `@param` annotations remain unchanged
- [x] 2.5 Rebuild `themes.json` via `node scripts/buildComponentDocs.mjs` and verify output is correct

## 3. Restructure handler for simple components

- [x] 3.1 Refactor `component-tokens.ts` opening line from `## Design Tokens for \`${name}\`` to `Implement a theme for the \`${name}\` component using the following guidance.`
- [x] 3.2 Replace raw `theme.description` dump with structured rendering: theme function, primary tokens bullet list (from `primaryTokens` field), then available tokens table
- [x] 3.3 Verify non-compound components (e.g., `avatar`, `badge`) produce the simpler format without compound sections (no steps, no scope tables, no related themes, no guidance)

## 4. Restructure handler for compound components

- [x] 4.1 Refactor platform iteration from `['angular', 'webcomponents']` to two platform groups: `{ label: 'Angular', platform: 'angular' }` and `{ label: 'Web Components / React / Blazor', platform: 'webcomponents' }`
- [x] 4.2 Add logic to omit scope rows where the platform group has no selector (filter out rows where `getScopeSelectorForPlatform` returns `N/A`)
- [x] 4.3 Reorder compound sections to: opening instruction → theme function → compound description → numbered steps → per-platform sections (scope table + related themes table) → token derivations → guidance → primary tokens → available tokens → next step
- [x] 4.4 Verify `date-picker` output shows overlay scope only for Angular, not for WC group
- [x] 4.5 Verify `grid` output shows both platform groups with correct `igx-`/`igc-` selector arrays
- [x] 4.6 Verify `banner` output (inline-only compound) shows inline scope for both platform groups

## 5. Update tests

- [x] 5.1 Update `src/mcp/__tests__/tools/handlers/component-tokens.test.ts` assertions for new opening format (`Implement a theme for`)
- [x] 5.2 Update compound component test to assert two platform sections: "Angular" and "Web Components / React / Blazor"
- [x] 5.3 Update date-picker test to assert overlay row is present for Angular and absent for WC group
- [x] 5.4 Add test for simple component (e.g., `avatar`) asserting no compound sections in output
- [x] 5.5 Add test asserting primary tokens section is rendered from structured data
- [x] 5.6 Run `npx vitest run` and verify all tests pass

## 6. Verify end-to-end

- [x] 6.1 Rebuild themes.json and run the full test suite
- [x] 6.2 Manually inspect output for `date-picker` (compound, multi-scope), `avatar` (simple), `grid` (compound, array selectors), `combo` (compound, inline-only with derivations) to confirm format correctness
