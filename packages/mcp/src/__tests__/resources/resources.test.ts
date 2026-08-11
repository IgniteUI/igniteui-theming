import { describe, expect, it } from "vitest";
import { getResourceContent, RESOURCE_URIS } from "../../resources/index.js";

describe("resource handlers", () => {
  it("returns platform listing resource", () => {
    const result = getResourceContent(RESOURCE_URIS.PLATFORMS);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("application/json");

    const payload = JSON.parse(result?.content ?? "{}");
    expect(payload.platforms).toContain("angular");
    expect(payload.platforms).toContain("webcomponents");
  });

  it("returns angular platform resource", () => {
    const result = getResourceContent(RESOURCE_URIS.PLATFORM_ANGULAR);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("application/json");

    const payload = JSON.parse(result?.content ?? "{}");
    expect(
      payload.platform?.id ?? payload.platform?.name ?? payload.platform,
    ).toBeTruthy();
    expect(payload.schemas).toBeDefined();
    expect(payload.palettes).toBeDefined();
  });

  it("returns palette presets resource", () => {
    const result = getResourceContent(RESOURCE_URIS.PALETTES);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("application/json");

    const payload = JSON.parse(result?.content ?? "{}");
    expect(Object.keys(payload).length).toBeGreaterThan(0);
  });

  it("returns color guidance markdown resource", () => {
    const result = getResourceContent(RESOURCE_URIS.GUIDANCE_COLORS_RULES);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("text/markdown");
    expect(result?.content.length).toBeGreaterThan(0);
  });

  it("returns layout documentation resource", () => {
    const result = getResourceContent(RESOURCE_URIS.DOCS_LAYOUT_OVERVIEW);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("text/markdown");
    expect(result?.content.length).toBeGreaterThan(0);
  });

  it("returns chart series colors guidance resource", () => {
    const result = getResourceContent(RESOURCE_URIS.GUIDANCE_COLORS_CHARTS);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("text/markdown");
    expect(result?.content.length).toBeGreaterThan(0);
    expect(result?.content).toContain("precedence");
  });

  it("returns chart series brush palettes resource", () => {
    const result = getResourceContent(RESOURCE_URIS.PRESETS_CHART_BRUSHES);

    expect(result).not.toBeNull();
    expect(result?.mimeType).toBe("application/json");

    const payload = JSON.parse(result?.content ?? "{}");
    expect(payload.regular).toHaveLength(10);
    expect(payload["color-blind"]).toHaveLength(10);
    expect(payload.chartTypeTokens).not.toHaveProperty("sparkline");
    expect(payload.chartTypeTokens["category-chart"]).toBeDefined();
  });

  it("lists the chart series colors guidance in the color guidance overview", () => {
    const result = getResourceContent(RESOURCE_URIS.GUIDANCE_COLORS);

    expect(result).not.toBeNull();
    const payload = JSON.parse(result?.content ?? "{}");
    const uris = payload.resources.map((r: { uri: string }) => r.uri);
    expect(uris).toContain(RESOURCE_URIS.GUIDANCE_COLORS_CHARTS);
  });
});
