/**
 * Handler for create_palette tool.
 */

import {formatCssOutput, generatePaletteCss} from '../../generators/css.js';
import {generatePalette} from '../../generators/sass.js';
import {formatValidationResult, generateWarningComments, validatePaletteColors} from '../../validators/index.js';
import type {CreatePaletteParams} from '../schemas.js';

export async function handleCreatePalette(params: CreatePaletteParams) {
  const variant = params.variant ?? 'light';
  const output = params.output ?? 'sass';

  // Validate surface and gray colors against the variant
  const validation = await validatePaletteColors({
    variant,
    surface: params.surface,
    gray: params.gray,
  });

  // Branch based on output format
  if (output === 'css') {
    return handleCssOutput(params, validation);
  }

  return handleSassOutput(params, validation);
}

/**
 * Handle CSS output format - generates CSS custom properties directly.
 */
async function handleCssOutput(
  params: CreatePaletteParams,
  validation: Awaited<ReturnType<typeof validatePaletteColors>>
) {
  try {
    const result = await generatePaletteCss({
      primary: params.primary,
      secondary: params.secondary,
      surface: params.surface,
      gray: params.gray,
      info: params.info,
      success: params.success,
      warn: params.warn,
      error: params.error,
      variant: params.variant,
    });

    const formattedCss = formatCssOutput(result.css, result.description);

    // Build response text
    const responseParts: string[] = [result.description];
    responseParts.push('');
    responseParts.push('Output format: CSS custom properties');

    // Add validation warnings and tips
    const validationText = formatValidationResult(validation);

    if (validationText) {
      responseParts.push('');
      responseParts.push(validationText);
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
 * Handle Sass output format - generates Sass code using the palette() function.
 */
function handleSassOutput(params: CreatePaletteParams, validation: Awaited<ReturnType<typeof validatePaletteColors>>) {
  // Generate the palette code
  const result = generatePalette({
    platform: params.platform,
    licensed: params.licensed,
    primary: params.primary,
    secondary: params.secondary,
    surface: params.surface,
    gray: params.gray,
    info: params.info,
    success: params.success,
    warn: params.warn,
    error: params.error,
    variant: params.variant,
    name: params.name,
  });

  // Add warning comments to the generated code if there are validation issues
  let finalCode = result.code;
  if (!validation.isValid) {
    const warningComments = generateWarningComments(validation);
    if (warningComments.length > 0) {
      // Insert warning comments after the header but before the @use statement
      const lines = finalCode.split('\n');
      const useIndex = lines.findIndex((line) => line.startsWith("@use '") || line.startsWith('@use "'));
      if (useIndex > 0) {
        lines.splice(useIndex, 0, ...warningComments, '');
        finalCode = lines.join('\n');
      }
    }
  }

  // Build response text
  const responseParts: string[] = [result.description];

  // Add platform hint if not specified
  const platformNote = params.platform
    ? `Platform: ${params.platform === 'angular' ? 'Ignite UI for Angular' : 'Ignite UI for Web Components'}`
    : 'Platform: Not specified (generic output). Specify `platform` for optimized code.';
  responseParts.push('');
  responseParts.push(platformNote);

  // Add validation warnings and tips
  const validationText = formatValidationResult(validation);

  if (validationText) {
    responseParts.push('');
    responseParts.push(validationText);
  }

  responseParts.push('');
  responseParts.push(`Variables created: ${result.variables.join(', ')}`);
  responseParts.push('');
  responseParts.push('```scss');
  responseParts.push(finalCode.trimEnd());
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
