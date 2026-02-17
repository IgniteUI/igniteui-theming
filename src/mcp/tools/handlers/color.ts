/**
 * Handler for get_color tool.
 * Retrieves palette colors as CSS variable references.
 */

import type { GetColorParams } from "../schemas.js";

/**
 * Build a CSS variable reference for a palette color.
 */
function buildColorReference(
	color: string,
	variant: string,
	contrast: boolean,
): string {
	const suffix = contrast ? "-contrast" : "";
	return `var(--ig-${color}-${variant}${suffix})`;
}

/**
 * Wrap a color reference with opacity using CSS relative color syntax.
 */
function applyOpacity(colorRef: string, opacity: number): string {
	return `hsl(from ${colorRef} h s l / ${opacity})`;
}

export async function handleGetColor(params: GetColorParams) {
	const { color, variant = "500", contrast = false, opacity } = params;

	// Build the color reference
	let result = buildColorReference(color, variant, contrast);

	// Apply opacity if specified
	if (opacity !== undefined) {
		result = applyOpacity(result, opacity);
	}

	// Build response
	const description = buildDescription(color, variant, contrast, opacity);

	return {
		content: [
			{
				type: "text" as const,
				text: [
					description,
					"",
					"```css",
					result,
					"```",
					"",
					buildUsageExample(color, variant, contrast, opacity, result),
				].join("\n"),
			},
		],
	};
}

/**
 * Build a human-readable description of what was returned.
 */
function buildDescription(
	color: string,
	variant: string,
	contrast: boolean,
	opacity?: number,
): string {
	let desc = contrast
		? `Contrast color for ${color} ${variant}`
		: `${color.charAt(0).toUpperCase() + color.slice(1)} color, shade ${variant}`;

	if (opacity !== undefined) {
		desc += ` at ${Math.round(opacity * 100)}% opacity`;
	}

	return desc;
}

/**
 * Build a usage example showing how to use the returned value.
 */
function buildUsageExample(
	color: string,
	variant: string,
	contrast: boolean,
	opacity: number | undefined,
	result: string,
): string {
	const examples: string[] = ["**Usage example:**"];

	if (contrast) {
		examples.push("```scss");
		examples.push(".my-element {");
		examples.push(`  background: var(--ig-${color}-${variant});`);
		examples.push(`  color: ${result};`);
		examples.push("}");
		examples.push("```");
	} else if (opacity !== undefined) {
		examples.push("```scss");
		examples.push(".my-element {");
		examples.push(`  background: ${result};`);
		examples.push("}");
		examples.push("```");
	} else {
		examples.push("```scss");
		examples.push(".my-element {");
		examples.push(`  background: ${result};`);
		examples.push(`  color: var(--ig-${color}-${variant}-contrast);`);
		examples.push("}");
		examples.push("```");
	}

	return examples.join("\n");
}
