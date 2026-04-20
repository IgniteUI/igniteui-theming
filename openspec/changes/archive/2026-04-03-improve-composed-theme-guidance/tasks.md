## 1. Restructure composed compound output in handler

- [x] 1.1 In `component-tokens.ts`, for composed components (`compoundInfo.composed`), move primary tokens rendering ABOVE the composed compound block (⚡ warning, children list, guidance) — currently primary tokens come after
- [x] 1.2 Change the primary tokens section header from `**Primary Tokens:**` to `**✅ Primary Tokens — USE THESE:**` and add instruction text: "Use ONLY these tokens when creating the initial theme. The framework auto-derives all other tokens from these."
- [x] 1.3 Render primary tokens as a table (Token Name, Type, Description) instead of bullet list, filtering `theme.tokens` to only those matching `primaryTokens` names
- [x] 1.4 Replace the single `**Available Tokens (N):**` table with `**📖 Refinement Tokens — REFERENCE ONLY (M):**` for composed components, including only tokens NOT in `primaryTokens`
- [x] 1.5 Add instruction text above the refinement tokens table: "These tokens are auto-derived from the primary tokens. Use them ONLY when the user explicitly requests fine-grained control (e.g., 'change the header background')."
- [x] 1.6 Change the next-step line for composed components to: "Use `create_component_theme` with the **primary tokens** above to generate Sass/CSS code. Add refinement tokens only if the user requests specific customization."

## 2. Update tool descriptions

- [x] 2.1 In `descriptions.ts`, update the `get_component_design_tokens` composed compounds section under `<important_notes>` to describe the two-tier token hierarchy: primary tokens for initial theme, refinement tokens available when the user explicitly requests fine-grained control
- [x] 2.2 In `descriptions.ts`, update the `create_component_theme` composed compounds section under `<important_notes>` to mention that refinement tokens can be added in follow-up calls when the user explicitly asks (e.g., "change the header background")

## 3. Guard non-composed paths

- [x] 3.1 Verify that non-composed compound components (e.g., `combo`, `dialog`) still render a single flat `**Available Tokens**` table — no two-tier split
- [x] 3.2 Verify that simple components (e.g., `avatar`) still render `**Primary Tokens:**` as bullet list and `**Available Tokens**` as a single table unchanged

## 4. Update tests

- [x] 4.1 Update the `shows composed compound guidance for grid` test to assert the new section headers (`✅ Primary Tokens — USE THESE`, `📖 Refinement Tokens — REFERENCE ONLY`)
- [x] 4.2 Add test: composed compound primary tokens section contains a table with ONLY primary token entries (3 for grid: `background`, `foreground`, `accent-color`)
- [x] 4.3 Add test: composed compound refinement tokens section excludes primary tokens and includes non-primary tokens (e.g., `header-background`)
- [x] 4.4 Add test: composed compound next-step references "primary tokens" specifically
- [x] 4.5 Add test: non-composed compound (e.g., `combo`) does NOT show two-tier headers — uses single `Available Tokens` table
- [x] 4.6 Verify existing simple component test (`avatar`) still passes unchanged

## 5. Build and validate

- [x] 5.1 Run `vitest` for `component-tokens.test.ts` — all tests pass
- [x] 5.2 Build the MCP package — no compilation errors
- [x] 5.3 Manual smoke test: call `get_component_design_tokens` for `grid` and verify the two-tier output reads correctly

