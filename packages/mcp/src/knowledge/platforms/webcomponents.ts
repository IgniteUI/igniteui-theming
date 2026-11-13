/**
 * Ignite UI for Web Components Platform Knowledge
 *
 * This module contains platform-specific information for generating
 * valid Sass theme code for Ignite UI for Web Components applications.
 *
 * Key differences from Angular:
 * - Uses `typography()` and `theme()` from the igniteui-theming theme entry point
 * - Ships precompiled CSS themes, but users can install igniteui-theming for custom Sass themes
 * - Components use ThemingController for runtime theme switching via CSS variables
 * - Generated CSS variables follow --ig-* naming convention
 */

import { generateThemeExample } from "../../utils/sass.js";

export const WEBCOMPONENTS_PLATFORM = {
  id: "webcomponents",
  name: "Ignite UI for Web Components",
  packageName: "igniteui-webcomponents",

  /**
   * The Sass module to import for theming
   */
  themingModule: "igniteui-theming",

  /**
   * Detection patterns in package.json dependencies
   */
  detectionPatterns: [
    "igniteui-webcomponents",
    "@infragistics/igniteui-webcomponents",
  ],

  /**
   * No required root class (themes apply via CSS variables on :root)
   */
  rootClass: null,
} as const;

/**
 * Example usage documentation
 */
export const WEBCOMPONENTS_USAGE_EXAMPLES = {
  get basic() {
    return generateThemeExample(
      ["Basic Material Light Theme for Web Components"],
      { designSystem: "material", variant: "light", platform: "webcomponents" },
    );
  },

  get customPalette() {
    return generateThemeExample(["Custom Palette Theme for Web Components"], {
      designSystem: "material",
      variant: "light",
      platform: "webcomponents",
      primaryColor: "#2ab759",
      secondaryColor: "#f96a88",
      surfaceColor: "#ffffff",
    });
  },

  get darkTheme() {
    return generateThemeExample(["Dark Indigo Theme for Web Components"], {
      designSystem: "indigo",
      variant: "dark",
      platform: "webcomponents",
    });
  },

  get minimalConfig() {
    return generateThemeExample(
      ["Minimal theme (no typography or elevations)"],
      {
        designSystem: "bootstrap",
        variant: "light",
        platform: "webcomponents",
        includeTypography: false,
        includeElevations: false,
      },
    );
  },
} as const;

/**
 * Runtime theme configuration for Web Components
 *
 * Web Components support runtime theme switching via the configureTheme() function
 * and CSS variables. This is different from Angular which requires Sass recompilation.
 */
export const WEBCOMPONENTS_RUNTIME_CONFIG = {
  /**
   * JavaScript API for runtime theme switching
   */
  configureThemeAPI: `
import { configureTheme } from 'igniteui-webcomponents';

// Switch to dark material theme at runtime
configureTheme('material', 'dark');

// Switch to light indigo theme
configureTheme('indigo', 'light');
`,

  /**
   * CSS variables that control the theme at runtime
   */
  runtimeVariables: ["--ig-theme", "--ig-theme-variant"],

  /**
   * Events dispatched during theme changes
   */
  themeChangeEvents: ["igc-change-theme", "igc-changed-theme"],
} as const;
