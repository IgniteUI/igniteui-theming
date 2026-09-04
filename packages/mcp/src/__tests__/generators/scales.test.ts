import { describe, expect, it } from "vitest";
import { generatePaletteCss } from "../../generators/css.js";
import { generatePalette, generateTheme } from "../../generators/sass.js";
import { SCALE_NAMES, SHADE_SCALES } from "../../knowledge/scales.js";

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
});
