/**
 * Color usage documentation and semantic roles.
 * Describes how colors are used across Ignite UI components.
 */

import COLOR_USAGE_MARKDOWN from "./docs/colors/usage.md?raw";
import type { ShadeLevel } from "./multipliers.js";

/**
 * Shade range description.
 */
export interface ShadeRange {
	/** Shade levels included in this range */
	shades: ShadeLevel[];
	/** Description of what this range is used for */
	purpose: string;
	/** Example use cases */
	examples: string[];
}

/**
 * Color family semantic role definition.
 */
export interface ColorSemanticRole {
	/** Brief role description */
	role: string;
	/** Detailed description of the color's purpose */
	description: string;
	/** General usage patterns */
	usage: string[];
	/** Components that commonly use this color */
	components: string[];
	/** Shade-specific guidance */
	shadeGuidance: ShadeRange[];
}

/**
 * Semantic roles for each color family.
 * Derived from analysis of component schemas across Material, Fluent, Bootstrap, and Indigo themes.
 */
export const COLOR_SEMANTIC_ROLES: Record<string, ColorSemanticRole> = {
	primary: {
		role: "Brand identity and primary actions",
		description:
			"The primary color represents your brand and is the most prominent color in your UI. It draws attention to key interactive elements and indicates the primary action a user can take.",
		usage: [
			"Primary action buttons (contained/filled style)",
			"Links and navigation highlights",
			"Active/selected states (tabs, list items, tree nodes)",
			"Form controls when checked/selected (checkbox, radio, switch)",
			"Progress indicators and sliders",
			"Focus rings and outlines",
			"Calendar date selection",
			"Grid row selection and highlights",
		],
		components: [
			"button",
			"checkbox",
			"radio",
			"switch",
			"slider",
			"tabs",
			"progress",
			"calendar",
			"grid",
			"tree",
			"list",
			"nav-drawer",
			"stepper",
		],
		shadeGuidance: [
			{
				shades: ["50", "100"],
				purpose: "Subtle backgrounds and disabled states",
				examples: [
					"Focus backgrounds",
					"Disabled button fills",
					"Very light tints for hover",
				],
			},
			{
				shades: ["200", "300"],
				purpose: "Focus outlines, selection backgrounds with opacity",
				examples: [
					"Focus ring color (often with 0.5 opacity)",
					"Selected item backgrounds in Indigo theme (300 with 0.3 opacity)",
					"Light hover states",
				],
			},
			{
				shades: ["400"],
				purpose: "Intermediate states and secondary emphasis",
				examples: [
					"Hover states in some themes",
					"Border colors",
					"Secondary interactive elements",
				],
			},
			{
				shades: ["500"],
				purpose: "Default/main usage - THE primary color",
				examples: [
					"Button backgrounds",
					"Link text color",
					"Checkbox/radio fill when checked",
					"Tab indicators",
					"Progress bar fill",
				],
			},
			{
				shades: ["600", "700"],
				purpose: "Hover and active states",
				examples: [
					"Button hover background (Bootstrap)",
					"Active/pressed states",
					"Stronger emphasis",
				],
			},
			{
				shades: ["800", "900"],
				purpose: "Dark mode adaptations and maximum emphasis",
				examples: [
					"Active text in dark contexts",
					"Selected backgrounds in dark mode",
					"High contrast needs",
				],
			},
		],
	},

	secondary: {
		role: "Accent color and secondary emphasis",
		description:
			"The secondary color provides accent and emphasis for elements that need to stand out but are not the primary action. Most prominent in Material Design themes.",
		usage: [
			"Flat and outlined button text (Material)",
			"List and dropdown headers",
			"Selected item backgrounds (alternative to primary)",
			"Accent highlights and decorative elements",
			"Secondary action buttons",
		],
		components: [
			"button",
			"list",
			"drop-down",
			"tree",
			"grid",
			"radio",
			"checkbox",
		],
		shadeGuidance: [
			{
				shades: ["100", "200"],
				purpose: "Selected backgrounds and light accents",
				examples: [
					"Selected row backgrounds",
					"Light accent fills",
					"Hover backgrounds",
				],
			},
			{
				shades: ["300"],
				purpose: "Hover states in dark mode",
				examples: ["Dark mode hover backgrounds", "Medium accent"],
			},
			{
				shades: ["500"],
				purpose: "Default accent color",
				examples: ["Accent text", "Secondary action color", "Header text"],
			},
			{
				shades: ["600", "700"],
				purpose: "Stronger accents and header text",
				examples: [
					"Header text (Fluent)",
					"Strong accent color",
					"Hover states",
				],
			},
		],
	},

	gray: {
		role: "Neutral UI foundation - text, borders, and backgrounds",
		description:
			"Gray is the most extensively used color family, providing the foundation for text hierarchy, borders, backgrounds, and disabled states. It creates visual structure without competing with brand colors.",
		usage: [
			"Text at all hierarchy levels (primary, secondary, disabled)",
			"Borders and dividers",
			"Backgrounds (hover, selected, disabled)",
			"Icons and decorative elements",
			"Placeholder text",
			"Disabled state indicators",
			"Tooltips and overlays",
		],
		components: [
			"All components use gray",
			"input-group",
			"card",
			"list",
			"expansion-panel",
			"grid",
			"drop-down",
			"tooltip",
			"dialog",
		],
		shadeGuidance: [
			{
				shades: ["50"],
				purpose: "Lightest backgrounds (becomes dark in dark mode)",
				examples: [
					"Dark mode backgrounds",
					"Group areas",
					"Prefix/suffix backgrounds in inputs",
				],
			},
			{
				shades: ["100"],
				purpose: "Hover and focus backgrounds",
				examples: [
					"Item hover backgrounds",
					"Focus backgrounds",
					"Light borders",
					"Card outlines in dark mode",
				],
			},
			{
				shades: ["200"],
				purpose: "Selected backgrounds and borders",
				examples: [
					"Selected item backgrounds (Fluent)",
					"Hover backgrounds",
					"Row borders",
					"Default borders",
				],
			},
			{
				shades: ["300"],
				purpose: "Borders and light disabled states",
				examples: [
					"Border colors",
					"Disabled borders",
					"Dividers",
					"Light disabled fills",
				],
			},
			{
				shades: ["400"],
				purpose: "Disabled text/borders and placeholders",
				examples: [
					"Disabled text color",
					"Placeholder text",
					"Empty state icons",
					"Secondary borders",
				],
			},
			{
				shades: ["500"],
				purpose: "Secondary text and icons",
				examples: [
					"Disabled text",
					"Secondary text",
					"Icon colors",
					"Border colors",
				],
			},
			{
				shades: ["600"],
				purpose: "Secondary text and labels",
				examples: [
					"Header text (Indigo)",
					"Secondary text",
					"Label text",
					"Icon colors",
				],
			},
			{
				shades: ["700"],
				purpose: "Descriptions and tooltips",
				examples: [
					"Description text",
					"Tooltip backgrounds",
					"Subtitle text",
					"Icon colors",
				],
			},
			{
				shades: ["800"],
				purpose: "Primary text and strong emphasis",
				examples: ["Primary text", "Titles", "Strong text", "Icon colors"],
			},
			{
				shades: ["900"],
				purpose: "Maximum contrast text",
				examples: [
					"Highest contrast text",
					"Main headings",
					"Maximum emphasis content",
				],
			},
		],
	},

	surface: {
		role: "Component background foundation",
		description:
			'The surface color is the base background color for components. It defines the "canvas" on which UI elements are painted. In light themes, surface is typically white; in dark themes, it\'s a dark gray.',
		usage: [
			"Card backgrounds",
			"Dialog backgrounds",
			"Input field backgrounds",
			"List backgrounds",
			"Dropdown menu backgrounds",
			"Navigation drawer backgrounds",
			"Panel and expansion panel backgrounds",
		],
		components: [
			"card",
			"dialog",
			"input-group",
			"list",
			"drop-down",
			"nav-drawer",
			"expansion-panel",
			"calendar",
			"grid",
			"tree",
		],
		shadeGuidance: [
			{
				shades: ["500"],
				purpose: "Default surface - typically the only shade used",
				examples: [
					"Component backgrounds",
					"Base layer for contrast calculations",
					"Light theme: white or near-white",
					"Dark theme: dark gray (#222, #1a1a1a)",
				],
			},
		],
	},

	error: {
		role: "Validation errors and destructive actions",
		description:
			"The error color communicates problems, validation failures, and destructive actions. It should be used sparingly to maintain its impact and urgency.",
		usage: [
			"Form validation error borders and text",
			"Error messages and icons",
			"Invalid state indicators (checkbox, radio)",
			"Destructive action buttons",
			"Progress bar error state",
			"Stepper invalid step indicator",
		],
		components: [
			"input-group",
			"checkbox",
			"radio",
			"stepper",
			"progress",
			"button",
		],
		shadeGuidance: [
			{
				shades: ["200"],
				purpose: "Focus outlines with opacity",
				examples: ["Error focus rings (Bootstrap)", "Light error backgrounds"],
			},
			{
				shades: ["400"],
				purpose: "Focus outlines and hover states",
				examples: ["Error focus outlines (Indigo)", "Error hover states"],
			},
			{
				shades: ["500"],
				purpose: "Default error color",
				examples: [
					"Error borders",
					"Error text",
					"Error icons",
					"Invalid state fills",
				],
			},
			{
				shades: ["600", "700"],
				purpose: "Hover and active states",
				examples: [
					"Error button hover (Bootstrap/Fluent)",
					"Stronger error emphasis",
				],
			},
			{
				shades: ["800"],
				purpose: "Material theme error states",
				examples: ["Material Design error color", "Dark error emphasis"],
			},
		],
	},

	success: {
		role: "Positive feedback and completion",
		description:
			"The success color indicates successful operations, completed states, and positive feedback. Use it to confirm that actions have been completed successfully.",
		usage: [
			"Success messages and notifications",
			"Completed step indicators",
			"Progress completion state",
			"Positive validation feedback",
			"Success action buttons",
		],
		components: ["progress", "stepper", "snackbar", "button"],
		shadeGuidance: [
			{
				shades: ["500"],
				purpose: "Default success color",
				examples: [
					"Success indicators",
					"Completed state fills",
					"Success text and icons",
				],
			},
		],
	},

	warn: {
		role: "Warnings and cautionary states",
		description:
			"The warn color alerts users to potential issues or asks for caution. It's less severe than error but still requires attention.",
		usage: [
			"Warning messages and notifications",
			"Caution indicators",
			"Progress warning state",
			"Stepper warning indicator",
		],
		components: ["progress", "stepper", "snackbar"],
		shadeGuidance: [
			{
				shades: ["500"],
				purpose: "Default warning color",
				examples: [
					"Warning indicators",
					"Caution state fills",
					"Warning text and icons",
				],
			},
		],
	},

	info: {
		role: "Informational states",
		description:
			"The info color provides neutral informational feedback. It's less prominent than primary but indicates helpful information.",
		usage: [
			"Informational messages",
			"Info progress state",
			"Helper text and tooltips",
		],
		components: ["progress", "snackbar"],
		shadeGuidance: [
			{
				shades: ["500"],
				purpose: "Default info color",
				examples: [
					"Info indicators",
					"Informational state fills",
					"Info icons",
				],
			},
		],
	},
};

/**
 * Common opacity values and their purposes.
 */
export const OPACITY_USAGE = {
	"0.05-0.1": "Very subtle hover overlays, light backgrounds",
	"0.12-0.15": "Subtle active states, disabled backgrounds",
	"0.2": "Disabled text/elements",
	"0.3": "Selected backgrounds (Indigo theme), medium overlays",
	"0.38": "Material Design disabled opacity (standard)",
	"0.5": "Focus outlines, semi-transparent overlays",
	"0.6": "Border colors, secondary elements",
	"0.8": "Strong overlays, near-opaque states",
	"0.9": "Tooltip backgrounds, near-solid overlays",
} as const;

/**
 * State progression patterns showing how colors change across interaction states.
 */
export const STATE_PATTERNS = {
	button: {
		description: "Button state progression",
		states: {
			idle: "primary-500 background",
			hover: "primary-600 or primary-500 with overlay",
			focus: "primary-500 with focus ring (primary-200 or 300)",
			active: "primary-700 or darker",
			disabled: "gray-300 background, gray-500 text",
		},
	},
	listItem: {
		description: "List item state progression",
		states: {
			idle: "surface background, gray-800 text",
			hover: "gray-100 or 200 background",
			focus: "gray-100 background with focus outline",
			selected: "primary-100 or 200 background (or primary-300 with opacity)",
			disabled: "gray-400 text, no interaction",
		},
	},
	input: {
		description: "Input field state progression",
		states: {
			idle: "surface background, gray-300 or 400 border",
			hover: "gray-400 or 500 border",
			focus: "primary-500 border, focus ring",
			filled: "gray-800 text",
			error: "error-500 border and text",
			disabled: "gray-100 background, gray-400 text",
		},
	},
} as const;

/**
 * Design system specific patterns.
 */
export const THEME_PATTERNS = {
	material: {
		name: "Material Design",
		characteristics: [
			"Uses secondary color prominently for accents",
			"Ripple effects on interaction",
			"Shade 500 as baseline",
			"Elevation through shadows",
			"A100-A700 accent shades for selection",
		],
	},
	fluent: {
		name: "Fluent Design",
		characteristics: [
			"More gray-based, subtle interactions",
			"Hover states use 100-200 shades",
			"Border-focused component styling",
			"Less saturated colors overall",
		],
	},
	bootstrap: {
		name: "Bootstrap",
		characteristics: [
			"Uses primary color for most accents",
			"Shade 600 commonly used for hover",
			"Strong border patterns",
			"More traditional web styling",
		],
	},
	indigo: {
		name: "Indigo Design",
		characteristics: [
			"Transparent backgrounds with opacity",
			"Primary 300 with 0.3 opacity for selections",
			"Strong emphasis on gray scale",
			"Clean, modern aesthetic",
			"Subtle interactive states",
		],
	},
} as const;

export { COLOR_USAGE_MARKDOWN };
