/**
 * Handler for create_typography tool.
 */

import {
  formatCssOutput,
  generateTypographyCss,
} from "../../generators/css.js";
import { generateTypography } from "../../generators/sass.js";
import { PLATFORM_METADATA } from "../../knowledge/platforms/index.js";
import { SASS_USE_ASSEMBLY_NOTE } from "../../utils/sass.js";
import type { CreateTypographyParams } from "../schemas.js";

export async function handleCreateTypography(params: CreateTypographyParams) {
  const output =
    params.output ?? (params.platform === "angular" ? "sass" : "css");

  if (output === "css") {
    return handleCssOutput(params);
  }

  return handleSassOutput(params);
}

async function handleCssOutput(params: CreateTypographyParams) {
  try {
    const result = await generateTypographyCss({
      fontFamily: params.fontFamily,
      designSystem: params.designSystem,
    });

    const formattedCss = formatCssOutput(result.css, result.description);

    const responseParts: string[] = [result.description];
    responseParts.push("");
    responseParts.push("Output format: CSS custom properties");
    responseParts.push("");
    responseParts.push("```css");
    responseParts.push(formattedCss.trimEnd());
    responseParts.push("```");

    return {
      content: [{ type: "text" as const, text: responseParts.join("\n") }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text" as const,
          text: `**Error generating CSS typography**\n\n${message}`,
        },
      ],
      isError: true,
    };
  }
}

function handleSassOutput(params: CreateTypographyParams) {
  const result = generateTypography({
    platform: params.platform,
    licensed: params.licensed,
    fontFamily: params.fontFamily,
    designSystem: params.designSystem,
    customScale: params.customScale,
    name: params.name,
  });

  const responseParts: string[] = [result.description];

  const platformNote = params.platform
    ? `Platform: ${PLATFORM_METADATA[params.platform]?.name ?? params.platform}`
    : "Platform: Not specified (generic output). Specify `platform` for optimized code.";
  responseParts.push("");
  responseParts.push(platformNote);

  responseParts.push("");
  responseParts.push(`Variables used: ${result.variables.join(", ")}`);
  responseParts.push("");
  responseParts.push("```scss");
  responseParts.push(result.code.trimEnd());
  responseParts.push("```");
  responseParts.push(SASS_USE_ASSEMBLY_NOTE);

  return {
    content: [{ type: "text" as const, text: responseParts.join("\n") }],
  };
}
