## Context

The MCP theming server helps AI models generate component themes for Ignite UI. Compound components (date-picker, combo, grid, etc.) are composed of multiple child components that each need their own theme. Today, the model receives a "compound checklist" with inner CSS selectors for targeting each child — but the new `tokens` mixin makes these selectors unnecessary, and the model still lacks semantic knowledge about _how_ to derive child token values from the parent's theme intent.

Current state:

- `component-selectors.ts` stores `COMPOUND_COMPONENTS` with `relatedThemes` and `innerSelectors`
- `component-tokens.ts` handler formats inner selectors into a checklist table
- `generators/sass.ts` emits `@include css-vars-from-theme(...)` for each component theme
- The model receives no guidance about token relationships between parent and child components

## Goals / Non-Goals

**Goals:**

- Replace inner-selector-based compound guidance with token-derivation-based guidance
- Give the model deterministic rules for setting child component tokens (e.g., "flat-button foreground = adaptive-contrast of calendar content-background")
- Switch Sass output from `css-vars-from-theme` to the `tokens` mixin (global mode)
- Remove all `innerSelectors` infrastructure from the codebase
- Update chart themes to use `tokens` mixin

**Non-Goals:**

- Automating compound theme generation in a single tool call (multi-call with hints is the chosen approach)
- Changing individual theme functions (calendar-theme, flat-button-theme, etc.)
- Changing the `tokens` mixin implementation itself
- Populating `tokenDerivations` for all 10 compounds (initial implementation covers the data structure; compound-specific derivations are populated incrementally)

## Decisions

### Decision 1: New `compound-theming.ts` knowledge file

**Choice:** Create a single `src/mcp/knowledge/compound-theming.ts` file containing all compound theming metadata.

**Alternatives considered:**

- Per-compound files (`compound-theming/date-picker.ts`, etc.) — rejected because there are only 10 compounds; separate files add overhead without meaningful organizational benefit.
- Extending `component-selectors.ts` with new properties — rejected to maintain separation of concerns: `component-selectors.ts` owns structural data (selectors, which children exist), `compound-theming.ts` owns semantic data (how to theme children).

**Data structure:**

```typescript
interface TokenDerivation {
  /** Source token: 'componentName.tokenName' */
  from: string;
  /** Transform: 'identity' | 'adaptive-contrast' | 'dynamic-shade' */
  transform: 'identity' | 'adaptive-contrast' | 'dynamic-shade';
  /** Optional transform arguments (e.g., shade amount for dynamic-shade) */
  args?: Record<string, string | number>;
}

interface CompoundThemingInfo {
  /** Token derivation rules. Key: 'childTheme.childToken' */
  tokenDerivations?: Record<string, TokenDerivation>;
  /** Platform-specific selector overrides for the compound wrapper */
  selectorOverrides?: {
    angular?: string;
    webcomponents?: string;
  };
  /** Free-form guidance for edge cases */
  guidance?: string;
}
```

The `tokenDerivations` key format is `'childTheme.childToken'` (e.g., `'flat-button.foreground'`). The value describes where the token value comes from and how to transform it.

The `selectorOverrides` field handles edge cases where the compound component's wrapper selector differs from `COMPONENT_SELECTORS`. For example, the date-picker needs `igx-date-picker, .igx-date-picker` (extra class for the calendar outlet popup) rather than just `igx-date-picker`. Falls back to `COMPONENT_SELECTORS` when not specified.

### Decision 2: Multi-call with derivation hints (not single-call automation)

**Choice:** The model continues to make separate `create_component_theme` calls per child component. The `get_component_design_tokens` response includes derivation hints that tell the model what values to pass.

**Alternatives considered:**

- Single-call compound generation (one call produces all child themes) — rejected because it prevents the model from customizing individual child tokens based on user intent.
- Single-call with `childOverrides` parameter — rejected as it adds API complexity; the multi-call pattern is already established and gives the model full flexibility.

**How it works:**

1. Model calls `get_component_design_tokens("date-picker")`
2. Response includes derivation hints like: `flat-button.foreground → adaptive-contrast(calendar.content-background)`
3. Model calls `create_component_theme("calendar", tokens: { content-background: purple })` with the compound's selector
4. Model follows the hint and calls `create_component_theme("flat-button", tokens: { foreground: "adaptive-contrast(purple)" })` with the same selector
5. User can override: "make the button text coral" → model uses `foreground: coral` instead of the derived value

### Decision 3: Generator emits `@include tokens(...)` in global mode

**Choice:** `generateComponentTheme` in `generators/sass.ts` emits `@include tokens($theme)` instead of `@include css-vars-from-theme($theme, '$prefix-$name')`.

**Current output:**

```scss
igx-avatar {
  @include css-vars-from-theme($custom-avatar-theme, 'igx-avatar');
}
```

**New output:**

```scss
igx-avatar {
  @include tokens($custom-avatar-theme);
}
```

Global mode is the default for `tokens`. It emits `--ig-{component}-{token}` CSS variables. The second argument to `css-vars-from-theme` (the variable name prefix) is no longer needed since global mode reads the component name from the theme's `_meta.name`.

### Decision 4: Remove `innerSelectors` entirely (no deprecation period)

**Choice:** Remove `CompoundInnerSelectors` interface, `innerSelectors` property from `CompoundComponentInfo`, and all 11 accessor functions in one step.

**Alternatives considered:**

- Deprecation period (mark as deprecated, remove later) — rejected because the inner selector data is incomplete (many WC selectors are `TODO`) and the `tokens` mixin is already the correct approach. Keeping dead code adds maintenance burden.

**Removal surface:**

- `component-selectors.ts`: `CompoundInnerSelectors` interface, `innerSelectors` property on `CompoundComponentInfo`, `innerSelectors` data on all 10 compound entries, 11 functions (`getPartSelector`, `getAngularInnerSelector`, `getInnerSelector`, `hasPartSelectors`, `hasAngularInnerSelectors`, `hasInnerSelectors`, `getAllPartSelectors`, `getAllAngularInnerSelectors`, `getAllInnerSelectors`)
- `knowledge/index.ts`: re-exports of the 11 functions
- `component-tokens.ts`: imports of `hasPartSelectors`, `hasAngularInnerSelectors`; inner selector table formatting logic
- `component-selectors.test.ts`: all inner selector test blocks (`getPartSelector()`, `hasPartSelectors()`, `getAllPartSelectors()`)

### Decision 5: Compound selector resolution order

**Choice:** When generating Sass for a compound component's child theme, the selector is resolved as:

1. `selectorOverrides[platform]` from `compound-theming.ts` (if present)
2. `COMPONENT_SELECTORS[compoundName][platform]` (default)

This keeps the common case simple (most compounds just use their standard selector) while handling edge cases like the date-picker outlet.

### Decision 6: Handler output format for compound components

**Choice:** The `get_component_design_tokens` handler output for compound components changes from an inner-selector table to a derivation-aware checklist.

**Current format:**

```
**Compound checklist (required):**
1. `flat-button`: Angular `.igx-date-picker__actions .igx-button--flat` | WC `...`

| Theme | Angular Selector | Web Components Selector |
|-------|------------------|------------------------|
```

**New format:**

```
**Compound Component:** <description>

**Theming approach:** Use `@include tokens(child-theme(...))` for each related
theme inside the compound component's selector.

**Compound selector:** `<resolved selector for target platform>`

**Related themes and token derivations:**
1. `calendar` — primary visual element
2. `flat-button` — action buttons
   - `foreground` → `adaptive-contrast` of `calendar.content-background`
3. `input-group` — trigger input
   - `border-color` → same as `calendar.header-background`

**Guidance:** <prose guidance>
```

The handler reads from both `COMPOUND_COMPONENTS` (for `relatedThemes` and `description`) and `COMPOUND_THEMING` (for `tokenDerivations`, `selectorOverrides`, `guidance`) and merges them into this output.

## Risks / Trade-offs

**[Model compliance]** The derivation hints are guidance, not enforcement. A model might ignore them.
→ Mitigation: Format hints as a numbered checklist with explicit token-to-token mappings. The `descriptions.ts` tool description reinforces that derivations should be followed. Over time, monitor model compliance and tighten guidance wording if needed.

**[Incomplete derivations]** The `tokenDerivations` for all 10 compounds must be authored manually. Missing derivations mean the model falls back to guessing.
→ Mitigation: Start with the most-used compounds (date-picker, combo, select). The `guidance` prose field provides a fallback for compounds without full derivation rules. Grid is the largest effort — defer detailed derivations and rely on guidance prose initially.

**[Breaking change]** Removing `innerSelectors` and 11 functions is a breaking API change for any code importing from `component-selectors.ts`.
→ Mitigation: The only consumers are internal MCP code (handler, tests, index re-exports). No external packages depend on these APIs. Ship as a single commit with all consumers updated.

**[Chart theme regression]** Switching chart themes from `css-vars(...)` to `tokens(...)` changes output from scoped mode to global mode.
→ Mitigation: `tokens()` in global mode at root level emits into `:root {}`, which is equivalent to the previous scoped behavior at root level. Verify with existing chart theme tests.
