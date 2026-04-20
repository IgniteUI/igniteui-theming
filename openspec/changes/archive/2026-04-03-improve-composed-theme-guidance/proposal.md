## Why

For composed compound components (like `grid`), the `get_component_design_tokens` prompt tells models to use only PRIMARY tokens and not create separate child themes. However, the prompt then shows all 90 available tokens in a flat table with equal visual weight. Models predictably ignore the "primary only" instruction and use many non-primary tokens from the visible table. The guidance is too weak to override the signal of a fully enumerated 90-row token table presented at the same level as the 3 primary tokens.

## What Changes

- Introduce a **two-tier token hierarchy** in the `get_component_design_tokens` output for composed components:
  - **Tier 1 — Primary Tokens (actionable)**: Shown prominently as the tokens to use for the initial theme. Clear instruction that the model should use ONLY these for the first pass.
  - **Tier 2 — Refinement Tokens (reference)**: The remaining tokens, clearly labeled as available for fine-tuning only when the user explicitly requests a specific token (e.g., "change the header background"). Visually de-emphasized or separated from the primary set.
- Strengthen the wording to make the two-tier contract unambiguous: "Start with primary tokens only. Use refinement tokens only when the user explicitly asks to customize a specific aspect."
- This is **not a breaking change** — all tokens remain visible and usable; only the prompt structure and emphasis change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `component-theming`: The composed component prompt format in `get_component_design_tokens` changes to introduce a two-tier token hierarchy for composed components — primary tokens as the actionable set, remaining tokens as a clearly-labeled refinement reference.

## Impact

- **Code**: `packages/mcp/src/tools/handlers/component-tokens.ts` — the composed-component branch of `handleGetComponentDesignTokens`
- **Tests**: `packages/mcp/src/__tests__/tools/handlers/component-tokens.test.ts` — tests for composed component output format
- **Spec**: `openspec/specs/component-theming/spec.md` — existing scenarios may need updating to reflect the new composed format
- **Downstream**: All MCP consumers (LLMs) that call `get_component_design_tokens` for composed components (`grid`, `tree-grid`, `hierarchical-grid`, `pivot-grid`)
