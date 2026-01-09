/**
 * Handler for get_component_design_tokens tool.
 * Returns available design tokens for a component theme.
 */

import {
  getComponentTheme,
  searchComponents,
  COMPONENT_NAMES,
  hasVariants,
  getVariants,
  isCompoundComponent,
  getCompoundComponentInfo,
  hasPartSelectors,
  hasAngularInnerSelectors,
} from '../../knowledge/index.js';
import type {GetComponentDesignTokensParams} from '../schemas.js';

export async function handleGetComponentDesignTokens(params: GetComponentDesignTokensParams) {
  const {component} = params;
  const normalizedName = component.toLowerCase().trim();

  // Try exact match first
  const theme = getComponentTheme(normalizedName);

  if (!theme) {
    // Component not found - provide helpful suggestions
    const suggestions = searchComponents(normalizedName);

    // If no suggestions from search, show a subset of available components
    const componentList = suggestions.length > 0 ? suggestions.slice(0, 10) : COMPONENT_NAMES.slice(0, 20);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Component "${component}" not found.

${suggestions.length > 0 ? '**Similar components:**' : '**Available components (partial list):**'}
${componentList.map((c) => `- ${c}`).join('\n')}

${suggestions.length === 0 ? `\nTotal available: ${COMPONENT_NAMES.length} components. Use a more specific name to search.` : ''}

**Tip:** For button variants, use specific names like "flat-button", "contained-button", "outlined-button", or "fab-button".`,
        },
      ],
    };
  }

  // Build response parts
  const responseParts: string[] = [];

  // Header
  responseParts.push(`## Design Tokens for \`${theme.name}\``);
  responseParts.push('');

  // Theme function info
  responseParts.push(`**Theme Function:** \`${theme.themeFunctionName}()\``);
  responseParts.push('');

  // Description if present
  if (theme.description && theme.description.trim()) {
    responseParts.push('**Description:**');
    responseParts.push(theme.description.trim());
    responseParts.push('');
  }

  // Variants hint for base components
  if (hasVariants(normalizedName)) {
    const variants = getVariants(normalizedName);
    responseParts.push('**Note:** This component has variant-specific themes:');
    responseParts.push(variants.map((v) => `- \`${v}\``).join('\n'));
    responseParts.push('');
    responseParts.push('Consider using the specific variant theme for more targeted styling.');
    responseParts.push('');
  }

  // Compound component hint
  if (isCompoundComponent(normalizedName)) {
    const compoundInfo = getCompoundComponentInfo(normalizedName);
    if (compoundInfo) {
      responseParts.push('**Compound Component:**');
      responseParts.push(compoundInfo.description);
      responseParts.push('');
      responseParts.push('**Related themes for full customization:**');
      responseParts.push('');

      // Check if we have inner selectors defined for either platform
      const hasAngular = hasAngularInnerSelectors(normalizedName);
      const hasWC = hasPartSelectors(normalizedName);

      if ((hasAngular || hasWC) && compoundInfo.innerSelectors) {
        // Show table with both Angular and Web Components selectors
        responseParts.push('| Theme | Angular Selector | Web Components Selector |');
        responseParts.push('|-------|------------------|------------------------|');

        for (const relatedTheme of compoundInfo.relatedThemes) {
          const angularSelector = compoundInfo.innerSelectors.angular?.[relatedTheme];
          const wcSelector = compoundInfo.innerSelectors.webcomponents?.[relatedTheme];

          const angularDisplay = angularSelector && angularSelector !== 'TODO' ? `\`${angularSelector}\`` : '*(TBD)*';
          const wcDisplay = wcSelector && wcSelector !== 'TODO' ? `\`${wcSelector}\`` : '*(TBD)*';

          responseParts.push(`| \`${relatedTheme}\` | ${angularDisplay} | ${wcDisplay} |`);
        }
        responseParts.push('');
        responseParts.push(
          '**Tip:** Use the scoped selectors above to style internal components. For Angular, these are descendant selectors. For Web Components, use `::part()` selectors to penetrate the shadow DOM.',
        );
      } else {
        // Fallback to simple list if no selectors defined yet
        responseParts.push(compoundInfo.relatedThemes.map((t) => `- \`${t}\``).join('\n'));
      }
      responseParts.push('');
    }
  }

  // Tokens table
  if (theme.tokens.length > 0) {
    responseParts.push(`**Available Tokens (${theme.tokens.length}):**`);
    responseParts.push('');
    responseParts.push('| Token Name | Type | Description |');
    responseParts.push('|------------|------|-------------|');

    for (const token of theme.tokens) {
      // Clean up description - remove newlines and extra whitespace
      const cleanDesc = token.description.replace(/\s+/g, ' ').trim();
      responseParts.push(`| \`${token.name}\` | ${token.type} | ${cleanDesc} |`);
    }
    responseParts.push('');
  } else {
    responseParts.push('**No customizable tokens available for this component.**');
    responseParts.push('');
  }

  // Usage hint
  responseParts.push('---');
  responseParts.push('**Next step:** Use `create_component_theme` with the tokens above to generate Sass code.');

  return {
    content: [
      {
        type: 'text' as const,
        text: responseParts.join('\n'),
      },
    ],
  };
}
