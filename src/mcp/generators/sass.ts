/**
 * Sass code generator for Ignite UI Theming.
 * Generates valid Sass code that uses the igniteui-theming library.
 *
 * Supported platforms:
 * - Angular: Uses `igniteui-angular/theming` with `core()` and `theme()` mixins
 * - Web Components: Uses `igniteui-theming` directly with individual mixins
 * - Blazor: Uses `igniteui-theming` directly with individual mixins
 * - React: Uses `igniteui-theming` directly with individual mixins
 */

import type {
  CreatePaletteInput,
  CreateTypographyInput,
  CreateElevationsInput,
  CreateThemeInput,
  GeneratedCode,
  DesignSystem,
  ThemeVariant,
  Platform,
} from '../utils/types.js';
import {quoteFontFamily, generateUseStatement, toVariableName, generateHeader} from '../utils/sass.js';
import {
  TYPOGRAPHY_PRESETS,
  generateAngularThemeSass,
  generateWebComponentsThemeSass,
  getComponentTheme,
} from '../knowledge/index.js';

// Re-export utilities for external use
export {
  quoteFontFamily,
  generateUseStatement,
  generatePaletteCode,
  generateTypographyCode,
  generateElevationsCode,
  toVariableName,
  generateHeader,
} from '../utils/sass.js';
export type {
  PaletteCodeOptions,
  PaletteCodeResult,
  TypographyCodeOptions,
  ElevationsCodeOptions,
} from '../utils/sass.js';

/**
 * Generate a palette definition.
 */
export function generatePalette(input: CreatePaletteInput): GeneratedCode {
  const variant = input.variant ?? 'light';
  const name = input.name ? toVariableName(input.name) : `custom-${variant}`;
  const varName = `$${name}-palette`;

  // Primary, secondary, and surface are required by the Sass palette() function
  const paletteArgs: string[] = [
    `$primary: ${input.primary}`,
    `$secondary: ${input.secondary}`,
    `$surface: ${input.surface}`,
  ];

  // Optional colors
  if (input.gray) paletteArgs.push(`$gray: ${input.gray}`);
  if (input.info) paletteArgs.push(`$info: ${input.info}`);
  if (input.success) paletteArgs.push(`$success: ${input.success}`);
  if (input.warn) paletteArgs.push(`$warn: ${input.warn}`);
  if (input.error) paletteArgs.push(`$error: ${input.error}`);

  const code = `${generateHeader(`${variant} palette with primary color ${input.primary}`)}
${generateUseStatement(input.platform)}

// Custom ${variant} palette
${varName}: palette(
  ${paletteArgs.join(',\n  ')}
);

// Apply the palette (generates CSS custom properties)
@include palette(${varName});
`;

  return {
    code,
    description: `Generated a ${variant} color palette with primary color ${input.primary}`,
    variables: [varName],
  };
}

/**
 * Generate typography setup.
 */
export function generateTypography(input: CreateTypographyInput): GeneratedCode {
  const designSystem: DesignSystem = input.designSystem ?? 'material';
  const typeScaleVar = `$${designSystem}-type-scale`;

  // Get the typeface from preset
  const preset = TYPOGRAPHY_PRESETS[designSystem];
  const typeface = input.fontFamily || preset.typeface;

  const code = `${generateHeader(`Typography setup using ${designSystem} type scale`)}
${generateUseStatement(input.platform)}

// Typography setup with ${designSystem} type scale
@include typography(
  $font-family: ${quoteFontFamily(typeface)},
  $type-scale: ${typeScaleVar}
);
`;

  return {
    code,
    description: `Generated typography setup using ${designSystem} design system with font family ${typeface}`,
    variables: [typeScaleVar],
  };
}

/**
 * Generate elevations setup.
 */
export function generateElevations(input: CreateElevationsInput): GeneratedCode {
  const preset = input.designSystem ?? 'material';
  const elevationsVar = `$${preset}-elevations`;

  const code = `${generateHeader(`Elevations setup using ${preset} preset`)}
${generateUseStatement(input.platform)}

// Elevations setup with ${preset} shadows
@include elevations(${elevationsVar});
`;

  return {
    code,
    description: `Generated elevations setup using ${preset} preset (25 elevation levels)`,
    variables: [elevationsVar],
  };
}

/**
 * Generate a complete theme (palette + typography + elevations).
 *
 * Supports two platforms:
 * - `angular`: Uses `igniteui-angular/theming` with `core()` and `theme()` mixins
 * - `webcomponents`: Uses `igniteui-theming` directly with individual mixins
 *
 * If no platform is specified, defaults to generating platform-agnostic code
 * using igniteui-theming directly (similar to webcomponents but simpler).
 */
export function generateTheme(input: CreateThemeInput): GeneratedCode {
  const platform = input.platform;
  const designSystem: DesignSystem = input.designSystem ?? 'material';
  const variant = input.variant ?? 'light';

  // Use platform-specific generators if platform is specified
  switch (platform) {
    case 'angular':
      return generateAngularTheme(input, designSystem, variant);
    case 'webcomponents':
    case 'react':
    case 'blazor':
      return generateWebComponentsTheme(input, designSystem, variant);
    default:
      return generateGenericTheme(input, designSystem, variant);
  }
}

/**
 * Generate Angular-specific theme using core() and theme() mixins.
 */
function generateAngularTheme(
  input: CreateThemeInput,
  designSystem: DesignSystem,
  variant: ThemeVariant,
): GeneratedCode {
  const code = generateAngularThemeSass({
    designSystem,
    variant,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    surfaceColor: input.surfaceColor,
    customPaletteName: input.name ? `$${toVariableName(input.name)}-palette` : undefined,
    fontFamily: input.fontFamily,
    includeTypography: input.includeTypography !== false,
  });

  const variables: string[] = [];
  if (input.name) {
    variables.push(`$${toVariableName(input.name)}-palette`);
  }
  variables.push(`$${variant}-${designSystem}-schema`);
  if (input.includeTypography !== false) {
    // If custom font family provided, we're not using the preset variable
    if (!input.fontFamily) {
      variables.push(`$${designSystem}-typeface`);
    }
    variables.push(`$${designSystem}-type-scale`);
  }

  return {
    code,
    description: `Generated Angular ${variant} theme based on ${designSystem} design system`,
    variables,
  };
}

/**
 * Generate Web Components-specific theme using individual mixins.
 */
function generateWebComponentsTheme(
  input: CreateThemeInput,
  designSystem: DesignSystem,
  variant: ThemeVariant,
): GeneratedCode {
  const code = generateWebComponentsThemeSass({
    designSystem,
    variant,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    surfaceColor: input.surfaceColor,
    customPaletteName: input.name ? `$${toVariableName(input.name)}-palette` : undefined,
    fontFamily: input.fontFamily,
    includeTypography: input.includeTypography !== false,
    includeElevations: input.includeElevations !== false,
    includeSpacing: input.includeSpacing !== false,
  });

  const variables: string[] = [];
  if (input.name) {
    variables.push(`$${toVariableName(input.name)}-palette`);
  } else {
    variables.push('$palette');
  }
  if (input.includeTypography !== false) {
    // If custom font family provided, we're not using the preset $typeface variable
    if (!input.fontFamily) {
      variables.push('$typeface');
    }
    variables.push('$type-scale');
  }
  if (input.includeElevations !== false) {
    variables.push(designSystem === 'indigo' ? '$indigo-elevations' : '$material-elevations');
  }

  return {
    code,
    description: `Generated Web Components ${variant} theme based on ${designSystem} design system`,
    variables,
  };
}

/**
 * Generate platform-agnostic theme (legacy behavior).
 * Uses igniteui-theming directly without platform-specific optimizations.
 */
function generateGenericTheme(
  input: CreateThemeInput,
  designSystem: DesignSystem,
  variant: ThemeVariant,
): GeneratedCode {
  const themeName = input.name ? toVariableName(input.name) : `${variant}-${designSystem}`;
  const paletteVar = `$${themeName}-palette`;
  const includeTypography = input.includeTypography !== false;
  const includeElevations = input.includeElevations !== false;

  const variables: string[] = [paletteVar];

  // Build palette arguments
  const paletteArgs: string[] = [`$primary: ${input.primaryColor}`];
  if (input.secondaryColor) paletteArgs.push(`$secondary: ${input.secondaryColor}`);
  if (input.surfaceColor) {
    paletteArgs.push(`$surface: ${input.surfaceColor}`);
  } else {
    paletteArgs.push(`$surface: ${variant === 'dark' ? '#222222' : 'white'}`);
  }

  // Build the code sections
  const sections: string[] = [
    generateHeader(`Complete ${variant} theme based on ${designSystem} design system`),
    '// NOTE: Specify platform ("angular" or "webcomponents") for optimized output',
    generateUseStatement(),
    '',
    `// ${themeName} palette`,
    `${paletteVar}: palette(`,
    `  ${paletteArgs.join(',\n  ')}`,
    ');',
    '',
    '// Apply the palette',
    `@include palette(${paletteVar});`,
  ];

  if (includeTypography) {
    const preset = TYPOGRAPHY_PRESETS[designSystem];
    const typeface = input.fontFamily || preset.typeface;
    const typeScaleVar = `$${designSystem}-type-scale`;
    variables.push(typeScaleVar);

    sections.push(
      '',
      '// Typography setup',
      '@include typography(',
      `  $font-family: ${quoteFontFamily(typeface)},`,
      `  $type-scale: ${typeScaleVar}`,
      ');',
    );
  }

  if (includeElevations) {
    // Use material elevations for material/bootstrap, indigo for indigo/fluent
    const elevationPreset = designSystem === 'indigo' ? 'indigo' : 'material';
    const elevationsVar = `$${elevationPreset}-elevations`;
    variables.push(elevationsVar);

    sections.push('', '// Elevations setup', `@include elevations(${elevationsVar});`);
  }

  const code = sections.join('\n') + '\n';

  return {
    code,
    description: `Generated complete ${variant} theme based on ${designSystem} design system (platform-agnostic)`,
    variables,
  };
}

// ============================================================================
// Component Theme Generator
// ============================================================================

/**
 * Input for generating a component theme.
 */
export interface CreateComponentThemeInput {
  /** Target platform */
  platform?: Platform;
  /** Component name (e.g., "flat-button", "avatar") */
  component: string;
  /** Token name-value pairs */
  tokens: Record<string, string | number>;
  /** Optional CSS selector to scope the theme */
  selector?: string;
  /** Optional custom variable name */
  name?: string;
}

/**
 * Generate Sass code for a component theme.
 */
export function generateComponentTheme(input: CreateComponentThemeInput): GeneratedCode {
  const theme = getComponentTheme(input.component);

  if (!theme) {
    throw new Error(`Unknown component: ${input.component}`);
  }

  const themeFn = theme.themeFunctionName;
  const themeName = input.name ? `$${toVariableName(input.name)}` : `$custom-${input.component}-theme`;

  // Build token arguments
  const tokenArgs: string[] = [];
  for (const [tokenName, value] of Object.entries(input.tokens)) {
    // Convert value to string if needed
    const stringValue = typeof value === 'number' ? String(value) : value;
    tokenArgs.push(`$${tokenName}: ${stringValue}`);
  }

  // Determine selector
  let selector = input.selector || ':root';

  // Generate the code
  const sections: string[] = [
    generateHeader(`Custom ${input.component} theme`),
    generateUseStatement(input.platform),
    '',
    `// Custom ${input.component} theme`,
    `${themeName}: ${themeFn}(`,
  ];

  // Add token arguments with proper indentation
  if (tokenArgs.length > 0) {
    sections.push(`  ${tokenArgs.join(',\n  ')}`);
  }
  sections.push(');');

  // Add css-vars mixin to apply the theme
  sections.push('');
  sections.push(`// Apply the theme to ${selector}`);
  sections.push(`${selector} {`);
  sections.push(`  @include css-vars(${themeName});`);
  sections.push('}');

  const code = sections.join('\n') + '\n';

  return {
    code,
    description: `Generated custom ${input.component} theme with ${Object.keys(input.tokens).length} token(s)`,
    variables: [themeName],
  };
}
