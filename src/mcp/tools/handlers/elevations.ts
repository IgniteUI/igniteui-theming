/**
 * Handler for create_elevations tool.
 */

import { generateElevations } from "../../generators/sass.js";
import type { CreateElevationsParams } from "../schemas.js";

export function handleCreateElevations(params: CreateElevationsParams) {
	const result = generateElevations({
		platform: params.platform,
		licensed: params.licensed,
		designSystem: params.designSystem,
		name: params.name,
	});

	// Build response text
	const responseParts: string[] = [result.description];

	// Add platform hint if not specified
	const platformNote = params.platform
		? `Platform: ${params.platform === "angular" ? "Ignite UI for Angular" : "Ignite UI for Web Components"}`
		: "Platform: Not specified (generic output). Specify `platform` for optimized code.";
	responseParts.push("");
	responseParts.push(platformNote);

	responseParts.push("");
	responseParts.push(`Variables used: ${result.variables.join(", ")}`);
	responseParts.push("");
	responseParts.push("```scss");
	responseParts.push(result.code.trimEnd());
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
