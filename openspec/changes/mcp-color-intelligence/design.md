## Context

Palette generation uses Sass and embedded knowledge to output colors, but lacks guidance for choosing palettes and validating contrast. Color intelligence will build on existing color utilities and knowledge catalogs.

## Goals / Non-Goals

Goals:

- Provide palette suggestions from natural language descriptors.
- Provide contrast checking with WCAG reporting.
- Expose schema resources required by the roadmap.

Non-Goals:

- Replace existing palette generation behavior.
- Implement full design assistant prompts (tracked separately).

## Decisions

### Decision 1: Contrast checks return structured results

The tool should return ratio, pass/fail, and target level so clients can display or act on the result.

### Decision 2: Suggestions are advisory

Palette suggestions are non-binding recommendations that do not alter existing palette APIs.
