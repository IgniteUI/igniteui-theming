/**
 * Handler for read_resource tool.
 * Reads theming resource content by URI, bypassing the custom protocol scheme.
 */

import {
	getResourceContent,
	RESOURCE_DEFINITIONS,
} from "../../resources/index.js";
import type { ReadResourceParams } from "../schemas.js";

export async function handleReadResource(params: ReadResourceParams) {
	const { uri } = params;
	const content = getResourceContent(uri);

	if (!content) {
		const available = RESOURCE_DEFINITIONS.map(
			(r) => `  - ${r.uri}: ${r.name}`,
		).join("\n");

		return {
			content: [
				{
					type: "text" as const,
					text: `Resource not found: ${uri}\n\nAvailable resources:\n${available}`,
				},
			],
			isError: true,
		};
	}

	return {
		content: [
			{
				type: "text" as const,
				text: content.content,
			},
		],
	};
}
