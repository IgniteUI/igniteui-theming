/**
 * Tests for chart-colors.ts knowledge base
 */

import { describe, expect, it } from "vitest";
import {
  CHART_BRUSHES_COLOR_BLIND,
  CHART_BRUSHES_REGULAR,
  CHART_SERIES_COLORS_MARKDOWN,
  CHART_TYPE_COLOR_TOKENS,
  CHART_TYPES,
  EXCLUDED_CHART_TYPES,
  getChartBrushPalette,
  getChartTypeColorTokens,
} from "../../knowledge/chart-colors.js";

describe("Chart Colors Knowledge Base", () => {
  describe("brush palettes", () => {
    it("has exactly 10 colors in the regular palette", () => {
      expect(CHART_BRUSHES_REGULAR).toHaveLength(10);
    });

    it("has exactly 10 colors in the color-blind palette", () => {
      expect(CHART_BRUSHES_COLOR_BLIND).toHaveLength(10);
    });

    it("regular and color-blind palettes are different", () => {
      expect(CHART_BRUSHES_REGULAR).not.toEqual(CHART_BRUSHES_COLOR_BLIND);
    });

    it("every brush entry is a non-empty color string", () => {
      for (const brush of [
        ...CHART_BRUSHES_REGULAR,
        ...CHART_BRUSHES_COLOR_BLIND,
      ]) {
        expect(typeof brush).toBe("string");
        expect(brush.length).toBeGreaterThan(0);
      }
    });

    it("getChartBrushPalette defaults to the regular palette", () => {
      expect(getChartBrushPalette()).toEqual(CHART_BRUSHES_REGULAR);
      expect(getChartBrushPalette("regular")).toEqual(CHART_BRUSHES_REGULAR);
    });

    it("getChartBrushPalette returns the color-blind palette on request", () => {
      expect(getChartBrushPalette("color-blind")).toEqual(
        CHART_BRUSHES_COLOR_BLIND,
      );
    });
  });

  describe("CHART_TYPE_COLOR_TOKENS", () => {
    const EXPECTED_CHART_TYPES = [
      "category-chart",
      "data-chart",
      "doughnut-chart",
      "pie-chart",
      "funnel-chart",
      "shape-chart",
      "financial-chart",
      "linear-gauge",
      "radial-gauge",
      "bullet-graph",
    ];

    it("includes every expected in-scope chart type", () => {
      for (const chartType of EXPECTED_CHART_TYPES) {
        expect(CHART_TYPE_COLOR_TOKENS).toHaveProperty(chartType);
      }
    });

    it("CHART_TYPES matches the keys of CHART_TYPE_COLOR_TOKENS", () => {
      expect(CHART_TYPES.sort()).toEqual(
        Object.keys(CHART_TYPE_COLOR_TOKENS).sort(),
      );
    });

    it("every chart type has at least one color token", () => {
      for (const [chartType, info] of Object.entries(CHART_TYPE_COLOR_TOKENS)) {
        expect(
          info.colorTokens.length,
          `${chartType} should have tokens`,
        ).toBeGreaterThan(0);
      }
    });

    it("every chart type has a themeFunctionName ending in -theme", () => {
      for (const info of Object.values(CHART_TYPE_COLOR_TOKENS)) {
        expect(info.themeFunctionName).toMatch(/-theme$/);
      }
    });

    it("every color token has a valid defaultSource", () => {
      for (const info of Object.values(CHART_TYPE_COLOR_TOKENS)) {
        for (const token of info.colorTokens) {
          expect(["series", "fixed"]).toContain(token.defaultSource);
        }
      }
    });

    it("does NOT include sparkline", () => {
      expect(CHART_TYPE_COLOR_TOKENS).not.toHaveProperty("sparkline");
      expect(CHART_TYPES).not.toContain("sparkline");
    });

    it("EXCLUDED_CHART_TYPES lists sparkline and none of them appear in the map", () => {
      expect(EXCLUDED_CHART_TYPES).toContain("sparkline");
      for (const excluded of EXCLUDED_CHART_TYPES) {
        expect(CHART_TYPE_COLOR_TOKENS).not.toHaveProperty(excluded);
      }
    });

    it("category-chart's negative-brushes/negative-outlines default to 'fixed'", () => {
      const tokens = CHART_TYPE_COLOR_TOKENS["category-chart"].colorTokens;
      const negativeBrushes = tokens.find((t) => t.name === "negative-brushes");
      const negativeOutlines = tokens.find(
        (t) => t.name === "negative-outlines",
      );
      expect(negativeBrushes?.defaultSource).toBe("fixed");
      expect(negativeOutlines?.defaultSource).toBe("fixed");
    });

    it("financial-chart's negative-brushes/negative-outlines default to 'series' (unlike category-chart)", () => {
      const tokens = CHART_TYPE_COLOR_TOKENS["financial-chart"].colorTokens;
      const negativeBrushes = tokens.find((t) => t.name === "negative-brushes");
      const negativeOutlines = tokens.find(
        (t) => t.name === "negative-outlines",
      );
      expect(negativeBrushes?.defaultSource).toBe("series");
      expect(negativeOutlines?.defaultSource).toBe("series");
    });

    it("gauge and bullet-graph types only expose range-brushes/range-outlines", () => {
      for (const chartType of [
        "linear-gauge",
        "radial-gauge",
        "bullet-graph",
      ]) {
        const names = CHART_TYPE_COLOR_TOKENS[chartType].colorTokens.map(
          (t) => t.name,
        );
        expect(names.sort()).toEqual(["range-brushes", "range-outlines"]);
      }
    });
  });

  describe("getChartTypeColorTokens", () => {
    it("returns info for a known chart type", () => {
      const info = getChartTypeColorTokens("category-chart");
      expect(info?.themeFunctionName).toBe("category-chart-theme");
    });

    it("returns undefined for an unknown chart type", () => {
      expect(getChartTypeColorTokens("not-a-real-chart")).toBeUndefined();
    });

    it("returns undefined for sparkline", () => {
      expect(getChartTypeColorTokens("sparkline")).toBeUndefined();
    });
  });

  describe("CHART_SERIES_COLORS_MARKDOWN", () => {
    it("is non-empty markdown content", () => {
      expect(CHART_SERIES_COLORS_MARKDOWN.length).toBeGreaterThan(0);
    });

    it("documents the theme-vs-component-property precedence", () => {
      expect(CHART_SERIES_COLORS_MARKDOWN.toLowerCase()).toContain(
        "precedence",
      );
    });

    it("explicitly notes sparkline and selection colors are not covered", () => {
      expect(CHART_SERIES_COLORS_MARKDOWN).toContain("Sparkline");
      expect(CHART_SERIES_COLORS_MARKDOWN).toContain("selectionBrush");
    });
  });
});
