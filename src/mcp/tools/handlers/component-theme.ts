/**
 * Handler for create_component_theme tool.
 * Generates Sass code to customize a component's appearance.
 */

import {generateComponentTheme} from '../../generators/sass.js';
import {
  getComponentTheme,
  validateTokens,
  COMPONENT_NAMES,
  searchComponents,
  getComponentSelector,
  isComponentAvailable,
  getComponentPlatformAvailability,
} from '../../knowledge/index.js';
import type {CreateComponentThemeParams} from '../schemas.js';

export async function handleCreateComponentTheme(params: CreateComponentThemeParams) {
  const {platform, component, tokens, selector, name} = params;
  const normalizedComponent = component.toLowerCase().trim();

  // Validate component exists
  const theme = getComponentTheme(normalizedComponent);
  if (!theme) {
    const suggestions = searchComponents(normalizedComponent);
    const componentList = suggestions.length > 0 ? suggestions.slice(0, 10) : COMPONENT_NAMES.slice(0, 15);

    return {
      content: [
        {
          type: 'text' as const,
          text: `**Error:** Component "${component}" not found.

${suggestions.length > 0 ? '**Similar components:**' : '**Available components:**'}
${componentList.map((c) => `- ${c}`).join('\n')}

**Tip:** Use \`get_component_design_tokens\` first to discover valid component names and their tokens.`,
        },
      ],
      isError: true,
    };
  }

  // Check platform availability if platform is specified
  let platformWarning: string | null = null;
  if (platform) {
    const isAvailable = isComponentAvailable(normalizedComponent, platform);
    if (!isAvailable) {
      const availability = getComponentPlatformAvailability(normalizedComponent);
      const availablePlatforms: string[] = [];
      if (availability?.angular) availablePlatforms.push('Angular');
      if (availability?.webcomponents) availablePlatforms.push('Web Components');

      platformWarning = `**Warning:** The \`${component}\` component is not available on ${platform === 'angular' ? 'Ignite UI for Angular' : 'Ignite UI for Web Components'}. ${availablePlatforms.length > 0 ? `It is available on: ${availablePlatforms.join(', ')}.` : ''}`;
    }
  }

  // Validate tokens
  const tokenNames = Object.keys(tokens);
  if (tokenNames.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `**Error:** No tokens provided. At least one token must be specified.

Use \`get_component_design_tokens\` with component "${component}" to see available tokens.`,
        },
      ],
      isError: true,
    };
  }

  const validation = validateTokens(normalizedComponent, tokenNames);
  if (!validation.isValid) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `**Error:** Invalid token(s) for component "${component}":
${validation.invalidTokens.map((t) => `- \`${t}\``).join('\n')}

**Valid tokens for ${component}:**
${validation.validTokens
  .slice(0, 20)
  .map((t) => `- \`${t}\``)
  .join('\n')}${validation.validTokens.length > 20 ? `\n... and ${validation.validTokens.length - 20} more` : ''}

Use \`get_component_design_tokens\` to see all tokens with descriptions.`,
        },
      ],
      isError: true,
    };
  }

  // Determine the selector
  let finalSelector = selector;
  if (!finalSelector && platform) {
    // Get platform-specific default selector
    const selectors = getComponentSelector(normalizedComponent, platform);
    if (selectors.length > 0) {
      // Use the first selector as default
      finalSelector = selectors[0];
    }
  }

  // Generate the Sass code
  try {
    const result = generateComponentTheme({
      platform,
      component: normalizedComponent,
      tokens,
      selector: finalSelector,
      name,
    });

    // Build response
    const responseParts: string[] = [];

    // Add platform warning if applicable (before the main content)
    if (platformWarning) {
      responseParts.push(platformWarning);
      responseParts.push('');
    }

    responseParts.push(result.description);
    responseParts.push('');

    // Platform info
    const platformNote = platform
      ? `Platform: ${platform === 'angular' ? 'Ignite UI for Angular' : `Ignite UI for ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}`
      : 'Platform: Not specified (generic output). Specify `platform` for optimized imports.';
    responseParts.push(platformNote);

    // Selector info
    if (finalSelector) {
      responseParts.push(`Selector: \`${finalSelector}\``);
    }

    responseParts.push('');
    responseParts.push(`Variables created: ${result.variables.join(', ')}`);
    responseParts.push('');
    responseParts.push('```scss');
    responseParts.push(result.code.trimEnd());
    responseParts.push('```');

    // Add usage hint
    responseParts.push('');
    responseParts.push('---');
    responseParts.push(
      '**Usage:** Import this Sass file in your main styles file, or include the code in your theme file.',
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: responseParts.join('\n'),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `**Error generating theme:** ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
