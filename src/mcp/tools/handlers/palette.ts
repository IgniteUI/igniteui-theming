/**
 * Handler for create_palette tool.
 */

import {generatePalette} from '../../generators/sass.js';
import type {CreatePaletteParams} from '../schemas.js';
import {validatePaletteColors, formatValidationResult, generateWarningComments} from '../../validators/index.js';

export async function handleCreatePalette(params: CreatePaletteParams) {
  const variant = params.variant ?? 'light';

  // Validate surface and gray colors against the variant
  const validation = await validatePaletteColors({
    variant,
    surface: params.surface,
    gray: params.gray,
  });

  // Generate the palette code
  const result = generatePalette({
    platform: params.platform,
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
