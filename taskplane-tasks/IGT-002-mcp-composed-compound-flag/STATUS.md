# IGT-002: MCP Composed Compound Flag — Status

**Current Step:** Not Started
**Status:** 🔵 Ready for Execution
**Last Updated:** 2026-04-03
**Review Level:** 1
**Review Counter:** 0
**Iteration:** 0
**Size:** S

> **Hydration:** Checkboxes represent meaningful outcomes, not individual code
> changes. Workers expand steps when runtime discoveries warrant it — aim for
> 2-5 outcome-level items per step, not exhaustive implementation scripts.

---

### Step 0: Preflight
**Status:** ⬜ Not Started

- [ ] Verify `CompoundInfo` interface exists in `component-metadata.ts`
- [ ] Verify `GRID_COMPOUND_INFO` exists with 14 relatedThemes
- [ ] Verify compound handler logic in `component-tokens.ts`
- [ ] Verify tool descriptions in `descriptions.ts`

---

### Step 1: Add `composed` flag to CompoundInfo and set on grid
**Status:** ⬜ Not Started

- [ ] Add `composed?: boolean` to `CompoundInfo` interface with JSDoc
- [ ] Set `composed: true` on `GRID_COMPOUND_INFO`
- [ ] Update grid guidance text for composed behavior
- [ ] Targeted tests pass

---

### Step 2: Update handler guidance for composed compounds
**Status:** ⬜ Not Started

- [ ] Add composed branch in `component-tokens.ts` handler
- [ ] Composed guidance emits correct labels and "Do NOT create separate themes"
- [ ] Standard compound guidance unchanged
- [ ] Targeted tests pass

---

### Step 3: Update tool descriptions for composed distinction
**Status:** ⬜ Not Started

- [ ] `get_design_tokens` description distinguishes standard vs composed compounds
- [ ] `create_component_theme` description covers composed compound behavior
- [ ] Targeted tests pass

---

### Step 4: Update tests
**Status:** ⬜ Not Started

- [ ] Grid test asserts composed output format
- [ ] Non-composed compound tests still pass
- [ ] Targeted tests pass

---

### Step 5: Testing & Verification
**Status:** ⬜ Not Started

- [ ] FULL test suite passing
- [ ] All failures fixed
- [ ] Build passes

---

### Step 6: Documentation & Delivery
**Status:** ⬜ Not Started

- [ ] "Must Update" docs modified
- [ ] "Check If Affected" docs reviewed
- [ ] Discoveries logged

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-03 | Task staged | PROMPT.md and STATUS.md created |

---

## Blockers

*None*

---

## Notes

*Reserved for execution notes*
