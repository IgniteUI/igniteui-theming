# Ignite UI Theming MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that enables AI assistants to generate production-ready theming code for Ignite UI components.

## Overview

This MCP server helps you create custom themes for Ignite UI applications by generating Sass code for:

- **Color Palettes** - Primary, secondary, surface, and semantic colors with automatic shade generation
- **Typography** - Font families and type scales following design system conventions
- **Elevations** - Shadow definitions for visual depth and hierarchy
- **Complete Themes** - All of the above combined into a ready-to-use theme

### Supported Platforms

| Platform | Package | Description |
|----------|---------|-------------|
| `angular` | `igniteui-angular` | Ignite UI for Angular applications |
| `webcomponents` | `igniteui-webcomponents` | Ignite UI for Web Components |

### Supported Design Systems

- **Material** - Google Material Design
- **Bootstrap** - Bootstrap design language
- **Fluent** - Microsoft Fluent Design
- **Indigo** - Infragistics Indigo Design

---

## Quick Start

### 1. Install the Package

```bash
npm install igniteui-theming
```

### 2. Build the MCP Server

```bash
npm run build:mcp
```

### 3. Configure Your AI Client

#### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "node",
      "args": ["/path/to/igniteui-theming/dist/mcp/index.js"]
    }
  }
}
```

#### Using npx (after publishing)

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

---

## Tools Reference

The MCP server provides 6 tools for theme generation.

### `detect_platform`

Automatically detects whether your project uses Ignite UI for Angular or Web Components by analyzing `package.json`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `packageJsonPath` | string | No | Path to package.json (default: `./package.json`) |

**Example prompt:**
> "Detect which Ignite UI platform my project uses"

---

### `create_palette`

Generates a color palette with automatically calculated shade variations (50-900, A100-A700).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | `"angular"` \| `"webcomponents"` | No | Target platform |
| `primary` | string | Yes | Primary brand color (hex, rgb, hsl, or named) |
| `secondary` | string | Yes | Secondary/accent color |
| `surface` | string | Yes | Background/surface color |
| `gray` | string | No | Gray/neutral color (auto-calculated if omitted) |
| `info` | string | No | Info state color |
| `success` | string | No | Success state color |
| `warn` | string | No | Warning state color |
| `error` | string | No | Error state color |
| `variant` | `"light"` \| `"dark"` | No | Theme variant (default: `"light"`) |
| `name` | string | No | Custom variable name |

**Example prompts:**
> "Create a color palette with blue (#1976D2) as primary and orange (#FF9800) as secondary for a light theme"

> "Generate a dark theme palette using my brand colors: primary #6366F1, secondary #EC4899, surface #1E1E1E"

---

### `create_custom_palette`

Creates a palette with fine-grained control over individual shade values. Use this when you have exact brand guidelines or when automatic shade generation produces suboptimal results.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | `"angular"` \| `"webcomponents"` | No | Target platform |
| `variant` | `"light"` \| `"dark"` | No | Theme variant |
| `designSystem` | `"material"` \| `"bootstrap"` \| `"fluent"` \| `"indigo"` | No | Design system preset |
| `name` | string | No | Custom variable name |
| `primary` | ColorDefinition | Yes | Primary color definition |
| `secondary` | ColorDefinition | Yes | Secondary color definition |
| `surface` | ColorDefinition | Yes | Surface color definition |
| `gray` | ColorDefinition | No | Gray color definition |
| `info` | ColorDefinition | No | Info color definition |
| `success` | ColorDefinition | No | Success color definition |
| `warn` | ColorDefinition | No | Warning color definition |
| `error` | ColorDefinition | No | Error color definition |

**ColorDefinition** can be:
- `{ mode: "shades", baseColor: "#hexcolor" }` - Auto-generate shades from base color
- `{ mode: "explicit", shades: { "50": "#...", "100": "#...", ... } }` - Specify all 14 shades manually

**Example prompts:**
> "Create a custom palette where primary uses explicit shades from my brand guidelines, but secondary and surface are auto-generated"

> "I have exact hex values for all 14 shades of my primary green color. Create a custom palette with these explicit values."

---

### `create_typography`

Sets up typography with your preferred font family.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | `"angular"` \| `"webcomponents"` | No | Target platform |
| `fontFamily` | string | Yes | Font family with fallbacks |
| `designSystem` | `"material"` \| `"bootstrap"` \| `"fluent"` \| `"indigo"` | No | Design system for type scale |
| `name` | string | No | Custom variable name |

**Example prompts:**
> "Set up typography using Inter font with Material Design type scale"

> "Configure typography with 'Segoe UI', Arial, sans-serif for a Fluent design system"

---

### `create_elevations`

Configures elevation shadows for visual depth.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | `"angular"` \| `"webcomponents"` | No | Target platform |
| `designSystem` | `"material"` \| `"indigo"` | No | Elevation preset |
| `name` | string | No | Custom variable name |

**Example prompts:**
> "Set up Material Design elevations for my Angular app"

> "Create Indigo-style shadows for my web components project"

---

### `create_theme`

Generates a complete, production-ready theme with palette, typography, and elevations combined.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | `"angular"` \| `"webcomponents"` | No | Target platform |
| `designSystem` | `"material"` \| `"bootstrap"` \| `"fluent"` \| `"indigo"` | No | Design system |
| `primaryColor` | string | Yes | Primary brand color |
| `secondaryColor` | string | Yes | Secondary/accent color |
| `surfaceColor` | string | Yes | Background/surface color |
| `variant` | `"light"` \| `"dark"` | No | Theme variant |
| `name` | string | No | Custom theme name |
| `fontFamily` | string | No | Font family |
| `includeTypography` | boolean | No | Include typography (default: `true`) |
| `includeElevations` | boolean | No | Include elevations (default: `true`) |
| `includeSpacing` | boolean | No | Include spacing - Web Components only (default: `true`) |

**Example prompts:**
> "Create a complete Material Design dark theme for my Angular app with primary #3F51B5, secondary #FF4081, and a dark surface"

> "Generate a production-ready Bootstrap light theme using my brand colors: primary teal (#009688), secondary amber (#FFC107)"

> "Create a Fluent theme for Web Components with Segoe UI font, blue primary, and orange accent colors"

---

## Resources Reference

The MCP server exposes read-only resources that provide reference data.

### Platform Resources

| URI | Description |
|-----|-------------|
| `theming://platforms` | List of supported platforms |
| `theming://platforms/angular` | Angular platform configuration and usage examples |
| `theming://platforms/webcomponents` | Web Components platform configuration and examples |

### Preset Resources

| URI | Description |
|-----|-------------|
| `theming://presets/palettes` | All predefined palette configurations |
| `theming://presets/palettes/light` | Light mode palette presets |
| `theming://presets/palettes/dark` | Dark mode palette presets |
| `theming://presets/typography` | Typography presets for all design systems |
| `theming://presets/elevations` | Elevation shadow presets |

### Color Guidance Resources

| URI | Description |
|-----|-------------|
| `theming://guidance/colors` | Overview of color guidance resources |
| `theming://guidance/colors/rules` | Light/dark theme color rules |
| `theming://guidance/colors/usage` | Which shades to use for different purposes |
| `theming://guidance/colors/roles` | Semantic meaning of each color family |
| `theming://guidance/colors/states` | Color changes for interaction states |
| `theming://guidance/colors/themes` | Design system-specific color patterns |

---

## Example Usage Scenarios

### Scenario 1: New Project Setup

> "I'm starting a new Angular project with Ignite UI. Create a complete Material Design theme with:
> - Primary: our brand blue #2563EB
> - Secondary: coral accent #F97316  
> - Light theme
> - Roboto font"

The AI will use `create_theme` to generate ready-to-use Sass code.

### Scenario 2: Dark Mode Variant

> "I need a dark mode version of my theme. Use the same primary blue #2563EB but with a dark surface color #121212"

### Scenario 3: Brand Guidelines with Exact Colors

> "Our design system specifies exact hex values for each shade of our primary green. I'll provide all 14 values - create a custom palette with these explicit shades."

The AI will use `create_custom_palette` with `mode: "explicit"`.

### Scenario 4: Typography Only

> "I just need to change the font to Inter for my existing Material theme"

The AI will use `create_typography` to generate only the typography setup.

### Scenario 5: Platform Detection

> "Check my package.json and tell me which Ignite UI platform I'm using, then create an appropriate theme"

The AI will first use `detect_platform`, then use the detected platform for `create_theme`.

---

## Platform Differences

### Ignite UI for Angular

- Uses `@use "igniteui-angular/theming"` module
- Requires `core()` mixin to be called first
- Uses unified `theme()` mixin
- Requires `ig-typography` CSS class on root element

### Ignite UI for Web Components

- Uses `@use "igniteui-theming"` directly
- Uses individual mixins (`palette()`, `typography()`, `elevations()`)
- Supports runtime theme switching via JavaScript API
- Includes optional `spacing()` mixin

---

## Development

### Running in Development Mode

```bash
npm run mcp:dev
```

### Running Tests

```bash
npm run test:mcp
```

### Building

```bash
npm run build:mcp
```

### Debugging with MCP Inspector

```bash
npm run mcp:inspector
```

---

## Troubleshooting

### "Platform not detected"

If `detect_platform` returns `null`, ensure:
- The `package.json` path is correct
- Your project has `igniteui-angular` or `igniteui-webcomponents` in dependencies

You can always specify the `platform` parameter explicitly.

### "Luminance warning" on colors

If you see warnings about color luminance, it means your chosen color may produce suboptimal automatic shade generation. Options:
1. Choose a color with mid-range luminance (not too light or too dark)
2. Use `create_custom_palette` with explicit shade values

### "Surface color doesn't match variant"

For light themes, use light surface colors (high luminance like `#FAFAFA`).  
For dark themes, use dark surface colors (low luminance like `#121212`).

### Generated code doesn't compile

Ensure you have the correct Ignite UI package installed:
- Angular: `npm install igniteui-angular`
- Web Components: `npm install igniteui-webcomponents`

---

## Related Documentation

- [Ignite UI for Angular Theming](https://www.infragistics.com/products/ignite-ui-angular/angular/components/themes/index)
- [Ignite UI for Web Components Theming](https://www.infragistics.com/products/ignite-ui-web-components/web-components/components/themes/overview)
- [Model Context Protocol](https://modelcontextprotocol.io/)
