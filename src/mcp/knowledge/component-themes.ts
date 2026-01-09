/**
 * Component themes knowledge base - loads component theme data from JSON.
 * This provides the LLM with accurate design tokens for each component.
 */

import themesData from '../../../json/components/themes.json' with {type: 'json'};

/**
 * Represents a design token (themeable property) for a component.
 */
export interface ComponentToken {
  /** Token name (e.g., 'background', 'border-color') */
  name: string;
  /** Sass type (e.g., 'Color', 'Number', 'List', 'box-shadow') */
  type: string;
  /** Description of what this token controls */
  description: string;
}

/**
 * Represents a component theme definition.
 */
export interface ComponentTheme {
  /** Component name (e.g., 'button', 'avatar') */
  name: string;
  /** The Sass function name (e.g., 'button-theme', 'avatar-theme') */
  themeFunctionName: string;
  /** Description of the theme function */
  description: string;
  /** Available design tokens */
  tokens: ComponentToken[];
}

/**
 * All component themes loaded from JSON.
 */
export const COMPONENT_THEMES = themesData as Record<string, ComponentTheme>;

/**
 * List of all available component names.
 */
export const COMPONENT_NAMES = Object.keys(COMPONENT_THEMES);

/**
 * Get a component theme by name.
 * @param componentName - The component name (e.g., 'button', 'avatar')
 * @returns The component theme or undefined if not found
 */
export function getComponentTheme(componentName: string): ComponentTheme | undefined {
  return COMPONENT_THEMES[componentName];
}

/**
 * Get the token names for a component.
 * @param componentName - The component name
 * @returns Array of token names or empty array if component not found
 */
export function getTokenNames(componentName: string): string[] {
  const theme = getComponentTheme(componentName);
  return theme ? theme.tokens.map((t) => t.name) : [];
}

/**
 * Validate that all provided tokens exist for a component.
 * @param componentName - The component name
 * @param tokenNames - Array of token names to validate
 * @returns Object with isValid flag and any invalid tokens
 */
export function validateTokens(
  componentName: string,
  tokenNames: string[],
): {isValid: boolean; invalidTokens: string[]; validTokens: string[]} {
  const validTokens = getTokenNames(componentName);
  const invalidTokens = tokenNames.filter((name) => !validTokens.includes(name));

  return {
    isValid: invalidTokens.length === 0,
    invalidTokens,
    validTokens,
  };
}

/**
 * Find components that match a search query.
 * @param query - Search string to match against component names
 * @returns Array of matching component names
 */
export function searchComponents(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return COMPONENT_NAMES.filter((name) => name.toLowerCase().includes(lowerQuery));
}
