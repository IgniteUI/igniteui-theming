/**
 * Ignite UI for Blazor Platform Knowledge
 *
 * This module contains platform-specific information for generating
 * valid Sass theme code for Ignite UI for Blazor applications.
 *
 * Key characteristics:
 * - .NET/C# project using Blazor framework (Server or WebAssembly)
 * - Uses NuGet package `IgniteUI.Blazor` (not npm)
 * - Uses `igniteui-theming` npm package for Sass compilation
 * - Sass files are compiled to CSS and referenced in Blazor components
 * - Components use CSS variables for theming (--ig-* naming convention)
 * - Theming approach is similar to Web Components/React
 */

import { generateWCThemeExample } from "./webcomponents.js";

export const BLAZOR_PLATFORM = {
  id: "blazor",
  name: "Ignite UI for Blazor",
  packageName: "IgniteUI.Blazor",

  /**
   * The Sass module to import for theming
   * Note: Blazor projects need to install igniteui-theming via npm
   * even though the main package is NuGet-based
   */
  themingModule: "igniteui-theming",

  /**
   * Detection patterns - Blazor uses NuGet packages, not npm
   * Detection is done via .csproj file analysis
   */
  detectionPatterns: ["IgniteUI.Blazor"],

  /**
   * Config files that indicate a Blazor project
   * .csproj files with IgniteUI.Blazor package reference
   */
  configFiles: [".csproj"],

  /**
   * No required root class (themes apply via CSS variables on :root)
   */
  rootClass: null,
} as const;

/**
 * Example usage documentation for Blazor
 */
export const BLAZOR_USAGE_EXAMPLES = {
  get basic() {
    return generateWCThemeExample(
      [
        "Basic Material Light Theme for Blazor",
        "In your wwwroot/css/theme.scss file:",
      ],
      { designSystem: "material", variant: "light" },
    );
  },

  projectSetup: `
// Blazor project setup for custom theming:

// 1. Install NuGet package in your .csproj:
<PackageReference Include="IgniteUI.Blazor" Version="*" />

// 2. Install npm packages for Sass theming:
npm init -y
npm install igniteui-theming sass

// 3. Create theme file (wwwroot/css/theme.scss)

// 4. Add npm script to package.json:
{
  "scripts": {
    "build:theme": "sass wwwroot/css/theme.scss wwwroot/css/theme.css"
  }
}

// 5. Reference compiled CSS in _Host.cshtml or index.html:
<link href="css/theme.css" rel="stylesheet" />
`,

  csprojExample: `
<!-- Example .csproj with IgniteUI.Blazor -->
<Project Sdk="Microsoft.NET.Sdk.BlazorWebAssembly">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="IgniteUI.Blazor" Version="24.1.16" />
  </ItemGroup>
</Project>
`,

  get customPalette() {
    return generateWCThemeExample(
      [
        "Custom Palette Theme for Blazor",
        "In your wwwroot/css/theme.scss file:",
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
      ["Dark Indigo Theme for Blazor", "In your wwwroot/css/theme.scss file:"],
      { designSystem: "indigo", variant: "dark" },
    );
  },
} as const;

/**
 * Note: Blazor uses the same Sass code generation as Web Components/React.
 * The generateWebComponentsThemeSass function from webcomponents.ts can be reused for Blazor.
 * The main difference is in the build pipeline (npm + sass CLI vs Angular CLI).
 */
