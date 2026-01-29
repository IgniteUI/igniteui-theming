## Context

The MCP tools currently expose compound component information (related themes and scoped selectors) via `get_component_design_tokens`, but model behavior is inconsistent. Some models follow the cues and generate the related theme calls; others ignore them, producing incomplete theming guidance. We want deterministic, model-agnostic prompting that preserves the existing tool behavior (single-component theme generation) while guiding multi-call flows.

Constraints:

- Keep `create_component_theme` behavior unchanged (single component + selector output).
- Improve guidance and response templates only; no code generation changes.
- Use conventions already present in tool responses (tables, tips, examples).

## Goals / Non-Goals

**Goals:**

- Make compound-component expansion a required, explicit flow when compound data is present.
- Provide a checklist that models can follow without inference.
- Include a canonical combo example that demonstrates the multi-call pattern.
- Add a lightweight failure criterion for skipping compound expansion.

**Non-Goals:**

- Auto-generate related theme output in `create_component_theme`.
- Introduce new MCP tools or change existing tool inputs/outputs beyond templated guidance.
- Add new compound selectors or revise component metadata.

## Decisions

- **Decision:** Add a “Compound checklist (required)” block to `get_component_design_tokens` responses when a compound component is detected.
  - **Rationale:** Ordered, explicit steps reduce model variance and make the compound flow harder to skip.
  - **Alternatives:** Rely on narrative hints or a short note; rejected due to unreliable compliance.

- **Decision:** Include a canonical combo example in the tool guidance that shows the exact sequence of tool calls (tokens lookup + three scoped theme generations).
  - **Rationale:** Example-driven behavior is more consistent across models than prose-only instructions.
  - **Alternatives:** No example; rejected because GPT-5.2 Codex often ignores contextual hints without a pattern.

- **Decision:** Add an explicit completeness rule in `create_component_theme` guidance for compound components (response is incomplete if related themes are not generated).
  - **Rationale:** Models that perform self-evaluation are more likely to correct omissions.
  - **Alternatives:** Soft warnings only; rejected due to low compliance.

## Risks / Trade-offs

- **Risk:** Checklist adds response length and could reduce brevity. → **Mitigation:** Keep checklist to 3-4 lines and only show for compound components.
- **Risk:** Some compound selectors are `TODO` and could mislead models. → **Mitigation:** In the checklist, instruct to skip related themes with missing selectors and note the omission.
- **Risk:** Models may still ignore guidance. → **Mitigation:** Combine checklist + example + completeness rule; if still inconsistent, consider adding a dedicated helper tool.

## Migration Plan

- Update response templates and tool descriptions in a single PR.
- Verify with a small evaluation set (combo/select/grid) across models.
- Roll back to previous wording if guidance causes regressions or confusion.

## Open Questions

- Should we include platform-specific sample calls (Angular vs Web Components) or keep the example neutral?
- Do we need a dedicated “compound theme helper” tool if guidance alone is insufficient?
