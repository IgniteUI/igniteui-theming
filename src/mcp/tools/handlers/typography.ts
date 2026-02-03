/**
 * Handler for create_typography tool.
 */

import {generateTypography} from '../../generators/sass.js';
import type {CreateTypographyParams} from '../schemas.js';

export function handleCreateTypography(params: CreateTypographyParams) {
  const result = generateTypography({
    platform: params.platform,
    licensed: params.licensed,
    fontFamily: params.fontFamily,
    designSystem: params.designSystem,
    customScale: params.customScale,
    name: params.name,
  });

  // Build response text
  const responseParts: string[] = [result.description];

  // Add platform hint if not specified
  const platformNote = params.platform
    ? `Platform: ${params.platform === 'angular' ? 'Ignite UI for Angular' : 'Ignite UI for Web Components'}`
    : 'Platform: Not specified (generic output). Specify `platform` for optimized code.';
  responseParts.push('');
  responseParts.push(platformNote);

  responseParts.push('');
  responseParts.push(`Variables used: ${result.variables.join(', ')}`);
  responseParts.push('');
  responseParts.push('```scss');
  responseParts.push(result.code.trimEnd());
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
