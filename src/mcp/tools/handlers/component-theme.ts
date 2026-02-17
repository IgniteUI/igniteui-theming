/**
 * Handler for create_component_theme tool.
 * Generates Sass code to customize a component's appearance.
 */

import { generateComponentTheme } from "../../generators/sass.js";
import {
	COMPONENT_NAMES,
	getComponentPlatformAvailability,
	getComponentSelector,
	getComponentTheme,
	getVariants,
	hasVariants,
	isComponentAvailable,
	searchComponents,
	validateTokens,
} from "../../knowledge/index.js";
import type { CreateComponentThemeParams } from "../schemas.js";

export async function handleCreateComponentTheme(
	params: CreateComponentThemeParams,
) {
	const {
		platform,
		component,
		tokens,
		selector,
		name,
		output = "sass",
		designSystem = "material",
		variant = "light",
	} = params;
	const normalizedComponent = component.toLowerCase().trim();

	if (!platform) {
		return {
			content: [
				{
					type: "text" as const,
					text: `**Error:** The \`platform\` parameter is required.

**Valid platforms:**
- \`angular\` - Ignite UI for Angular
- \`webcomponents\` - Ignite UI for Web Components
- \`react\` - Ignite UI for React
- \`blazor\` - Ignite UI for Blazor

Please specify which platform you're using to generate the correct variable prefixes and selectors.`,
				},
			],
			isError: true,
		};
	}

	// Validate component exists
	const theme = getComponentTheme(normalizedComponent);

	if (!theme) {
		const suggestions = searchComponents(normalizedComponent);
		const componentList =
			suggestions.length > 0
				? suggestions.slice(0, 10)
				: COMPONENT_NAMES.slice(0, 15);

		return {
			content: [
				{
					type: "text" as const,
					text: `**Error:** Component "${component}" not found.

${suggestions.length > 0 ? "**Similar components:**" : "**Available components:**"}
${componentList.map((c) => `- ${c}`).join("\n")}

**Tip:** Use \`get_component_design_tokens\` first to discover valid component names and their tokens.`,
				},
			],
			isError: true,
		};
	}

	// Check if component is a base variant component (button, icon-button)
	// These components require specific variants for theming
	if (hasVariants(normalizedComponent)) {
		const variants = getVariants(normalizedComponent);
		return {
			content: [
				{
					type: "text" as const,
					text: `**Error:** The \`${component}\` component has multiple variants and requires a specific variant for theming.

**Available variants:**
${variants.map((v) => `- \`${v}\``).join("\n")}

Please use \`create_component_theme\` with one of the specific variant names above.

**Tip:** Use \`get_component_design_tokens\` with a specific variant (e.g., \`${variants[0]}\`) to see available tokens.`,
				},
			],
			isError: true,
		};
	}

	if (platform) {
		const isAvailable = isComponentAvailable(normalizedComponent, platform);

		if (!isAvailable) {
			const availability =
				getComponentPlatformAvailability(normalizedComponent);
			const availablePlatforms: string[] = [];

			if (availability?.angular) availablePlatforms.push("Angular");
			if (availability?.webcomponents)
				availablePlatforms.push("Web Components");

			const error = `**Error:** The \`${component}\` component is not available on ${platform === "angular" ? "Ignite UI for Angular" : "Ignite UI for Web Components"}. ${availablePlatforms.length > 0 ? `It is available on: ${availablePlatforms.join(", ")}.` : ""}`;

			return {
				content: [{ type: "text" as const, text: error }],
				isError: true,
			};
		}
	}

	// Validate tokens
	const tokenNames = Object.keys(tokens);

	if (tokenNames.length === 0) {
		return {
			content: [
				{
					type: "text" as const,
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
					type: "text" as const,
					text: `**Error:** Invalid token(s) for component "${component}":
${validation.invalidTokens.map((t) => `- \`${t}\``).join("\n")}

**Valid tokens for ${component}:**
${validation.validTokens
	.slice(0, 20)
	.map((t) => `- \`${t}\``)
	.join(
		"\n",
	)}${validation.validTokens.length > 20 ? `\n... and ${validation.validTokens.length - 20} more` : ""}

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

	if (output === "css") {
		try {
			const { generateComponentThemeCss, formatCssOutput } = await import(
				"../../generators/css.js"
			);

			const result = await generateComponentThemeCss({
				platform,
				component: normalizedComponent,
				tokens,
				selector: finalSelector,
				name,
				designSystem,
				variant,
			});

			// Build response
			const responseParts: string[] = [];

			responseParts.push(result.description);
			responseParts.push("");

			// Platform info
			const platformNote = platform
				? `Platform: ${platform === "angular" ? "Ignite UI for Angular" : `Ignite UI for ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}`
				: "Platform: Not specified (generic output). Specify `platform` for optimized imports.";
			responseParts.push(platformNote);

			// Design system info
			responseParts.push(
				`Design System: ${designSystem.charAt(0).toUpperCase() + designSystem.slice(1)} (${variant})`,
			);

			// Selector info
			if (finalSelector) {
				responseParts.push(`Selector: \`${finalSelector}\``);
			}

			responseParts.push("");
			responseParts.push("```css");
			responseParts.push(
				formatCssOutput(result.css, result.description).trimEnd(),
			);
			responseParts.push("```");

			// Add usage hint
			responseParts.push("");
			responseParts.push("---");
			responseParts.push(
				"**Usage:** Include this CSS in your stylesheet or add it to your application's global styles.",
			);

			return {
				content: [
					{
						type: "text" as const,
						text: responseParts.join("\n"),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `**Error generating CSS:** ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	}

	// Generate the Sass code (original behavior)
	try {
		const result = generateComponentTheme({
			platform,
			licensed: params.licensed,
			component: normalizedComponent,
			tokens,
			selector: finalSelector,
			name,
			designSystem,
			variant,
		});

		// Build response
		const responseParts: string[] = [];

		responseParts.push(result.description);
		responseParts.push("");

		// Platform info
		const platformNote = platform
			? `Platform: ${platform === "angular" ? "Ignite UI for Angular" : `Ignite UI for ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}`
			: "Platform: Not specified (generic output). Specify `platform` for optimized imports.";
		responseParts.push(platformNote);

		// Design system info
		responseParts.push(
			`Design System: ${designSystem.charAt(0).toUpperCase() + designSystem.slice(1)} (${variant})`,
		);

		// Selector info
		if (finalSelector) {
			responseParts.push(`Selector: \`${finalSelector}\``);
		}

		responseParts.push("");
		responseParts.push(`Variables created: ${result.variables.join(", ")}`);
		responseParts.push("");
		responseParts.push("```scss");
		responseParts.push(result.code.trimEnd());
		responseParts.push("```");

		// Add usage hint
		responseParts.push("");
		responseParts.push("---");
		responseParts.push(
			"**Usage:** Import this Sass file in your main styles file, or include the code in your theme file.",
		);

		return {
			content: [
				{
					type: "text" as const,
					text: responseParts.join("\n"),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `**Error generating theme:** ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		};
	}
}
