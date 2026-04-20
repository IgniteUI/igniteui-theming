## Context

The `get_component_design_tokens` MCP tool returns component theming descriptions that models consume as instructions. The current output format has two problems:

1. **Structure**: The output reads as a reference document (header, description dump, flat tables) instead of actionable instructions. Models perform better with step-by-step skill-like formats.
2. **Platform bias**: Scope tables show Angular overlay rows with `N/A` for Web Components, React, and Blazor — misleading models into thinking those platforms are missing something. In reality, WC-based platforms simply don't use overlays; their child themes all scope inline.

The description text originates in SassDoc comments across 54 `*-theme.scss` files, gets extracted by `buildComponentDocs.mjs` into `json/components/themes.json`, loaded by `component-themes.ts`, and assembled into the final response by `component-tokens.ts`.

## Goals / Non-Goals

**Goals:**

- Restructure the `get_component_design_tokens` response into an instruction-oriented format that models can follow like a skill
- Present two distinct formats: compound components (with steps, platform scopes, related themes) and simple components (theme function + token table)
- Group platforms into two theming strategies: Angular vs. Web Components / React / Blazor — showing only relevant scope rows per group
- Trim verbose SassDoc descriptions and extract PRIMARY TOKENS into structured data
- Preserve all existing information (tokens, scopes, derivations, guidance) — just reorganize presentation

**Non-Goals:**

- Changing the compound theming data structures in `compound-theming.ts` or `component-selectors.ts`
- Adding new tokens, components, or theming capabilities
- Modifying the `create_component_theme` handler output
- Changing how Sass code generation works

## Decisions

### 1. Two output formats: compound vs. simple

**Decision:** Produce distinct output formats based on whether the component is compound.

**Rationale:** Non-compound components (avatar, badge, chip, etc.) don't need steps about scoping, related themes, or platform differences. Including empty compound sections adds noise. Models parse shorter, focused outputs more reliably.

**Alternative considered:** Unified format with empty/N/A sections for non-compound components. Rejected because it wastes context window and can confuse models into thinking they need to handle compound logic for simple components.

### 2. Platform grouping: Angular vs. WC-based

**Decision:** Show two platform sections — "Angular" and "Web Components / React / Blazor" — rather than iterating over all four platforms individually.

**Rationale:** React and Blazor wrap Web Components. They use identical `igc-` selectors, `--ig-` variable prefixes, and inline-only scoping. Showing three identical tables wastes tokens and suggests false differences. The existing code in `sass.ts` already groups these: Angular gets its own generator; WC/React/Blazor share one (`generateTheme()` lines 155-164).

**Implementation:** In `component-tokens.ts`, iterate over two platform groups instead of the current `['angular', 'webcomponents']` loop. Use `'webcomponents'` as the representative platform for the WC group when calling `getScopeSelectorForPlatform()` and `resolveChildScopeName()`.

### 3. Omit irrelevant scope rows per platform

**Decision:** Only render scope rows that have a non-null selector for the platform group. For WC-based platforms, if `overlay` scope has no `webcomponents` selector, omit that row entirely.

**Rationale:** Showing `| overlay | N/A |` for Web Components implies the platform is missing functionality. It's not — WC simply doesn't use overlay outlets. Omitting the row makes the instruction clearer: "here are your scopes, use them."

**Alternative considered:** Keep N/A rows with explanatory note. Rejected because it adds complexity for zero informational value — the model just needs to know which scopes to use, not which ones don't exist.

### 4. Instruction-oriented opening

**Decision:** Change the opening from `## Design Tokens for \`date-picker\``to`Implement a theme for the \`date-picker\` component using the following guidance.`

**Rationale:** The opening line sets the model's mode. A reference-style header puts it in "describe" mode; an instruction-style opening puts it in "execute" mode. The latter is what we want when models consume this output to generate theming code.

### 5. Extract PRIMARY TOKENS into structured data

**Decision:** In `buildComponentDocs.mjs`, parse the SassDoc description to split it into two fields in `themes.json`:

- `description`: Just the title line (e.g., "Calendar Theme")
- `primaryTokens`: Array of `{ name, description }` objects extracted from the "PRIMARY TOKENS" block

**Rationale:** The current description field mixes the component title with verbose derivation prose. By extracting PRIMARY TOKENS into structured data, the handler can format them consistently and concisely without regex-parsing free-form text at runtime.

**Implementation:** Add a `parsePrimaryTokens(description)` function to `buildComponentDocs.mjs` that:

1. Splits on `PRIMARY TOKENS` marker
2. Parses `- \`$name\` - description` lines into objects
3. Returns `{ title, primaryTokens, summary }` where summary is any remaining non-token prose (e.g., "Text/icon colors auto-calculated for contrast.")

The `ComponentTheme` interface in `component-themes.ts` gains an optional `primaryTokens` field. The handler reads this instead of the raw description blob.

### 6. Trim SassDoc descriptions in Sass source

**Decision:** Edit the 54 `*-theme.scss` files to shorten the description block. Remove verbose "Auto-derives: X, Y, Z" lists from the PRIMARY TOKENS bullet points. Keep one-line summaries per token.

**Before:**

```
/// PRIMARY TOKENS (set these first for quick theming):
/// - `$header-background` - The main accent color. Auto-derives: header-foreground, date-selected colors,
///   picker hover colors, year/month selected colors, date-special colors, navigation hover colors.
/// - `$content-background` - The calendar body background. Auto-derives: content-foreground, inactive-color,
///   weekday-color, date-hover colors, week-number colors.
///
/// Setting just `$header-background` will theme all accent/selection states consistently.
/// Setting just `$content-background` will theme the calendar body with proper contrast.
/// Text and icon colors are automatically calculated for accessibility.
```

**After:**

```
/// PRIMARY TOKENS:
/// - `$header-background` — Main accent color. Derives accent/selection states.
/// - `$content-background` — Calendar body background. Derives text and inactive colors.
///
/// Text and icon colors are auto-calculated for contrast.
```

**Rationale:** The individual `@param` annotations already carry the full derivation info per token. The description block is for quick orientation, not exhaustive enumeration. Trimming reduces both the SassDoc source noise and the `themes.json` payload.

### 7. Compound component output structure

**Decision:** The compound format follows this section order:

```
1. Opening instruction line
2. Theme Function
3. Compound Component (description)
4. Steps (numbered, actionable)
5. Per-platform sections:
   a. Platform label (e.g., "Angular:")
   b. Scope table (only rows with non-null selectors)
   c. Related themes table (theme → scope → selector)
6. Token Derivations table (platform-agnostic)
7. Guidance paragraph
8. Primary Tokens (from structured data)
9. Available Tokens table (or "No directly customizable tokens" note)
10. Next step prompt
```

**Rationale:** This mirrors the execution flow a model should follow: understand what it is → know the steps → pick a platform → look up scopes → check derivations → apply tokens. The guidance comes after the structural data because it provides edge-case context, not primary instructions.

## Risks / Trade-offs

**[Breaking change for downstream prompt caches]** → Models that have cached or fine-tuned on the old format may need prompt adjustments. Mitigation: The new format is strictly better-structured, so models should adapt without explicit retraining. The semantic content is identical.

**[54 Sass file edits]** → Large surface area for the SassDoc trimming. Mitigation: Each edit is mechanical (shorten bullet points, remove "Auto-derives" lists). Can be partially automated with a script. Individual `@param` annotations are untouched, so no data loss.

**[`themes.json` schema change]** → Adding `primaryTokens` field. Mitigation: The field is additive — existing consumers that only read `description` and `tokens` are unaffected. The `description` field gets shorter but remains present.
