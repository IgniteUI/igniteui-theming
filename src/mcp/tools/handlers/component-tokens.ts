import type {CompoundInfo} from '../../knowledge/index.js';
import {
  COMPONENT_NAMES,
  getComponentSelector,
  getComponentTheme,
  getCompoundComponentInfo,
  getTokenDerivationsForChild,
  getVariants,
  hasVariants,
  isCompoundComponent,
  searchComponents,
} from '../../knowledge/index.js';
import type {GetComponentDesignTokensParams, Platform} from '../schemas.js';

export async function handleGetComponentDesignTokens(params: GetComponentDesignTokensParams) {
  const {component} = params;
  const normalizedName = component.toLowerCase().trim();

  const formatSelectorList = (selectors?: string | string[] | null): string => {
    if (!selectors || selectors.length === 0) {
      return 'N/A';
    }

    const selectorText = Array.isArray(selectors) ? selectors.join(' | ') : selectors;

    return `\`${selectorText}\``;
  };

  const getScopeSelectorForPlatform = (
    compoundInfo: CompoundInfo,
    componentName: string,
    scopeName: string,
    platform: Platform
  ): string => {
    // React/Blazor share Web Components selectors
    const selectorPlatform: 'angular' | 'webcomponents' = platform === 'angular' ? 'angular' : 'webcomponents';

    if (scopeName === 'inline') {
      // Derive inline scope from base selectors
      const selectors = getComponentSelector(componentName, platform);
      return formatSelectorList(selectors.length > 0 ? (selectors.length === 1 ? selectors[0] : selectors) : null);
    }

    const scope = compoundInfo.additionalScopes?.[scopeName];
    if (!scope) {
      return 'N/A';
    }

    return formatSelectorList(scope[selectorPlatform]);
  };

  const resolveChildScopeName = (
    compoundInfo: CompoundInfo | undefined,
    childThemeName: string,
    platform: Platform
  ): string => {
    // React/Blazor share Web Components scoping
    const scopePlatform: 'angular' | 'webcomponents' = platform === 'angular' ? 'angular' : 'webcomponents';
    const childScope = compoundInfo?.childScopes?.[childThemeName];
    return childScope?.[scopePlatform] ?? 'inline';
  };

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

  // Platform groups for compound component output
  const PLATFORM_GROUPS: {label: string; platform: Platform}[] = [
    {label: 'Angular', platform: 'angular'},
    {label: 'Web Components', platform: 'webcomponents'},
    {label: 'Blazor', platform: 'blazor'},
    {label: 'React', platform: 'react'},
  ];

  // Build response parts
  const responseParts: string[] = [];

  // 1. Opening instruction line
  responseParts.push(`Implement a theme for the \`${theme.name}\` component using the following guidance.`);
  responseParts.push('');

  // 2. Theme function
  responseParts.push(`**Theme Function:** \`${theme.themeFunctionName}()\``);
  responseParts.push('');

  // Variants hint for base components
  if (hasVariants(normalizedName)) {
    const variants = getVariants(normalizedName);

    responseParts.push('**Note:** This component has variant-specific themes:');
    responseParts.push(variants.map((v) => `- \`${v}\``).join('\n'));
    responseParts.push('');
    responseParts.push('Consider using the specific variant theme for more targeted styling.');
    responseParts.push('');
  }

  if (isCompoundComponent(normalizedName)) {
    const compoundInfo = getCompoundComponentInfo(normalizedName);

    if (compoundInfo) {
      // 3. Compound Component description
      responseParts.push('**Compound Component:**');
      responseParts.push(compoundInfo.description);
      responseParts.push('');

      // 4. Steps
      responseParts.push('**Steps:**');
      responseParts.push('1. Choose your platform and use the matching scopes below.');
      responseParts.push(
        '2. For each related theme: call `get_component_design_tokens`, then `create_component_theme` using the selector for that platform scope.'
      );
      responseParts.push('3. Apply `@include tokens(child-theme(...))` inside the scope selector.');
      responseParts.push('');

      // 5. Per-platform sections — scopes derived from compoundInfo
      // Collect all scope names: 'inline' + any additionalScopes keys
      const allScopeNames = ['inline', ...Object.keys(compoundInfo.additionalScopes ?? {})];

      for (const group of PLATFORM_GROUPS) {
        responseParts.push(`**${group.label}:**`);

        // Scope table - only rows with non-N/A selectors
        const scopeRows = allScopeNames
          .map((scopeName) => {
            const selectorText = getScopeSelectorForPlatform(compoundInfo, normalizedName, scopeName, group.platform);
            return {scopeName, selectorText};
          })
          .filter((row) => row.selectorText !== 'N/A');

        if (scopeRows.length > 0) {
          responseParts.push('| Scope | Selector |');
          responseParts.push('| --- | --- |');
          responseParts.push(scopeRows.map((row) => `| ${row.scopeName} | ${row.selectorText} |`).join('\n'));
          responseParts.push('');
        }

        // Related themes table
        responseParts.push(`**Related themes (${group.label})**`);
        responseParts.push('| Theme | Scope | Selector |');
        responseParts.push('| --- | --- | --- |');
        responseParts.push(
          compoundInfo.relatedThemes
            .map((relatedTheme) => {
              const scopeName = resolveChildScopeName(compoundInfo, relatedTheme, group.platform);
              const selectorText = getScopeSelectorForPlatform(compoundInfo, normalizedName, scopeName, group.platform);

              return `| \`${relatedTheme}\` | ${scopeName} | ${selectorText} |`;
            })
            .join('\n')
        );
        responseParts.push('');
      }

      // 6. Token derivations (platform-agnostic)
      const derivationRows = compoundInfo.relatedThemes.flatMap((relatedTheme) => {
        const derivations = getTokenDerivationsForChild(normalizedName, relatedTheme);

        return Object.entries(derivations).map(([token, derivation]) => {
          const transformDesc =
            derivation.transform === 'identity'
              ? `same as \`${derivation.from}\``
              : `\`${derivation.transform}\` of \`${derivation.from}\``;

          return `| \`${relatedTheme}\` | \`${token}\` | ${transformDesc} |`;
        });
      });

      responseParts.push('**Token derivations:**');

      if (derivationRows.length > 0) {
        responseParts.push('| Theme | Token | Derivation |');
        responseParts.push('| --- | --- | --- |');
        responseParts.push(derivationRows.join('\n'));
      } else {
        responseParts.push('None.');
      }

      responseParts.push('');

      // 7. Guidance
      if (compoundInfo.guidance) {
        responseParts.push('**Guidance:**');
        responseParts.push(compoundInfo.guidance);
        responseParts.push('');
      }
    }
  }

  // 8. Primary Tokens (for both compound and simple)
  if (theme.primaryTokens && theme.primaryTokens.length > 0) {
    responseParts.push('**Primary Tokens:**');

    for (const pt of theme.primaryTokens) {
      responseParts.push(`- \`$${pt.name}\` — ${pt.description}`);
    }

    if (theme.primaryTokensSummary) {
      responseParts.push('');
      responseParts.push(theme.primaryTokensSummary);
    }

    responseParts.push('');
  }

  // 9. Available Tokens table
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

  // 10. Next step
  responseParts.push('---');
  responseParts.push('**Next step:** Use `create_component_theme` with the tokens above to generate Sass/CSS code.');

  return {
    content: [
      {
        type: 'text' as const,
        text: responseParts.join('\n'),
      },
    ],
  };
}
