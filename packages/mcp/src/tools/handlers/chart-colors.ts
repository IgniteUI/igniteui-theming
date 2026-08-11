/**
 * Handler for get_chart_series_colors tool.
 * Retrieves the shared chart series brush palette (regular/color-blind),
 * per-chart-type color-token guidance, and optionally validates a
 * user-supplied custom brush list.
 */

import {
  CHART_TYPES,
  getChartBrushPalette,
  getChartTypeColorTokens,
} from "../../knowledge/chart-colors.js";
import {
  analyzeColorsWithHue,
  DEFAULT_HUE_TOLERANCE,
  huesAreClose,
  validateColorsInBatch,
} from "../../utils/color.js";
import {
  formatValidationMessages,
  validationFailure,
  validationSuccess,
} from "../../utils/result.js";
import type { GetChartSeriesColorsParams } from "../schemas.js";

const MIN_RECOMMENDED_BRUSHES = 3;

/**
 * Plain text + error-flag shape returned by the internal builder functions.
 * Kept minimal and consistent so the exported handler can wrap it into a
 * fresh MCP content-array literal at each of its own return sites.
 */
interface TextResult {
  text: string;
  isError?: boolean;
}

export async function handleGetChartSeriesColors(
  params: GetChartSeriesColorsParams,
) {
  const { mode = "regular", index, chartType, customBrushes } = params;

  if (customBrushes) {
    const result = await buildCustomBrushValidationText(customBrushes);
    return {
      content: [{ type: "text" as const, text: result.text }],
      isError: result.isError,
    };
  }

  const palette = getChartBrushPalette(mode);

  if (index !== undefined) {
    const result = buildSingleBrushText(mode, index, palette);
    return { content: [{ type: "text" as const, text: result.text }] };
  }

  if (chartType) {
    const result = buildChartTypeText(chartType, palette);
    return {
      content: [{ type: "text" as const, text: result.text }],
      isError: result.isError,
    };
  }

  const result = buildPaletteText(mode, palette);
  return { content: [{ type: "text" as const, text: result.text }] };
}

/**
 * Validate a user-supplied custom brush list before it's used in a
 * `$brushes: (...)` theme override.
 */
async function buildCustomBrushValidationText(
  customBrushes: string[],
): Promise<TextResult> {
  const colorMap = Object.fromEntries(
    customBrushes.map((color, i) => [`brush-${i + 1}`, color]),
  );

  const validity = await validateColorsInBatch(colorMap);
  const invalidBrushes = customBrushes.filter(
    (_, i) => !validity[`brush-${i + 1}`],
  );

  if (invalidBrushes.length > 0) {
    const result = validationFailure(
      invalidBrushes.map((color) => ({
        field: color,
        message: `"${color}" could not be resolved as a valid CSS color by Sass.`,
        suggestion:
          "Use a hex, rgb(), hsl(), or named CSS color that Sass can parse.",
      })),
    );

    return {
      text: [
        `**Custom brush list validation failed** (${invalidBrushes.length}/${customBrushes.length} invalid)`,
        "",
        formatValidationMessages(result),
      ].join("\n"),
      isError: true,
    };
  }

  const analysis = await analyzeColorsWithHue(colorMap);
  const warnings: string[] = [];

  if (customBrushes.length < MIN_RECOMMENDED_BRUSHES) {
    warnings.push(
      `Only ${customBrushes.length} brush(es) provided. Most chart series palettes work best with at least ${MIN_RECOMMENDED_BRUSHES} distinguishable colors.`,
    );
  }

  const entries = Object.entries(analysis);
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [keyA, dataA] = entries[i];
      const [keyB, dataB] = entries[j];

      if (huesAreClose(dataA.hue, dataB.hue, DEFAULT_HUE_TOLERANCE)) {
        const colorA = customBrushes[Number(keyA.replace("brush-", "")) - 1];
        const colorB = customBrushes[Number(keyB.replace("brush-", "")) - 1];
        warnings.push(
          `"${colorA}" and "${colorB}" have similar hues (within ${DEFAULT_HUE_TOLERANCE}\u00b0) and may be hard to visually distinguish as separate series.`,
        );
      }
    }
  }

  const result = validationSuccess(
    warnings.map((message) => ({ message, severity: "warning" as const })),
  );

  const lines = [
    `**Custom brush list is valid** (${customBrushes.length} colors)`,
    "",
    "```scss",
    `$brushes: (${customBrushes.join(", ")});`,
    "```",
  ];

  if (warnings.length > 0) {
    lines.push("", formatValidationMessages(result));
  }

  return { text: lines.join("\n") };
}

function buildSingleBrushText(
  mode: "regular" | "color-blind",
  index: number,
  palette: string[],
): TextResult {
  const color = palette[index - 1];

  return {
    text: [
      `Chart series brush ${index} of 10 (${mode} palette): \`${color}\``,
      "",
      "```css",
      color,
      "```",
    ].join("\n"),
  };
}

function buildPaletteText(
  mode: "regular" | "color-blind",
  palette: string[],
): TextResult {
  const lines = [
    `**Chart series brush palette** (${mode}, ${palette.length} colors)`,
    "",
    "```scss",
    `(${palette.join(", ")})`,
    "```",
    "",
    "Resolved at runtime via the shared CSS variable:",
    "",
    "```css",
    "var(--chart-brushes)",
    "```",
  ];

  if (mode === "regular") {
    lines.push(
      "",
      "To switch every chart to the color-blind-friendly variant, use the `configure-colors` mixin:",
      "",
      "```scss",
      "@include configure-colors($enhanced-accessibility: true);",
      "```",
    );
  }

  lines.push(
    "",
    `Pass \`chartType\` (one of: ${CHART_TYPES.join(", ")}) to see which tokens on a specific chart type accept this palette.`,
  );

  return { text: lines.join("\n") };
}

function buildChartTypeText(chartType: string, palette: string[]): TextResult {
  const info = getChartTypeColorTokens(chartType);

  if (!info) {
    const suggestions = CHART_TYPES.filter((t) =>
      t.includes(chartType.toLowerCase()),
    );

    const notes =
      chartType.toLowerCase() === "sparkline"
        ? "\n\nSparkline is intentionally out of scope: its color tokens (`brush`, `low-marker-brush`, etc.) are singular and default from the `primary` palette, not this shared series palette."
        : "";

    return {
      text: [
        `Chart type "${chartType}" not found.${notes}`,
        "",
        suggestions.length > 0
          ? `**Similar chart types:** ${suggestions.join(", ")}`
          : `**Available chart types:** ${CHART_TYPES.join(", ")}`,
      ].join("\n"),
      isError: true,
    };
  }

  const seriesTokens = info.colorTokens.filter(
    (t) => t.defaultSource === "series",
  );
  const fixedTokens = info.colorTokens.filter(
    (t) => t.defaultSource === "fixed",
  );

  const lines = [
    `**${info.displayName}** \u2014 \`${info.themeFunctionName}()\``,
    "",
    "| Token | Default | Description |",
    "|---|---|---|",
    ...info.colorTokens.map(
      (t) =>
        `| \`${t.name}\` | ${t.defaultSource === "series" ? "shared series palette" : "fixed (chart-specific)"} | ${t.description} |`,
    ),
    "",
  ];

  if (fixedTokens.length > 0) {
    lines.push(
      `Note: ${fixedTokens.map((t) => `\`${t.name}\``).join(", ")} do${fixedTokens.length === 1 ? "es" : ""} **not** default to the shared series palette \u2014 see the description above.`,
      "",
    );
  }

  if (seriesTokens.length > 0) {
    const exampleArgs = seriesTokens
      .slice(0, 2)
      .map((t) => `\n  $${t.name}: (${palette.slice(0, 4).join(", ")}),`)
      .join("");

    lines.push(
      "```scss",
      "@use 'igniteui-theming/sass/themes/charts' as *;",
      "",
      `$custom-theme: ${info.themeFunctionName}(${exampleArgs}\n);`,
      "",
      ":root {",
      "  @include tokens($custom-theme);",
      "}",
      "```",
    );
  }

  lines.push(
    "",
    "**Reminder:** this sets the Sass theme default only. If the chart component instance also binds its own color-list property (e.g. `brushes`, `outlines`, `rangeBrushes`), that value takes precedence over this theme.",
  );

  return { text: lines.join("\n") };
}
