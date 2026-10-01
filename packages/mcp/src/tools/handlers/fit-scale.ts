/**
 * Handler for fit_color_scale tool.
 * Turns an existing color ladder into a `$scales` spec the palette tools accept.
 */

import { analyzeColorsWithHue } from "../../utils/color.js";
import { fitScale } from "../../utils/scale-fit.js";
import type { FitColorScaleParams } from "../schemas.js";

/** Renders the fitted spec as the Sass a user would paste into palette(). */
function toSass(
  range: [number, number],
  curve: [number, number, number, number] | null,
  family: string,
): string {
  const parts = [`range: (${range[0]}, ${range[1]})`];

  if (curve) {
    parts.push(`curve: (${curve.join(", ")})`);
  }

  return `$scales: ('${family}': (${parts.join(", ")}))`;
}

export async function handleFitColorScale(params: FitColorScaleParams) {
  const { colors, name } = params;

  const analyzed = await analyzeColorsWithHue(
    Object.fromEntries(colors.map((c, i) => [`rung${i}`, c])),
  );

  const luminances = colors.map((color, i) => {
    const entry = analyzed[`rung${i}`];

    if (!entry) {
      throw new Error(`Could not read the color at position ${i}: ${color}`);
    }

    return entry.luminance;
  });

  let fitted: ReturnType<typeof fitScale>;

  try {
    fitted = fitScale(luminances);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: "text" as const,
          text: `**Could not fit a scale**\n\n${message}`,
        },
      ],
      isError: true,
    };
  }

  const family = name ?? "gray";
  const worst = Math.max(
    ...fitted.rungs.map((r) => Math.abs(r.fitted - r.actual) / r.actual),
  );

  const lines = [
    `**Fitted scale${name ? ` for "${name}"` : ""}**`,
    "",
    `- range: \`(${fitted.range[0]}, ${fitted.range[1]})\` — contrast against white at the lightest and darkest rungs`,
    `- curve: ${fitted.curve ? `\`(${fitted.curve.join(", ")})\`` : "`null` — the ladder is already evenly spread, so no curve is needed"}`,
    `- fit: RMS ${fitted.rms}, worst rung off by ${(worst * 100).toFixed(1)}%`,
    "",
    "Pass it to create_palette or create_theme as:",
    "```json",
    JSON.stringify(
      {
        scales: {
          [family]: fitted.curve
            ? { range: fitted.range, curve: fitted.curve }
            : { range: fitted.range },
        },
      },
      null,
      2,
    ),
    "```",
    "",
    "Or write it directly in Sass:",
    "```scss",
    toSass(fitted.range, fitted.curve, family),
    "```",
    "",
    "| rung | ladder | fitted |",
    "|------|--------|--------|",
    ...fitted.rungs.map(
      (r) => `| ${r.index} | ${r.actual}:1 | ${r.fitted}:1 |`,
    ),
  ];

  if (worst > 0.1) {
    lines.push(
      "",
      "Note: the ladder does not follow a single smooth curve, so the fit is approximate. " +
        "Check the table above before using it.",
    );
  }

  return {
    content: [{ type: "text" as const, text: lines.join("\n") }],
  };
}
