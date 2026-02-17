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
	basic: `
// Basic Material Light Theme for React (Vite)
// In your styles.scss or theme.scss file:

@use 'igniteui-theming/sass/color/presets/light/material' as *;
@use 'igniteui-theming' as *;
@use 'igniteui-theming/sass/typography/presets/material' as *;
@use 'igniteui-theming/sass/elevations/presets' as *;

:root {
  --ig-theme: material;
  --ig-theme-variant: light;
  --ig-size-small: 1;
  --ig-size-medium: 2;
  --ig-size-large: 3;
  --ig-scrollbar-size: #{rem(16px)};
}

@include palette($palette);
@include elevations($material-elevations);
@include typography(
  $font-family: $typeface,
  $type-scale: $type-scale
);
@include spacing();
`,

	viteConfig: `
// vite.config.ts - Sass configuration for Ignite UI theming
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Add node_modules to include paths for @use statements
        includePaths: ['node_modules'],
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
    includePaths: [path.join(__dirname, 'node_modules')],
  },
};
`,

	customPalette: `
// Custom Palette Theme for React
@use 'igniteui-theming' as *;
@use 'igniteui-theming/sass/typography/presets/material' as *;
@use 'igniteui-theming/sass/elevations/presets' as *;

$my-palette: palette(
  $primary: #2ab759,
  $secondary: #f96a88,
  $surface: #ffffff
);

:root {
  --ig-theme: material;
  --ig-theme-variant: light;
  --ig-size-small: 1;
  --ig-size-medium: 2;
  --ig-size-large: 3;
}

@include palette($my-palette);
@include elevations($material-elevations);
@include typography(
  $font-family: $typeface,
  $type-scale: $type-scale
);
@include spacing();
`,

	darkTheme: `
// Dark Indigo Theme for React
@use 'igniteui-theming' as *;
@use 'igniteui-theming/sass/typography/presets/indigo' as *;
@use 'igniteui-theming/sass/elevations/presets' as *;

:root {
  --ig-theme: indigo;
  --ig-theme-variant: dark;
  --ig-size-small: 1;
  --ig-size-medium: 2;
  --ig-size-large: 3;
}

@include palette($palette);
@include elevations($indigo-elevations);
@include typography(
  $font-family: $typeface,
  $type-scale: $type-scale
);
@include spacing();
`,
} as const;

/**
 * Note: React uses the same Sass code generation as Web Components.
 * The generateWebComponentsThemeSass function from webcomponents.ts can be reused for React.
 * The only difference is in how the Sass files are imported and bundled (Vite vs Angular CLI).
 */
