import { describe, expect, it } from "vitest";
import {
  CHART_BRUSHES_COLOR_BLIND,
  CHART_BRUSHES_REGULAR,
} from "../../../knowledge/chart-colors.js";
import { handleGetChartSeriesColors } from "../../../tools/handlers/chart-colors.js";

describe("handleGetChartSeriesColors", () => {
  describe("default palette retrieval", () => {
    it("returns the full regular palette by default", async () => {
      const result = await handleGetChartSeriesColors({});
      const text = result.content[0].text;

      expect(text).toContain("regular, 10 colors");
      expect(text).toContain("var(--chart-brushes)");
      for (const color of CHART_BRUSHES_REGULAR) {
        expect(text).toContain(color);
      }
    });

    it("returns the color-blind palette when requested", async () => {
      const result = await handleGetChartSeriesColors({ mode: "color-blind" });
      const text = result.content[0].text;

      expect(text).toContain("color-blind, 10 colors");
      for (const color of CHART_BRUSHES_COLOR_BLIND) {
        expect(text).toContain(color);
      }
    });

    it("mentions the accessibility toggle only for the regular palette", async () => {
      const regular = await handleGetChartSeriesColors({});
      const colorBlind = await handleGetChartSeriesColors({
        mode: "color-blind",
      });

      expect(regular.content[0].text).toContain("configure-colors");
      expect(colorBlind.content[0].text).not.toContain("configure-colors");
    });
  });

  describe("single brush lookup by index", () => {
    it("returns the brush at the given 1-based index", async () => {
      const result = await handleGetChartSeriesColors({ index: 1 });
      const text = result.content[0].text;

      expect(text).toContain(CHART_BRUSHES_REGULAR[0]);
    });

    it("respects mode when looking up by index", async () => {
      const result = await handleGetChartSeriesColors({
        index: 2,
        mode: "color-blind",
      });
      const text = result.content[0].text;

      expect(text).toContain(CHART_BRUSHES_COLOR_BLIND[1]);
    });
  });

  describe("chart-type-aware guidance", () => {
    it("returns the token table and theme function for a known chart type", async () => {
      const result = await handleGetChartSeriesColors({
        chartType: "category-chart",
      });
      const text = result.content[0].text;

      expect(text).toContain("category-chart-theme()");
      expect(text).toContain("brushes");
      expect(text).toContain("negative-brushes");
      expect(text).toContain("fixed (chart-specific)");
    });

    it("uses the tokens() mixin, not the deprecated css-vars() mixin, in generated snippets", async () => {
      const result = await handleGetChartSeriesColors({
        chartType: "category-chart",
      });
      const text = result.content[0].text;

      expect(text).toContain("@include tokens($custom-theme);");
      expect(text).not.toContain("css-vars(");
    });

    it("mentions the theme-vs-component-property precedence", async () => {
      const result = await handleGetChartSeriesColors({
        chartType: "financial-chart",
      });

      expect(result.content[0].text).toContain("takes precedence");
    });

    it("returns an error with a sparkline-specific explanation", async () => {
      const result = await handleGetChartSeriesColors({
        chartType: "sparkline",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("intentionally out of scope");
    });

    it("returns an error with suggestions for an unknown chart type", async () => {
      const result = await handleGetChartSeriesColors({
        chartType: "not-a-real-chart",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("not found");
    });
  });

  describe("custom brush list validation", () => {
    it("accepts a valid, distinguishable custom brush list", async () => {
      const result = await handleGetChartSeriesColors({
        customBrushes: ["#4285f4", "#ea4335", "#fbbc05", "#34a853"],
      });
      const text = result.content[0].text;

      expect(result.isError).toBeUndefined();
      expect(text).toContain("is valid");
      expect(text).toContain("$brushes: (#4285f4, #ea4335, #fbbc05, #34a853);");
    });

    it("rejects an invalid color in the custom list", async () => {
      const result = await handleGetChartSeriesColors({
        customBrushes: ["#4285f4", "not-a-color"],
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("validation failed");
    });

    it("warns when fewer than the recommended minimum brushes are provided", async () => {
      const result = await handleGetChartSeriesColors({
        customBrushes: ["#4285f4"],
      });

      expect(result.content[0].text.toLowerCase()).toContain(
        "at least 3 distinguishable",
      );
    });

    it("warns about brushes with similar hues", async () => {
      const result = await handleGetChartSeriesColors({
        customBrushes: ["#ff0000", "#fe0101", "#0000ff"],
      });

      expect(result.content[0].text).toContain("similar hues");
    });
  });
});
