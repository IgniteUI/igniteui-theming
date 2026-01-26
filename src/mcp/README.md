# Ignite UI Theming MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that enables AI assistants to generate production-ready theming code for Ignite UI components.

## Overview

This MCP server helps you create custom themes for Ignite UI applications by generating Sass code for:

- **Color Palettes** - Primary, secondary, surface, and semantic colors with automatic shade generation
- **Typography** - Font families and type scales following design system conventions
- **Elevations** - Shadow definitions for visual depth and hierarchy
- **Complete Themes** - All of the above combined into a ready-to-use theme

### Supported Platforms

| Platform        | Package                  | Description                        |
| --------------- | ------------------------ | ---------------------------------- |
| `angular`       | `igniteui-angular`       | Ignite UI for Angular applications |
| `webcomponents` | `igniteui-webcomponents` | Ignite UI for Web Components       |
| `react`         | `igniteui-react`         | Ignite UI for React applications   |
| `blazor`        | `igniteui-blazor`        | Ignite UI for Blazor applications  |

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

The MCP server uses STDIO transport and can be configured with any MCP-compatible client.

#### Editor Clients

##### VS Code (with MCP-compatible extensions)

**Using local clone (for development):**

Create or edit `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "igniteui-theming": {
      "command": "node",
      "args": ["/absolute/path/to/igniteui-theming/dist/mcp/index.js"]
    }
  }
}
```

**Using installed package (via npx):**

```json
{
  "mcp.servers": {
    "igniteui-theming": {
      "command": "npx",
      "args": ["igniteui-theming-mcp"]
    }
  }
}
```

##### WebStorm / JetBrains IDEs

1. Go to **Settings → Tools → AI Assistant → MCP Servers**
2. Click **+ Add MCP Server**
3. Configure:
   - **Name**: `igniteui-theming`
   - **Command**: `node` (for local) or `npx` (for installed package)
   - **Arguments**:
     - Local: `/absolute/path/to/igniteui-theming/dist/mcp/index.js`
     - Package: `igniteui-theming-mcp`
4. Click **OK** and restart AI Assistant

#### Desktop Clients

##### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Using local clone:**

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "node",
      "args": ["/absolute/path/to/igniteui-theming/dist/mcp/index.js"]
    }
  }
}
```

**Using installed package (via npx):**

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "npx",
      "args": ["igniteui-theming-mcp"]
    }
  }
}
```

##### Cursor

Create or edit `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "node",
      "args": ["/absolute/path/to/igniteui-theming/dist/mcp/index.js"]
    }
  }
}
```

Or using npx:

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "npx",
      "args": ["igniteui-theming-mcp"]
    }
  }
}
```

#### Other MCP Clients

For any other MCP-compatible client, use the STDIO transport configuration:

- **Command**: `node` (or `npx`)
- **Arguments**:
  - Local: `/absolute/path/to/igniteui-theming/dist/mcp/index.js`
  - Package: `igniteui-theming-mcp`

````

---

## Tools Reference

The MCP server provides tools for theme generation.

### `detect_platform`

Automatically detects whether your project uses Ignite UI for Angular or Web Components by analyzing `package.json`.

| Parameter         | Type   | Required | Description                                      |
| ----------------- | ------ | -------- | ------------------------------------------------ |
| `packageJsonPath` | string | No       | Path to package.json (default: `./package.json`) |

**Example prompts:**

> "Detect which Ignite UI platform my project uses"

> "What Ignite UI package is installed in this project?"

> "Check if I'm using Angular or Web Components for Ignite UI"

---

### `create_palette`

Generates a color palette with automatically calculated shade variations (50-900, A100-A700).

| Parameter   | Type                             | Required | Description                                     |
| ----------- | -------------------------------- | -------- | ----------------------------------------------- |
| `platform`  | `angular` \| `webcomponents"`    | No       | Target platform                                 |
| `primary`   | string                           | Yes      | Primary brand color (hex, rgb, hsl, or named)   |
| `secondary` | string                           | Yes      | Secondary/accent color                          |
| `surface`   | string                           | Yes      | Background/surface color                        |
| `gray`      | string                           | No       | Gray/neutral color (auto-calculated if omitted) |
| `info`      | string                           | No       | Info state color                                |
| `success`   | string                           | No       | Success state color                             |
| `warn`      | string                           | No       | Warning state color                             |
| `error`     | string                           | No       | Error state color                               |
| `variant`   | `"light"` \| `"dark"`            | No       | Theme variant (default: `"light"`)              |
| `name`      | string                           | No       | Custom variable name                            |

**Example prompts:**

> "Create a color palette with blue as primary and orange as secondary for a light theme"

> "Generate a dark theme palette using my brand colors: primary #6366F1, secondary #EC4899, surface #1E1E1E"

> "I need a light palette with teal primary, purple secondary, and white surface"

> "Make me a professional dark mode palette with navy blue and gold accent"

---

### `create_custom_palette`

Creates a palette with fine-grained control over individual shade values. Use this when you have exact brand guidelines or when automatic shade generation produces suboptimal results.

| Parameter      | Type                                                      | Required | Description                |
| -------------- | --------------------------------------------------------- | -------- | -------------------------- |
| `platform`     | `angular` \| `webcomponents`                              | No       | Target platform            |
| `variant`      | `"light"` \| `"dark"`                                     | No       | Theme variant              |
| `designSystem` | `"material"` \| `"bootstrap"` \| `"fluent"` \| `"indigo"` | No       | Design system preset       |
| `name`         | string                                                    | No       | Custom variable name       |
| `primary`      | ColorDefinition                                           | Yes      | Primary color definition   |
| `secondary`    | ColorDefinition                                           | Yes      | Secondary color definition |
| `surface`      | ColorDefinition                                           | Yes      | Surface color definition   |
| `gray`         | ColorDefinition                                           | No       | Gray color definition      |
| `info`         | ColorDefinition                                           | No       | Info color definition      |
| `success`      | ColorDefinition                                           | No       | Success color definition   |
| `warn`         | ColorDefinition                                           | No       | Warning color definition   |
| `error`        | ColorDefinition                                           | No       | Error color definition     |

**ColorDefinition** can be:

- `{ mode: "shades", baseColor: "#hexcolor" }` - Auto-generate shades from base color
- `{ mode: "explicit", shades: { "50": "#...", "100": "#...", ... } }` - Specify all 14 shades manually

**Example prompts:**

> "Create a custom palette where primary uses explicit shades from my brand guidelines, but secondary and surface are auto-generated"

> "I have exact hex values for all 14 shades of my primary green color. Create a custom palette with these explicit values."

> "Our design system specifies exact colors for primary-500, primary-600, primary-700. Use those exact values and auto-generate the rest."

> "Make a custom palette with explicit shades for primary (#3B82F6 as base) but let secondary auto-generate from #EC4899"

---

### `create_typography`

Sets up typography with your preferred font family.

| Parameter      | Type                                                      | Required | Description                  |
| -------------- | --------------------------------------------------------- | -------- | ---------------------------- |
| `platform`     | `"angular"` \| `"webcomponents"`                          | No       | Target platform              |
| `fontFamily`   | string                                                    | Yes      | Font family with fallbacks   |
| `designSystem` | `"material"` \| `"bootstrap"` \| `"fluent"` \| `"indigo"` | No       | Design system for type scale |
| `name`         | string                                                    | No       | Custom variable name         |

**Example prompts:**

> "Set up typography using Inter font with Material Design type scale"

> "Configure typography with 'Segoe UI', Arial, sans-serif for a Fluent design system"

> "I want to use Roboto font for my Angular app with Bootstrap type scale"

> "Set up typography with system fonts: -apple-system, BlinkMacSystemFont, 'Segoe UI' for Material Design"

---

### `create_elevations`

Configures elevation shadows for visual depth.

| Parameter      | Type                             | Required | Description          |
| -------------- | -------------------------------- | -------- | -------------------- |
| `platform`     | `"angular"` \| `"webcomponents"` | No       | Target platform      |
| `designSystem` | `"material"` \| `"indigo"`       | No       | Elevation preset     |
| `name`         | string                           | No       | Custom variable name |

**Example prompts:**

> "Set up Material Design elevations for my Angular app"

> "Create Indigo-style shadows for my web components project"

> "I need Material Design shadows for my React components"

> "Configure Indigo elevations with subtle shadows for a minimalist design"

---

### `create_theme`

Generates a complete, production-ready theme with palette, typography, and elevations combined.

| Parameter           | Type                                                      | Required | Description                                             |
| ------------------- | --------------------------------------------------------- | -------- | ------------------------------------------------------- |
| `platform`          | `"angular"` \| `"webcomponents"`                          | No       | Target platform                                         |
| `designSystem`      | `"material"` \| `"bootstrap"` \| `"fluent"` \| `"indigo"` | No       | Design system                                           |
| `primaryColor`      | string                                                    | Yes      | Primary brand color                                     |
| `secondaryColor`    | string                                                    | Yes      | Secondary/accent color                                  |
| `surfaceColor`      | string                                                    | Yes      | Background/surface color                                |
| `variant`           | `"light"` \| `"dark"`                                     | No       | Theme variant                                           |
| `name`              | string                                                    | No       | Custom theme name                                       |
| `fontFamily`        | string                                                    | No       | Font family                                             |
| `includeTypography` | boolean                                                   | No       | Include typography (default: `true`)                    |
| `includeElevations` | boolean                                                   | No       | Include elevations (default: `true`)                    |
| `includeSpacing`    | boolean                                                   | No       | Include spacing - Web Components only (default: `true`) |

**Example prompts:**

> "Create a complete Material Design dark theme for my Angular app with primary #3F51B5, secondary #FF4081, and a dark surface"

> "Generate a production-ready Bootstrap light theme using my brand colors: primary teal (#009688), secondary amber (#FFC107)"

> "Create a Fluent theme for Web Components with Segoe UI font, blue primary, and orange accent colors"

> "I need a dark Indigo theme for React with navy blue primary (#1E3A8A), warm orange secondary (#F97316), and charcoal surface (#18181B)"

> "Make a light Material theme for Blazor using our brand: primary #7C3AED (purple), secondary #10B981 (green), with Inter font"

---

### `get_component_design_tokens`

Discovers available design tokens (customizable properties) for a specific Ignite UI component. Use this tool **before** `create_component_theme` to see what tokens are available.

| Parameter   | Type   | Required | Description                                     |
| ----------- | ------ | -------- | ----------------------------------------------- |
| `component` | string | Yes      | Component name (e.g., "button", "card", "grid") |

**Example prompts:**

> "What design tokens are available for the button component?"

> "Show me all the customizable properties for the data grid"

> "I want to style the card component - what tokens can I use?"

**Sample response:**

```json
{
  "component": "button",
  "tokens": {
    "background": "Background color of the button",
    "foreground": "Text color of the button",
    "border-color": "Border color of the button",
    "hover-background": "Background color on hover",
    "disabled-foreground": "Text color when disabled"
  }
}
````

---

### `create_component_theme`

Generates Sass code to customize a specific component's appearance using design tokens. Call `get_component_design_tokens` first to discover available tokens.

| Parameter      | Type                                                        | Required | Description                           |
| -------------- | ----------------------------------------------------------- | -------- | ------------------------------------- |
| `platform`     | `"angular"` \| `"webcomponents"` \| `"react"` \| `"blazor"` | No       | Target platform                       |
| `component`    | string                                                      | Yes      | Component name                        |
| `designSystem` | `"material"` \| `"bootstrap"` \| `"fluent"` \| `"indigo"`   | No       | Design system                         |
| `variant`      | `"light"` \| `"dark"`                                       | No       | Theme variant                         |
| `tokens`       | object                                                      | Yes      | Design token values (key-value pairs) |

**Example prompts:**

> "Create a button theme with a purple background (#8B5CF6) and white text"

> "Style the card component with a light gray background and subtle shadow"

> "Make the data grid header bold with a blue background (#1E40AF)"

> "Customize the input component for dark mode with a dark background and bright border"

**Example interaction:**

```
User: "I want to create a custom theme for buttons with my brand colors"

AI: First, let me check what design tokens are available for buttons.
[calls get_component_design_tokens with component="button"]

AI: Great! I can customize these properties: background, foreground, border-color,
hover-background, and more. What are your brand colors?

User: "Primary purple #8B5CF6, white text, and lighter purple #A78BFA on hover"

AI: Perfect! Let me create that theme for you.
[calls create_component_theme with tokens]
```

---

## Resources Reference

The MCP server exposes read-only resources that provide reference data.

### Platform Resources

| URI                                 | Description                                        |
| ----------------------------------- | -------------------------------------------------- |
| `theming://platforms`               | List of supported platforms                        |
| `theming://platforms/angular`       | Angular platform configuration and usage examples  |
| `theming://platforms/webcomponents` | Web Components platform configuration and examples |

### Preset Resources

| URI                                | Description                               |
| ---------------------------------- | ----------------------------------------- |
| `theming://presets/palettes`       | All predefined palette configurations     |
| `theming://presets/palettes/light` | Light mode palette presets                |
| `theming://presets/palettes/dark`  | Dark mode palette presets                 |
| `theming://presets/typography`     | Typography presets for all design systems |
| `theming://presets/elevations`     | Elevation shadow presets                  |

### Color Guidance Resources

| URI                                | Description                                |
| ---------------------------------- | ------------------------------------------ |
| `theming://guidance/colors`        | Overview of color guidance resources       |
| `theming://guidance/colors/rules`  | Light/dark theme color rules               |
| `theming://guidance/colors/usage`  | Which shades to use for different purposes |
| `theming://guidance/colors/roles`  | Semantic meaning of each color family      |
| `theming://guidance/colors/states` | Color changes for interaction states       |
| `theming://guidance/colors/themes` | Design system-specific color patterns      |

---

## Example Usage Scenarios

### Scenario 1: New Project Setup

> "I'm starting a new Angular project with Ignite UI. Create a complete Material Design theme with:
>
> - Primary: our brand blue #2563EB
> - Secondary: coral accent #F97316
> - Light theme
> - Roboto font"

The AI will use `create_theme` to generate ready-to-use Sass code.

### Scenario 2: Dark Mode Variant

> "I need a dark mode version of my theme. Use the same primary blue but with a dark surface color #121212"

### Scenario 3: Brand Guidelines with Exact Colors

> "Our design system specifies exact hex values for each shade of our primary green. I'll provide all 14 values - create a custom palette with these explicit shades."

The AI will use `create_custom_palette` with `mode: "explicit"`.

### Scenario 4: Typography Only

> "I just need to change the font to Inter for my existing Material theme"

The AI will use `create_typography` to generate only the typography setup.

### Scenario 5: Platform Detection

> "Check my project and tell me which Ignite UI platform I'm using, then create an appropriate theme"

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
- Your project has `igniteui-angular`, `igniteui-webcomponents`, `igniteui-react`, or `Ignite UI for Blazor` in dependencies

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
