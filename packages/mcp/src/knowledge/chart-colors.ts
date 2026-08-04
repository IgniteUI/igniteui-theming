/**
 * Chart series colors knowledge base.
 *
 * Ignite UI charts draw their default categorical colors from a shared,
 * fixed 10-color palette (regular + color-blind variants) rather than the
 * primary/secondary/gray palette used by other components. This module
 * exposes that palette plus a map of which list-valued color tokens each
 * in-scope chart type exposes.
 *
 * Explicitly out of scope (see docs/colors/chart-series.md for why):
 * - Sparkline: all color tokens are singular and default from `primary`.
 * - Selection/highlight colors (`selectionBrush`, `focusBrush`): component-only,
 *   no Sass theme equivalent exists.
 */

import { ChartBrushes } from "igniteui-theming";
import CHART_SERIES_COLORS_MARKDOWN from "./docs/colors/chart-series.md?raw";

export { CHART_SERIES_COLORS_MARKDOWN };

/**
 * A single list-valued color token exposed by a chart theme function.
 */
export interface ChartColorToken {
  /** Token name as used in the Sass theme function's argument (kebab-case), e.g. 'brushes'. */
  name: string;
  /**
   * Whether this token's default value is the shared series brush palette
   * (`series`, resolving to `var(--chart-brushes)`) or a fixed, chart-specific
   * default (e.g. category-chart's `negative-brushes` defaults to a fixed red).
   */
  defaultSource: "series" | "fixed";
  /** Human-readable description of what this token colors. */
  description: string;
}

/**
 * Color token information for a single chart type.
 */
export interface ChartTypeColorInfo {
  /** Display name, e.g. 'Category Chart'. */
  displayName: string;
  /** Sass theme function name, e.g. 'category-chart-theme'. */
  themeFunctionName: string;
  /** The chart type's list-valued series color tokens. */
  colorTokens: ChartColorToken[];
}

/**
 * Chart type keys intentionally excluded from `CHART_TYPE_COLOR_TOKENS`.
 * Kept as an explicit list (not just a comment) so tests can assert the
 * exclusion holds even as the map above is edited.
 */
export const EXCLUDED_CHART_TYPES = ["sparkline"] as const;

/**
 * Per-chart-type list-valued series color tokens, scoped to chart types that
 * expose an array-valued brush/outline palette (category, data, doughnut,
 * pie, funnel, shape, financial, linear/radial gauge, bullet graph).
 *
 * Sourced from `packages/theming/sass/themes/schemas/charts/light/*.scss`.
 */
export const CHART_TYPE_COLOR_TOKENS: Record<string, ChartTypeColorInfo> = {
  "category-chart": {
    displayName: "Category Chart",
    themeFunctionName: "category-chart-theme",
    colorTokens: [
      {
        name: "brushes",
        defaultSource: "series",
        description: "Fill colors for each series.",
      },
      {
        name: "marker-brushes",
        defaultSource: "series",
        description: "Fill colors for data point markers.",
      },
      {
        name: "outlines",
        defaultSource: "series",
        description: "Outline colors for each series.",
      },
      {
        name: "marker-outlines",
        defaultSource: "series",
        description: "Outline colors for data point markers.",
      },
      {
        name: "trend-line-brushes",
        defaultSource: "series",
        description: "Colors for trend lines.",
      },
      {
        name: "negative-brushes",
        defaultSource: "fixed",
        description:
          "Fill color(s) for negative values in contextual charts like Waterfall (fixed red default, not the series palette).",
      },
      {
        name: "negative-outlines",
        defaultSource: "fixed",
        description:
          "Outline color(s) for negative values in contextual charts like Waterfall (fixed red default, not the series palette).",
      },
    ],
  },
  "data-chart": {
    displayName: "Data Chart",
    themeFunctionName: "data-chart-theme",
    colorTokens: [
      {
        name: "brushes",
        defaultSource: "series",
        description: "Fill colors for each series.",
      },
      {
        name: "marker-brushes",
        defaultSource: "series",
        description: "Fill colors for data point markers.",
      },
      {
        name: "outlines",
        defaultSource: "series",
        description: "Outline colors for each series.",
      },
      {
        name: "marker-outlines",
        defaultSource: "series",
        description: "Outline colors for data point markers.",
      },
    ],
  },
  "doughnut-chart": {
    displayName: "Doughnut Chart",
    themeFunctionName: "doughnut-chart-theme",
    colorTokens: [
      {
        name: "brushes",
        defaultSource: "series",
        description: "Fill colors for each slice.",
      },
      {
        name: "outlines",
        defaultSource: "series",
        description: "Outline colors for each slice.",
      },
    ],
  },
  "pie-chart": {
    displayName: "Pie Chart",
    themeFunctionName: "pie-chart-theme",
    colorTokens: [
      {
        name: "brushes",
        defaultSource: "series",
        description: "Fill colors for each slice.",
      },
      {
        name: "outlines",
        defaultSource: "series",
        description: "Outline colors for each slice.",
      },
    ],
  },
  "funnel-chart": {
    displayName: "Funnel Chart",
    themeFunctionName: "funnel-chart-theme",
    colorTokens: [
      {
        name: "brushes",
        defaultSource: "series",
        description: "Fill colors for each segment.",
      },
      {
        name: "outlines",
        defaultSource: "series",
        description: "Outline colors for each segment.",
      },
    ],
  },
  "shape-chart": {
    displayName: "Shape Chart",
    themeFunctionName: "shape-chart-theme",
    colorTokens: [
      {
        name: "brushes",
        defaultSource: "series",
        description: "Fill colors for each series.",
      },
      {
        name: "marker-brushes",
        defaultSource: "series",
        description: "Fill colors for data point markers.",
      },
      {
        name: "outlines",
        defaultSource: "series",
        description: "Outline colors for each series.",
      },
      {
        name: "marker-outlines",
        defaultSource: "series",
        description: "Outline colors for data point markers.",
      },
      {
        name: "trend-line-brushes",
        defaultSource: "series",
        description: "Colors for trend lines.",
      },
    ],
  },
  "financial-chart": {
    displayName: "Financial Chart",
    themeFunctionName: "financial-chart-theme",
    colorTokens: [
      {
        name: "brushes",
        defaultSource: "series",
        description: "Fill colors for each series.",
      },
      {
        name: "outlines",
        defaultSource: "series",
        description: "Outline colors for each series.",
      },
      {
        name: "marker-brushes",
        defaultSource: "series",
        description: "Fill colors for data point markers.",
      },
      {
        name: "marker-outlines",
        defaultSource: "series",
        description: "Outline colors for data point markers.",
      },
      {
        name: "negative-brushes",
        defaultSource: "series",
        description:
          "Fill color(s) for negative price elements (defaults to the series palette, unlike category-chart's fixed default).",
      },
      {
        name: "negative-outlines",
        defaultSource: "series",
        description:
          "Outline color(s) for negative price elements (defaults to the series palette, unlike category-chart's fixed default).",
      },
      {
        name: "indicator-brushes",
        defaultSource: "series",
        description: "Colors used for financial indicators.",
      },
      {
        name: "indicator-negative-brushes",
        defaultSource: "series",
        description: "Colors for negative elements in financial indicators.",
      },
      {
        name: "overlay-brushes",
        defaultSource: "series",
        description: "Colors used for financial overlays.",
      },
      {
        name: "trend-line-brushes",
        defaultSource: "series",
        description: "Colors for trend lines.",
      },
      {
        name: "volume-brushes",
        defaultSource: "series",
        description: "Fill colors for volume series in the volume pane.",
      },
      {
        name: "volume-outlines",
        defaultSource: "series",
        description: "Outline colors for volume series in the volume pane.",
      },
    ],
  },
  "linear-gauge": {
    displayName: "Linear Gauge",
    themeFunctionName: "linear-gauge-theme",
    colorTokens: [
      {
        name: "range-brushes",
        defaultSource: "series",
        description: "Fill colors for the gauge's comparative ranges.",
      },
      {
        name: "range-outlines",
        defaultSource: "series",
        description: "Outline colors for the gauge's comparative ranges.",
      },
    ],
  },
  "radial-gauge": {
    displayName: "Radial Gauge",
    themeFunctionName: "radial-gauge-theme",
    colorTokens: [
      {
        name: "range-brushes",
        defaultSource: "series",
        description: "Fill colors for the gauge's comparative ranges.",
      },
      {
        name: "range-outlines",
        defaultSource: "series",
        description: "Outline colors for the gauge's comparative ranges.",
      },
    ],
  },
  "bullet-graph": {
    displayName: "Bullet Graph",
    themeFunctionName: "bullet-graph-theme",
    colorTokens: [
      {
        name: "range-brushes",
        defaultSource: "series",
        description: "Fill colors for the graph's comparative ranges.",
      },
      {
        name: "range-outlines",
        defaultSource: "series",
        description: "Outline colors for the graph's comparative ranges.",
      },
    ],
  },
};

/**
 * List of in-scope chart type keys (stable order matching the map above).
 */
export const CHART_TYPES = Object.keys(CHART_TYPE_COLOR_TOKENS);

/**
 * Convert a `{ "brush-1": "...", "brush-2": "...", ... }` record into an
 * ordered array by numeric suffix.
 */
function toOrderedBrushList(brushSet: Record<string, string>): string[] {
  return Object.entries(brushSet)
    .sort(([a], [b]) => {
      const na = Number(a.replace("brush-", ""));
      const nb = Number(b.replace("brush-", ""));
      return na - nb;
    })
    .map(([, color]) => color);
}

/**
 * The default (regular) 10-color chart series palette, in order.
 */
export const CHART_BRUSHES_REGULAR: string[] = toOrderedBrushList(
  ChartBrushes.regular,
);

/**
 * The color-blind-friendly 10-color chart series palette, in order.
 * Activated via `configure-colors($enhanced-accessibility: true)`.
 */
export const CHART_BRUSHES_COLOR_BLIND: string[] = toOrderedBrushList(
  ChartBrushes["color-blind"],
);

/**
 * Get color token info for a chart type.
 * @param chartType - The chart type key (e.g. 'category-chart').
 * @returns The chart type's color token info, or undefined if not found or
 * intentionally excluded (e.g. 'sparkline').
 */
export function getChartTypeColorTokens(
  chartType: string,
): ChartTypeColorInfo | undefined {
  return CHART_TYPE_COLOR_TOKENS[chartType];
}

/**
 * Resolve the series brush palette for a given mode.
 * @param mode - 'regular' (default) or 'color-blind'.
 * @returns The ordered 10-color palette for that mode.
 */
export function getChartBrushPalette(
  mode: "regular" | "color-blind" = "regular",
): string[] {
  return mode === "color-blind"
    ? CHART_BRUSHES_COLOR_BLIND
    : CHART_BRUSHES_REGULAR;
}
