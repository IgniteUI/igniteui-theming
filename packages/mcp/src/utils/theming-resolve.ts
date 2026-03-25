/**
 * Theming package resolution utilities.
 *
 * Provides a Sass FileImporter that resolves `@use 'igniteui-theming/sass/...'`
 * to the theming package's sass/ directory.
 *
 * Resolution strategy:
 * - Dev/test mode: resolves the `igniteui-theming` package via Node module resolution
 *   (workspace symlink in a monorepo).
 * - Built mode (dist/mcp/utils/): falls back to relative __dirname traversal
 *   since the built MCP lives inside the theming package and can't resolve itself.
 */

import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { FileImporter } from "sass-embedded";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THEMING_SASS_PREFIX = "igniteui-theming/sass/";

/**
 * Resolves the root directory of the igniteui-theming package.
 */
function resolveThemingRoot(): string {
  try {
    const require = createRequire(import.meta.url);
    return path.dirname(require.resolve("igniteui-theming/package.json"));
  } catch {
    // Built context: this file is at dist/mcp/utils/theming-resolve.js
    // Go up 3 levels to reach the theming package root.
    return path.resolve(__dirname, "..", "..", "..");
  }
}

/**
 * Root directory of the igniteui-theming package.
 */
export const THEMING_ROOT = resolveThemingRoot();

/**
 * Sass FileImporter that resolves `@use 'igniteui-theming/sass/...'`
 * to the theming package's `sass/` directory.
 *
 * @example
 * ```ts
 * import { themingImporter } from './theming-resolve.js';
 *
 * const result = await sass.compileStringAsync(code, {
 *   importers: [themingImporter],
 * });
 * ```
 */
export const themingImporter: FileImporter = {
  findFileUrl(url: string) {
    if (url === "igniteui-theming/sass") {
      // Bare import: @use 'igniteui-theming/sass' as *;
      // Resolve to the sass/ directory index
      return new URL(`file://${path.join(THEMING_ROOT, "sass")}/`);
    }
    if (url.startsWith(THEMING_SASS_PREFIX)) {
      const subpath = url.slice(THEMING_SASS_PREFIX.length);
      return new URL(subpath, `file://${path.join(THEMING_ROOT, "sass")}/`);
    }
    return null;
  },
};
