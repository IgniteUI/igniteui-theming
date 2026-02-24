/**
 * Component themes knowledge base - loads component theme data from JSON.
 * This provides the LLM with accurate design tokens for each component.
 */

import themesData from "../../../json/components/themes.json" with {
	type: "json",
};
import { COMPONENT_METADATA } from "./component-metadata.js";

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
 * Represents a primary token entry extracted from SassDoc descriptions.
 */
export interface PrimaryToken {
	/** Token name without $ prefix (e.g., 'background', 'header-background') */
	name: string;
	/** Brief description of what this token controls and what it derives */
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
	/** Title/description of the theme (e.g., 'Calendar Theme') */
	description: string;
	/** Structured primary tokens extracted from SassDoc */
	primaryTokens?: PrimaryToken[];
	/** Optional summary prose about token behavior */
	primaryTokensSummary?: string;
	/** Available design tokens */
	tokens: ComponentToken[];
}

export interface ComponentThemeResolution {
	theme?: ComponentTheme;
	resolvedName?: string;
	error?: string;
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
export function getComponentTheme(
	componentName: string,
): ComponentTheme | undefined {
	return resolveComponentTheme(componentName)?.theme;
}

/**
 * Resolve a component theme by name, falling back to metadata alias when needed.
 * @param componentName - The component name (e.g., 'button', 'avatar')
 * @returns Resolution with resolved theme name or error details
 */
export function resolveComponentTheme(
	componentName: string,
): ComponentThemeResolution | undefined {
	const theme = COMPONENT_THEMES[componentName];

	if (theme) {
		return { theme: theme, resolvedName: componentName };
	}

	const metadata = COMPONENT_METADATA[componentName];

	if (!metadata?.theme) {
		return {};
	}

	const alias = metadata.theme;

	if (alias === componentName) {
		return {
			error: `Theme alias target "${alias}" cannot reference itself.`,
		};
	}

	if (!COMPONENT_METADATA[alias]) {
		return {
			error: `Theme alias target "${alias}" is not a valid component metadata entry.`,
		};
	}

	const resolvedTheme = COMPONENT_THEMES[alias];

	if (!resolvedTheme) {
		return {
			error: `Theme alias target "${alias}" does not have a theme definition.`,
		};
	}

	return {
		theme: resolvedTheme,
		resolvedName: alias,
	};
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
): { isValid: boolean; invalidTokens: string[]; validTokens: string[] } {
	const validTokens = getTokenNames(componentName);
	const invalidTokens = tokenNames.filter(
		(name) => !validTokens.includes(name),
	);

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
	return COMPONENT_NAMES.filter((name) =>
		name.toLowerCase().includes(lowerQuery),
	);
}
