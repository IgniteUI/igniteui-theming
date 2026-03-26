# Ignite UI Theming Documentation

This directory contains markdown documentation served via the MCP (Model Context Protocol) server to AI assistants.

## Structure

- **`layout/`** - Sizing, spacing, and roundness system documentation
  - `overview.md` - Complete layout scale guide
  - `functions/` - Sass functions (pad, sizable, border-radius)
  - `mixins/` - Sass mixins (spacing, sizing, sizable)
  
- **`colors/`** - Color system guidance
  - `guidance.md` - Color variant rules and best practices
  - `usage.md` - Shade usage patterns and semantic roles
  - `custom-palettes.md` - Creating custom color palettes

## How Documentation Works

1. **Markdown files** contain the actual documentation content
2. **TypeScript files** import markdown using `?raw` suffix:
   ```typescript
   import OVERVIEW from './docs/layout/overview.md?raw';
   export { OVERVIEW as LAYOUT_OVERVIEW_DOC };
   ```
3. **MCP resources** serve markdown as `text/markdown` via URI protocol
4. **AI assistants** consume documentation through MCP server

## Editing Guidelines

- Use standard GitHub-flavored markdown
- Include code blocks with language tags (```scss, ```css, ```typescript)
- Keep examples concise and practical
- Test locally with: `npm run mcp:inspector`

## Adding New Documentation

1. Create markdown file in appropriate subdirectory
2. Import in corresponding TypeScript file:
   ```typescript
   import NEW_DOC from './docs/path/to/doc.md?raw';
   export { NEW_DOC };
   ```
3. Re-export in `knowledge/index.ts`
4. Register resource in `resources/presets.ts`:
   ```typescript
   {
     uri: `${RESOURCE_SCHEME}://docs/new-doc`,
     name: 'Document Title',
     description: 'Brief description',
     mimeType: 'text/markdown',
   }
   ```
5. Add handler in `RESOURCE_HANDLERS` Map:
   ```typescript
   [RESOURCE_URIS.DOCS_NEW_DOC, () => ({ 
     content: NEW_DOC, 
     mimeType: 'text/markdown' 
   })],
   ```

## Testing

```bash
# Build MCP server
npm run build:mcp

# Test with MCP inspector
npm run mcp:inspector

# Query a resource
# In inspector: theming://docs/spacing-and-sizing
```

## Notes

- Documentation is embedded at build time (not loaded dynamically)
- Changes require rebuild: `npm run build:mcp`
- Markdown is served as plain text; AI assistants handle rendering
- File structure mirrors conceptual organization for maintainability
