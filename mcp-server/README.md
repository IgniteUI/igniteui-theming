# IgniteUI Theming MCP Server

An MCP (Model Context Protocol) server implementation that exposes commands for generating CSS from the igniteui-theming library. This server enables developers to easily implement design system CSS as handed off from design tools like Figma and Sketch.

## Features

The MCP server provides the following tools:

### 1. `generate_color_palette`
Generate CSS color palette variables from igniteui-theming presets.

**Parameters:**
- `theme` (string): Theme name - `material`, `bootstrap`, `fluent`, or `indigo` (default: `material`)
- `variant` (string): Color variant - `light` or `dark` (default: `light`)

**Example Output:**
```css
:root {
  --ig-primary-50: #e3f2fd;
  --ig-primary-100: #bbdefb;
  --ig-primary-500: #0099ff;
  --ig-primary-500-contrast: #ffffff;
  /* ... */
}
```

### 2. `generate_typography`
Generate CSS typography definitions from igniteui-theming presets.

**Parameters:**
- `theme` (string): Theme name - `material`, `bootstrap`, `fluent`, or `indigo` (default: `material`)

**Example Output:**
```css
:root {
  --ig-font-family: 'Titillium Web', sans-serif;
  --ig-h1-font-size: 6rem;
  --ig-h1-font-weight: 300;
  --ig-h1-line-height: 7rem;
  /* ... */
}

.ig-typography-h1 {
  font-family: var(--ig-font-family);
  font-size: var(--ig-h1-font-size);
  /* ... */
}
```

### 3. `generate_elevations`
Generate CSS elevation (box-shadow) definitions from igniteui-theming presets.

**Parameters:**
- `theme` (string): Theme name - `material` or `indigo` (default: `material`)

**Example Output:**
```css
:root {
  --ig-elevation-0: none;
  --ig-elevation-1: 0 1px 3px 0 rgba(0, 0, 0, 0.26), ...;
  /* ... */
}

.ig-elevation-1 {
  box-shadow: var(--ig-elevation-1);
}
```

### 4. `generate_sizing_spacing`
Generate CSS sizing and spacing utility variables and classes.

**Parameters:** None

**Example Output:**
```css
:root {
  --ig-size-small: 1;
  --ig-size-medium: 2;
  --ig-size-large: 3;
  --ig-spacing: 1;
  /* ... */
}

.ig-size-small {
  --component-size: var(--ig-size-small);
}

.ig-spacing-compact {
  --ig-spacing: 0.5;
}
```

### 5. `generate_complete_theme`
Generate a complete CSS theme including all components.

**Parameters:**
- `theme` (string): Theme name - `material`, `bootstrap`, `fluent`, or `indigo` (default: `material`)
- `variant` (string): Color variant - `light` or `dark` (default: `light`)

**Example Output:**
Combines output from all other tools into a single comprehensive CSS file.

## Installation

```bash
cd mcp-server
npm install
```

## Usage

### As a Standalone Server

Run the MCP server:

```bash
npm start
```

Or using the binary directly:

```bash
node index.js
```

### Using the CLI

For direct command-line usage and testing:

```bash
# Generate color palette
node cli.js palette --theme=material --variant=light

# Generate typography
node cli.js typography --theme=bootstrap

# Generate elevations
node cli.js elevations --theme=material

# Generate sizing and spacing
node cli.js spacing

# Save output to file
node cli.js palette --theme=fluent --variant=dark --output=fluent-dark-palette.css
```

CLI Options:
- `--theme=<name>`: Theme name (material, bootstrap, fluent, indigo)
- `--variant=<type>`: Variant type (light, dark) - for palette only
- `--output=<file>`: Output file path (optional, prints to stdout if not specified)


### Configuration for MCP Clients

Add to your MCP client configuration (e.g., Claude Desktop, Cline):

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "node",
      "args": ["/path/to/igniteui-theming/mcp-server/index.js"]
    }
  }
}
```

Or use npx:

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "npx",
      "args": ["-y", "igniteui-theming-mcp-server"]
    }
  }
}
```

## Development

The server uses:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `sass-embedded` - Sass compilation
- `postcss` - CSS post-processing

## Use Cases

1. **Design System Implementation**: Convert Figma/Sketch design tokens into production-ready CSS
2. **Theme Generation**: Quickly generate complete themes for different brands or modes
3. **Prototyping**: Rapidly create styled prototypes using consistent design tokens
4. **CSS Variable Management**: Generate comprehensive CSS custom property definitions
5. **Multi-theme Applications**: Support light/dark modes and multiple brand themes

## Examples

### Generate Material Light Theme
```json
{
  "tool": "generate_complete_theme",
  "arguments": {
    "theme": "material",
    "variant": "light"
  }
}
```

### Generate Bootstrap Typography
```json
{
  "tool": "generate_typography",
  "arguments": {
    "theme": "bootstrap"
  }
}
```

### Generate Dark Fluent Palette
```json
{
  "tool": "generate_color_palette",
  "arguments": {
    "theme": "fluent",
    "variant": "dark"
  }
}
```

## Contributing

This MCP server is part of the igniteui-theming repository. For contributions, please see the main repository README.

## License

MIT
