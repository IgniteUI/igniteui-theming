import type { Platform } from "./platforms/index.js";

/**
 * Platform-specific selectors for a component.
 * Use `null` to indicate a component is not available on a platform.
 */
export interface ComponentSelectors {
	/** Angular selector(s) - can be single string, array, or null if not available on Angular */
	angular: string | string[] | null;
	/** Web Components selector(s) - can be single string, array, or null if not available on Web Components */
	webcomponents: string | string[] | null;
}

/**
 * Describes how a child component's token value is derived from a source token.
 */
export interface TokenDerivation {
	/** Source token: 'componentName.tokenName' */
	from: string;
	/** Transform to apply to the source value */
	transform: "identity" | "adaptive-contrast" | "dynamic-shade";
	/** Optional transform arguments (e.g., shade amount for dynamic-shade) */
	args?: Record<string, string | number>;
}

/**
 * Platform-specific selector(s) for a named scope.
 */
export interface ScopeSelectors {
	angular?: string | string[];
	webcomponents?: string | string[];
}

/**
 * Information about a compound component (one that contains multiple themeable sub-components).
 */
export interface CompoundInfo {
	/** Description of what the compound component contains */
	description: string;
	/** Related theme functions needed for full customization */
	relatedThemes: string[];
	/**
	 * Non-inline scopes (e.g., overlay). Inline scope is always derived from base selectors.
	 * Most compounds won't have this field.
	 */
	additionalScopes?: Record<string, ScopeSelectors>;
	/** Maps child theme name to a scope name per platform. Values: 'inline' or a key in additionalScopes */
	childScopes?: Record<string, { angular?: string; webcomponents?: string }>;
	/** Token derivation rules. Key: 'childTheme.childToken' */
	tokenDerivations?: Record<string, TokenDerivation>;
	/** Free-form guidance for edge cases */
	guidance?: string;
}

export interface ComponentMetadata {
	/** Platform-specific CSS selectors */
	selectors: ComponentSelectors;
	/** Present only for components with variant-specific themes (e.g., button) */
	variants?: string[];
	/** Present only for compound components */
	compound?: CompoundInfo;
}

export const COMPONENT_METADATA: Record<string, ComponentMetadata> = {
	accordion: {
		selectors: { angular: "igx-accordion", webcomponents: "igc-accordion" },
	},
	"action-strip": {
		selectors: { angular: "igx-action-strip", webcomponents: null },
	},
	avatar: {
		selectors: { angular: "igx-avatar", webcomponents: "igc-avatar" },
	},
	badge: {
		selectors: { angular: "igx-badge", webcomponents: "igc-badge" },
	},
	banner: {
		selectors: { angular: ".igx-banner", webcomponents: "igc-banner" },
		compound: {
			description: "The banner component uses flat-buttons for the actions",
			relatedThemes: ["flat-button"],
			guidance: `The banner action buttons should visually coordinate with the banner background. \
If customizing the banner background, ensure flat-button foreground contrasts against it.`,
		},
	},
	"bottom-nav": {
		selectors: { angular: "igx-bottom-nav", webcomponents: null },
	},
	button: {
		selectors: { angular: ".igx-button", webcomponents: "igc-button" },
		variants: [
			"flat-button",
			"contained-button",
			"outlined-button",
			"fab-button",
		],
	},
	"flat-button": {
		selectors: {
			angular: ".igx-button--flat",
			webcomponents: 'igc-button[variant="flat"]',
		},
	},
	"contained-button": {
		selectors: {
			angular: [".igx-button--contained"],
			webcomponents: 'igc-button[variant="contained"]',
		},
	},
	"outlined-button": {
		selectors: {
			angular: [".igx-button--outlined"],
			webcomponents: 'igc-button[variant="outlined"]',
		},
	},
	"fab-button": {
		selectors: {
			angular: [".igx-button--fab"],
			webcomponents: 'igc-button[variant="fab"]',
		},
	},
	"icon-button": {
		selectors: {
			angular: [".igx-icon-button"],
			webcomponents: "igc-icon-button",
		},
		variants: [
			"flat-icon-button",
			"contained-icon-button",
			"outlined-icon-button",
		],
	},
	"flat-icon-button": {
		selectors: {
			angular: [".igx-icon-button--flat"],
			webcomponents: 'igc-icon-button[variant="flat"]',
		},
	},
	"contained-icon-button": {
		selectors: {
			angular: [".igx-icon-button--contained"],
			webcomponents: 'igc-icon-button[variant="contained"]',
		},
	},
	"outlined-icon-button": {
		selectors: {
			angular: [".igx-icon-button--outlined"],
			webcomponents: 'igc-icon-button[variant="outlined"]',
		},
	},
	"button-group": {
		selectors: {
			angular: "igx-buttongroup",
			webcomponents: "igc-button-group",
		},
	},
	calendar: {
		selectors: { angular: "igx-calendar", webcomponents: "igc-calendar" },
	},
	card: {
		selectors: { angular: "igx-card", webcomponents: "igc-card" },
		compound: {
			description:
				"The card component can contain various child components like avatars, buttons, chips, and icons.",
			relatedThemes: ["flat-button", "flat-icon-button", "chip", "icon"],
			guidance: `The card component can contain flat-button(s), flat-icon-button(s), and icon(s) that should harmonize visually well with the background of the card component. \
        For the flat-button and flat-icon-button themes, ensure the foreground color contrasts well with the card background. \
        For the icon theme, the color should also coordinate with the card background while maintaining sufficient contrast.`,
		},
	},
	carousel: {
		selectors: { angular: "igx-carousel", webcomponents: "igc-carousel" },
	},
	chat: {
		selectors: { angular: "igx-chat", webcomponents: "igc-chat" },
		compound: {
			description:
				"The carousel component uses a contained-button and a textarea internally.",
			relatedThemes: ["contained-button", "input-group"],
			guidance:
				"Make sure the textarea and the contained-button themes visually coordinate with each other and the overall chat background.",
		},
	},
	checkbox: {
		selectors: { angular: "igx-checkbox", webcomponents: "igc-checkbox" },
	},
	chip: {
		selectors: { angular: "igx-chip", webcomponents: "igc-chip" },
	},
	"column-actions": {
		selectors: { angular: "igx-column-actions", webcomponents: null },
		compound: {
			description:
				"The column actions component uses checkboxes for selection and flat-buttons for the action items.",
			relatedThemes: ["checkbox", "flat-button"],
			tokenDerivations: {
				"flat-button.foreground": {
					from: "column-actions.background",
					transform: "adaptive-contrast",
				},
			},
			guidance:
				"Make sure to theme these child components to visually coordinate with each other and the overall column actions background.",
		},
	},
	combo: {
		selectors: { angular: "igx-combo", webcomponents: "igc-combo" },
		compound: {
			description:
				"The combo component combines input, drop-down, and checkbox components.",
			relatedThemes: ["input-group", "drop-down", "checkbox"],
			tokenDerivations: {
				"input-group.focused-border-color": {
					from: "combo.toggle-button-background",
					transform: "identity",
				},
				"drop-down.background-color": {
					from: "combo.toggle-button-background",
					transform: "identity",
				},
				"checkbox.fill-color": {
					from: "combo.toggle-button-background",
					transform: "identity",
				},
			},
			additionalScopes: {
				overlay: { angular: ".igx-drop-down__list" },
			},
			childScopes: {
				"drop-down": { angular: "overlay" },
				checkbox: { angular: "overlay" },
			},
			guidance:
				"The combo input-group, drop-down, and checkbox should share a consistent color scheme.",
		},
	},
	"date-picker": {
		selectors: { angular: "igx-date-picker", webcomponents: "igc-date-picker" },
		compound: {
			description:
				"The date-picker combines input, calendar, and flat-button components.",
			relatedThemes: ["flat-button", "input-group", "calendar"],
			additionalScopes: {
				overlay: { angular: ".igx-date-picker" },
			},
			childScopes: {
				calendar: { angular: "overlay" },
				"flat-button": { angular: "overlay" },
				"input-group": { angular: "inline" },
			},
			tokenDerivations: {
				"flat-button.foreground": {
					from: "calendar.content-background",
					transform: "adaptive-contrast",
				},
			},
			guidance:
				"The flat-button foreground inside the calendar should contrast with the calendar content background.",
		},
	},
	"date-range-picker": {
		selectors: {
			angular: "igx-date-range-picker",
			webcomponents: "igc-date-range-picker",
		},
		compound: {
			description:
				"The date-range-picker combines input, calendar, and flat-button components.",
			relatedThemes: ["flat-button", "input-group", "calendar"],
			additionalScopes: {
				overlay: { angular: ".igx-date-picker" },
			},
			childScopes: {
				calendar: { angular: "overlay" },
				"flat-button": { angular: "overlay" },
				"input-group": { angular: "inline" },
			},
			tokenDerivations: {
				"flat-button.foreground": {
					from: "calendar.content-background",
					transform: "adaptive-contrast",
				},
			},
			guidance:
				"The flat-button foreground inside the calendar should contrast with the calendar content background.",
		},
	},
	"date-range-start": {
		selectors: { angular: "igx-date-range-start", webcomponents: null },
	},
	"date-range-end": {
		selectors: { angular: "igx-date-range-end", webcomponents: null },
	},
	"date-time-input": {
		selectors: { angular: null, webcomponents: "igc-date-time-input" },
	},
	dialog: {
		selectors: { angular: ".igx-dialog", webcomponents: "igc-dialog" },
		compound: {
			description: "The dialog component uses flat-buttons for the actions",
			relatedThemes: ["flat-button"],
			tokenDerivations: {
				"flat-button.foreground": {
					from: "dialog.background",
					transform: "adaptive-contrast",
				},
			},
			guidance: `The dialog action buttons should visually coordinate with the dialog background. \
If customizing the dialog background, ensure flat-button foreground contrasts against it.`,
		},
	},
	divider: {
		selectors: { angular: "igx-divider", webcomponents: "igc-divider" },
	},
	"dock-manager": {
		selectors: { angular: "igc-dockmanager", webcomponents: "igc-dockmanager" },
	},
	"drop-down": {
		selectors: {
			angular: ".igx-drop-down__list",
			webcomponents: "igc-dropdown",
		},
	},
	"expansion-panel": {
		selectors: {
			angular: "igx-expansion-panel",
			webcomponents: "igc-expansion-panel",
		},
	},
	"file-input": {
		selectors: {
			angular: 'igx-input-group[class~="igx-input-group--file"]',
			webcomponents: "igc-file-input",
		},
		compound: {
			description: "The file-input uses an input-group for the input field.",
			relatedThemes: ["input-group", "file-input"],
			guidance: `The file input is composed of an input-group and a browse button. \
Both themes should share the same visual treatment as the file-input wrapper.`,
		},
	},
	grid: {
		selectors: {
			angular: [
				"igx-grid",
				"igx-tree-grid",
				"igx-hierarchical-grid",
				"igx-pivot-grid",
				"igx-grid-excel-style-filtering",
			],
			webcomponents: [
				"igc-grid",
				"igc-tree-grid",
				"igc-hierarchical-grid",
				"igc-pivot-grid",
				"igc-grid-excel-style-filtering",
			],
		},
		compound: {
			description:
				"The grid is a complex compound component with many themeable parts including filtering, editing, pagination, toolbar and more.",
			relatedThemes: [
				"action-strip",
				"grid-summary",
				"grid-toolbar",
				"paginator",
				"checkbox",
				"chip",
				"input-group",
				"flat-button",
				"outlined-button",
				"flat-icon-button",
				"outlined-icon-button",
			],
			guidance: `The grid is a complex compound component with many related themes. \
For basic customization, focus on the grid theme itself and the most visible children: \
input-group (filtering), outlined-button/icon-button (toolbar actions), checkbox (row selection), \
and paginator. The grid-summary and grid-toolbar themes control their respective areas. \
Detailed token derivation rules are not yet available for the grid — use the token names \
and descriptions from get_component_design_tokens for each child to guide value selection.`,
		},
	},
	"grid-summary": {
		selectors: {
			angular: "igx-grid-summary",
			webcomponents: "igc-grid-summary",
		},
	},
	"grid-toolbar": {
		selectors: {
			angular: "igx-grid-toolbar",
			webcomponents: "igc-grid-toolbar",
		},
	},
	highlight: {
		selectors: { angular: "igx-highlight", webcomponents: "igc-highlight" },
	},
	icon: {
		selectors: { angular: "igx-icon", webcomponents: "igc-icon" },
	},
	"input-group": {
		selectors: { angular: "igx-input-group", webcomponents: "igc-input" },
	},
	label: {
		selectors: { angular: "[igxLabel]", webcomponents: "igc-label" },
	},
	list: {
		selectors: { angular: "igx-list", webcomponents: "igc-list" },
	},
	navbar: {
		selectors: { angular: "igx-navbar", webcomponents: "igc-navbar" },
		compound: {
			description:
				"The navbar contains buttons and icons-buttons for navigation.",
			relatedThemes: [
				"flat-button",
				"outlined-button",
				"contained-button",
				"flat-icon-button",
				"outlined-icon-button",
				"contained-icon-button",
			],
			guidance:
				"Make sure to theme all button and icon-button variants in the navbar to visually coordinate with the navbar background.",
		},
	},
	navdrawer: {
		selectors: { angular: "igx-nav-drawer", webcomponents: "igc-nav-drawer" },
	},
	overlay: {
		selectors: { angular: ".igx-overlay__content", webcomponents: null },
	},
	paginator: {
		selectors: { angular: "igx-paginator", webcomponents: "igc-paginator" },
		compound: {
			description:
				"The paginator uses combo and flat-icon-buttons for the page controls.",
			relatedThemes: ["combo", "flat-icon-button"],
			guidance:
				"The combo and flat-icon-button themes should visually coordinate with each other and the overall paginator background.",
		},
	},
	"pivot-data-selector": {
		selectors: {
			angular: "igx-pivot-data-selector",
			webcomponents: "igc-pivot-data-selector",
		},
		compound: {
			description:
				"The pivot data selector uses checkboxes, expansion panels, lists, and chips.",
			relatedThemes: ["checkbox", "expansion-panel", "chip", "list"],
			guidance: `The pivot data selector uses checkboxes for field selection, expansion panels for grouping, \
chips for displaying selected fields, and lists for field ordering. \
Detailed token derivation rules are not yet available — use the token names \
and descriptions from get_component_design_tokens for each child to guide value selection.`,
		},
	},
	"progress-circular": {
		selectors: {
			angular: "igx-circular-bar",
			webcomponents: "igc-circular-progress",
		},
	},
	"progress-linear": {
		selectors: {
			angular: "igx-linear-bar",
			webcomponents: "igc-linear-progress",
		},
	},
	"query-builder": {
		selectors: { angular: "igx-query-builder", webcomponents: null },
		compound: {
			description:
				"The query builder uses inputs, dropdowns, chips, buttons and button-groups for building query expressions.",
			relatedThemes: [
				"input-group",
				"select",
				"chip",
				"flat-button",
				"outlined-button",
				"button-group",
				"flat-icon-button",
				"outlined-icon-button",
			],
			guidance: `The query builder uses input-groups and selects for expression values and operator/field selection, \
chips for displaying conditions, and buttons/button-groups for adding and grouping expressions.`,
		},
	},
	radio: {
		selectors: { angular: "igx-radio", webcomponents: "igc-radio" },
	},
	rating: {
		selectors: { angular: "igc-rating", webcomponents: "igc-rating" },
	},
	ripple: {
		selectors: { angular: "igx-ripple", webcomponents: "igc-ripple" },
	},
	scrollbar: {
		selectors: { angular: ".ig-scrollbar", webcomponents: ".ig-scrollbar" },
	},
	select: {
		selectors: { angular: "igx-select", webcomponents: "igc-select" },
		compound: {
			description:
				"The select component combines input-group and drop-down components.",
			relatedThemes: ["input-group", "drop-down"],
			additionalScopes: {
				overlay: { angular: ".igx-drop-down__list" },
			},
			childScopes: {
				"drop-down": { angular: "overlay" },
			},
			tokenDerivations: {
				"input-group.focused-border-color": {
					from: "select.toggle-button-background",
					transform: "identity",
				},
				"drop-down.background-color": {
					from: "select.toggle-button-background",
					transform: "identity",
				},
			},
			guidance: `The select input-group and drop-down should share a consistent color scheme. \
The drop-down background should match the select surface intent.`,
		},
	},
	slider: {
		selectors: { angular: "igx-slider", webcomponents: "igc-slider" },
	},
	snackbar: {
		selectors: { angular: "igx-snackbar", webcomponents: "igc-snackbar" },
	},
	splitter: {
		selectors: { angular: "igx-splitter", webcomponents: "igc-splitter" },
	},
	stepper: {
		selectors: { angular: "igx-stepper", webcomponents: "igc-stepper" },
	},
	switch: {
		selectors: { angular: "igx-switch", webcomponents: "igc-switch" },
	},
	tabs: {
		selectors: { angular: "igx-tabs", webcomponents: "igc-tabs" },
	},
	"time-picker": {
		selectors: { angular: "igx-time-picker", webcomponents: "igc-time-picker" },
		compound: {
			description: "The time picker uses an input-group for the input field.",
			relatedThemes: ["input-group", "time-picker"],
			guidance: `The time-picker input-group and the time-picker dial should share a consistent color scheme. \
The input-group text color should coordinate with the time-picker header.`,
		},
	},
	toast: {
		selectors: { angular: "igx-toast", webcomponents: "igc-toast" },
	},
	tooltip: {
		selectors: { angular: "igx-tooltip", webcomponents: "igc-tooltip" },
	},
	tree: {
		selectors: { angular: "igx-tree-node", webcomponents: "igc-tree" },
	},
	watermark: {
		selectors: {
			angular: "igc-trial-watermark",
			webcomponents: "igc-trial-watermark",
		},
	},
};

/**
 * List of variant theme names (derived from COMPONENT_METADATA at init).
 */
export const VARIANT_THEME_NAMES = new Set(
	Object.values(COMPONENT_METADATA)
		.filter((m) => m.variants)
		.flatMap((m) => m.variants!),
);

// ===== Accessor Functions =====

/**
 * Get the selector(s) for a component on a specific platform.
 * @param componentName - The component name
 * @param platform - The target platform
 * @returns Array of selectors (normalized to always return array), empty array if component not found or not available on platform
 */
export function getComponentSelector(
	componentName: string,
	platform: Platform,
): string[] {
	const metadata = COMPONENT_METADATA[componentName];
	if (!metadata) {
		return [];
	}

	const platformSelectors =
		platform === "angular"
			? metadata.selectors.angular
			: metadata.selectors.webcomponents;

	if (platformSelectors === null) {
		return [];
	}

	return Array.isArray(platformSelectors)
		? platformSelectors
		: [platformSelectors];
}

/**
 * Check if a component is available on a specific platform.
 * @param componentName - The component name
 * @param platform - The target platform ('angular' or 'webcomponents')
 * @returns True if the component is available on the platform, false otherwise
 */
export function isComponentAvailable(
	componentName: string,
	platform: Platform,
): boolean {
	const metadata = COMPONENT_METADATA[componentName];
	if (!metadata) {
		return false;
	}

	const platformSelector =
		platform === "angular"
			? metadata.selectors.angular
			: metadata.selectors.webcomponents;
	return platformSelector !== null;
}

/**
 * Get all component names available on a specific platform.
 * @param platform - The target platform ('angular' or 'webcomponents')
 * @returns Array of component names available on the platform
 */
export function getComponentsForPlatform(platform: Platform): string[] {
	return Object.entries(COMPONENT_METADATA)
		.filter(([, metadata]) => {
			const platformSelector =
				platform === "angular"
					? metadata.selectors.angular
					: metadata.selectors.webcomponents;
			return platformSelector !== null;
		})
		.map(([name]) => name);
}

/**
 * Get platform availability for a component.
 * @param componentName - The component name
 * @returns Object indicating availability on each platform, or undefined if component not found
 */
export function getComponentPlatformAvailability(
	componentName: string,
): { angular: boolean; webcomponents: boolean } | undefined {
	const metadata = COMPONENT_METADATA[componentName];
	if (!metadata) {
		return undefined;
	}

	return {
		angular: metadata.selectors.angular !== null,
		webcomponents: metadata.selectors.webcomponents !== null,
	};
}

/**
 * Check if a component has variants.
 * @param componentName - The component name (e.g., 'button')
 * @returns True if the component has variant-specific themes
 */
export function hasVariants(componentName: string): boolean {
	return !!COMPONENT_METADATA[componentName]?.variants;
}

/**
 * Get variants for a component.
 * @param componentName - The component name (e.g., 'button')
 * @returns Array of variant names or empty array
 */
export function getVariants(componentName: string): string[] {
	return COMPONENT_METADATA[componentName]?.variants ?? [];
}

/**
 * Check if a component name is a variant theme.
 * @param themeName - The theme name to check
 * @returns True if this is a variant theme (e.g., 'flat-button')
 */
export function isVariantTheme(themeName: string): boolean {
	return VARIANT_THEME_NAMES.has(themeName);
}

/**
 * Get compound component info if applicable.
 * @param componentName - The component name
 * @returns CompoundInfo or undefined
 */
export function getCompoundComponentInfo(
	componentName: string,
): CompoundInfo | undefined {
	return COMPONENT_METADATA[componentName]?.compound;
}

/**
 * Check if a component is a compound component.
 * @param componentName - The component name
 * @returns True if this is a compound component
 */
export function isCompoundComponent(componentName: string): boolean {
	return !!COMPONENT_METADATA[componentName]?.compound;
}

/**
 * Get token derivations for a specific child theme within a compound component.
 * @param compoundName - The compound component name
 * @param childThemeName - The child theme name (e.g., 'flat-button')
 * @returns Record of 'childToken' -> TokenDerivation, or empty record if none exist
 */
export function getTokenDerivationsForChild(
	compoundName: string,
	childThemeName: string,
): Record<string, TokenDerivation> {
	const compound = COMPONENT_METADATA[compoundName]?.compound;
	if (!compound?.tokenDerivations) {
		return {};
	}

	const prefix = `${childThemeName}.`;
	const result: Record<string, TokenDerivation> = {};

	for (const [key, derivation] of Object.entries(compound.tokenDerivations)) {
		if (key.startsWith(prefix)) {
			const childToken = key.slice(prefix.length);
			result[childToken] = derivation;
		}
	}

	return result;
}
