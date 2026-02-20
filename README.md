<h1 align="center">
  Ignite UI Theming - from Infragistics 
</h1>

[![npm version](https://badge.fury.io/js/igniteui-theming.svg)](https://badge.fury.io/js/igniteui-theming)

The Ignite UI Theming repository collects a set of Sass mixins, functions, and variables used to create themes for a variety of UI frameworks built by Infragistics. The theming package makes it super easy to create palettes, elevations and typography styles for your projects.

## Palettes

We provide four predefined palettes - material, bootstrap, fluent and indigo that have all the necessary colors along with diffent variants of those colors to make it even easier picking the right one for your case. Here's what they look like:

![Palettes](https://user-images.githubusercontent.com/45598235/189592212-0d58b08d-3c98-4f27-8ec3-c6f674c9942b.png)

To access any of the colors in the palettes, you can use the `color` function:

```scss
background: color($light-material-palette, 'primary', 500);
```

You can take a further look on what color functions and mixins the package contains and how to use them in the [Colors Wiki Page](<https://github.com/IgniteUI/igniteui-theming/wiki/Colors-(Draft)>)

## Typography

Another valuable module of our theming package is the typography, helping you have consistency all over your project. There are again four typography presets for the four themes that we provide out of the box.

![Typography](https://user-images.githubusercontent.com/45598235/189596034-d8697bc1-e683-4d4a-a113-96e17fc90d4b.png)

You can set any of the typefaces by using the `typography` mixin, which accepts 2 arguments(font-family and type-scale). By default the typography is using the material typeface and type-scale.

```scss
@include typography($font-family: $material-typeface, $type-scale: $material-type-scale);
```

Learn more about the typography module in the package by checking out the [Typography Wiki Page](<https://github.com/IgniteUI/igniteui-theming/wiki/Typography-(Draft)>)

## Elevations

The theming package is providing one preset of shadows that can be used to give your components a lift. They're super helpful using with buttons, cards, navigation bars, etc.

![Elevations](https://user-images.githubusercontent.com/45598235/189627744-1fa47d35-6b3b-4b7a-b26e-5b46fe4311a4.png)

You can set elevations 0-24, by using the `elevation` function, which accepts the elevation level as an argument:

```scss
box-shadow: elevation(12);
```

Learn more about elevations and their abilities in the [Elevations Wiki Page](<https://github.com/IgniteUI/igniteui-theming/wiki/Elevations-(draft)>)

## Usage

In order to use the Ignite UI Theming in your application you should install the `igniteui-theming` package:

```
npm install igniteui-theming
```

Next, you will need to **use** it in the file that you want like this:

```scss
@use '.../node_modules/igniteui-theming/' as *;
```

You can also **use** just a fraction of the package:

```scss
@use '.../node_modules/igniteui-theming/sass/color' as *;
```

We provide presets for **material, bootstrap, fluent and indigo** themes for the color(light and dark palettes), typography and elevations fractions. You can import them into your scss file like this:

```scss
@use '.../node_modules/igniteui-theming/sass/typography/presets' as *;
```

You can read more about what the package contains on the [Wiki page](https://github.com/IgniteUI/igniteui-theming/wiki)

## Linting and Testing

To scan the project for linting errors, run

```
npm run lint
```

To run the suite of tests, run

```
npm run test
```

## Building and Running API Docs

To build the docs, run

```
npm run build:docs
```

To start the docs in your browser, run

```
npm run serve:docs
```

## Testing and Debugging

### Preview Palettes

To preview a palette you can pass the palette (`material`, `bootstrap`, `fluent`, `indigo`) and variant (`light` or `dark`) to the `palette` and `variant` arguments respectively. If you want to output the result to a file in the `./dist` folder add the `out` option.

```
npm run preview:palette -- --palette=material --variant=light --out
```

---

## MCP Server (AI-Assisted Theming)

The Ignite UI Theming package includes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that enables AI assistants to generate production-ready theming code for your Ignite UI applications.

### What is MCP?

The Model Context Protocol allows AI assistants (like Claude, GitHub Copilot, and others) to connect to external tools and data sources. The Ignite UI Theming MCP server acts as an expert theming assistant that can:

- 🎨 **Generate color palettes** with automatic shade variations
- 📝 **Create typography systems** following design standards
- 🌓 **Build complete themes** for light and dark modes
- 🎯 **Customize components** with design tokens
- ✅ **Validate colors** for accessibility compliance

### Quick Start

#### 1. Clone and Build

Clone the repository and build the MCP server:

```bash
npm install
npm run build:mcp
```

#### 2. Configure Your AI Client

The MCP server works with any MCP-compatible client. Here are setup instructions for popular clients:

<details>
<summary><strong>VS Code</strong> (with MCP-compatible extensions)</summary>

**For local development** - Create or edit `.vscode/mcp.json`:

```json
{
  "servers": {
    "igniteui-theming": {
      "command": "node",
      "args": ["/absolute/path/to/igniteui-theming/dist/mcp/index.js"]
    }
  }
}
```

**Using published package**:

```json
{
  "servers": {
    "igniteui-theming": {
      "command": "npx",
      "args": ["-y", "igniteui-theming", "igniteui-theming-mcp"]
    }
  }
}
```

</details>

<details>
<summary><strong>WebStorm / JetBrains IDEs</strong></summary>

1. Go to **Settings → Tools → AI Assistant → MCP Servers**
2. Click **+ Add MCP Server**
3. Configure:
   - **Name**: `igniteui-theming`
   - **Command**: `node` (for local) or `npx` (for package)
   - **Arguments**:
     - Local: `/absolute/path/to/igniteui-theming/dist/mcp/index.js`
     - Package: `igniteui-theming igniteui-theming-mcp`
4. Click **OK** and restart AI Assistant

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to your configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**For local development**:

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

**Using published package**:

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "npx",
      "args": ["-y", "igniteui-theming", "igniteui-theming-mcp"]
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Create or edit `.cursor/mcp.json` in your project:

**For local development**:

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

**Using published package**:

```json
{
  "mcpServers": {
    "igniteui-theming": {
      "command": "npx",
      "args": ["-y", "igniteui-theming", "igniteui-theming-mcp"]
    }
  }
}
```

</details>

### What Can It Do?

#### 🎨 Create Complete Themes

Simply describe your theme to your AI assistant:

> "Create a Material Design dark theme for my Angular app with that takes inspiration from the Gruvbox color scheme."

The AI will generate production-ready Sass code with:

- Color palette with all shade variations
- Typography setup with proper type scales
- Elevation shadows
- Platform-specific imports and configuration

#### 🌈 Generate Color Palettes

> "Generate a light theme palette using teal as primary and purple as secondary"

Get perfectly calculated color shades following design system standards.

#### 📝 Setup Typography

> "Set up typography using Inter font with Material Design type scale for Web Components"

Get proper typography configuration with font families and responsive type scales.

#### 🎯 Customize Components

> "What design tokens are available for the button component?"
>
> "Create a flat button theme with purple background and white text"

Discover and customize individual component styles using design tokens.

### Available Capabilities

The MCP server provides **8 tools** and **16 resources**:

#### Tools (Actions)

| Tool                          | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `detect_platform`             | Auto-detect which Ignite UI platform your project uses          |
| `create_palette`              | Generate color palette with automatic shade calculations        |
| `create_custom_palette`       | Create palette with fine-grained control over individual shades |
| `create_typography`           | Setup typography with font families and type scales             |
| `create_elevations`           | Configure elevation shadows                                     |
| `create_theme`                | Generate complete theme (palette + typography + elevations)     |
| `get_component_design_tokens` | Discover customizable properties for components                 |
| `create_component_theme`      | Generate component-specific theme code                          |

#### Resources (Reference Data)

- **Platform Information**: Configuration for Angular, Web Components, React, and Blazor
- **Preset Libraries**: Pre-built palettes, typography, and elevation sets
- **Color Guidance**: Best practices for color selection and usage
- **Design System Schemas**: Material, Bootstrap, Fluent, and Indigo configurations

### Supported Platforms

- **Angular** - `igniteui-angular`
- **Web Components** - `igniteui-webcomponents`
- **React** - `igniteui-react`
- **Blazor** - `igniteui-blazor`

### Example Interactions

<details>
<summary><strong>Creating a new project theme</strong></summary>

**You**: "I'm starting a new Angular project with Ignite UI. Create a complete Material Design theme with primary blue, secondary coral, light theme, and Roboto font"

**AI**: _Uses `create_theme` tool and generates complete Sass code ready to use_

</details>

<details>
<summary><strong>Adding dark mode</strong></summary>

**You**: "I need a dark mode version with the same primary blue but dark surface"

**AI**: _Uses `create_theme` with `variant: "dark"` and generates dark theme code_

</details>

<details>
<summary><strong>Customizing components</strong></summary>

**You**: "What properties can I customize on the card component?"

**AI**: _Uses `get_component_design_tokens` to show available tokens_

**You**: "Make the card have a light gray background with subtle shadow"

**AI**: _Uses `create_component_theme` to generate component theme code_

</details>

### Full Documentation

For detailed documentation including:

- Complete tool parameter reference
- All prompt examples
- Platform-specific differences
- Troubleshooting guide
- Development instructions

See the [MCP Server README](./src/mcp/README.md)

### Development Scripts

```bash
# Build for production
npm run build:mcp

# Debug with MCP Inspector
npm run mcp:inspector

# Run tests
npm run test
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
