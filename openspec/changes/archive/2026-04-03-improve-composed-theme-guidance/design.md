## Context

The `handleGetComponentDesignTokens` handler in `component-tokens.ts` builds a text prompt returned to LLMs when they call `get_component_design_tokens`. For composed compound components (those with `compound.composed: true`), the current output structure is:

1. Opening instruction line
2. Theme function name
3. Composed compound block (⚡ warning, children list, guidance)
4. **Primary Tokens** — 3 bullet items
5. **Available Tokens (90)** — full table, same visual weight as everything above
6. Next step

The problem: sections 4 and 5 have equal visual weight. Models see 90 tokens in a table and use many of them, treating the "PRIMARY tokens only" instruction as a suggestion rather than a constraint.

Non-composed components are unaffected — they should continue showing all tokens at equal weight since there's no auto-derivation hierarchy.

## Goals / Non-Goals

**Goals:**
- Models use only primary tokens on the first `create_component_theme` call for composed components
- Users can still request specific refinement tokens in follow-up turns (e.g., "now change the header background")
- The prompt structure makes the two-tier hierarchy unambiguous without relying on the model's self-discipline
- Non-composed components remain unchanged

**Non-Goals:**
- Changing the `create_component_theme` handler or its token validation (it already validates tokens)
- Modifying the primary tokens data or adding new primary tokens
- Changing behavior for standard (non-composed) compound components
- Changing the token data in `themes.json` or the build pipeline

## Decisions

### Decision 1: Split the token table into two sections for composed components

**Choice**: For composed components, replace the single "Available Tokens" table with two distinct sections:
- **"✅ Primary Tokens — USE THESE"** — the 3 primary tokens shown as a table (name, type, description), with an explicit instruction: "Use ONLY these tokens when creating the initial theme."
- **"📖 Refinement Tokens — REFERENCE ONLY"** — the remaining tokens, prefaced with: "These tokens are auto-derived from the primary tokens above. Use them ONLY when the user explicitly requests fine-grained control over a specific aspect (e.g., 'change the header background')."

**Why not hide refinement tokens?** Hiding them would break the follow-up workflow where users ask to tweak specific aspects. The model needs to see the token exists to use it.

**Why not just add stronger wording?** The current prompt already says "PRIMARY tokens" — the issue is structural, not linguistic. A 90-row table at the same level signals "use all of these." Splitting into two sections with different headers creates a visual/structural hierarchy that models respect better than inline instructions.

**Alternative considered — collapsible/summary format**: Using a terse one-line-per-token list instead of a table for refinement tokens. Rejected because: the table format is useful when the user does ask for a specific token — they need type and description info. We can keep the table but under a clearly de-emphasized header.

### Decision 2: Move primary tokens ABOVE the composed compound block

**Choice**: For composed components, restructure the section order to:

1. Opening instruction line
2. Theme function name
3. **Primary Tokens section** (promoted, with "USE THESE" header)
4. Composed compound block (⚡ warning, children list, guidance)
5. **Refinement Tokens section** (demoted, with "REFERENCE ONLY" header)
6. Next step

**Rationale**: Putting the actionable tokens immediately after the theme function — before the compound explanation — establishes "what to do" before "how it works." The model reads the actionable tokens first, then the explanation of why only those are needed, then the reference list last. This order reinforces the hierarchy.

### Decision 3: Adjust the "Next step" line for composed components

**Choice**: Change the next-step text for composed components from the generic:
> "Use `create_component_theme` with the tokens above to generate Sass/CSS code."

To:
> "Use `create_component_theme` with the **primary tokens** above to generate Sass/CSS code. Add refinement tokens only if the user requests specific customization."

**Rationale**: The last line is the final instruction the model sees before acting. Reinforcing "primary tokens" here closes the loop.

## Risks / Trade-offs

**[Risk] Models may still use refinement tokens on first pass** → Mitigation: The structural separation (two distinct sections with different headers) is a stronger signal than inline text. If this proves insufficient, a future iteration could omit the refinement table entirely and instruct the model to call `get_component_design_tokens` again for refinement tokens when needed. But try the two-tier approach first since it's non-breaking and preserves single-call ergonomics.

**[Risk] Increased prompt length from repeated instructions** → Mitigation: The additional text is ~3-4 lines. Negligible compared to the 90-row token table already present.

**[Risk] Spec drift — existing test snapshots may break** → Mitigation: Update test expectations in the same PR. The tests for composed component output format will need to match the new section structure.
