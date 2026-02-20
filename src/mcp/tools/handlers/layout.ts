/**
 * Handlers for layout scale tools: set_size, set_spacing, set_roundness.
 */

import {
	COMPONENT_METADATA,
	getComponentPlatformAvailability,
	getComponentSelector,
} from "../../knowledge/index.js";
import type { Platform } from "../../utils/types.js";
import type {
	SetRoundnessParams,
	SetSizeParams,
	SetSpacingParams,
} from "../schemas.js";

const SIZE_KEYWORDS: Record<string, number> = {
	small: 1,
	medium: 2,
	large: 3,
};

interface ScopeResolution {
	selectors: string[];
	notes: string[];
	scopeLabel: string;
}

interface ScopeError {
	error: string;
}

function normalizeComponentName(component?: string): string | null {
	return component ? component.toLowerCase().trim() : null;
}

function buildSelectorList(value: string | string[]): string[] {
	return Array.isArray(value) ? value : [value];
}

function resolveScope(
	component: string | undefined,
	scope: string | undefined,
	platform: Platform | undefined,
): ScopeResolution | ScopeError {
	const notes: string[] = [];

	if (component) {
		const normalized = normalizeComponentName(component);

		if (!normalized || !COMPONENT_METADATA[normalized]) {
			const available = Object.keys(COMPONENT_METADATA);
			const suggestions = normalized
				? available.filter((name) => name.includes(normalized)).slice(0, 10)
				: [];
			const list =
				suggestions.length > 0 ? suggestions : available.slice(0, 15);

			return {
				error: `**Error:** Component "${component}" not found.

${suggestions.length > 0 ? "**Similar components:**" : "**Available components:**"}
${list.map((name) => `- ${name}`).join("\n")}`,
			};
		}

		if (scope) {
			notes.push("Scope ignored because component was provided.");
		}

		const selectorsEntry = COMPONENT_METADATA[normalized].selectors;
		let selectors: string[] = [];

		if (platform && platform !== "generic") {
			selectors = getComponentSelector(normalized, platform);

			if (selectors.length === 0) {
				const availability = getComponentPlatformAvailability(normalized);
				const availablePlatforms: string[] = [];

				if (availability?.angular) availablePlatforms.push("angular");
				if (availability?.webcomponents)
					availablePlatforms.push("webcomponents");

				return {
					error: `**Error:** Component "${component}" is not available on platform "${platform}".
${availablePlatforms.length > 0 ? `Available platforms: ${availablePlatforms.join(", ")}.` : ""}`,
				};
			}
		} else {
			if (selectorsEntry.angular) {
				selectors = selectors.concat(buildSelectorList(selectorsEntry.angular));
			}

			if (selectorsEntry.webcomponents) {
				selectors = selectors.concat(
					buildSelectorList(selectorsEntry.webcomponents),
				);
			}

			if (selectorsEntry.angular && selectorsEntry.webcomponents) {
				notes.push(
					"Platform not specified; output includes Angular and Web Components selectors.",
				);
			}
		}

		return {
			selectors: Array.from(new Set(selectors)),
			notes,
			scopeLabel: `component "${normalized}"`,
		};
	}

	if (scope) {
		return {
			selectors: [scope],
			notes,
			scopeLabel: `scope "${scope}"`,
		};
	}

	return {
		selectors: [":root"],
		notes,
		scopeLabel: "global scope (:root)",
	};
}

function formatSelectorBlock(
	selectors: string[],
	declarations: string[],
): string {
	const selectorLine = selectors.join(",\n");
	const lines = [
		selectorLine,
		"{",
		...declarations.map((line) => `  ${line}`),
		"}",
	];

	return lines.join("\n");
}

function buildResponse(
	description: string,
	output: "css" | "sass",
	code: string,
	notes: string[],
	guidance: string[],
): { content: { type: "text"; text: string }[] } {
	const responseParts: string[] = [description];

	if (notes.length > 0) {
		responseParts.push("", ...notes);
	}

	if (guidance.length > 0) {
		responseParts.push("", ...guidance);
	}

	responseParts.push("");
	responseParts.push(output === "sass" ? "```scss" : "```css");
	responseParts.push(code);
	responseParts.push("```");

	return {
		content: [
			{
				type: "text" as const,
				text: responseParts.join("\n"),
			},
		],
	};
}

function coerceSizeValue(size: string | number): {
	display: string;
	value: number;
} {
	if (typeof size === "number") {
		return { display: String(size), value: size };
	}

	const normalized = size.toLowerCase();
	const value = SIZE_KEYWORDS[normalized];

	return { display: `${size} (${value})`, value };
}

export async function handleSetSize(params: SetSizeParams) {
	const { component, scope, platform, size, output = "css" } = params;
	const resolution = resolveScope(component, scope, platform);

	if ("error" in resolution) {
		return {
			content: [{ type: "text" as const, text: resolution.error }],
			isError: true,
		};
	}

	const { selectors, notes, scopeLabel } = resolution;
	const { display, value } = coerceSizeValue(size);

	const declarations: string[] = [`--ig-size: ${value};`];
	const code = formatSelectorBlock(selectors, declarations);
	const description = `Set size to ${display} in ${scopeLabel}.`;

	const guidance =
		output === "sass"
			? [
					"Sass note: sizable() requires @include sizable() in component styles.",
					"Components map --ig-size to --component-size internally.",
				]
			: [];

	return buildResponse(description, output, code, notes, guidance);
}

export async function handleSetSpacing(params: SetSpacingParams) {
	const {
		component,
		scope,
		platform,
		spacing,
		inline,
		block,
		output = "css",
	} = params;
	const resolution = resolveScope(component, scope, platform);

	if ("error" in resolution) {
		return {
			content: [{ type: "text" as const, text: resolution.error }],
			isError: true,
		};
	}

	const { selectors, notes, scopeLabel } = resolution;
	const declarations: string[] = [];

	if (spacing !== undefined) declarations.push(`--ig-spacing: ${spacing};`);
	if (inline !== undefined)
		declarations.push(`--ig-spacing-inline: ${inline};`);
	if (block !== undefined) declarations.push(`--ig-spacing-block: ${block};`);

	const code = formatSelectorBlock(selectors, declarations);
	const description = `Set spacing in ${scopeLabel}.`;
	const guidance =
		output === "sass"
			? [
					"Sass note: pad() functions require @include spacing() once at root scope.",
				]
			: [];

	return buildResponse(description, output, code, notes, guidance);
}

export async function handleSetRoundness(params: SetRoundnessParams) {
	const { component, scope, platform, radiusFactor, output = "css" } = params;
	const resolution = resolveScope(component, scope, platform);

	if ("error" in resolution) {
		return {
			content: [{ type: "text" as const, text: resolution.error }],
			isError: true,
		};
	}

	const { selectors, notes, scopeLabel } = resolution;

	const declarations = [`--ig-radius-factor: ${radiusFactor};`];
	const code = formatSelectorBlock(selectors, declarations);
	const description = `Set roundness factor to ${radiusFactor} in ${scopeLabel}.`;

	const guidance =
		output === "sass"
			? [
					"Sass note: border-radius() responds to --ig-radius-factor without extra mixins.",
				]
			: [];

	return buildResponse(description, output, code, notes, guidance);
}
