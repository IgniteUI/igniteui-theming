# Ignite UI Theming MCP Server - ROADMAP

## Executive Summary

This document outlines the architecture and implementation plan for a **goals-oriented Model Context Protocol (MCP) server** for the Ignite UI Theming framework. The server will enable AI coding assistants and design tools (including integrations with tools like the Figma MCP server) to generate professional, production-ready theming code in both Sass and CSS formats.

### Goals-Oriented Philosophy

Unlike API-based MCP servers that simply expose functions, this server is designed around **user goals**:

| API-Based Approach                           | Goals-Oriented Approach                                    |
| -------------------------------------------- | ---------------------------------------------------------- |
| `createPalette(primary, secondary, surface)` | "Create a dark theme for a fintech app with blue branding" |
| `setTypography(font, scale)`                 | "Set up modern, accessible typography for a mobile app"    |
| `getElevation(level)`                        | "Make this card feel elevated and interactive"             |

The server should understand context, make smart defaults, and guide users toward best practices.

---

## Platform Support

The MCP server supports two target platforms for theme generation:

| Platform        | Package                  | Theming Module             | Key Characteristics                                                                              |
| --------------- | ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `angular`       | `igniteui-angular`       | `igniteui-angular/theming` | Uses `core()` + `theme()` mixins, forwards igniteui-theming with overrides                       |
| `webcomponents` | `igniteui-webcomponents` | `igniteui-theming`         | Uses individual mixins (`palette()`, `typography()`, `elevations()`), supports runtime switching |
| `react`         | `igniteui-react`         | `igniteui-theming`         | Uses individual mixins (`palette()`, `typography()`, `elevations()`), supports runtime switching |
| `blazor`        | `igniteui-blazor`        | `igniteui-theming`         | Uses individual mixins (`palette()`, `typography()`, `elevations()`), supports runtime switching |

### Platform Detection Strategy

The server can detect the target platform through multiple methods:

1. **Explicit Parameter**: User specifies `platform: 'angular'` or `platform: 'webcomponents'`
2. **Automatic Detection**: `detect_platform` tool reads `package.json` and other platform-specific files to infer platform from dependencies
3. **Fallback**: Generate platform-agnostic code when detection fails

### Key Platform Differences

#### Ignite UI for Angular

```scss
// Uses igniteui-angular/theming module
@use 'igniteui-angular/theming' as *;

// Requires core() mixin first (Angular-specific)
@include core();

// Typography mixin (Angular overrides this)
@include typography($font-family: $material-typeface, $type-scale: $material-type-scale);

// theme() mixin (Angular-specific, combines palette + schema + elevations)
@include theme($palette: $light-material-palette, $schema: $light-material-schema);
```

**Angular-specific features:**

- `core()` mixin with `$print-layout` and `$enhanced-accessibility` options
- `theme()` mixin with `$exclude`, `$roundness`, `$elevation` options
- Requires `ig-typography` CSS class on root element
- Typography module is overridden with Angular-specific implementation

#### Ignite UI for Web Components (et al.)

```scss
// Uses igniteui-theming directly
@use 'igniteui-theming' as *;
@use 'igniteui-theming/sass/color/presets/light/material' as *;
@use 'igniteui-theming/sass/typography/presets/material' as *;
@use 'igniteui-theming/sass/elevations/presets' as *;

// Individual mixin calls (no unified theme() mixin)
:root {
  --ig-theme: material;
  --ig-theme-variant: light;
}

@include palette($palette);
@include elevations($material-elevations);
@include typography($font-family: $typeface, $type-scale: $type-scale);
@include spacing();
```

**Web Components-specific features:**

- No `core()` or `theme()` mixins - uses igniteui-theming directly
- Ships precompiled CSS themes in `dist/themes/`
- Supports runtime theme switching via `configureTheme()` JavaScript API
- Components use `ThemingController` for dynamic CSS variable updates

---

## Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Server (TypeScript)                 │
├─────────────────────────────────────────────────────────────┤
│  Transport: STDIO (local) / Streamable HTTP (remote)        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Tools     │  │  Resources  │  │      Prompts        │  │
│  │             │  │             │  │                     │  │
│  │ • Theme     │  │ • Schemas   │  │ • Theme Creation    │  │
│  │   Generator │  │ • Presets   │  │ • Color Selection   │  │
│  │ • Palette   │  │ • Component │  │ • Typography Setup  │  │
│  │   Creator   │  │   Catalog   │  │ • Troubleshooting   │  │
│  │ • Validator │  │ • Examples  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              Core Services Layer                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • SassGenerator - Generates valid Sass code          │   │
│  │ • CssGenerator  - Generates CSS custom properties    │   │
│  │ • Validator     - Validates via Sass                 │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│              Knowledge Base (Embedded)                      │
│  • Color presets, multipliers, shade algorithms             │
│  • Typography scales (Material, Bootstrap, Fluent, Indigo)  │
│  • Elevation definitions                                    │
│  • Component theme schemas                                  │
└─────────────────────────────────────────────────────────────┘
```

### Build System

- **Vite** for building the TypeScript MCP server
- **Output**: `mcp/` folder in the published package
- **Entry point**: `mcp/index.js`

---

## MCP Primitives Design

### 1. Tools (Model-Controlled Actions)

Tools are the core of the MCP server - they perform actions and generate code.

#### Tool Category 1: Theme Foundation

| Tool Name               | Description                         | Input Schema                                                                                                               | Output                |
| ----------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `detect_platform`       | Detect target platform from project | `{ packageJsonPath? }`                                                                                                     | Platform detection    |
| `create_palette`        | Generate a color palette            | `{ platform, variant, designSystem?, name?, output?, primary, secondary, surface, gray?, info?, success?, warn?, error? }` | Palette definition    |
| `create_custom_palette` | Generate a custom color palette     | `{ platform, variant, designSystem?, name?, output?, primary, secondary, surface, gray?, info?, success?, warn?, error? }` | Palette definition    |
| `create_typography`     | Set up typography system            | `{ platform, fontFamily, designSystem?, baseFontSize?, customScale? }`                                                     | Typography setup code |
| `create_elevations`     | Configure elevation/shadow system   | `{ platform, designSystem?, customColors? }`                                                                               | Elevations setup code |
| `create_theme`          | Create a complete theme foundation  | `{ platform?, designSystem?, primaryColor, secondaryColor?, surfaceColor?, variant?, name? }`                              | Sass/CSS theme code   |

#### Tool Category 2: Color Operations

| Tool Name               | Description                          | Input Schema                               | Output                 |
| ----------------------- | ------------------------------------ | ------------------------------------------ | ---------------------- |
| `get_color`             | Retrieve a palette color as CSS var  | `{ color, variant?, contrast?, opacity? }` | CSS variable reference |
| `suggest_palette`       | Suggest palette based on description | `{ description, mood?, industry? }`        | Recommended colors     |

**Note:** `get_contrast_color` has been consolidated into `get_color` via the `contrast` parameter.

#### Tool Category 3: Typography Operations

| Tool Name                 | Description                | Input Schema                                                             | Output                |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------ | --------------------- |
| `create_type_style`       | Create a custom type style | `{ fontSize, fontWeight?, lineHeight?, letterSpacing?, textTransform? }` | Type style definition |
| `get_type_scale_category` | Get styles for a category  | `{ category, designSystem? }`                                            | Category styles       |
| `convert_units`           | Convert between px/rem/em  | `{ value, to, context? }`                                                | Converted value       |

#### Tool Category 4: Spacing & Sizing

| Tool Name               | Description               | Input Schema                              | Output             |
| ----------------------- | ------------------------- | ----------------------------------------- | ------------------ |
| `create_spacing_system` | Define spacing scale      | `{ baseUnit?, scale? }`                   | Spacing variables  |
| `get_sizable_value`     | Get responsive size value | `{ small, medium, large }`                | Sizable expression |
| `get_padding`           | Get contextual padding    | `{ small?, medium?, large?, direction? }` | Padding expression |

#### Tool Category 5: Component Theming

| Tool Name                     | Description                | Input Schema                                               | Output               |
| ----------------------------- | -------------------------- | ---------------------------------------------------------- | -------------------- |
| `create_component_theme`      | Create a component theme   | `{ platform, designSystem?, variant?, component, tokens }` | Component theme code |
| `get_component_design_tokens` | Get schema for a component | `{ component }`                                            | Schema definition    |

#### Tool Category 6: Validation & Utilities

| Tool Name          | Description                   | Input Schema                         | Output            |
| ------------------ | ----------------------------- | ------------------------------------ | ----------------- |
| `validate_theme`   | Validate generated theme code | `{ code, format }`                   | Validation result |
| `check_contrast`   | Check WCAG contrast ratio     | `{ foreground, background, level? }` | Pass/fail + ratio |
| `explain_function` | Explain a theming function    | `{ functionName }`                   | Documentation     |

### 2. Resources (Application-Controlled Data)

Resources provide read-only context that AI applications can use.

#### Resource Category 1: Platform Information (Direct Resources)

| URI                                 | Description                            | MIME Type          |
| ----------------------------------- | -------------------------------------- | ------------------ |
| `theming://platforms`               | List of supported platforms            | `application/json` |
| `theming://platforms/angular`       | Angular platform configuration & usage | `application/json` |
| `theming://platforms/webcomponents` | Web Components platform config & usage | `application/json` |
| `theming://platforms/react`         | React platform config & usage          | `application/json` |
| `theming://platforms/blazor`        | Blazor platform config & usage         | `application/json` |

#### Resource Category 2: Presets (Direct Resources)

| URI                                | Description                           | MIME Type          |
| ---------------------------------- | ------------------------------------- | ------------------ |
| `theming://presets/palettes`       | All predefined palette configurations | `application/json` |
| `theming://presets/palettes/light` | Light palette variants                | `application/json` |
| `theming://presets/palettes/dark`  | Dark palette variants                 | `application/json` |
| `theming://presets/typography`     | All typography presets                | `application/json` |
| `theming://presets/elevations`     | Elevation definitions                 | `application/json` |

#### Resource Category 4: Schemas (Direct Resources)

| URI                                 | Description            | MIME Type          |
| ----------------------------------- | ---------------------- | ------------------ |
| `theming://schemas/light-material`  | Light Material schema  | `application/json` |
| `theming://schemas/dark-material`   | Dark Material schema   | `application/json` |
| `theming://schemas/light-bootstrap` | Light Bootstrap schema | `application/json` |
| `theming://schemas/dark-bootstrap`  | Dark Bootstrap schema  | `application/json` |
| `theming://schemas/light-fluent`    | Light Fluent schema    | `application/json` |
| `theming://schemas/dark-fluent`     | Dark Fluent schema     | `application/json` |
| `theming://schemas/light-indigo`    | Light Indigo schema    | `application/json` |
| `theming://schemas/dark-indigo`     | Dark Indigo schema     | `application/json` |

#### Resource Category 5: Component Catalog (Resource Templates)

| URI Template                           | Description                         |
| -------------------------------------- | ----------------------------------- |
| `theming://components`                 | List all themeable components       |
| `theming://components/{name}`          | Component theme schema & properties |
| `theming://components/{name}/examples` | Usage examples for a component      |

#### Resource Category 6: Documentation (Resource Templates)

| URI Template                      | Description            |
| --------------------------------- | ---------------------- |
| `theming://docs/functions/{name}` | Function documentation |
| `theming://docs/mixins/{name}`    | Mixin documentation    |
| `theming://docs/variables/{name}` | Variable documentation |

#### Category 7: Guidance (Direct Resources)

| URI                                | Description                                | MIME Type       |
| ---------------------------------- | ------------------------------------------ | --------------- |
| `theming://guidance/colors`        | Color usage guidelines                     | `text/markdown` |
| `theming://guidance/colors/rules`  | Color Shades scaling guidance              | `text/markdown` |
| `theming://guidance/colors/usage`  | Color Shades usage guidance                | `text/markdown` |
| `theming://guidance/colors/roles`  | Color Shades roles guidance                | `text/markdown` |
| `theming://guidance/colors/states` | Color Shades in components states guidance | `text/markdown` |
| `theming://guidance/colors/themes` | How color shades are used across themes    | `text/markdown` |

---

## Implementation Phases

### Phase 1: Foundation (Done)

**Goal**: Core palette, typography, and elevation generation, and per-component themes

**Deliverables**:

- MCP server scaffolding with STDIO transport
- `detect_platform` tool
- `create_theme` tool
- `create_palette` tool
- `create_custom_palette` tool
- `create_typography` tool
- `create_elevations` tool
- `get_component_design_tokens` tool
- `create_component_theme` tool
- Preset resources (palettes, typography, elevations)
- Basic Sass and CSS code generation

**Data to Embed**:

- Color multipliers (`$color`, `$grayscale` from `_multipliers.scss`)
- All 8 palette presets (light/dark x 4 design systems)
- All 4 typography presets with type scales
- Both elevation presets (material, indigo)
- Shade generation algorithms

### Phase 2: Color Intelligence (Partially Done)

**Goal**: Smart color operations, validation, and suggestions

**Deliverables**:

- ✅ Color validation for surface/gray colors (validates against theme variant)
- ✅ Color guidance resource (`theming://guidance/colors`)
- ✅ `get_color` tool (includes contrast color retrieval via `contrast` parameter)
- `suggest_palette` tool (AI-friendly descriptions)
- `check_contrast` tool
- Schema resources

**Implemented: Surface/Gray Color Validation**

The `create_palette`, `create_custom_palette`, and `create_theme` tools validate surface and gray colors against the theme variant:

| Variant | Surface Requirement           | Gray Requirement              |
| ------- | ----------------------------- | ----------------------------- |
| `light` | Light color (luminance > 0.5) | Dark color (luminance ≤ 0.5)  |
| `dark`  | Dark color (luminance ≤ 0.5)  | Light color (luminance > 0.5) |

**Why is gray inverted?** The `palette()` function generates gray shades that need to contrast against the surface. Light themes need dark gray text, dark themes need light gray text.

**Validation behavior:**

- Warnings are shown but code is still generated (non-blocking)
- Warning comments are added to generated Sass code
- Tips suggest omitting gray parameter to let it auto-calculate
- Uses Sass `luminance()` function via `sass-embedded` for accurate calculation

**Data to Embed**:

- WCAG contrast calculation algorithms
- Color shade generation logic
- Industry/mood color associations

### Phase 3: Typography & Spacing

**Goal**: Complete typography and spacing control

**Deliverables**:

- `create_type_style` tool
- `get_type_scale_category` tool
- `convert_units` tool
- `create_spacing_system` tool
- `get_sizable_value` tool
- `get_padding` tool
- Typography documentation resources

### Phase 4: Validation & Intelligence

**Goal**: Code validation and smart assistance

**Deliverables**:

- `validate_theme` tool (integrates dart-sass for validation)
- `explain_function` tool
- Documentation resources
- All prompts

**Optional Enhancement**:

- Sass compilation service for validation
- Error message interpretation

---

## Data Extraction Strategy

The MCP server needs embedded knowledge from the Sass source files.

### Approach: Build-Time Extraction

1. **Parse Sass files** during build to extract:
   - Color presets and multipliers -> JSON
   - Typography presets -> JSON
   - Elevation presets -> JSON
   - Component schemas -> JSON

2. **Embed as TypeScript constants**:

   ```typescript
   // Generated from sass/color/presets/
   export const PALETTES = {
     'light-material': { primary: '#09f', secondary: '#df1b74', ... },
     // ...
   } as const;
   ```

3. **Existing JSON exports**: Leverage the existing `scripts/buildJSON.mjs` pipeline that already generates:
   - `json/colors/presets/palettes.json`
   - `json/colors/meta/multipliers.json`
   - `json/typography/presets/typescales.json`
   - `json/elevations/*.json`

### Shade Generation Algorithm (To Embed)

From `sass/color/_functions.scss`, the shade generation uses HSL manipulation with multipliers:

```typescript
// Simplified shade generation logic
function generateShades(baseColor: string, multipliers: ShadeMultipliers): ShadeMap {
  const hsl = parseToHSL(baseColor);
  const shades: ShadeMap = {};

  for (const [shade, factors] of Object.entries(multipliers)) {
    shades[shade] = {
      h: hsl.h,
      s: clamp(hsl.s * factors.s, 0, 100),
      l: clamp(hsl.l * factors.l, 0, 100),
    };
  }

  return shades;
}
```

---

## Code Generation Templates

The MCP server generates platform-specific Sass code based on the detected or specified platform.

### Ignite UI for Angular

```scss
// Generated by Ignite UI Theming MCP Server
// Platform: Angular

@use 'igniteui-angular/theming' as *;

// Initialize core styles (required for Angular)
@include core();

// Custom palette
$my-palette: palette(
  $primary: #2563eb,
  $secondary: #7c3aed,
  $surface: #ffffff,
  $gray: #64748b,
);

// Typography setup
@include typography($font-family: $material-typeface, $type-scale: $material-type-scale);

// Apply complete theme (palette + schema + elevations)
@include theme($palette: $my-palette, $schema: $light-material-schema);
```

**Angular-specific notes:**

- Uses `igniteui-angular/theming` module (forwards igniteui-theming with overrides)
- Requires `core()` mixin to be called first
- Uses unified `theme()` mixin instead of individual `palette()`, `elevations()` calls
- Typography module is overridden with Angular-specific implementation
- Requires `ig-typography` CSS class on the root HTML element

### Ignite UI for Web Components

```scss
// Generated by Ignite UI Theming MCP Server
// Platform: Web Components

@use 'igniteui-theming/sass/color/presets/light/material' as light-preset;
@use 'igniteui-theming' as *;
@use 'igniteui-theming/sass/typography/presets/material' as typography-preset;
@use 'igniteui-theming/sass/elevations/presets' as elevation-preset;

// Theme identification variables
:root {
  --ig-theme: material;
  --ig-theme-variant: light;
}

// Custom palette
$my-palette: palette(
  $primary: #2563eb,
  $secondary: #7c3aed,
  $surface: #ffffff,
  $gray: #64748b,
);

// Apply palette (generates CSS custom properties)
@include palette($my-palette);

// Typography setup
@include typography($font-family: typography-preset.$typeface, $type-scale: typography-preset.$type-scale);

// Elevations
@include elevations(elevation-preset.$material-elevations);

// Spacing (Web Components only)
@include spacing();
```

**Web Components-specific notes:**

- Uses `igniteui-theming` directly (not via Angular forwarding)
- No `core()` or unified `theme()` mixins - uses individual mixins
- Supports runtime theme switching via `configureTheme()` JavaScript API
- Ships precompiled CSS themes in `dist/themes/` for zero-config usage
- Includes `spacing()` mixin for spacing CSS custom properties

### CSS Output Example

Both platforms generate similar CSS custom properties:

```css
/* Generated by Ignite UI Theming MCP Server */
:root {
  /* Primary Color Shades */
  --ig-primary-50: hsl(217, 91%, 95%);
  --ig-primary-100: hsl(217, 91%, 85%);
  --ig-primary-200: hsl(217, 91%, 75%);
  /* ... */
  --ig-primary-500: hsl(217, 91%, 59%);
  /* ... */

  /* Typography */
  --ig-font-family: 'Inter', system-ui, sans-serif;
  --ig-h1-font-size: 6rem;
  --ig-h1-font-weight: 300;
  /* ... */

  /* Elevations */
  --ig-elevation-1: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  /* ... */
}
```

---

## File Structure (Initial Scaffolding)

```
src/mcp/
├── index.ts                 # Entry point, server initialization
├── server.ts                # MCP server configuration
├── transport/
│   ├── stdio.ts             # STDIO transport
│   └── http.ts              # HTTP transport (future)
├── tools/
│   ├── index.ts             # Tool registry
│   ├── handlers/            # Tool handler implementations
│   │   ├── theme.ts         # create_theme handler
│   │   ├── palette.ts       # create_palette handler
│   │   ├── typography.ts    # create_typography handler
│   │   ├── elevations.ts    # create_elevations handler
│   │   └── platform.ts      # detect_platform handler
│   └── schemas.ts           # Zod schemas for tool inputs
├── resources/
│   ├── index.ts             # Resource registry
│   ├── presets.ts           # Preset resources
│   ├── schemas.ts           # Schema resources
│   ├── components.ts        # Component catalog
│   └── docs.ts              # Documentation resources
├── prompts/
│   ├── index.ts             # Prompt registry
│   └── templates.ts         # Prompt definitions
├── generators/
│   ├── sass.ts              # Sass code generation (platform-aware)
│   ├── css.ts               # CSS code generation
│   └── templates/           # Code templates
├── validators/
│   ├── sass.ts              # Sass validation (dart-sass)
│   └── contrast.ts          # WCAG contrast validation
├── knowledge/
│   ├── index.ts             # Knowledge base exports
│   ├── palettes.ts          # Embedded palette data
│   ├── typography.ts        # Embedded typography data
│   ├── elevations.ts        # Embedded elevation data
│   ├── multipliers.ts       # Color multipliers
│   ├── platforms/           # Platform-specific knowledge
│   │   ├── index.ts         # Platform exports, detection
│   │   ├── angular.ts       # Angular platform config & generator
│   │   └── webcomponents.ts # Web Components platform config & generator
│   └── components/          # Component schemas
└── utils/
    ├── color.ts             # Color manipulation utilities
    ├── units.ts             # Unit conversion
    └── types.ts             # TypeScript types
```

---

## Build Configuration

### Vite Configuration

```typescript
// vite.config.mcp.ts
import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mcp/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'mcp',
    rollupOptions: {
      external: ['@modelcontextprotocol/sdk'],
    },
  },
});
```

### Package.json Updates

```json
{
  "bin": {
    "igniteui-theming-mcp": "./mcp/index.js"
  },
  "exports": {
    "./mcp": {
      "import": "./mcp/index.js"
    }
  },
  "files": ["mcp/"],
  "scripts": {
    "build:mcp": "vite build --config vite.config.mcp.ts",
    "mcp:dev": "tsx src/mcp/index.ts"
  }
}
```

---

## Dependencies

### Runtime Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "zod": "^3.0.0",
  "sass-embedded": "^1.92.0"
}
```

### Dev Dependencies

```json
{
  "vite": "^5.0.0",
  "typescript": "^5.0.0",
  "tsx": "^4.0.0"
}
```

---

## Usage Examples

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "npx",
      "args": ["igniteui-theming/mcp"]
    }
  }
}
```

### Example Interaction

**User**: "Create a dark theme for a healthcare app with a calming blue primary color"

**AI uses `detect_platform` tool first** (optional, to auto-detect):

```json
{
  "name": "detect_platform",
  "arguments": {
    "packageJsonPath": "./package.json"
  }
}
```

**Response**:

```json
{
  "platform": "angular",
  "confidence": "high",
  "detectedPackage": "igniteui-angular",
  "reason": "Found igniteui-angular in dependencies"
}
```

**AI uses `create_theme` tool**:

```json
{
  "name": "create_theme",
  "arguments": {
    "platform": "angular",
    "designSystem": "material",
    "primaryColor": "#0891b2",
    "variant": "dark",
    "name": "healthcare-dark"
  }
}
```

**Response**: Complete platform-specific Sass code with accessible color palette optimized for healthcare applications.

### Example: Web Components Theme

**User**: "I need a Material light theme for my web components project"

**AI uses `create_theme` tool** (with explicit platform):

```json
{
  "name": "create_theme",
  "arguments": {
    "platform": "webcomponents",
    "designSystem": "material",
    "primaryColor": "#3f51b5",
    "variant": "light"
  }
}
```

**Response**: Web Components-specific Sass code using `igniteui-theming` directly with individual `palette()`, `typography()`, and `elevations()` mixins.

---

## Success Metrics

1. **Functional**: All Phase 1 tools working correctly
2. **Quality**: Generated code compiles without errors
3. **Accessibility**: Generated themes pass WCAG AA by default
4. **Usability**: AI assistants can accomplish theming tasks in 1-2 tool calls
5. **Extensibility**: New components can be added without modifying core code

---

## Open Questions

1. **HTTP Transport**:

- Q: Will Phase 1 include HTTP transport for remote hosting, or is STDIO sufficient for MVP?
- A: No. Phase 1 will focus on STDIO. HTTP transport can be added in a later phase if needed.

2. **Caching**:

- Q: Should validated themes be cached? What invalidation strategy?
- A: Not in Phase 1. Caching can be considered in future phases based on performance needs.

---

## Appendix: Theming Framework API Reference

### Color Module (`sass/color/`)

#### Public Functions

- `palette($primary, $secondary, $surface, ...)` - Generate complete color palette
- `color($palette?, $color, $variant, $opacity?)` - Retrieve color from palette
- `contrast-color($palette?, $color, $variant, $opacity?)` - Get contrast color
- `adaptive-contrast($color)` - Runtime-calculated contrast color
- `luminance($color)` - Calculate relative luminance
- `contrast($background, $foreground)` - Calculate WCAG contrast ratio

#### Public Mixins

- `palette($palette, $contrast?, $contrast-level?)` - Generate CSS custom properties
- `adaptive-contrast($level?)` - Set up WCAG contrast variables
- `configure-colors($enhanced-accessibility?)` - Configure color module

#### Presets

- Light: `$light-material-palette`, `$light-bootstrap-palette`, `$light-fluent-palette`, `$light-indigo-palette`
- Dark: `$dark-material-palette`, `$dark-bootstrap-palette`, `$dark-fluent-palette`, `$dark-indigo-palette`

### Typography Module (`sass/typography/`)

#### Public Functions

- `rem($pixels, $context?)` - Convert to rem units
- `em($pixels, $context?)` - Convert to em units
- `px($num, $context?)` - Convert to pixels
- `type-style(...)` - Create type style map
- `type-scale(...)` - Create complete type scale
- `type-scale-category($scale, $category)` - Get category from scale

#### Public Mixins

- `typography($font-family, $type-scale)` - Set up complete typography
- `type-style($category, $check?)` - Apply type style
- `type-style-vars($name, $type-style)` - Generate CSS variables

#### Presets

- `$material-typeface`, `$material-type-scale`
- `$bootstrap-typeface`, `$bootstrap-type-scale`
- `$fluent-typeface`, `$fluent-type-scale`
- `$indigo-typeface`, `$indigo-type-scale`

### Elevations Module (`sass/elevations/`)

#### Public Functions

- `elevation($name)` - Get elevation CSS variable reference
- `box-shadow($shadows)` - Transform shadows with elevation factor

#### Public Mixins

- `elevations($elevations)` - Generate all elevation CSS variables
- `elevation($name)` - Apply elevation to element

#### Presets

- `$material-elevations` - 25 levels (0-24)
- `$indigo-elevations` - 25 levels (0-24)

### Themes Module (`sass/themes/`)

#### Public Functions

- `sizable($sm, $md, $lg)` - Responsive sizing
- `pad($sm, $md, $lg, $dir?)` - Contextual padding
- `pad-inline($sm, $md, $lg)` - Inline padding
- `pad-block($sm, $md, $lg)` - Block padding

#### Public Mixins

- `css-vars-from-theme($theme)` - Output CSS custom properties from theme
- `sizable()` - Add size reactivity CSS properties
- `ellipsis()` - Text overflow ellipsis
- `line-clamp($lines, ...)` - Multi-line text truncation

#### Design System Schemas

- Light: `$light-material-schema`, `$light-bootstrap-schema`, `$light-fluent-schema`, `$light-indigo-schema`
- Dark: `$dark-material-schema`, `$dark-bootstrap-schema`, `$dark-fluent-schema`, `$dark-indigo-schema`

### Animations Module (`sass/animations/`)

#### Public Mixins

- `keyframes($name)` - Register keyframe animation
- `animation($animate...)` - Apply animation

#### Easing Variables

- `$ease-in-quad`, `$ease-in-cubic`, `$ease-in-quart`, etc.
- `$ease-out-quad`, `$ease-out-cubic`, `$ease-out-quart`, etc.
- `$ease-in-out-quad`, `$ease-in-out-cubic`, etc.
