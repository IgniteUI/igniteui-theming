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

export const BLAZOR_PLATFORM = {
  id: 'blazor',
  name: 'Ignite UI for Blazor',
  packageName: 'IgniteUI.Blazor',

  /**
   * The Sass module to import for theming
   * Note: Blazor projects need to install igniteui-theming via npm
   * even though the main package is NuGet-based
   */
  themingModule: 'igniteui-theming',

  /**
   * Detection patterns - Blazor uses NuGet packages, not npm
   * Detection is done via .csproj file analysis
   */
  detectionPatterns: ['IgniteUI.Blazor'],

  /**
   * Config files that indicate a Blazor project
   * .csproj files with IgniteUI.Blazor package reference
   */
  configFiles: ['.csproj'],

  /**
   * No required root class (themes apply via CSS variables on :root)
   */
  rootClass: null,
} as const;

/**
 * Example usage documentation for Blazor
 */
export const BLAZOR_USAGE_EXAMPLES = {
  basic: `
// Basic Material Light Theme for Blazor
// In your wwwroot/css/theme.scss file:

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

  customPalette: `
// Custom Palette Theme
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
// Dark Indigo Theme for Blazor
@use 'igniteui-theming' as *;
@use 'igniteui-theming/sass/color/presets/dark/indigo' as *;
@use 'igniteui-theming/sass/typography/presets/indigo' as *;
@use 'igniteui-theming/sass/elevations/presets' as *;

:root {
  --ig-theme: indigo;
  --ig-theme-variant: dark;
  --ig-size-small: 1;
  --ig-size-medium: 2;
  --ig-size-large: 3;
}

@include palette($dark-indigo-palette);
@include elevations($indigo-elevations);
@include typography(
  $font-family: $indigo-typeface,
  $type-scale: $indigo-type-scale
);
@include spacing();
`,
} as const;

/**
 * Note: Blazor uses the same Sass code generation as Web Components/React.
 * The generateWebComponentsThemeSass function from webcomponents.ts can be reused for Blazor.
 * The main difference is in the build pipeline (npm + sass CLI vs Angular CLI).
 */
