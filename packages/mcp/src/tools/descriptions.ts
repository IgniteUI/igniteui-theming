/**
 * Centralized descriptions for MCP tools and their parameters.
 *
 * Uses XML-like tags for structured content that helps AI models
 * understand tool purpose, workflows, and constraints.
 *
 * Structure:
 * - FRAGMENTS: Reusable text snippets for common concepts
 * - TOOL_DESCRIPTIONS: Full tool descriptions with XML sections
 * - PARAM_DESCRIPTIONS: Individual parameter descriptions
 */

// ============================================================================
// REUSABLE FRAGMENTS
// ============================================================================

/**
 * Reusable text fragments for common concepts.
 * Used to maintain consistency across descriptions.
 */
export const FRAGMENTS = {
  /** Platform parameter description */
  PLATFORM: `Target platform: "angular" for Ignite UI for Angular, "webcomponents" for Ignite UI for Web Components, "react" for Ignite UI for React, "blazor" for Ignite UI for Blazor, or "generic" for platform-agnostic output (standalone igniteui-theming usage). If omitted, generates generic code. Use detect_platform tool first to auto-detect from project files.`,

  /** Color format examples - CSS Color Level 4 */
  COLOR_FORMAT: `Valid CSS color formats: hex ("#3F51B5", "#3F51B5AA"), rgb/rgba ("rgb(63, 81, 181)", "rgb(63 81 181 / 0.5)"), hsl/hsla ("hsl(231, 48%, 48%)", "hsl(231 48% 48% / 0.5)"), hwb ("hwb(231 20% 30%)"), lab/lch ("lab(50% 40 59)", "lch(50% 80 30)"), oklab/oklch ("oklab(59% 0.1 0.1)", "oklch(60% 0.15 50)"), color() for wide-gamut ("color(display-p3 1 0.5 0)"), or CSS named colors ("indigo", "rebeccapurple").`,

  /** Variant parameter description */
  VARIANT: `Theme variant: "light" (light backgrounds, dark text) or "dark" (dark backgrounds, light text). Defaults to "light".`,

  /** Design system parameter description */
  DESIGN_SYSTEM: `Design system preset: "material" (Material Design), "bootstrap" (Bootstrap), "fluent" (Microsoft Fluent), or "indigo" (Infragistics Indigo). Defaults to "material".`,

  /** Chromatic shade levels */
  CHROMATIC_SHADES:
    "14 shades required: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, A100, A200, A400, A700",

  /** Gray shade levels */
  GRAY_SHADES:
    "10 shades required: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900",

  /** Surface layer roles */
  SURFACE_ROLES:
    "6 layers required: base, sunken, raised, overlay, container, seed",

  /** What a seed color does and does not control */
  SEED_BEHAVIOUR:
    "Every shade is solved for a contrast target, so a seed supplies HUE and SATURATION, not lightness - a very light or very dark brand color yields the same ramp as a mid-tone one. Pass the brand color as-is. The one caveat: a seed with almost no chroma (a near-white or near-gray wash) is read as neutral and produces a gray ramp.",

  /** Monochromatic requirement - only applies to hand-written explicit shades */
  MONOCHROMATIC_RULE:
    "In explicit mode, all shades in a group must be the SAME HUE (±30°) and run 50 lightest to 900 darkest - they are lightness steps of one color, not different colors. Shades mode enforces this for you.",

  /** Sass @use placement guidance for tools that generate Sass output */
  SASS_FILE_PLACEMENT: `SASS FILE PLACEMENT:
  - When combining Sass output from multiple tools into one file, all @use rules
    must appear at the top before any other statements. Deduplicate @use lines
    that share the same module path.`,

  /** Resource scheme */
  RESOURCE_SCHEME: "theming://",
} as const;

// ============================================================================
// TOOL DESCRIPTIONS
// ============================================================================

/**
 * Comprehensive tool descriptions with XML-structured sections.
 * These are shown to AI models when listing available tools.
 */
export const TOOL_DESCRIPTIONS = {
  // ---------------------------------------------------------------------------
  // detect_platform - Simple tool
  // ---------------------------------------------------------------------------
  detect_platform: `Detect the target platform by analyzing dependencies and project config files.

<use_case>
  Use this tool FIRST before generating any theme code to ensure platform-optimized output.
  The detected platform determines the correct Sass module paths and syntax.
  Output format ("sass" vs "css") is a separate concern — see the output parameter on each
  generation tool. For non-Angular platforms, prefer "css" unless the project has a confirmed
  Sass pipeline; use your own file-reading tools or ask the user to confirm before choosing
  output: "sass".
</use_case>

<detection_signals>
  Uses multi-signal detection with confidence scoring:
  1. Ignite UI packages (HIGH - 100): igniteui-angular, igniteui-webcomponents, igniteui-react, IgniteUI.Blazor
  2. Config files (MEDIUM-HIGH - 80): angular.json, vite.config.*, next.config.*, .csproj
  3. Framework packages (LOW - 40): @angular/core, react, lit (fallback only)
  4. Generic fallback: When no Ignite UI product is found, returns "generic" for standalone theming
</detection_signals>

<output>
  Returns:
  - platform: "angular" | "webcomponents" | "react" | "blazor" | "generic" | null
  - confidence: "high" | "medium" | "low" | "none"
  - ambiguous: true if multiple Ignite UI platforms detected (requires user to specify explicitly)
  - alternatives: Array of detected platforms when ambiguous
  - signals: Array of detection signals found
  - detectedPackage: The primary package that triggered detection
  - platformInfo: Name, theming module path, and description

  "generic" means no Ignite UI product framework was found. Most tools work in generic mode
  (palette, typography, elevations, theme generation, color references, layout tokens with scope).
  Component-specific tools (create_component_theme, get_component_design_tokens) are NOT available
  in generic mode. The response includes Sass load path guidance based on detected build tooling.
  null is reserved for error states (package.json read failure) or ambiguous multi-product detection.
</output>

<ambiguous_handling>
  When multiple Ignite UI platforms are detected with significant confidence (≥60), returns:
  - platform: null
  - ambiguous: true
  - alternatives: List of possible platforms with their signals
  - Action: User must specify platform explicitly in subsequent tool calls
</ambiguous_handling>

<related_tools>
  After detection, use the platform value with:
  - create_palette: Generate color palette
  - create_theme: Generate complete theme
  - create_typography: Set up typography
  - create_elevations: Configure shadows
</related_tools>

<related_resources>
  - "theming://guidance/platform-setup": Comprehensive setup guide covering detection workflow, Sass load path configuration, dependency handling, and the recommended theming sequence. Read this for detailed platform-specific setup instructions.
</related_resources>`,

  // ---------------------------------------------------------------------------
  // create_palette - Medium complexity
  // ---------------------------------------------------------------------------
  create_palette: `Generate a color palette for Ignite UI themes using the palette() Sass function.

<use_case>
  Use this tool when you have base colors and want to auto-generate a complete palette
  with all shade variations (50-900, A100-A700). This is the right tool for almost every
  palette - pass the brand colors and let the generator do the rest.
</use_case>

<output_formats>
  - "sass" (default): Generates Sass code using the palette() function. Requires Sass compilation.
  - "css": Generates CSS custom properties (variables) directly. Ready to use in any CSS file.

  Use "css" output when:
  - Working with vanilla CSS projects without Sass
  - You want immediately usable CSS variables
  - Using CSS-in-JS or other non-Sass styling approaches
</output_formats>

<workflow>
  1. Validates input colors against the theme variant
  2. Generates Sass code OR compiles to CSS based on output parameter
  3. Adds warning comments to code if issues detected
  4. Returns validation warnings and tips in response
</workflow>

<important_notes>
  - Requires primary, secondary, and surface colors (matches Sass palette() API)
  - Gray, info, success, warn, error are optional (use design system defaults)
  - Surface color should match variant: light colors for "light", dark for "dark"
  - ${FRAGMENTS.SEED_BEHAVIOUR}

  SHADE PROGRESSION (important):
  - Primary, secondary, and all chromatic colors: shades are NEVER inverted.
    The palette() function always generates 50=lightest to 900=darkest.
  - Only gray shades behave differently based on variant (for text contrast).
  - DO NOT manually invert primary/secondary colors for dark themes.

  ${FRAGMENTS.SASS_FILE_PLACEMENT}
</important_notes>

<output>
  Returns:
  - Generated Sass code with palette() function call, OR
  - Generated CSS with custom properties (:root { --ig-primary-50: ...; })
  - Platform-specific module imports (Sass only)
  - Validation warnings (if any colors have issues)
  - Variable name created (e.g., $my-palette) (Sass only)
</output>

<error_handling>
  - Invalid color format: Returns error with format examples
  - Variant mismatch: Warns if surface color doesn't match theme variant
</error_handling>

<example>
  Blue brand with orange accent on light theme (Sass output):
  {
    "primary": "#1976D2",
    "secondary": "#FF9800",
    "surface": "#FAFAFA",
    "variant": "light"
  }

  Same palette as CSS variables:
  {
    "primary": "#1976D2",
    "secondary": "#FF9800",
    "surface": "#FAFAFA",
    "variant": "light",
    "output": "css"
  }
</example>

<related_tools>
  - detect_platform: Run first to get correct platform value
  - create_custom_palette: Only when exact per-shade values are mandated by a brand spec
  - create_theme: Use instead if you want palette + typography + elevations together
</related_tools>

<related_resources>
  Call read_resource to load reference data:
  - "theming://presets/palettes" — preset palette colors
  - "theming://guidance/colors" — color guidance overview
  - "theming://guidance/colors/rules" — light/dark theme color rules
</related_resources>`,

  // ---------------------------------------------------------------------------
  // create_custom_palette - Complex tool
  // ---------------------------------------------------------------------------
  create_custom_palette: `Generate a custom color palette with fine-grained control over individual shade values.

⚠️ CRITICAL RULES - READ BEFORE GENERATING SHADES:
1. MONOCHROMATIC: Each color (primary, secondary, etc.) must use ONE HUE only.
   All 14 shades are lighter/darker versions of the SAME color.
   Example: primary blue → all shades must be blue (#E3F2FD light → #0D47A1 dark).
   WRONG: mixing blue, green, purple in one color's shades.
2. NEVER INVERT: Chromatic colors always go 50=lightest → 900=darkest.
   This applies to BOTH light and dark themes. Only gray inverts for dark themes.

<use_case>
  PREFER create_palette. It derives every shade from a seed by solving for a contrast
  target, so it handles any brand color - light, dark, muted or neon - on its own.
  ${FRAGMENTS.SEED_BEHAVIOUR}

  Reach for this tool only when:
  - A brand spec mandates exact values for specific shades, and those values must be
    reproduced rather than generated
  - An accessibility audit requires exact contrast color values (rare - the generated
    adaptive-contrast() is normally what you want)

  Mixing is supported and is the usual shape: pin the one group the brand specifies and
  leave every other group in "shades" mode.
</use_case>

<output_formats>
  - "sass" (default): Generates Sass code with palette map structure. Requires Sass compilation.
  - "css": Generates CSS custom properties (variables) directly. Ready to use in any CSS file.

  Use "css" output when:
  - Working with vanilla CSS projects without Sass
  - You want immediately usable CSS variables
  - Building prototypes or quick demos
  - Using CSS-in-JS or other non-Sass styling approaches
</output_formats>

<workflow>
  1. For each color group, choose a mode:
     - mode:"shades" → Auto-generate from baseColor (the default choice)
     - mode:"explicit" → Reproduce mandated values shade by shade
  2. Validates explicit shades for completeness, color format, lightness order and hue
     consistency
  3. Generates Sass code with color() map structure
  4. Returns any validation warnings
</workflow>

<important_notes>
  CHROMATIC COLORS (primary, secondary, info, success, warn, error):
  - "shades" mode needs only a baseColor - prefer it
  - "explicit" mode requires ${FRAGMENTS.CHROMATIC_SHADES}
  - ${FRAGMENTS.MONOCHROMATIC_RULE}
  - Chromatic shades are NEVER inverted: 50 is lightest and 900 darkest in BOTH light
    and dark themes

  GRAY (the only family that inverts):
  - "explicit" mode requires ${FRAGMENTS.GRAY_SHADES}
  - LIGHT themes: 50 = lightest, 900 = darkest. DARK themes: inverted
  - Gray inverts because text and UI elements contrast against the surface

  SURFACE (not a ramp):
  - A background plus the layers on it, keyed by ${FRAGMENTS.SURFACE_ROLES}
  - "base" is the page; "sunken"/"raised"/"overlay" step away from it; "container" is a
    translucent tint; "seed" is the input color
  - There are no numeric surface shades and no hue ramp to keep monochromatic

  CONTRAST COLORS - OMIT contrastOverrides entirely. Each shade automatically gets
  '<shade>-contrast': adaptive-contrast(<color>), which picks black or white for
  readability. Only supply overrides for an audit demanding exact values.

  ${FRAGMENTS.SASS_FILE_PLACEMENT}
</important_notes>

<output>
  Returns:
  - Generated Sass code with color() map definitions, OR
  - Generated CSS with custom properties (:root { --ig-primary-50: ...; })
  - Summary of which colors use shades() vs explicit values
  - Variable name created (e.g., $custom-light-palette) (Sass only)
  - Validation warnings (if any)
</output>

<error_handling>
  Validation FAILS (returns error, no code generated) if:
  - Missing required shades in explicit mode
  - Invalid CSS color format in any shade

  Validation WARNS (generates code with warnings) if:
  - Luminance progression incorrect (50 darker than 900)
  - Hue inconsistency detected (shades not monochromatic)
  - Gray progression doesn't match variant (light vs dark)
</error_handling>

<example>
  The usual case - every group from a seed:
  {
    "variant": "light",
    "primary": { "mode": "shades", "baseColor": "#4CAF50" },
    "secondary": { "mode": "shades", "baseColor": "#FF9800" },
    "surface": { "mode": "shades", "baseColor": "#FAFAFA" }
  }

  A brand spec pins primary; everything else is still generated:
  {
    "variant": "light",
    "primary": {
      "mode": "explicit",
      "shades": {
        "50": "#E8F5E9", "100": "#C8E6C9", "200": "#A5D6A7", "300": "#81C784",
        "400": "#66BB6A", "500": "#4CAF50", "600": "#43A047", "700": "#388E3C",
        "800": "#2E7D32", "900": "#1B5E20",
        "A100": "#B9F6CA", "A200": "#69F0AE", "A400": "#00E676", "A700": "#00C853"
      }
    },
    "secondary": { "mode": "shades", "baseColor": "#FF9800" },
    "surface": { "mode": "shades", "baseColor": "#FAFAFA" }
  }

  Note: no contrastOverrides in either input. The generated Sass adds
  '500-contrast': adaptive-contrast(#4CAF50) for every shade automatically.
</example>

<related_tools>
  - detect_platform: Run first to get correct platform value
  - create_palette: Prefer this - it handles any seed color without hand-written shades
  - create_theme: Does not support custom palettes; use this tool + manual theme assembly
</related_tools>

<anti_example>
  ❌ WRONG - DO NOT create shades like this (different hues = broken palette):
  {
    "primary": {
      "mode": "explicit",
      "shades": {
        "50": "#E3F2FD",   // blue
        "100": "#DCEDC8",  // green ← WRONG HUE
        "200": "#FFF9C4",  // yellow ← WRONG HUE
        "500": "#9C27B0",  // purple ← WRONG HUE
        "900": "#BF360C"   // red-brown ← WRONG HUE
      }
    }
  }
  This creates a rainbow, not a shade palette. Components will look broken.
</anti_example>

<related_resources>
  Call read_resource to load reference data:
  - "theming://presets/palettes" — preset palette colors for reference
  - "theming://guidance/colors/usage" — which shades to use for different purposes
  - "theming://guidance/colors/roles" — semantic meaning of each color family
</related_resources>`,

  // ---------------------------------------------------------------------------
  // create_typography - Medium complexity
  // ---------------------------------------------------------------------------
  fit_color_scale: `Derive a shade scale from an existing color ladder.

<use_case>
  Use when shades must follow the rhythm of a ladder you already have - another design
  system's grays, a brand ramp, a palette from a screenshot. Pass the returned spec to
  create_palette or create_theme as \`scales\`. Never hand-write range/curve values.

  Not needed for the built-in presets ("even" | "material" | "tailwind" | "carbon") -
  name those in \`scales\` directly.
</use_case>

<important_notes>
  - Order the colors LIGHTEST FIRST (a 50-900 ladder already is). 3 minimum, 10 fits best.
  - The response reports how closely the fit reproduces the ladder; a ladder that does not
    follow one smooth curve fits loosely and says so.
  - A scale sets rhythm only, never hue - the seed still decides the color.
  - Background: read_resource "igniteui-theming://guidance/colors/scales"
</important_notes>

<example>
  { "colors": ["#f8fafc","#f1f5f9","#e2e8f0","#cbd5e1","#94a3b8",
               "#64748b","#475569","#334155","#1e293b","#0f172a"], "name": "gray" }
</example>`,

  create_typography: `Set up typography for Ignite UI themes with custom font families and type scales.

<use_case>
  Use this tool to configure fonts that match your brand identity while maintaining
  consistent sizing, line heights, and letter spacing based on design system conventions.
</use_case>

<workflow>
  1. Takes font family string and optional design system preset
  2. Generates Sass code using the typography() mixin
  3. Applies the type scale from the selected design system
  4. Optionally applies custom scale overrides
</workflow>

<important_notes>
  - Font family string should include fallbacks for cross-platform compatibility
  - Quote font names that contain spaces: '"Segoe UI"' not 'Segoe UI'
  - Design system affects: font sizes, line heights, letter spacing, font weights
  - Type styles include: h1-h6, subtitle-1/2, body-1/2, button, caption, overline

  ${FRAGMENTS.SASS_FILE_PLACEMENT}
</important_notes>

<output>
  Returns:
  - Generated Sass code with typography() mixin call
  - Platform-specific module imports
  - Variable name used (e.g., $my-typography)
</output>

<error_handling>
  - Empty font family: Returns error requesting valid font family string
</error_handling>

<example>
  Modern sans-serif typography for Material Design:
  {
    "fontFamily": "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
    "designSystem": "material"
  }
</example>

<related_tools>
  - detect_platform: Run first to get correct platform value
  - create_theme: Use instead if you want typography + palette + elevations together
</related_tools>

<related_resources>
  Call read_resource to load reference data:
  - "theming://presets/typography" — typography presets for all design systems
</related_resources>`,

  // ---------------------------------------------------------------------------
  // create_elevations - Simple tool
  // ---------------------------------------------------------------------------
  create_elevations: `Set up elevation shadows for Ignite UI themes.

<use_case>
  Use this tool to configure box-shadow values that provide visual depth and hierarchy.
  Elevations follow Material Design or Indigo design specifications.
</use_case>

<workflow>
  1. Selects elevation preset based on design system parameter
  2. Generates Sass code using the elevations() mixin
  3. Creates 24 elevation levels (0-24) with corresponding shadow values
</workflow>

<important_notes>
  - "material" preset: Material Design 3 shadow specifications
  - "indigo" preset: Infragistics Indigo shadow specifications
  - Elevation 0 = no shadow, elevation 24 = maximum shadow depth
  - Components use elevation() function to apply specific levels

  ${FRAGMENTS.SASS_FILE_PLACEMENT}
</important_notes>

<output>
  Returns:
  - Generated Sass code with elevations() mixin call
  - Platform-specific module imports
  - Variable name used (e.g., $my-elevations)
</output>

<related_tools>
  - detect_platform: Run first to get correct platform value
  - create_theme: Use instead if you want elevations + palette + typography together
</related_tools>

<related_resources>
  Call read_resource to load reference data:
  - "theming://presets/elevations" — elevation presets for Material and Indigo
</related_resources>`,

  // ---------------------------------------------------------------------------
  // create_theme - Complex tool
  // ---------------------------------------------------------------------------
  create_theme: `Generate a complete, production-ready Ignite UI theme with palette, typography, and elevations.

<use_case>
  Use this tool as the starting point for new projects. It generates everything needed
  for a working theme in a single operation: color palette, typography setup, elevation
  shadows, and the theme application mixin.
</use_case>

<workflow>
  1. Creates color palette using palette() function
  2. Sets up typography with specified font family (if includeTypography: true)
  3. Configures elevations based on design system (if includeElevations: true)
  4. Configures spacing utilities for Web Components, React, and Blazor (if includeSpacing: true)
  5. Applies the theme using the theme() mixin
</workflow>

<important_notes>
  REQUIRED COLORS:
  - primaryColor: Main brand color
  - secondaryColor: Accent/highlight color
  - surfaceColor: Background color (should match variant)

  SHADE PROGRESSION (important):
  - Primary and secondary colors are NEVER inverted between light/dark themes.
  - The palette() function generates shades 50=lightest to 900=darkest for ALL
    chromatic colors regardless of theme variant.
  - Only gray shades behave differently (for text contrast against surface).
  - DO NOT provide inverted primary/secondary colors for dark themes.

  SEED COLORS:
  - ${FRAGMENTS.SEED_BEHAVIOUR}

  PLATFORM DIFFERENCES:
  - Angular: Uses igniteui-angular/theming with core() and theme() mixins
  - Web Components: Uses igniteui-theming directly with palette(), typography(), elevations() mixins
  - React: Uses igniteui-theming directly (same as Web Components), common with Vite/Next.js
  - Blazor: Uses igniteui-theming for Sass compilation, theme CSS referenced in Blazor components

  ${FRAGMENTS.SASS_FILE_PLACEMENT}
</important_notes>

<output>
  Returns:
  - Complete Sass code with all theme components
  - List of variables created/used
  - Platform-specific guidance
</output>

<error_handling>
  - Invalid color format: Returns error with format examples
  - Variant mismatch: Warns if surface color doesn't match theme variant
</error_handling>

<example>
  Complete Material Design blue theme:
  {
    "platform": "angular",
    "designSystem": "material",
    "primaryColor": "#1976D2",
    "secondaryColor": "#FF9800",
    "surfaceColor": "#FAFAFA",
    "variant": "light",
    "fontFamily": "'Roboto', sans-serif",
    "includeTypography": true,
    "includeElevations": true
  }
</example>

<next_steps>
  After generating a theme:
  1. Import the generated Sass file in your application's main styles
  2. Customize individual component themes as needed using component schema overrides
</next_steps>

<related_tools>
  - detect_platform: Run first to auto-detect platform from package.json
  - create_custom_palette: Only when exact per-shade values are mandated by a brand spec
  - create_palette: Use if you only need a palette without full theme
  - create_typography: Use if you only need typography setup
  - create_elevations: Use if you only need elevation shadows
</related_tools>

  <related_resources>
  Call read_resource to load reference data:
  - "theming://presets/palettes" — preset palette colors
  - "theming://guidance/colors" — color guidance overview
  - "theming://guidance/colors/rules" — light/dark theme color rules
  - "theming://platforms/angular" — Angular platform configuration
  - "theming://platforms/webcomponents" — Web Components platform configuration
  - "theming://platforms/react" — React platform configuration
  - "theming://platforms/blazor" — Blazor platform configuration
  </related_resources>`,

  // ---------------------------------------------------------------------------
  // set_size - Layout tool
  // ---------------------------------------------------------------------------
  set_size: `Set global or component-specific sizing by updating --ig-size.

<use_case>
  Use this tool for requests like:
  - "Make the calendar smaller"
  - "The buttons feel too big"
  - "Use the small size everywhere"
</use_case>

<behavior>
  - Sets --ig-size in the chosen scope (defaults to :root)
  - Accepts "small", "medium", "large" (mapped to 1, 2, 3) or numeric values
  - When platform is "generic", do NOT use the "component" parameter (it resolves Ignite UI component selectors). Use "scope" with a custom CSS selector instead, or omit both for :root.
</behavior>

<sass_notes>
  - Components map --ig-size to --component-size internally
  - Styles using sizable() require @include sizable() in component styles
</sass_notes>

<example>
  Make flat buttons medium:
  {
    "component": "flat-button",
    "size": "medium"
  }

  Make everything small globally:
  {
    "size": "small"
  }
</example>

<related_resources>
  Call read_resource to load reference data:
  - "theming://docs/spacing-and-sizing" — spacing and sizing overview
  - "theming://docs/functions/sizable" — sizable value function
  - "theming://docs/mixins/sizable" — sizable mixin
</related_resources>`,

  // ---------------------------------------------------------------------------
  // set_spacing - Layout tool
  // ---------------------------------------------------------------------------
  set_spacing: `Set global or component-specific spacing by updating --ig-spacing.

<use_case>
  Use this tool for requests like:
  - "The button feels bloated"
  - "Tighten the spacing on the form"
  - "Double the padding on cards"
</use_case>

<behavior>
  - Sets --ig-spacing in the chosen scope (defaults to :root)
  - Optional overrides for --ig-spacing-inline and --ig-spacing-block
  - 0 = no spacing, 1 = default, 2 = double (fractions allowed)
  - spacing is required; inline/block are optional overrides
  - When platform is "generic", do NOT use the "component" parameter (it resolves Ignite UI component selectors). Use "scope" with a custom CSS selector instead, or omit both for :root.
</behavior>

<sass_notes>
  - pad(), pad-inline(), pad-block() require @include spacing() once
</sass_notes>

<example>
  Reduce calendar spacing:
  {
    "component": "calendar",
    "spacing": 0.75
  }

  Override inline spacing:
  {
    "scope": ".compact",
    "inline": 0.5,
    "block": 0.75
  }
</example>

<related_resources>
  Call read_resource to load reference data:
  - "theming://docs/spacing-and-sizing" — spacing and sizing overview
  - "theming://docs/functions/pad" — pad spacing function
  - "theming://docs/mixins/spacing" — spacing mixin
</related_resources>`,

  // ---------------------------------------------------------------------------
  // set_roundness - Layout tool
  // ---------------------------------------------------------------------------
  set_roundness: `Set global or component-specific roundness by updating --ig-radius-factor.

<use_case>
  Use this tool for requests like:
  - "Make the flat buttons more round"
  - "Square off the cards"
</use_case>

<behavior>
  - Sets --ig-radius-factor in the chosen scope (defaults to :root)
  - 0 = minimum radius, 1 = maximum radius, values between interpolate
  - When platform is "generic", do NOT use the "component" parameter (it resolves Ignite UI component selectors). Use "scope" with a custom CSS selector instead, or omit both for :root.
</behavior>

<sass_notes>
  - border-radius() responds to --ig-radius-factor without extra mixins
</sass_notes>

<example>
  Round avatars more:
  {
    "component": "avatar",
    "radiusFactor": 0.9
  }

  Globally reduce roundness:
  {
    "radiusFactor": 0.8
  }
</example>

<related_resources>
  Call read_resource to load reference data:
  - "theming://docs/spacing-and-sizing" — spacing and sizing overview
  - "theming://docs/functions/border-radius" — border radius function
</related_resources>`,

  // ---------------------------------------------------------------------------
  // get_component_design_tokens - Discovery tool
  // ---------------------------------------------------------------------------
  get_component_design_tokens: `Discover available design tokens (themeable properties) for an Ignite UI component.

<use_case>
  ALWAYS call this tool FIRST before using create_component_theme. It returns the
  exact token names that can be customized for a component, preventing hallucination
  of invalid property names.

  NOTE: This tool returns tokens for Ignite UI framework components. It is NOT useful
  when the detected platform is "generic" — component theming requires a specific
  Ignite UI product (angular, webcomponents, react, or blazor).
</use_case>

<workflow>
  1. Provide the component name (e.g., "button", "avatar", "grid")
  2. Receive list of all available tokens with their types and descriptions
  3. Use the token names in create_component_theme
</workflow>

<important_notes>
  COMPONENT NAMING:
  - Basic components: Use simple names like "avatar", "badge", "card"
  - Button variants: Use specific variant names like "flat-button", "contained-button",
    "outlined-button", "fab-button" (NOT just "button")
  - Icon button variants: "flat-icon-button", "contained-icon-button", "outlined-icon-button"
  - Child sub-components: Use names like "list-item", "card-header", "accordion-header",
    "tab-item", "step", "expansion-panel-header". These resolve to the parent component's
    theme automatically.

  CHILD SUB-COMPONENTS:
  - Some component parts (e.g., "list-item", "card-header", "accordion-header") don't have
    their own theme function — they are styled through the parent component's theme tokens.
  - When you query a child sub-component, the response includes a note explaining the
    parent-child relationship and shows the parent theme's full token list.
  - The token descriptions guide you to the relevant tokens (e.g., "item-background"
    for list items, "header-text-color" for card headers).
  - When you then call create_component_theme with a child name, it automatically
    uses the parent's theme function, variable name, and selector — producing output
    that is merge-compatible with the parent component's theme.

  COMPOUND COMPONENTS:
  There are two types of compound components:

  **Standard compounds** (e.g., "combo", "select", "date-picker"):
  - Use multiple internal components that each need their own theme
  - The response lists related themes and, where available, token derivation hints
    showing how child token values relate to parent/sibling tokens
    (e.g., "foreground → adaptive-contrast of calendar.content-background")
  - Follow derivation hints when setting child token values. If the user specifies an
    explicit value, use that instead of the derived value.
  - All related themes should be scoped under the parent component's selector
  - For each related theme: call get_component_design_tokens, then create_component_theme
    using the parent component's selector for the target platform

  **Composed compounds** (e.g., "grid components"):
  - The framework automatically generates internal themes for all child components from just the primary tokens
  - Do NOT create separate themes for the related components — they are auto-derived
    in the component's Sass styles
  - The response uses a **two-tier token hierarchy**:
    - **✅ Primary Tokens — USE THESE**: Use ONLY these tokens for the initial theme
    - **📖 Refinement Tokens — REFERENCE ONLY**: Auto-derived tokens available ONLY when
      the user explicitly requests fine-grained control (e.g., "change the header background")
  - Only set the primary tokens in the parent component's theme; all children inherit automatically
  - The response clearly marks these as "Composed Compound Component" and lists the
    internally themed children for reference (not for separate theming)

  VARIANTS INFO:
  - If you query a base component that has variants (e.g., "button"), the response
    lists available variants to help you choose the right one
</important_notes>

<output>
  Returns:
  - component: The component name
  - themeFunctionName: The Sass function to use (e.g., "button-theme")
  - description: Information about the component theme
  - tokens: Array of { name, type, description } for each available token
  - variants: (if applicable) List of variant-specific theme names
  - compoundInfo: (if applicable) Related themes with token derivation hints and guidance
  - childNote: (if child sub-component) A note explaining the parent-child relationship
</output>

<error_handling>
  - Unknown component: Returns list of similar component names as suggestions
  - Partial match: If query partially matches multiple components, returns all matches
</error_handling>

<example>
  Get tokens for flat button:
  {
    "component": "flat-button"
  }

  Returns tokens like: background, foreground, hover-background, border-radius, etc.

  Get tokens for a child sub-component:
  {
    "component": "list-item"
  }

  Returns the list theme's tokens with a note: "list-item is a child of the list component.
  Its styling is controlled through the list theme."
</example>

<related_tools>
  - create_component_theme: Use the discovered tokens to create a custom theme
</related_tools>`,

  // ---------------------------------------------------------------------------
  // create_component_theme - Theme generation tool
  // ---------------------------------------------------------------------------
  create_component_theme: `Generate Sass or CSS code to customize an Ignite UI component's appearance using design tokens.

<use_case>
  Use this tool AFTER calling get_component_design_tokens to customize specific
  component styles. The generated code can be included in your theme file to
  override default component appearances.
</use_case>

<workflow>
  1. First call get_component_design_tokens to discover available tokens
  2. Choose which tokens to customize based on your design requirements
  3. Specify designSystem and variant to match the global theme or the one explicitly requested (defaults to Material light)
  4. Call this tool with component name, token values, and output format ("sass" or "css")
  5. Receive ready-to-use Sass or CSS code with the component theme
</workflow>

<important_notes>
  DESIGN SYSTEM & VARIANT:
  - designSystem: Choose "material" (default), "bootstrap", "fluent", or "indigo"
  - variant: Choose "light" (default) or "dark"
  - The correct schema (e.g., $light-bootstrap-schema, $dark-material-schema) is
    automatically selected and passed to the component theme function
  - The correct output: Choose output format based on the target file type (Sass vs CSS)
  - This ensures component tokens inherit proper defaults from the design system

  TOKEN VALIDATION:
  - All provided token names are validated against the component's schema
  - Invalid tokens return an error with the list of valid token names
  - You don't need to specify all tokens - only those you want to customize (prefer PRIMARY tokens to minimize the number of overrides)

  TOKEN VALUE FORMATS:
  - Colors: Any valid CSS color format (hex, rgb, hsl, named colors)
  - Dimensions: Include units (e.g., "8px", "0.5rem", "2em")
  - Border radius: Can be single value or shorthand ("8px" or "8px 8px 0 0")
  - Shadows: Full box-shadow syntax ("0 2px 4px rgba(0,0,0,0.1)")

  SELECTORS:
  - Default selector is auto-detected based on platform and component
  - For child sub-components (e.g., "list-item", "card-header"), the selector
    automatically resolves to the parent component's selector (e.g., "igx-list", "igx-card")
  - Angular: Uses "igx-*" element selectors or attribute selectors
  - Web Components: Uses "igc-*" element selectors
  - Custom selectors supported for targeted styling (e.g., ".my-button")

  CHILD SUB-COMPONENTS:
  - When creating a theme for a child sub-component (e.g., "card-actions"), the output
    uses the parent's theme function, variable name, and selector.
  - This means the output for "card" and "card-actions" is merge-compatible:
    both produce \`$custom-card-theme: card-theme(...)\` scoped to \`igx-card\`.
  - To add tokens for multiple sub-parts, merge the token arguments into a single
    theme function call rather than creating separate themes.

  SASS OUTPUT:
  - Generated code uses \`@include tokens($theme)\` to apply the theme
  - The tokens mixin emits --ig-{component}-{token} CSS custom properties in global mode

  COMPOUND COMPLETENESS:
  - **Standard compounds:** If the user asks for a standard compound component,
    the response is incomplete unless related theme calls are also generated.
    Use the related themes list from get_component_design_tokens to drive the sequence.
    All related themes should use the compound component's selector as the wrapper.
    Follow token derivation hints to set child token values consistently.
  - **Composed compounds:** If the component is a composed compound (e.g., grid),
    do NOT generate separate child themes. Only set the primary tokens (background,
    foreground, accent-color) on the parent component's theme — child themes are
    auto-derived internally by the component's Sass styles.
    Refinement tokens (e.g., header-background) can be added in follow-up calls
    when the user explicitly asks to customize a specific aspect.

  ${FRAGMENTS.SASS_FILE_PLACEMENT}
</important_notes>

<output>
  Returns:
  - Generated Sass or CSS code with:
    - Platform-specific @use import (Sass only)
    - Theme function call with $schema parameter and provided token values (Sass only)
    - tokens mixin to apply the theme to the selector (Sass only)
  - Description of what was generated
  - Design system and variant used
  - List of tokens used
</output>

<error_handling>
  - Unknown component: Returns error with list of available components
  - Invalid tokens: Returns error listing invalid tokens and valid alternatives
  - Invalid color format: Returns error with format guidance
</error_handling>

<example>
  Custom blue flat button with rounded corners (Angular, Material Design):
  {
    "platform": "angular",
    "designSystem": "material",
    "variant": "light",
    "component": "flat-button",
    "tokens": {
      "foreground": "#1976d2",
    }
  }

  Generates:
  \`\`\`scss
  @use 'igniteui-angular/theming' as *;

  $custom-flat-button-theme: flat-button-theme(
    $schema: $light-material-schema,
    $foreground: #1976d2,
  );

  .igx-button--flat {
    @include tokens($custom-flat-button-theme);
  }
  \`\`\`

  Bootstrap dark theme example:
  {
    "platform": "webcomponents",
    "designSystem": "bootstrap",
    "variant": "dark",
    "component": "avatar",
    "tokens": {
      "background": "#ff5722"
    }
  }

  Generates:
  \`\`\`scss
  @use 'igniteui-theming' as *;

  $custom-avatar-theme: avatar-theme(
    $schema: $dark-bootstrap-schema,
    $background: #ff5722
  );

  igc-avatar {
    @include tokens($custom-avatar-theme);
  }
  \`\`\`
</example>

<compound_example>
  Date Picker (compound) — all child themes use the parent component's selector.
  Follow token derivation hints from get_component_design_tokens:
  1) get_component_design_tokens { "component": "date-picker" }
  2) create_component_theme { "component": "date-picker", "platform": "angular", ... }
  3) create_component_theme { "component": "calendar", "selector": "igx-date-picker", ... }
  4) create_component_theme { "component": "flat-button", "selector": "igx-date-picker", ... }
  5) create_component_theme { "component": "input-group", "selector": "igx-date-picker", ... }

  Each child theme uses the parent's platform selector (e.g., \`igx-date-picker\` for Angular,
  \`igc-date-picker\` for Web Components / React / Blazor).
  The tokens mixin emits --ig-{component}-{token} variables that child components
  consume via var() fallback — no per-child selectors needed.
</compound_example>

<related_tools>
  - detect_platform: Run to auto-detect platform for correct imports
  - get_component_design_tokens: MUST call first to discover valid tokens
  - create_theme: Use for full theme (palette + typography + elevations)
</related_tools>`,

  // ---------------------------------------------------------------------------
  // get_color - Color retrieval tool
  // ---------------------------------------------------------------------------
  get_color: `Retrieve a palette color from Ignite UI Theming as a CSS variable reference.

<use_case>
  Use this tool when you need to reference a specific palette color in CSS or Sass code.
  Returns CSS variable references that work in both Sass and CSS contexts.

  Common scenarios:
  - Setting component backgrounds/foregrounds using theme colors
  - Creating hover/focus states with opacity variations
  - Ensuring text contrast against colored backgrounds
</use_case>

<workflow>
  1. Specify the color family (primary, secondary, gray, etc.)
  2. Optionally specify a shade variant (50-900, A100-A700)
  3. Optionally request the contrast color for text readability
  4. Optionally apply opacity for transparency effects
</workflow>

<output_examples>
  Basic color:
    { color: "primary" }
    → var(--ig-primary-500)

  Specific shade:
    { color: "primary", variant: "600" }
    → var(--ig-primary-600)

  Contrast color:
    { color: "primary", variant: "600", contrast: true }
    → var(--ig-primary-600-contrast)

  With opacity:
    { color: "primary", opacity: 0.5 }
    → hsl(from var(--ig-primary-500) h s l / 0.5)

  Contrast with opacity:
    { color: "primary", contrast: true, opacity: 0.7 }
    → hsl(from var(--ig-primary-500-contrast) h s l / 0.7)
</output_examples>

<important_notes>
  CSS VARIABLE NAMING:
  - Base colors: --ig-{color}-{variant} (e.g., --ig-primary-500)
  - Contrast: --ig-{color}-{variant}-contrast (e.g., --ig-primary-500-contrast)

  GRAY RESTRICTIONS:
  - Gray only supports standard shades (50-900), not accent shades (A100-A700)

  OPACITY HANDLING:
  - Uses CSS relative color syntax: hsl(from <color> h s l / <opacity>)
  - Works in modern browsers (CSS Color Level 4)
  - For Sass projects, this syntax is passed through unchanged
</important_notes>

<related_tools>
  - create_palette: Generate a complete palette with these colors
  - create_component_theme: Use retrieved colors in component theming
</related_tools>`,

  // ---------------------------------------------------------------------------
  // get_chart_series_colors - Chart series brush palette retrieval tool
  // ---------------------------------------------------------------------------
  get_chart_series_colors: `Retrieve the shared Ignite UI chart series brush palette, per-chart-type color-token guidance, and validate custom brush lists.

<use_case>
  Use this tool when theming Ignite UI charts (category, data, doughnut, pie, funnel, shape,
  financial, linear/radial gauge, bullet graph) and you need the default series colors, want to
  know which theme tokens accept a custom color list for a given chart type, or want to sanity-check
  a custom brush list before using it in a $brushes: (...) override.

  NOT covered by this tool: sparkline (singular tokens, not a palette list) and
  selection/highlight colors (selectionBrush, focusBrush — component-only, no Sass theme equivalent).
</use_case>

<workflow>
  1. Call with no arguments to get the full 10-color default (regular) palette.
  2. Optionally set mode: "color-blind" for the accessibility-friendly variant.
  3. Optionally set index (1-10) to retrieve a single brush color.
  4. Optionally set chartType (e.g. "category-chart", "financial-chart", "linear-gauge") to see
     which theme tokens on that chart type accept the palette, plus a ready-to-use Sass snippet.
  5. Optionally set customBrushes to a color array to validate it before using it in an override —
     checks each color is valid and flags color pairs with similar hues that may be hard to tell apart.
</workflow>

<output_examples>
  Default palette:
    {}
    → 10-color list + var(--chart-brushes) reference

  Single brush:
    { index: 3 }
    → the 3rd regular-palette color

  Chart-type guidance:
    { chartType: "category-chart" }
    → token table (brushes, marker-brushes, outlines, marker-outlines, trend-line-brushes,
      negative-brushes, negative-outlines) + a category-chart-theme() Sass snippet

  Custom brush validation:
    { customBrushes: ["#4285f4", "#ea4335", "#fbbc05", "#34a853"] }
    → validity + hue-distinctness warnings
</output_examples>

<important_notes>
  THEME VS. COMPONENT PRECEDENCE:
  - This tool and the Sass snippets it generates set the THEME DEFAULT only.
  - Chart components also expose their own color-list properties (e.g. Angular's brushes,
    outlines, markerBrushes, markerOutlines, rangeBrushes, rangeOutlines) that OVERRIDE the
    theme default per instance. Always mention this precedence when generating chart theme code.

  SCOPE:
  - Only list-valued brush/outline tokens are covered. Sparkline and selection/highlight colors
    are intentionally excluded — see the guidance resource at theming://guidance/colors/charts.
  - Some chart types default certain tokens to a FIXED color rather than the shared palette
    (e.g. category-chart's negative-brushes/negative-outlines default to red, not "series") —
    check the "default" column in the chartType response rather than assuming uniformity.
</important_notes>

<related_tools>
  - create_component_theme: Not yet wired for chart components (see project notes) — use the
    Sass snippet from this tool directly instead.
  - theming://guidance/colors/charts: Full guidance resource with the complete per-chart-type
    token reference and override examples.
</related_tools>`,

  // ---------------------------------------------------------------------------
  // read_resource - Resource access tool
  // ---------------------------------------------------------------------------
  read_resource: `Read a theming resource by URI. Returns reference data such as platform configurations, color palette presets, typography presets, color guidance, and layout documentation.

<use_case>
  Use this tool to load reference data before or during theme generation. Other tools
  reference these resources in their related_resources sections — call this tool with
  the listed URI to retrieve the data.

  Common scenarios:
  - Load palette presets to see available colors before creating a palette
  - Read color guidance to understand shade usage and semantic roles
  - Check platform configuration for usage examples and supported features
  - Read layout documentation for spacing, sizing, and roundness details
</use_case>

<workflow>
  1. Identify the resource URI from the available_resources list or from a related_resources hint in another tool
  2. Call this tool with the URI
  3. Use the returned data to inform your next action
</workflow>

<output>
  Returns the resource content as text. Format depends on the resource:
  - application/json resources return JSON data
  - text/markdown resources return Markdown documentation
</output>

<error_handling>
  If the URI is not found, returns the list of all available resource URIs.
</error_handling>`,
} as const;

// ============================================================================
// PARAMETER DESCRIPTIONS
// ============================================================================

/**
 * Individual parameter descriptions for schema fields.
 * Include valid values, defaults, formats, and constraints.
 */
export const PARAM_DESCRIPTIONS = {
  // ---------------------------------------------------------------------------
  // Common parameters (used across multiple tools)
  // ---------------------------------------------------------------------------
  platform: FRAGMENTS.PLATFORM,
  licensed:
    "Use licensed @infragistics package (Angular only). Set to true if using @infragistics/igniteui-angular from private ProGet registry. Defaults to false (uses open-source igniteui-angular from npm). Note: igniteui-theming is always free/OSS for all other platforms.",
  variant: FRAGMENTS.VARIANT,
  designSystem: FRAGMENTS.DESIGN_SYSTEM,
  name: `Custom variable name (without $ prefix). If omitted, auto-generates based on tool and variant (e.g., "custom-light", "my-theme").`,
  output: `Output format for the generated code.

"sass" — Returns Sass source using igniteui-theming functions and mixins. Requires a Sass pipeline in the consuming project. Prefer for Angular (Angular CLI handles Sass compilation automatically).

"css" — The MCP server compiles the Sass internally and returns ready-to-use CSS custom properties. No local Sass toolchain needed. Prefer for Web Components, React, and Blazor unless the project has a confirmed Sass setup (e.g. .scss files and a sass build step are present). When in doubt, use "css" or ask the user.

Layout tools (set_size, set_spacing, set_roundness) default to "css". Generation tools (create_palette, create_theme, etc.) default to "sass" for Angular and "css" for all other platforms.`,

  // ---------------------------------------------------------------------------
  // detect_platform parameters
  // ---------------------------------------------------------------------------
  packageJsonPath: `Path to package.json file, relative to current working directory. Defaults to "./package.json".`,

  // ---------------------------------------------------------------------------
  // Color parameters (for create_palette)
  // ---------------------------------------------------------------------------
  primary: `Primary brand color - used for main actions, active states, and emphasis. ${FRAGMENTS.COLOR_FORMAT}`,
  secondary: `Secondary/accent color - used for FABs, selection controls, highlights. ${FRAGMENTS.COLOR_FORMAT}`,
  surface: `Surface/background color - should be light for "light" variant, dark for "dark" variant. ${FRAGMENTS.COLOR_FORMAT}`,
  gray: `Gray/neutral base color for text, borders, disabled states. Optional - defaults from design system preset. ${FRAGMENTS.COLOR_FORMAT}`,
  info: `Info state color (typically blue) for informational messages. Optional - defaults from design system. ${FRAGMENTS.COLOR_FORMAT}`,
  success: `Success state color (typically green) for success messages and positive actions. Optional - defaults from design system. ${FRAGMENTS.COLOR_FORMAT}`,
  warn: `Warning state color (typically orange/amber) for warning messages. Optional - defaults from design system. ${FRAGMENTS.COLOR_FORMAT}`,
  error: `Error state color (typically red) for error messages and destructive actions. Optional - defaults from design system. ${FRAGMENTS.COLOR_FORMAT}`,

  // ---------------------------------------------------------------------------
  // Typography parameters
  // ---------------------------------------------------------------------------
  fontFamily: `Font family string with fallbacks. Quote names with spaces. Example: '"Inter", "Helvetica Neue", sans-serif'`,
  customScale:
    "Custom type scale overrides. Object with type style names as keys (h1, h2, body-1, button, etc.) and style objects as values containing fontSize, fontWeight, lineHeight, letterSpacing, textTransform.",

  // ---------------------------------------------------------------------------
  // Elevations parameters
  // ---------------------------------------------------------------------------
  elevationPreset: `Elevation shadow preset: "material" (Material Design shadows) or "indigo" (Infragistics Indigo shadows). Defaults to "material".`,

  // ---------------------------------------------------------------------------
  // Theme-specific parameters (for create_theme)
  // ---------------------------------------------------------------------------
  primaryColor: `Primary brand color for the theme - used for main actions and emphasis. ${FRAGMENTS.COLOR_FORMAT}`,
  secondaryColor: `Secondary/accent color for the theme - used for highlights and selection. ${FRAGMENTS.COLOR_FORMAT}`,
  surfaceColor: `Surface/background color for the theme. Use light colors (#FAFAFA) for "light" variant, dark colors (#121212) for "dark" variant. ${FRAGMENTS.COLOR_FORMAT}`,
  includeTypography:
    "Include typography setup in the generated theme. Set to false if you want to configure typography separately. Defaults to true.",
  includeElevations:
    "Include elevation shadows in the generated theme. Set to false if you want to configure elevations separately. Defaults to true.",
  includeSpacing:
    "Include spacing CSS custom properties. Applies to Web Components, React, and Blazor. Has no effect on Angular. Defaults to true.",

  // ---------------------------------------------------------------------------
  // Custom palette parameters (for create_custom_palette)
  // ---------------------------------------------------------------------------
  colorDefinition: `Color definition object with mode selection:
• mode: "shades" + baseColor: Auto-generates all shades from one color - prefer this
• mode: "explicit" + shades: Manually specify all ${FRAGMENTS.CHROMATIC_SHADES}
${FRAGMENTS.MONOCHROMATIC_RULE}`,

  surfaceDefinition: `Surface definition object with mode selection:
• mode: "shades" + baseColor: Auto-generates the background and its layers from one color
• mode: "explicit" + shades: Manually specify all ${FRAGMENTS.SURFACE_ROLES}
IMPORTANT: A surface is a background plus the layers that sit on it, so it is addressed by ROLE, not by shade number. "base" is the page background; "sunken", "raised" and "overlay" step away from it; "container" is a translucent tint. A role with no room in its direction resolves back onto "base".`,

  grayDefinition: `Gray color definition object with mode selection:
• mode: "shades" + baseColor: Auto-generates all shades from one color
• mode: "explicit" + shades: Manually specify all ${FRAGMENTS.GRAY_SHADES}
Important: Gray progression is INVERTED for dark themes (50=darkest, 900=lightest).`,

  scales: `OPTIONAL - omit unless asked to match another system's rhythm. Preset name ("even" | "material" | "tailwind" | "carbon"), or a map keyed by family: {"gray": "carbon"}. To match a ladder you have seen, call fit_color_scale and pass back its spec - never hand-write a curve.`,

  generator: `OPTIONAL - omit it. "legacy" reproduces the original multiplier-based ramps and exists only to keep an existing theme byte-identical while migrating.`,

  ladderColors: `The ladder to fit, LIGHTEST FIRST (3-20 colors). ${FRAGMENTS.COLOR_FORMAT}`,

  ladderName:
    "Optional label for the fitted scale, used in the generated Sass comment.",

  baseColor: `Base color for automatic shade generation using shades() function. Pass the brand color as-is; its lightness does not need adjusting. ${FRAGMENTS.COLOR_FORMAT}`,

  shades: `Object with all shade values. ${FRAGMENTS.CHROMATIC_SHADES}. Luminance should decrease from 50 (lightest) to 900 (darkest). CRITICAL: All shades must be the SAME COLOR (same hue) at different lightness levels - do NOT use different colors for different shades.`,

  surfaceRoles: `Object with all surface layer values. ${FRAGMENTS.SURFACE_ROLES}. "base" is the page background; "sunken" is darker, "raised" and "overlay" lighter (inverted for dark themes); "container" is a translucent black/white tint; "seed" is the original input color.`,

  grayShades: `Object with all gray shade values. ${FRAGMENTS.GRAY_SHADES}. For light themes: 50=lightest, 900=darkest. For dark themes: 50=darkest, 900=lightest.`,

  contrastOverrides:
    "USUALLY OMIT THIS FIELD. Contrast colors are auto-generated using adaptive-contrast(). Only provide this if you have specific accessibility requirements with exact contrast values (rare). When omitted (recommended), the generated Sass code automatically includes adaptive-contrast(#shadeColor) for each shade, which auto-selects black or white for optimal readability.",

  // ---------------------------------------------------------------------------
  // Component theming parameters
  // ---------------------------------------------------------------------------
  component: `Component name to get design tokens for (e.g., "button", "avatar", "grid"). Use exact names like "flat-button" for button variants. Child sub-component names like "list-item", "card-header", "accordion-header", "tab-item", "step" are also supported — they resolve to the parent component's theme. Call this tool to discover available tokens BEFORE using create_component_theme.`,

  componentTheme: `Component name to theme (e.g., "button", "avatar", "flat-button", "grid"). Must match a valid component from get_component_design_tokens. For button/icon-button variants, use specific names like "flat-button", "contained-button", "outlined-button", "fab-button". Child sub-component names (e.g., "list-item", "card-header") are supported and automatically resolve to the parent theme with the parent's selector and variable name.`,

  tokens: `Object mapping token names to values. Token names must be valid for the component (use get_component_design_tokens to discover them). Values can be CSS colors, dimensions with units, or other Sass-compatible values. Example: { "background": "#1976D2", "border-radius": "8px" }`,

  selector: `Optional CSS selector to scope the theme. If omitted, uses the platform's default selector for the component. For child sub-components (e.g., "list-item"), the default selector is the parent component's selector (e.g., "igx-list"). For Angular: "igx-*" selectors, for Web Components: "igc-*" selectors. You can specify custom selectors like ".my-custom-button" for targeted styling.`,

  themeName: `Optional name for the generated theme variable (without $ prefix). If omitted, auto-generates based on component name (e.g., "$custom-button-theme").`,

  // ---------------------------------------------------------------------------
  // Layout tool parameters
  // ---------------------------------------------------------------------------
  layoutComponent: `Optional component name to scope the layout change (e.g., "flat-button", "calendar", "avatar"). If omitted, the change applies globally via :root. Note: component targets Ignite UI framework selectors — do not use with platform "generic". Use "scope" instead for custom CSS selectors.`,
  scope: `Optional CSS selector scope for the change (e.g., ".my-theme", ":root", "#app"). Ignored when component is provided.`,
  sizeValue: `Size value to set for --ig-size. Accepts "small" (1), "medium" (2), "large" (3), or numeric 1, 2, 3 only.`,
  spacing:
    "Spacing scale multiplier for --ig-spacing. 0 = none, 1 = default, 2 = double. Fractions allowed.",
  spacingInline:
    "Inline spacing scale multiplier for --ig-spacing-inline. Overrides inline spacing only.",
  spacingBlock:
    "Block spacing scale multiplier for --ig-spacing-block. Overrides block spacing only.",
  radiusFactor:
    "Roundness scale factor for --ig-radius-factor. 0 = minimum radius, 1 = maximum radius. Values must be between 0 and 1.",

  // ---------------------------------------------------------------------------
  // Color operations parameters (for get_color)
  // ---------------------------------------------------------------------------
  colorName: `Palette color family name: "primary" (brand color), "secondary" (accent), "gray" (neutrals), "surface" (backgrounds), "info" winformational), "success" (positive), "warn" (warnings), "error" (errors/destructive).`,

  shadeVariant: `Color shade variant. Standard shades: 50 (lightest) through 900 (darkest). Accent shades: A100, A200, A400, A700 (more saturated). Default: "500" (base color). Note: Gray only supports standard shades (50-900).`,

  contrastFlag:
    "If true, returns the contrast color for the specified shade instead of the shade itself. Contrast colors are pre-computed for optimal text readability. Default: false.",

  opacity:
    "Opacity value between 0 (fully transparent) and 1 (fully opaque). When provided, wraps the color in CSS relative color syntax: hsl(from var(...) h s l / opacity).",

  // ---------------------------------------------------------------------------
  // Chart series colors parameters (for get_chart_series_colors)
  // ---------------------------------------------------------------------------
  chartBrushMode: `Which series brush palette to use: "regular" (default, visually distinct colors) or "color-blind" (alternate palette for better distinguishability under common color vision deficiencies, activated via the configure-colors($enhanced-accessibility: true) Sass mixin). Default: "regular".`,

  chartBrushIndex:
    "Optional 1-based index (1-10) to retrieve a single brush color from the palette instead of the full 10-color list.",

  chartType: `Optional chart type to get color-token guidance for (e.g., "category-chart", "financial-chart", "linear-gauge", "bullet-graph"). When provided, the response lists which theme tokens accept the series brush list for that chart type and a Sass usage snippet. Not all chart types are covered — sparkline and selection/highlight colors are out of scope (see the guidance resource for why).`,

  customBrushes:
    "Optional array of CSS colors to validate as a custom series brush list before using them in a $brushes: (...) override. When provided, the tool checks each color is valid and flags any pair of colors that may be hard to visually distinguish (similar hue).",

  // ---------------------------------------------------------------------------
  // Resource read parameters
  // ---------------------------------------------------------------------------
  resourceUri: `URI of the theming resource to read (e.g., "theming://presets/palettes", "theming://platforms/angular"). See the available_resources list in the tool description for all valid URIs.`,
} as const;
