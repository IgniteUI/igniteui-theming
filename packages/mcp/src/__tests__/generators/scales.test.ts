import { describe, expect, it } from "vitest";
import { generatePaletteCss } from "../../generators/css.js";
import { generatePalette, generateTheme } from "../../generators/sass.js";
import { SCALE_NAMES, SHADE_SCALES } from "../../knowledge/scales.js";
import { RESOURCE_URIS } from "../../resources/presets.js";
import { TOOL_DESCRIPTIONS } from "../../tools/descriptions.js";
import { handleFitColorScale } from "../../tools/handlers/fit-scale.js";
import {
  createPaletteSchema,
  fitColorScaleSchema,
} from "../../tools/schemas.js";

const base = { primary: "#09f", secondary: "#f0f", surface: "#fff" };

describe("shade scales", () => {
  it("exposes the presets the Sass ships", () => {
    // Generated from config.$scales, so this cannot drift from the generator.
    expect(SCALE_NAMES).toEqual(
      expect.arrayContaining(["even", "material", "tailwind", "carbon"]),
    );
    expect(SHADE_SCALES.even.curve).toBeNull();
    expect(SHADE_SCALES.carbon.curve).toHaveLength(4);
  });

  it("emits a named preset", () => {
    expect(generatePalette({ ...base, scales: "carbon" }).code).toContain(
      "$scales: 'carbon'",
    );
  });

  it("emits a per-family map", () => {
    expect(
      generatePalette({ ...base, scales: { gray: "tailwind" } }).code,
    ).toContain("$scales: ('gray': 'tailwind')");
  });

  it("emits an inline range and curve", () => {
    const code = generatePalette({
      ...base,
      scales: {
        gray: { range: [1.05, 17.85], curve: [0.611, 0.06, 0.249, 0.46] },
      },
    }).code;

    expect(code).toContain(
      "$scales: ('gray': (range: (1.05, 17.85), curve: (0.611, 0.06, 0.249, 0.46)))",
    );
  });

  it("carries the anchor through the generated JSON", () => {
    expect(SHADE_SCALES.material.anchor).toBe("white");
    expect(SHADE_SCALES.carbon.anchor).toBe("surface");
  });

  it("emits an inline anchor", () => {
    const code = generatePalette({
      ...base,
      scales: { gray: { range: [1.1, 14], anchor: "white" } },
    }).code;

    expect(code).toContain(
      "$scales: ('gray': (range: (1.1, 14), anchor: 'white'))",
    );
  });

  it("emits the generator only when asked", () => {
    expect(generatePalette(base).code).not.toContain("$generator");
    expect(generatePalette({ ...base, generator: "legacy" }).code).toContain(
      "$generator: 'legacy'",
    );
  });

  it("threads both through create_theme", () => {
    const code = generateTheme({
      primaryColor: "#09f",
      secondaryColor: "#f0f",
      surfaceColor: "#fff",
      scales: { gray: "carbon" },
      generator: "fitted",
    }).code;

    expect(code).toContain("$scales: ('gray': 'carbon')");
    expect(code).toContain("$generator: 'fitted'");
  });

  it("compiles, and a scale changes the grays it produces", async () => {
    const [plain, carbon] = await Promise.all([
      generatePaletteCss(base),
      generatePaletteCss({ ...base, scales: { gray: "carbon" } }),
    ]);

    const grays = (css: string) =>
      [...css.matchAll(/--ig-gray-(\d00): ([^;]+);/g)].map((m) => m[2]);

    expect(grays(plain.css).length).toBeGreaterThan(5);
    expect(grays(carbon.css)).not.toEqual(grays(plain.css));
  });

  describe("scales input", () => {
    const input = { platform: "webcomponents", ...base, variant: "light" };
    const parse = (scales: unknown) =>
      createPaletteSchema.safeParse({ ...input, scales });

    it("keeps a per-family map through validation", () => {
      const parsed = parse({
        gray: { range: [1.1, 14], anchor: "white" },
        primary: "carbon",
      });

      expect(parsed.success && parsed.data.scales).toEqual({
        gray: { range: [1.1, 14], anchor: "white" },
        primary: "carbon",
      });
    });

    it("keeps a single spec through validation", () => {
      const parsed = parse({ anchor: "white" });

      expect(parsed.success && parsed.data.scales).toEqual({ anchor: "white" });
    });

    it("rejects a single spec mixed with family keys", () => {
      const parsed = parse({ range: [1, 10], gray: "carbon" });

      expect(parsed.success).toBe(false);
      expect(parsed.error?.issues).toHaveLength(1);
      expect(parsed.error?.issues[0].message).toContain(
        "key every entry by family",
      );
    });

    it("reports a bad field in a single spec", () => {
      const parsed = parse({ anchor: "carbon" });

      expect(parsed.success).toBe(false);
      expect(parsed.error?.issues[0].path).toEqual(["scales", "anchor"]);
    });

    it("reports a bad field in a family entry at that field", () => {
      const parsed = parse({ gray: { range: [1, 10], foo: 1 } });

      expect(parsed.success).toBe(false);
      expect(parsed.error?.issues).toHaveLength(1);
      expect(parsed.error?.issues[0].path).toEqual(["scales", "gray"]);
      expect(parsed.error?.issues[0].message).toContain("'foo'");
    });

    it("rejects a surface key, which takes no scale", () => {
      const parsed = parse({ surface: "carbon" });

      expect(parsed.success).toBe(false);
      expect(parsed.error?.issues[0].message).toContain("takes no scale");
    });

    it("rejects a key that isn't a palette family", () => {
      const parsed = parse({ "ledger-teal": "carbon" });

      expect(parsed.success).toBe(false);
      expect(parsed.error?.issues[0].message).toContain(
        'Unknown scales key "ledger-teal"',
      );
    });
  });

  describe("fit_color_scale", () => {
    const colors = [
      "#f8fafc",
      "#f1f5f9",
      "#e2e8f0",
      "#cbd5e1",
      "#94a3b8",
      "#64748b",
      "#475569",
      "#334155",
      "#1e293b",
      "#0f172a",
    ];
    const text = async (params: Parameters<typeof handleFitColorScale>[0]) =>
      (await handleFitColorScale(params)).content[0].text;

    it("keys the spec by family, not by the label", async () => {
      const out = await text({
        colors,
        family: "primary",
        name: "ledger-teal",
      });

      expect(out).toContain('"primary": {');
      expect(out).toContain("// ledger-teal\n$scales: ('primary': (");
      expect(out).not.toContain("'ledger-teal':");
    });

    it("still keys by name when it names a family and family is omitted", async () => {
      expect(await text({ colors, name: "primary" })).toContain(
        "$scales: ('primary': (",
      );
    });

    it("keeps the label on one comment line", async () => {
      expect(await text({ colors, name: "Brand\n$x: oops" })).toContain(
        "// Brand $x: oops\n$scales:",
      );
    });

    it("doesn't offer surface as a family", () => {
      expect(
        fitColorScaleSchema.safeParse({ colors, family: "surface" }).success,
      ).toBe(false);
    });

    it("matches a family name in any case", async () => {
      expect(await text({ colors, name: " Primary " })).toContain(
        "$scales: ('primary': (",
      );
    });

    it("explains the anchor for a gray fit only", async () => {
      expect(await text({ colors })).toContain("anchor: 'white'");
      expect(await text({ colors, family: "primary" })).not.toContain(
        "anchor: 'white'",
      );
    });

    it("defaults the family to gray", async () => {
      expect(await text({ colors })).toContain("$scales: ('gray': (");
    });

    it("links the scales guidance by its registered URI", () => {
      expect(TOOL_DESCRIPTIONS.fit_color_scale).toContain(
        RESOURCE_URIS.GUIDANCE_COLORS_SCALES,
      );
    });
  });
});
