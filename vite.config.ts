import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {chmodSync, existsSync} from 'node:fs';
import dts from 'vite-plugin-dts';
import type {Plugin} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Plugin to set executable permissions on the MCP server entry point.
 * Replaces: node -e "require('fs').chmodSync('dist/mcp/index.js', '755')"
 */
function chmodPlugin(): Plugin {
  return {
    name: 'chmod-executable',
    closeBundle() {
      const indexPath = resolve(__dirname, 'dist/mcp/index.js');

      if (existsSync(indexPath)) {
        chmodSync(indexPath, '755');
        console.log('✓ Set executable permissions on dist/mcp/index.js');
      }
    },
  };
}

export default defineConfig({
  plugins: [
    dts({
      include: ['src/mcp/**/*'],
      exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
      copyDtsFiles: true, // Copy .d.ts files to preserve structure
    }),
    chmodPlugin(),
  ],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/mcp/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },

    outDir: 'dist/mcp',
    emptyOutDir: true,

    rollupOptions: {
      // Externalize dependencies (don't bundle them)
      // They will be resolved from node_modules at runtime
      external: [
        // Runtime dependencies (from package.json dependencies)
        '@modelcontextprotocol/sdk',
        '@modelcontextprotocol/sdk/server/mcp.js',
        '@modelcontextprotocol/sdk/server/stdio.js',
        'sass-embedded', // Contains native binaries - MUST be external
        'zod', // Runtime validation - MUST be external

        // Node.js built-ins
        /^node:.*/,
        'fs',
        'path',
        'url',
        'child_process',
      ],

      output: {
        // Preserve file structure instead of bundling
        preserveModules: true,
        preserveModulesRoot: 'src/mcp',
        entryFileNames: '[name].js',

        // ES modules format
        format: 'es',
      },
    },

    target: 'node18',
    minify: false, // Keep code readable for debugging
  },

  resolve: {
    extensions: ['.ts', '.js', '.json', '.md'],
  },

  // Ensure markdown files are treated as assets for ?raw imports
  assetsInclude: ['**/*.md'],
});
