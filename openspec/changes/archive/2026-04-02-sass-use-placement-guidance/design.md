## Context

Each Sass-generating MCP tool (`create_palette`, `create_theme`, `create_typography`, `create_elevations`, `create_custom_palette`, `create_component_theme`) emits a standalone code block with its own `@use` statement at the top. When an LLM combines outputs from multiple tool calls into a single `.scss` file, it sometimes places `@use` rules after other statements or duplicates them, breaking Sass compilation.

The `@use` lines are generated centrally in `utils/sass.ts` (`generateUseStatement`, `generatePresetImports`) and assembled into output by `generators/sass.ts` and platform-specific generators. Handler response text wraps the Sass in a markdown code fence but includes no assembly guidance.

## Goals / Non-Goals

**Goals:**

- Make the `@use` placement constraint visible to the LLM at three levels: inline in generated code, in response text after the code block, and in tool descriptions
- Keep the guidance minimal so it doesn't bloat output or distract from the primary content

**Non-Goals:**

- Restructuring tool output format (splitting imports from code into separate sections) — reserved for a follow-up if this lighter approach is insufficient
- Changing how `@use` statements are generated or resolved
- Handling non-Sass output (CSS output mode is unaffected)

## Decisions

### 1) Add an inline comment above `@use` lines in generated Sass

Modify `generateUseStatement` in `utils/sass.ts` to prepend a short comment:

```scss
// NOTE: @use rules must be at the top of the file. Deduplicate when combining multiple outputs.
@use 'igniteui-theming' as *;
```

Rationale: This is the most visible placement — it's inside the code the LLM reads and copies. One line, no ambiguity.

Alternatives considered:

- Comment after the `@use` line: less prominent, LLM may not associate it with placement.
- Multi-line comment block: too verbose for something that should be a brief nudge.

### 2) Append an assembly note after each Sass code block in handler response text

Each Sass-generating handler will append a brief note after the code fence:

```
> **File placement:** `@use` rules must appear at the very top of the `.scss` file,
> before any other statements. When combining outputs from multiple tools,
> keep only one `@use` per module path.
```

This applies to handlers in: `palette.ts`, `custom-palette.ts`, `typography.ts`, `elevations.ts`, `theme.ts`, `component-theme.ts`.

Rationale: The inline comment handles the code-level signal; this handles the prose-level instruction that the LLM processes when deciding how to assemble the file.

Alternatives considered:

- Only inline comment (no prose): some LLMs weight prose instructions more than code comments.
- Longer assembly instructions with examples: too verbose for every tool response.

### 3) Add brief `@use` note to Sass-generating tool descriptions

Add a short `<important_notes>` entry or append to existing notes in tool descriptions for `create_palette`, `create_theme`, `create_typography`, `create_elevations`, `create_custom_palette`, `create_component_theme`:

```
When combining Sass output from multiple tools into one file, all @use rules
must appear at the top before any other statements. Deduplicate @use lines
that share the same module path.
```

Rationale: Tool descriptions are read by the LLM before it calls the tool. This primes the LLM to think about placement before it even sees the output.

Alternatives considered:

- Only adding to `create_component_theme` (most common composition target): misses cases where palette + typography are combined without component themes.

### 4) Centralize the assembly note text

Define the assembly note string once in `utils/sass.ts` and import it in each handler, rather than duplicating the text.

Rationale: Single source of truth; easy to tune wording later without touching six files.

## Risks / Trade-offs

- [Risk] Inline comment adds one line to every Sass output, including cases where the user never combines files → Acceptable; the line is short and informative.
- [Risk] Assembly note in response text may be ignored by some LLM clients → Mitigated by the inline comment and description-level guidance working in parallel.
- [Risk] Description additions make already-long tool descriptions slightly longer → Mitigated by keeping the addition to 2-3 sentences.
- [Risk] This approach may not fully prevent the issue for all LLM agents → If misplacement persists, the structured output approach (option C from exploration) can be implemented as a follow-up.
