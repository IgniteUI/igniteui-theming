/**
 * Ignite UI for React Platform Knowledge
 *
 * This module contains platform-specific information for generating
 * valid Sass theme code for Ignite UI for React applications.
 *
 * Key characteristics:
 * - Uses `igniteui-theming` directly (same as Web Components)
 * - No `core()` or `theme()` mixins - uses individual mixins: `palette()`, `typography()`, `elevations()`
 * - Commonly used with Vite, Next.js, or Create React App
 * - Components use CSS variables for theming (--ig-* naming convention)
 * - Theming approach is identical to Web Components
 */

import { generateWCThemeExample } from "./webcomponents.js";

export const REACT_PLATFORM = {
  id: "react",
  name: "Ignite UI for React",
  packageName: "igniteui-react",

  /**
   * The Sass module to import for theming
   */
  themingModule: "igniteui-theming",

  /**
   * Detection patterns in package.json dependencies
   */
  detectionPatterns: ["igniteui-react", "@infragistics/igniteui-react"],

  /**
   * Config files that indicate a React project
   */
  configFiles: [
    "vite.config.ts",
    "vite.config.js",
    "next.config.js",
    "next.config.mjs",
  ],

  /**
   * No required root class (themes apply via CSS variables on :root)
   */
  rootClass: null,
} as const;

/**
 * Example usage documentation for React
 */
export const REACT_USAGE_EXAMPLES = {
  get basic() {
    return generateWCThemeExample(
      [
        "Basic Material Light Theme for React (Vite)",
        "In your styles.scss or theme.scss file:",
      ],
      { designSystem: "material", variant: "light" },
    );
  },

  viteConfig: `
// vite.config.ts - Sass configuration for Ignite UI theming
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Add node_modules to load paths for @use statements
        loadPaths: ['node_modules'],
      },
    },
  },
});
`,

  nextjsConfig: `
// next.config.js - Sass configuration for Next.js
const path = require('path');

module.exports = {
  sassOptions: {
    loadPaths: [path.join(__dirname, 'node_modules')],
  },
};
`,

  get customPalette() {
    return generateWCThemeExample(
      [
        "Custom Palette Theme for React",
        "In your styles.scss or theme.scss file:",
      ],
      {
        designSystem: "material",
        variant: "light",
        primaryColor: "#2ab759",
        secondaryColor: "#f96a88",
        surfaceColor: "#ffffff",
      },
    );
  },

  get darkTheme() {
    return generateWCThemeExample(
      [
        "Dark Indigo Theme for React",
        "In your styles.scss or theme.scss file:",
      ],
      { designSystem: "indigo", variant: "dark" },
    );
  },
} as const;

/**
 * Note: React uses the same Sass code generation as Web Components.
 * The generateWebComponentsThemeSass function from webcomponents.ts can be reused for React.
 * The only difference is in how the Sass files are imported and bundled (Vite vs Angular CLI).
 */
