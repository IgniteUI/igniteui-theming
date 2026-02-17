/**
 * Handler for create_theme tool.
 */

import {generateTheme} from '../../generators/sass.js';
import {
  analyzeThemeColorsForPalette,
  formatPaletteSuitabilityWarnings,
  formatValidationResult,
  generatePaletteSuitabilityComments,
  generateWarningComments,
  validatePaletteColors,
} from '../../validators/index.js';
import type {CreateThemeParams} from '../schemas.js';

export async function handleCreateTheme(params: CreateThemeParams) {
  const variant = params.variant ?? 'light';

  // Validate surface color against the variant
  // Note: For themes, we only validate surfaceColor (gray is not exposed in theme params)
  const validation = await validatePaletteColors({
    variant,
    surface: params.surfaceColor,
  });

  // Analyze colors for palette shade generation suitability
  const suitabilityAnalysis = await analyzeThemeColorsForPalette({
    primary: params.primaryColor,
    secondary: params.secondaryColor,
    surface: params.surfaceColor,
  });

  // Generate the theme code
  const result = generateTheme({
    platform: params.platform,
    licensed: params.licensed,
    designSystem: params.designSystem,
    primaryColor: params.primaryColor,
    secondaryColor: params.secondaryColor,
    surfaceColor: params.surfaceColor,
    variant: params.variant,
    name: params.name,
    fontFamily: params.fontFamily,
    includeTypography: params.includeTypography,
    includeElevations: params.includeElevations,
    includeSpacing: params.includeSpacing,
  });

  // Add warning comments to the generated code if there are validation issues
  let finalCode = result.code;

  // Collect all warning comments to insert
  const allWarningComments: string[] = [];

  // Add variant validation warnings (single-line comments)
  if (!validation.isValid) {
    allWarningComments.push(...generateWarningComments(validation));
  }

  // Add suitability warnings (block comment)
  if (!suitabilityAnalysis.allSuitable) {
    allWarningComments.push(...generatePaletteSuitabilityComments(suitabilityAnalysis));
  }

  // Insert all warning comments after the header but before the @use statement
  if (allWarningComments.length > 0) {
    const lines = finalCode.split('\n');
    const useIndex = lines.findIndex((line) => line.startsWith("@use '") || line.startsWith('@use "'));
    if (useIndex > 0) {
      lines.splice(useIndex, 0, ...allWarningComments, '');
      finalCode = lines.join('\n');
    }
  }

  // Build response text
  const responseParts: string[] = [result.description];

  // Add platform hint if not specified
  let platformNote = '';

  switch (params.platform) {
    case 'angular':
      platformNote = 'Platform: Ignite UI for Angular';
      break;
    case 'webcomponents':
      platformNote = 'Platform: Ignite UI for Web Components';
      break;
    case 'react':
      platformNote = 'Platform: Ignite UI for React';
      break;
    case 'blazor':
      platformNote = 'Platform: Ignite UI for Blazor';
      break;
    default:
      platformNote = 'Platform: Not specified (generic output). Specify `platform` for optimized code.';
      break;
  }

  responseParts.push('');
  responseParts.push(platformNote);

  // Add validation warnings and tips (variant mismatch)
  const validationText = formatValidationResult(validation);
  if (validationText) {
    responseParts.push('');
    responseParts.push(validationText);
  }

  // Add suitability warnings (luminance issues)
  if (!suitabilityAnalysis.allSuitable) {
    responseParts.push('');
    responseParts.push(formatPaletteSuitabilityWarnings(suitabilityAnalysis));
  }

  responseParts.push('');
  responseParts.push(`Variables created/used: ${result.variables.join(', ')}`);
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
