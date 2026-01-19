/**
 * Handler for create_custom_palette tool.
 */

import {generateCustomPaletteCode, generateUseStatement, toVariableName, generateHeader} from '../../utils/sass.js';
import {generateCustomPaletteCss, formatCssOutput} from '../../generators/css.js';
import {PALETTE_PRESETS, type PalettePresetName} from '../../knowledge/palettes.js';
import {validateCustomPalette, formatCustomPaletteValidation} from '../../validators/index.js';
import type {CreateCustomPaletteParams} from '../schemas.js';
import type {ShadesBasedColor, ColorDefinition, GrayDefinition} from '../../utils/types.js';

export async function handleCreateCustomPalette(params: CreateCustomPaletteParams) {
  const variant = params.variant ?? 'light';
  const designSystem = params.designSystem ?? 'material';
  const output = params.output ?? 'sass';
  const presetName = `${variant}-${designSystem}-palette` as PalettePresetName;
  const preset = PALETTE_PRESETS[presetName];

  // Determine surface color for gray generation
  // If surface is explicit, extract a representative color (500 shade)
  // If surface is shades-based, use the baseColor
  let surfaceColorForGray: string;
  if (params.surface.mode === 'shades') {
    surfaceColorForGray = params.surface.baseColor;
  } else {
    surfaceColorForGray = params.surface.shades['500'];
  }

  // Fill in missing colors with defaults from preset (using shades mode)
  // Cast to our internal types since Zod schema generates slightly different types
  const colors: {
    primary: ColorDefinition;
    secondary: ColorDefinition;
    surface: ColorDefinition;
    gray: GrayDefinition;
    info: ColorDefinition;
    success: ColorDefinition;
    warn: ColorDefinition;
    error: ColorDefinition;
  } = {
    primary: params.primary as ColorDefinition,
    secondary: params.secondary as ColorDefinition,
    surface: params.surface as ColorDefinition,
    gray: (params.gray as GrayDefinition) ?? ({mode: 'shades', baseColor: preset.gray} as ShadesBasedColor),
    info: (params.info as ColorDefinition) ?? ({mode: 'shades', baseColor: preset.info} as ShadesBasedColor),
    success: (params.success as ColorDefinition) ?? ({mode: 'shades', baseColor: preset.success} as ShadesBasedColor),
    warn: (params.warn as ColorDefinition) ?? ({mode: 'shades', baseColor: preset.warn} as ShadesBasedColor),
    error: (params.error as ColorDefinition) ?? ({mode: 'shades', baseColor: preset.error} as ShadesBasedColor),
  };

  // Validate the custom palette structure (passing variant for gray progression validation)
  const validation = await validateCustomPalette(
    {
      platform: params.platform,
      variant,
      designSystem,
      name: params.name,
      primary: colors.primary,
      secondary: colors.secondary,
      surface: colors.surface,
      gray: colors.gray,
      info: colors.info,
      success: colors.success,
      warn: colors.warn,
      error: colors.error,
    },
    variant,
  );

  if (!validation.isValid) {
    const errorText = formatCustomPaletteValidation(validation);
    return {
      content: [
        {
          type: 'text' as const,
          text: `**Validation Failed**\n\n${errorText}\n\nPlease fix the errors and try again.`,
        },
      ],
    };
  }

  // Branch based on output format
  if (output === 'css') {
    return handleCssOutput(params, variant, designSystem, surfaceColorForGray, colors, validation);
  }

  return handleSassOutput(params, variant, designSystem, surfaceColorForGray, colors, validation);
}

/**
 * Handle CSS output format - generates CSS custom properties directly.
 */
async function handleCssOutput(
  params: CreateCustomPaletteParams,
  variant: string,
  designSystem: string,
  surfaceColorForGray: string,
  colors: {
    primary: ColorDefinition;
    secondary: ColorDefinition;
    surface: ColorDefinition;
    gray: GrayDefinition;
    info: ColorDefinition;
    success: ColorDefinition;
    warn: ColorDefinition;
    error: ColorDefinition;
  },
  validation: Awaited<ReturnType<typeof validateCustomPalette>>,
) {
  try {
    const result = await generateCustomPaletteCss({
      variant: params.variant,
      surfaceColor: surfaceColorForGray,
      colors,
    });

    const formattedCss = formatCssOutput(result.css, result.description);

    // Build response
    const responseParts: string[] = [`**Custom Palette Generated (CSS)**`];
    responseParts.push('');
    responseParts.push(
      `Created CSS custom properties for a custom ${variant} color palette based on ${designSystem} defaults.`,
    );
    responseParts.push('');
    responseParts.push('Output format: CSS custom properties');

    // Show which colors use which mode
    const shadesMode = Object.entries(colors)
      .filter(([_, def]) => def.mode === 'shades')
      .map(([name]) => name);
    const explicitMode = Object.entries(colors)
      .filter(([_, def]) => def.mode === 'explicit')
      .map(([name]) => name);

    responseParts.push('');
    if (shadesMode.length > 0) {
      responseParts.push(`**Using shades() function:** ${shadesMode.join(', ')}`);
    }
    if (explicitMode.length > 0) {
      responseParts.push(`**Using explicit shades:** ${explicitMode.join(', ')}`);
    }

    // Add warnings if any
    if (validation.warnings.length > 0) {
      responseParts.push('');
      responseParts.push(formatCustomPaletteValidation(validation));
    }

    responseParts.push('');
    responseParts.push('```css');
    responseParts.push(formattedCss.trimEnd());
    responseParts.push('```');

    return {
      content: [
        {
          type: 'text' as const,
          text: responseParts.join('\n'),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: `**Error generating CSS palette**\n\n${message}`,
        },
      ],
    };
  }
}

/**
 * Handle Sass output format - generates Sass code with palette map structure.
 */
function handleSassOutput(
  params: CreateCustomPaletteParams,
  variant: string,
  designSystem: string,
  surfaceColorForGray: string,
  colors: {
    primary: ColorDefinition;
    secondary: ColorDefinition;
    surface: ColorDefinition;
    gray: GrayDefinition;
    info: ColorDefinition;
    success: ColorDefinition;
    warn: ColorDefinition;
    error: ColorDefinition;
  },
  validation: Awaited<ReturnType<typeof validateCustomPalette>>,
) {
  // Generate the Sass code
  const paletteName = params.name ? toVariableName(params.name) : `custom-${variant}`;
  const paletteLines = generateCustomPaletteCode({
    platform: params.platform,
    variant: params.variant,
    variableName: paletteName,
    surfaceColor: surfaceColorForGray,
    colors,
  });

  const varName = `$${paletteName}-palette`;

  const code = `${generateHeader(`Custom ${variant} palette with explicit shade control`)}
${generateUseStatement(params.platform)}

${paletteLines.join('\n')}

// Apply the palette (generates CSS custom properties)
@include palette(${varName});
`;

  // Build response
  const responseParts: string[] = [`**Custom Palette Generated**`];
  responseParts.push('');
  responseParts.push(`Created a custom ${variant} color palette based on ${designSystem} defaults.`);

  // Add platform hint
  const platformNote = params.platform
    ? `Platform: ${params.platform === 'angular' ? 'Ignite UI for Angular' : 'Ignite UI for Web Components'}`
    : 'Platform: Not specified (generic output). Specify `platform` for optimized code.';
  responseParts.push('');
  responseParts.push(platformNote);

  // Show which colors use which mode
  const shadesMode = Object.entries(colors)
    .filter(([_, def]) => def.mode === 'shades')
    .map(([name]) => name);
  const explicitMode = Object.entries(colors)
    .filter(([_, def]) => def.mode === 'explicit')
    .map(([name]) => name);

  responseParts.push('');
  if (shadesMode.length > 0) {
    responseParts.push(`**Using shades() function:** ${shadesMode.join(', ')}`);
  }
  if (explicitMode.length > 0) {
    responseParts.push(`**Using explicit shades:** ${explicitMode.join(', ')}`);
  }

  responseParts.push('');
  responseParts.push(`**Variable:** \`${varName}\``);

  // Add warnings if any
  if (validation.warnings.length > 0) {
    responseParts.push('');
    responseParts.push(formatCustomPaletteValidation(validation));
  }

  responseParts.push('');
  responseParts.push('```scss');
  responseParts.push(code.trimEnd());
  responseParts.push('```');

  return {
    content: [
      {
        type: 'text' as const,
        text: responseParts.join('\n'),
      },
    ],
  };
}
