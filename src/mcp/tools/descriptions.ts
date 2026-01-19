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
  PLATFORM: `Target platform: "angular" for Ignite UI for Angular, "webcomponents" for Ignite UI for Web Components, "react" for Ignite UI for React, or "blazor" for Ignite UI for Blazor. If omitted, generates generic code. Use detect_platform tool first to auto-detect from project files.`,

  /** Color format examples - CSS Color Level 4 */
  COLOR_FORMAT: `Valid CSS color formats: hex ("#3F51B5", "#3F51B5AA"), rgb/rgba ("rgb(63, 81, 181)", "rgb(63 81 181 / 0.5)"), hsl/hsla ("hsl(231, 48%, 48%)", "hsl(231 48% 48% / 0.5)"), hwb ("hwb(231 20% 30%)"), lab/lch ("lab(50% 40 59)", "lch(50% 80 30)"), oklab/oklch ("oklab(59% 0.1 0.1)", "oklch(60% 0.15 50)"), color() for wide-gamut ("color(display-p3 1 0.5 0)"), or CSS named colors ("indigo", "rebeccapurple").`,

  /** Variant parameter description */
  VARIANT: `Theme variant: "light" (light backgrounds, dark text) or "dark" (dark backgrounds, light text). Defaults to "light".`,

  /** Design system parameter description */
  DESIGN_SYSTEM: `Design system preset: "material" (Material Design), "bootstrap" (Bootstrap), "fluent" (Microsoft Fluent), or "indigo" (Infragistics Indigo). Defaults to "material".`,

  /** Chromatic shade levels */
  CHROMATIC_SHADES: `14 shades required: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, A100, A200, A400, A700`,

  /** Gray shade levels */
  GRAY_SHADES: `10 shades required: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900`,

  /** Luminance warning */
  LUMINANCE_WARNING: `Colors with extreme luminance (< 0.05 or > 0.45) may produce suboptimal automatic shade generation.`,

  /** Monochromatic requirement for chromatic colors */
  MONOCHROMATIC_RULE: `MONOCHROMATIC REQUIREMENT: All shades in a color group (e.g., primary) must be the SAME HUE. Shades are lighter/darker versions of ONE color, NOT different colors. Example: primary shades should all be blue (#E3F2FD → #0D47A1), not blue→green→purple. Vary only lightness and saturation, keep hue constant (±30° tolerance).`,

  /** Resource scheme */
  RESOURCE_SCHEME: 'theming://',
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
  detect_platform: `Detect the target Ignite UI platform by analyzing package.json dependencies and project config files.

<use_case>
  Use this tool FIRST before generating any theme code to ensure platform-optimized output.
  The detected platform determines the correct Sass module paths and syntax.
</use_case>

<detection_signals>
  Uses multi-signal detection with confidence scoring:
  1. Ignite UI packages (HIGH - 100): igniteui-angular, igniteui-webcomponents, igniteui-react, IgniteUI.Blazor
  2. Config files (MEDIUM-HIGH - 80): angular.json, vite.config.*, next.config.*, .csproj
  3. Framework packages (LOW - 40): @angular/core, react, lit (fallback only)
</detection_signals>

<output>
  Returns:
  - platform: "angular" | "webcomponents" | "react" | "blazor" | null
  - confidence: "high" | "medium" | "low" | "none"
  - ambiguous: true if multiple platforms detected (requires user to specify explicitly)
  - alternatives: Array of detected platforms when ambiguous
  - signals: Array of detection signals found
  - detectedPackage: The primary package that triggered detection
  - platformInfo: Name, theming module path, and description
</output>

<ambiguous_handling>
  When multiple platforms are detected with significant confidence (≥60), returns:
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
</related_tools>`,

  // ---------------------------------------------------------------------------
  // create_palette - Medium complexity
  // ---------------------------------------------------------------------------
  create_palette: `Generate a color palette for Ignite UI themes using the palette() Sass function.

<use_case>
  Use this tool when you have base colors and want to auto-generate a complete palette
  with all shade variations (50-900, A100-A700). Best for colors with mid-range luminance
  that will produce good automatic shade distribution.
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
  2. Analyzes color luminance for shade generation suitability
  3. Generates Sass code OR compiles to CSS based on output parameter
  4. Adds warning comments to code if issues detected
  5. Returns validation warnings and tips in response
</workflow>

<important_notes>
  - Requires primary, secondary, and surface colors (matches Sass palette() API)
  - Gray, info, success, warn, error are optional (use design system defaults)
  - Surface color should match variant: light colors for "light", dark for "dark"
  - ${FRAGMENTS.LUMINANCE_WARNING}

  SHADE PROGRESSION (important):
  - Primary, secondary, and all chromatic colors: shades are NEVER inverted.
    The palette() function always generates 50=lightest to 900=darkest.
  - Only gray shades behave differently based on variant (for text contrast).
  - DO NOT manually invert primary/secondary colors for dark themes.
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
  - Luminance issues: Warns with recommendation to use create_custom_palette
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
  - create_custom_palette: Use if this tool warns about luminance issues
  - create_theme: Use instead if you want palette + typography + elevations together
</related_tools>

<related_resources>
  - theming://presets/palettes: View available preset palette colors
  - theming://guidance/colors: Color guidance overview
  - theming://guidance/colors/rules: Light/dark theme color rules
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
  Use this tool when:
  - The standard palette() function produces suboptimal shade distribution
  - You have brand guidelines specifying exact color values for each shade
  - Base colors are too light (luminance > 0.45) or too dark (< 0.05)
  - You have specific accessibility audit requirements with exact contrast color values (rare - auto-generated contrast is usually sufficient)
  - You want to mix auto-generated and manually specified color groups
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
     - mode:"shades" → Auto-generate all shades from baseColor using shades() function
     - mode:"explicit" → Manually specify every shade value
  2. Validates all explicit shades for:
     - Completeness: All required shades present
     - Color format: Valid CSS color values
     - Luminance progression: 50 lightest → 900 darkest (chromatic colors)
     - Hue consistency: All shades within ±30° hue tolerance (monochromatic)
  3. Generates Sass code with color() map structure
  4. Returns any validation warnings
</workflow>

<important_notes>
  CRITICAL - SHADE PROGRESSION RULES:
  - CHROMATIC colors (primary, secondary, surface, info, success, warn, error):
    Shade 50 = ALWAYS lightest, shade 900 = ALWAYS darkest.
    This is TRUE FOR BOTH light AND dark themes. NEVER invert chromatic colors.
  - GRAY color ONLY: Inverts for dark themes (50=darkest, 900=lightest).
  - DO NOT confuse these rules. Only gray inverts, never primary/secondary/etc.

  ⚠️ CRITICAL - MONOCHROMATIC REQUIREMENT:
  Each color group (primary, secondary, etc.) must contain shades of ONE COLOR ONLY.
  Shades are lighter/darker variations of the SAME hue - NOT different colors!

  CORRECT example for primary blue:
    50: "#E3F2FD"  (very light blue)
    500: "#2196F3" (medium blue)
    900: "#0D47A1" (dark blue)
    → All shades are BLUE, just different lightness levels

  WRONG example (DO NOT DO THIS):
    50: "#E3F2FD"  (light blue)
    500: "#4CAF50" (green) ← WRONG! Different hue
    900: "#9C27B0" (purple) ← WRONG! Different hue
    → This creates a rainbow, not a shade palette

  Rule: Keep hue constant (±30° tolerance), vary only lightness and saturation.

  CHROMATIC COLORS (primary, secondary, surface, info, success, warn, error):
  - Explicit mode requires ${FRAGMENTS.CHROMATIC_SHADES}
  - Shade 50 = lightest, shade 900 = darkest (SAME for light AND dark themes)
  - ALL shades must be the SAME HUE (monochromatic) - see requirement above
  - A100-A700 are accent shades (same hue, typically more saturated)

  GRAY COLOR (the ONLY color that inverts):
  - Explicit mode requires ${FRAGMENTS.GRAY_SHADES}
  - LIGHT themes: 50 = lightest (near white), 900 = darkest (near black)
  - DARK themes: 50 = darkest, 900 = lightest (INVERTED progression)
  - Gray inverts because text/UI elements need to contrast against the surface

  CONTRAST COLORS (AUTO-GENERATED - DO NOT PROVIDE):
  - DO NOT include contrastOverrides in your input - OMIT THIS FIELD ENTIRELY
  - The system AUTOMATICALLY generates contrast colors using adaptive-contrast()
  - For each shade, the generated Sass output will include:
      '500': #4CAF50,
      '500-contrast': adaptive-contrast(#4CAF50),  ← AUTO-GENERATED
      '500-raw': #4CAF50,
  - The adaptive-contrast() function auto-selects black or white for readability
  - Only provide contrastOverrides if you have a specific accessibility audit
    requiring exact contrast color values (this is extremely rare)

  MIXING MODES:
  - You can use "shades" mode for some colors and "explicit" for others
  - Example: explicit primary, shades-based secondary and surface
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
  Brand green with exact shades (NOTE: ALL shades are GREEN - same hue, different lightness):

  INPUT (what you provide - NO contrastOverrides needed):
  {
    "variant": "light",
    "primary": {
      "mode": "explicit",
      "shades": {
        "50": "#E8F5E9",
        "100": "#C8E6C9",
        "200": "#A5D6A7",
        "300": "#81C784",
        "400": "#66BB6A",
        "500": "#4CAF50",
        "600": "#43A047",
        "700": "#388E3C",
        "800": "#2E7D32",
        "900": "#1B5E20",
        "A100": "#B9F6CA",
        "A200": "#69F0AE",
        "A400": "#00E676",
        "A700": "#00C853"
      }
      // ↑ Only provide shades - contrast colors are AUTO-GENERATED
    },
    "secondary": { "mode": "shades", "baseColor": "#FF9800" },
    "surface": { "mode": "shades", "baseColor": "#FAFAFA" }
  }

  GENERATED OUTPUT (contrast colors added automatically):
  'primary': (
    '500': #4CAF50,
    '500-contrast': adaptive-contrast(#4CAF50),  // ← AUTO-GENERATED
    '500-raw': #4CAF50,  // ← AUTO-GENERATED
    // ... same pattern for all 14 shades
  )
</example>

<related_tools>
  - detect_platform: Run first to get correct platform value
  - create_palette: Use for simpler cases with mid-range luminance colors
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
  - theming://presets/palettes: View preset palette colors for reference
  - theming://guidance/colors/usage: Which shades to use for different purposes
  - theming://guidance/colors/roles: Semantic meaning of each color family
</related_resources>`,

  // ---------------------------------------------------------------------------
  // create_typography - Medium complexity
  // ---------------------------------------------------------------------------
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
  - theming://presets/typography: View typography presets for all design systems
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
  - theming://presets/elevations: View elevation presets for Material and Indigo
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
  1. Analyzes input colors for palette shade generation suitability
  2. Creates color palette using palette() function
  3. Sets up typography with specified font family (if includeTypography: true)
  4. Configures elevations based on design system (if includeElevations: true)
  5. Configures spacing utilities for Web Components (if includeSpacing: true)
  6. Applies the theme using the theme() mixin
  7. Returns luminance warnings if any colors may produce poor shades
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

  LUMINANCE ANALYSIS:
  - ${FRAGMENTS.LUMINANCE_WARNING}
  - If warnings appear, consider using create_custom_palette for those colors

  PLATFORM DIFFERENCES:
  - Angular: Uses igniteui-angular/theming with core() and theme() mixins
  - Web Components: Uses igniteui-theming directly with palette(), typography(), elevations() mixins
  - React: Uses igniteui-theming directly (same as Web Components), common with Vite/Next.js
  - Blazor: Uses igniteui-theming for Sass compilation, theme CSS referenced in Blazor components
</important_notes>

<output>
  Returns:
  - Complete Sass code with all theme components
  - Luminance analysis warnings (if applicable)
  - List of variables created/used
  - Platform-specific guidance
</output>

<error_handling>
  - Invalid color format: Returns error with format examples
  - Luminance issues: Warns but still generates code (may produce suboptimal shades)
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
  1. Review any luminance warnings in the output
  2. If warnings suggest shade generation issues:
     - Use create_custom_palette for problematic colors
     - Manually assemble theme with custom palette
  3. Import the generated Sass file in your application's main styles
  4. Customize individual component themes as needed using component schema overrides
</next_steps>

<related_tools>
  - detect_platform: Run first to auto-detect platform from package.json
  - create_custom_palette: Use for colors that produce luminance warnings
  - create_palette: Use if you only need a palette without full theme
  - create_typography: Use if you only need typography setup
  - create_elevations: Use if you only need elevation shadows
</related_tools>

<related_resources>
  - theming://presets/palettes: View available preset palette colors
  - theming://guidance/colors: Color guidance overview
  - theming://guidance/colors/rules: Light/dark theme color rules
  - theming://platforms/angular: Angular platform configuration
  - theming://platforms/webcomponents: Web Components platform configuration
  - theming://platforms/react: React platform configuration
  - theming://platforms/blazor: Blazor platform configuration
</related_resources>`,

  // ---------------------------------------------------------------------------
  // get_component_design_tokens - Discovery tool
  // ---------------------------------------------------------------------------
  get_component_design_tokens: `Discover available design tokens (themeable properties) for an Ignite UI component.

<use_case>
  ALWAYS call this tool FIRST before using create_component_theme. It returns the
  exact token names that can be customized for a component, preventing hallucination
  of invalid property names.
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

  COMPOUND COMPONENTS:
  - Some components like "combo", "grid", "select" are compound - they use multiple
    internal components that may also need theming
  - The response includes hints about related themes for compound components

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
  - compoundInfo: (if applicable) Related themes for compound components
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
</example>

<related_tools>
  - create_component_theme: Use the discovered tokens to create a custom theme
</related_tools>`,

  // ---------------------------------------------------------------------------
  // create_component_theme - Theme generation tool
  // ---------------------------------------------------------------------------
  create_component_theme: `Generate Sass code to customize an Ignite UI component's appearance using design tokens.

<use_case>
  Use this tool AFTER calling get_component_design_tokens to customize specific
  component styles. The generated code can be included in your theme file to
  override default component appearances.
</use_case>

<workflow>
  1. First call get_component_design_tokens to discover available tokens
  2. Choose which tokens to customize based on your design requirements
  3. Call this tool with component name and token values
  4. Receive ready-to-use Sass code with the component theme
</workflow>

<important_notes>
  TOKEN VALIDATION:
  - All provided token names are validated against the component's schema
  - Invalid tokens return an error with the list of valid token names
  - You don't need to specify all tokens - only those you want to customize

  TOKEN VALUE FORMATS:
  - Colors: Any valid CSS color format (hex, rgb, hsl, named colors)
  - Dimensions: Include units (e.g., "8px", "0.5rem", "2em")
  - Border radius: Can be single value or shorthand ("8px" or "8px 8px 0 0")
  - Shadows: Full box-shadow syntax ("0 2px 4px rgba(0,0,0,0.1)")

  SELECTORS:
  - Default selector is auto-detected based on platform and component
  - Angular: Uses "igx-*" element selectors or attribute selectors
  - Web Components: Uses "igc-*" element selectors
  - Custom selectors supported for targeted styling (e.g., ".my-button")
</important_notes>

<output>
  Returns:
  - Generated Sass code with:
    - Platform-specific @use import
    - Theme function call with provided token values
    - css-vars mixin to apply the theme to the selector
  - Description of what was generated
  - List of tokens used
</output>

<error_handling>
  - Unknown component: Returns error with list of available components
  - Invalid tokens: Returns error listing invalid tokens and valid alternatives
  - Invalid color format: Returns error with format guidance
</error_handling>

<example>
  Custom blue flat button with rounded corners (Angular):
  {
    "platform": "angular",
    "component": "flat-button",
    "tokens": {
      "background": "#1976D2",
      "foreground": "#FFFFFF",
      "hover-background": "#1565C0",
      "border-radius": "24px"
    }
  }

  Generates:
  \`\`\`scss
  @use 'igniteui-angular/theming' as *;

  $custom-flat-button-theme: flat-button-theme(
    $background: #1976D2,
    $foreground: #FFFFFF,
    $hover-background: #1565C0,
    $border-radius: 24px
  );

  :root {
    @include css-vars($custom-flat-button-theme);
  }
  \`\`\`
</example>

<related_tools>
  - get_component_design_tokens: MUST call first to discover valid tokens
  - detect_platform: Run to auto-detect platform for correct imports
  - create_theme: Use for full theme (palette + typography + elevations)
</related_tools>`,
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
  variant: FRAGMENTS.VARIANT,
  designSystem: FRAGMENTS.DESIGN_SYSTEM,
  name: `Custom variable name (without $ prefix). If omitted, auto-generates based on tool and variant (e.g., "custom-light", "my-theme").`,
  output: `Output format: "sass" generates Sass code using igniteui-theming library functions. "css" generates CSS custom properties (variables) directly - useful for vanilla CSS projects or when you don't want Sass compilation. Defaults to "sass".`,

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
  customScale: `Custom type scale overrides. Object with type style names as keys (h1, h2, body-1, button, etc.) and style objects as values containing fontSize, fontWeight, lineHeight, letterSpacing, textTransform.`,

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
  includeTypography: `Include typography setup in the generated theme. Set to false if you want to configure typography separately. Defaults to true.`,
  includeElevations: `Include elevation shadows in the generated theme. Set to false if you want to configure elevations separately. Defaults to true.`,
  includeSpacing: `Include spacing CSS custom properties (Web Components platform only). Defaults to true. Has no effect on Angular platform.`,

  // ---------------------------------------------------------------------------
  // Custom palette parameters (for create_custom_palette)
  // ---------------------------------------------------------------------------
  colorDefinition: `Color definition object with mode selection:
• mode: "shades" + baseColor: Auto-generates all shades from one color
• mode: "explicit" + shades: Manually specify all ${FRAGMENTS.CHROMATIC_SHADES}
IMPORTANT: All shades must be MONOCHROMATIC (same hue). Shades are lighter/darker versions of ONE color, not different colors.`,

  grayDefinition: `Gray color definition object with mode selection:
• mode: "shades" + baseColor: Auto-generates all shades from one color
• mode: "explicit" + shades: Manually specify all ${FRAGMENTS.GRAY_SHADES}
Important: Gray progression is INVERTED for dark themes (50=darkest, 900=lightest).`,

  baseColor: `Base color for automatic shade generation using shades() function. Choose a mid-luminance color (0.1-0.4) for best results. ${FRAGMENTS.COLOR_FORMAT}`,

  shades: `Object with all shade values. ${FRAGMENTS.CHROMATIC_SHADES}. Luminance should decrease from 50 (lightest) to 900 (darkest). CRITICAL: All shades must be the SAME COLOR (same hue) at different lightness levels - do NOT use different colors for different shades.`,

  grayShades: `Object with all gray shade values. ${FRAGMENTS.GRAY_SHADES}. For light themes: 50=lightest, 900=darkest. For dark themes: 50=darkest, 900=lightest.`,

  contrastOverrides: `USUALLY OMIT THIS FIELD. Contrast colors are auto-generated using adaptive-contrast(). Only provide this if you have specific accessibility requirements with exact contrast values (rare). When omitted (recommended), the generated Sass code automatically includes adaptive-contrast(#shadeColor) for each shade, which auto-selects black or white for optimal readability.`,

  // ---------------------------------------------------------------------------
  // Component theming parameters
  // ---------------------------------------------------------------------------
  component: `Component name to get design tokens for (e.g., "button", "avatar", "grid"). Use exact names like "flat-button" for button variants. Call this tool to discover available tokens BEFORE using create_component_theme.`,

  componentTheme: `Component name to theme (e.g., "button", "avatar", "flat-button", "grid"). Must match a valid component from get_component_design_tokens. For button/icon-button variants, use specific names like "flat-button", "contained-button", "outlined-button", "fab-button".`,

  tokens: `Object mapping token names to values. Token names must be valid for the component (use get_component_design_tokens to discover them). Values can be CSS colors, dimensions with units, or other Sass-compatible values. Example: { "background": "#1976D2", "border-radius": "8px" }`,

  selector: `Optional CSS selector to scope the theme. If omitted, uses the platform's default selector for the component. For Angular: "igx-*" selectors, for Web Components: "igc-*" selectors. You can specify custom selectors like ".my-custom-button" for targeted styling.`,

  themeName: `Optional name for the generated theme variable (without $ prefix). If omitted, auto-generates based on component name (e.g., "$custom-button-theme").`,
} as const;
