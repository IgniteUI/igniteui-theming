# MCP Server Usage Examples

This document shows example outputs from the IgniteUI Theming MCP Server tools.

## Example 1: Generate Material Light Color Palette

**Tool:** `generate_color_palette`
**Arguments:**
```json
{
  "theme": "material",
  "variant": "light"
}
```

**Output:** CSS file with color palette variables for all color shades (primary, secondary, gray, surface, info, success, warn, error) from 50 to 900, plus A100-A700 shades.

## Example 2: Generate Bootstrap Typography

**Tool:** `generate_typography`
**Arguments:**
```json
{
  "theme": "bootstrap"
}
```

**Output:** CSS file with typography variables and utility classes for all type scales (h1-h6, subtitle-1, subtitle-2, body-1, body-2, button, caption, overline).

## Example 3: Generate Material Elevations

**Tool:** `generate_elevations`
**Arguments:**
```json
{
  "theme": "material"
}
```

**Output:** CSS file with elevation (box-shadow) variables and utility classes for levels 0-24.

## Example 4: Generate Sizing and Spacing Utilities

**Tool:** `generate_sizing_spacing`
**Arguments:**
```json
{}
```

**Output:** CSS file with sizing and spacing variables and utility classes (small, medium, large sizes; compact, cosy, comfortable spacing).

## Example 5: Generate Complete Fluent Dark Theme

**Tool:** `generate_complete_theme`
**Arguments:**
```json
{
  "theme": "fluent",
  "variant": "dark"
}
```

**Output:** Complete CSS theme file combining all the above components for the Fluent dark theme.

## Integration with Design Tools

The MCP server enables seamless integration with design tools:

1. **From Figma**: Export design tokens → Use MCP to generate matching CSS
2. **From Sketch**: Extract color palette → Generate CSS variables
3. **From Adobe XD**: Get typography specs → Create utility classes

## Use Cases

### Use Case 1: Multi-Brand Application

Generate different theme variants for different brands:

```javascript
// Brand A - Material Light
generate_complete_theme({ theme: "material", variant: "light" })

// Brand B - Fluent Dark  
generate_complete_theme({ theme: "fluent", variant: "dark" })
```

### Use Case 2: Light/Dark Mode Toggle

Generate both variants of the same theme:

```javascript
// Light mode CSS
generate_color_palette({ theme: "bootstrap", variant: "light" })

// Dark mode CSS
generate_color_palette({ theme: "bootstrap", variant: "dark" })
```

### Use Case 3: Component Library Styling

Generate specific utilities for a component library:

```javascript
// Typography utilities
generate_typography({ theme: "material" })

// Elevation utilities
generate_elevations({ theme: "material" })

// Spacing utilities
generate_sizing_spacing({})
```

## Tips

1. **Consistency**: Use the same theme across all tools for consistency
2. **Customization**: Generated CSS uses CSS variables, making it easy to customize
3. **Performance**: Generate CSS once, reuse across multiple projects
4. **Maintenance**: Update theme by regenerating CSS when design system changes
