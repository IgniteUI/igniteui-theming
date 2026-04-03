# Task: IGT-002 - MCP Composed Compound Flag

**Created:** 2026-04-03
**Size:** S

## Review Level: 1 (Plan Only)

**Assessment:** Touches handler response logic and tool descriptions across the MCP package — pattern is new (composed vs standard compound distinction) but scoped to a single package.
**Score:** 2/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 0

## Canonical Task Folder

```
taskplane-tasks/IGT-002-mcp-composed-compound-flag/
├── PROMPT.md   ← This file (immutable above --- divider)
├── STATUS.md   ← Execution state (worker updates this)
├── .reviews/   ← Reviewer output (created by the orchestrator runtime)
└── .DONE       ← Created when complete
```

## Mission

Add a `composed` boolean flag to the `CompoundInfo` interface in the MCP server's
component metadata. When `composed: true`, the `get_design_tokens` tool must tell
LLMs to **only set the three primary tokens** (`background`, `foreground`,
`accent-color`) — child component themes are auto-derived internally by the Sass
layer. This replaces the current "create themes for each related theme" guidance
for composed compounds.

The grid is the first component to use this mechanism. Its Sass layer already
derives all child themes from the three primary tokens (see `_grid-theme.scss`
Theme Builder Logic section). The MCP layer needs to match.

**Why:** Without this change, LLMs calling `get_design_tokens` for the grid
receive contradictory guidance — "here are 3 primary tokens that derive
everything" AND "create separate themes for 14 child components." The composed
flag resolves this by making the instruction unambiguous.

## Dependencies

- **None**

## Context to Read First

**Tier 3 (load only if needed):**
- `packages/theming/sass/themes/components/grid/_grid-theme.scss` — Reference for PRIMARY tokens and Theme Builder Logic that auto-derives child tokens

## Environment

- **Workspace:** `packages/mcp/`
- **Services required:** None

## File Scope

- `packages/mcp/src/knowledge/component-metadata.ts`
- `packages/mcp/src/tools/handlers/component-tokens.ts`
- `packages/mcp/src/tools/descriptions.ts`
- `packages/mcp/src/__tests__/tools/handlers/component-tokens.test.ts`

## Steps

### Step 0: Preflight

- [ ] Verify `packages/mcp/src/knowledge/component-metadata.ts` exists and contains `CompoundInfo` interface
- [ ] Verify `GRID_COMPOUND_INFO` exists with 14 `relatedThemes` entries
- [ ] Verify `packages/mcp/src/tools/handlers/component-tokens.ts` contains the compound component handler logic
- [ ] Verify `packages/mcp/src/tools/descriptions.ts` contains `get_design_tokens` and `create_component_theme` descriptions

### Step 1: Add `composed` flag to CompoundInfo and set on grid

- [ ] Add `composed?: boolean` field to `CompoundInfo` interface in `component-metadata.ts` with JSDoc explaining its purpose
- [ ] Set `composed: true` on `GRID_COMPOUND_INFO` (without disturbing the 14-item `relatedThemes` array)
- [ ] Update `GRID_COMPOUND_INFO.guidance` text to reflect composed behavior — tell LLMs to set only primary tokens and not create separate child themes
- [ ] Run targeted tests: `npx vitest run packages/mcp/src/__tests__/tools/handlers/component-tokens.test.ts`

**Artifacts:**
- `packages/mcp/src/knowledge/component-metadata.ts` (modified)

### Step 2: Update handler guidance for composed compounds

- [ ] In `component-tokens.ts`, add a conditional branch inside the `if (compoundInfo)` block: when `compoundInfo.composed === true`, emit composed-specific guidance instead of the standard compound guidance
- [ ] Composed guidance must: label as "Composed Compound Component", state that only background/foreground/accent-color are needed, explicitly say "Do NOT create separate themes", and list `relatedThemes` as "Internally themed children (auto-derived)" for reference only
- [ ] Standard compound guidance (the existing code) must remain unchanged for non-composed compounds (e.g., combo, select, date-picker)
- [ ] Run targeted tests: `npx vitest run packages/mcp/src/__tests__/tools/handlers/component-tokens.test.ts`

**Artifacts:**
- `packages/mcp/src/tools/handlers/component-tokens.ts` (modified)

### Step 3: Update tool descriptions for composed distinction

- [ ] In `descriptions.ts`, update the `get_design_tokens` COMPOUND COMPONENTS section to distinguish "Standard compounds" (LLM creates separate child themes) from "Composed compounds" (LLM only sets 3 primary tokens, child themes auto-derive)
- [ ] In `descriptions.ts`, update the `create_component_theme` COMPOUND COMPLETENESS section to document composed compound behavior (do NOT generate separate child themes)
- [ ] Run targeted tests: `npx vitest run packages/mcp`

**Artifacts:**
- `packages/mcp/src/tools/descriptions.ts` (modified)

### Step 4: Update tests

- [ ] Update the grid compound test in `component-tokens.test.ts` to assert composed output: expects "Composed Compound Component", "Do NOT create separate themes", "Internally themed children (auto-derived)", and does NOT contain "Scope all related themes under"
- [ ] Verify existing non-composed compound tests still pass (date-range-picker, time-picker, etc.)
- [ ] Run targeted tests: `npx vitest run packages/mcp/src/__tests__/tools/handlers/component-tokens.test.ts`

**Artifacts:**
- `packages/mcp/src/__tests__/tools/handlers/component-tokens.test.ts` (modified)

### Step 5: Testing & Verification

> ZERO test failures allowed. This step runs the FULL test suite as a quality gate.

- [ ] Run FULL test suite: `npm test`
- [ ] Fix all failures
- [ ] Build passes: `npm run build`

### Step 6: Documentation & Delivery

- [ ] "Must Update" docs modified
- [ ] "Check If Affected" docs reviewed
- [ ] Discoveries logged in STATUS.md

## Documentation Requirements

**Must Update:**
- None — the code changes are self-documenting via JSDoc and the updated tool descriptions

**Check If Affected:**
- `packages/mcp/README.md` — update if it documents compound component behavior

## Completion Criteria

- [ ] `CompoundInfo` interface has `composed?: boolean` field
- [ ] `GRID_COMPOUND_INFO` has `composed: true`
- [ ] `get_design_tokens` for grid returns composed guidance (not standard compound scoping)
- [ ] `get_design_tokens` for non-composed compounds (combo, select, etc.) returns standard guidance unchanged
- [ ] Tool descriptions in `descriptions.ts` document the composed vs standard distinction
- [ ] All tests passing (667+ tests)
- [ ] Build passes

## Git Commit Convention

Commits happen at **step boundaries** (not after every checkbox). All commits
for this task MUST include the task ID for traceability:

- **Step completion:** `feat(IGT-002): complete Step N — description`
- **Bug fixes:** `fix(IGT-002): description`
- **Tests:** `test(IGT-002): description`
- **Hydration:** `hydrate: IGT-002 expand Step N checkboxes`

## Do NOT

- Modify `_grid-theme.scss` or any Sass files — the Sass derivation layer is already complete
- Create a multi-phase task covering card → combo rollout — scope is MCP layer only for now
- Emit "create themes for each related theme" guidance when `compoundInfo.composed` is `true`
- Remove or modify `relatedThemes` entries on `GRID_COMPOUND_INFO` — they stay as informational metadata
- Add `composed: true` to any compound other than grid (future rollout is out of scope)

---

## Amendments (Added During Execution)

<!-- Workers add amendments here if issues discovered during execution.
     Format:
     ### Amendment N — YYYY-MM-DD HH:MM
     **Issue:** [what was wrong]
     **Resolution:** [what was changed] -->
