import { describe, expect, it } from "vitest";
import type { Preset, PresetSide } from "./data/color/presets.js";
import { buildPreset, markTwins, type Swatch } from "./preset-model.js";
import { ACCENTS, FAMILIES, type Family, ROLES, SHADES } from "./variants.js";

/** A gray ramp from white to black, the same on every family. */
const ramp = (i: number) => {
  const v = Math.round(255 - (i * 255) / 9);
  return `rgb(${v}, ${v}, ${v})`;
};

/** A preset whose every shade is set by one function, so a test can shape it. */
const side = (literal: (family: Family, key: string) => string): PresetSide => {
  const values: Record<string, string> = {};

  for (const family of FAMILIES) {
    SHADES.forEach((key, i) => {
      values[`${family}-${key}`] = literal(family, key) ?? ramp(i);
    });
    for (const key of ACCENTS)
      values[`${family}-${key}`] = literal(family, key);
    for (const key of ROLES) values[`${family}-${key}`] = literal(family, key);
  }

  return { vars: { "--ig-primary-500": "#09f" }, values };
};

const preset = (literal: (family: Family, key: string) => string): Preset => ({
  key: "material",
  label: "Material",
  theme: "light",
  seeds: {
    primary: "#0099ff",
    secondary: "#df1b74",
    gray: "#333333",
    surface: "#ffffff",
    info: "#1377d5",
    success: "#4eb862",
    warn: "#faa419",
    error: "#ff134a",
  },
  legacy: side(literal),
  fitted: side(literal),
});

const grayscale = (_: Family, key: string) => {
  const i = SHADES.indexOf(key as (typeof SHADES)[number]);
  return i >= 0 ? ramp(i) : "rgb(128, 128, 128)";
};

describe("buildPreset", () => {
  const model = buildPreset(preset(grayscale));

  it("measures chromatic families against white, whatever the page", () => {
    const primary = model.families[0].shades[0];
    expect(primary.swatches[0].against).toBe("white");
    expect(primary.swatches[0].ratio).toBeCloseTo(1, 5);
    expect(primary.swatches[9].ratio).toBeCloseTo(21, 3);
  });

  it("measures the neutrals against the page", () => {
    const gray = model.surface.grays[0];
    expect(gray.swatches[0].against).toBe("the page #ffffff");
  });

  it("only lets the numbered ramps take part in the probe", () => {
    const [family] = model.families;
    expect(family.shades.every((row) => row.probeable)).toBe(true);
    expect(family.accents.every((row) => !row.probeable)).toBe(true);
  });

  it("names the token each swatch paints from", () => {
    expect(model.families[0].shades[0].swatches[4].token).toBe(
      "--ig-primary-400",
    );
  });

  it("flags a shade the generator asked for outside sRGB", () => {
    const clipped = buildPreset(
      preset((family, key) =>
        family === "primary" && key === "50"
          ? "hsl(0, 0%, 174%)"
          : grayscale(family, key),
      ),
    );
    const [first, second] = clipped.families[0].shades[0].swatches;

    expect(first.clipped).toBe(true);
    expect(first.hex).toBe("#ffffff");
    expect(second.clipped).toBe(false);
  });

  it("reports a role that resolved onto the page as collapsed", () => {
    const flat = buildPreset(
      preset((family, key) =>
        family === "surface" && key === "raised"
          ? "#ffffff"
          : grayscale(family, key),
      ),
    );
    const raised = flat.surface.roles.find((r) => r.key === "raised");
    const sunken = flat.surface.roles.find((r) => r.key === "sunken");

    expect(raised?.collapsed).toBe(true);
    expect(sunken?.collapsed).toBe(false);
  });
});

describe("markTwins", () => {
  const swatch = (key: string, hex: string): Swatch => ({
    key,
    hex,
    token: "",
    rgb: [0, 0, 0],
    ratio: 1,
    against: "",
    clipped: false,
    same: [],
  });

  it("lists, on each shade, every other shade with the same color", () => {
    const swatches = [
      swatch("50", "#fff"),
      swatch("100", "#fff"),
      swatch("200", "#eee"),
    ];
    markTwins(swatches);

    expect(swatches[0].same).toEqual(["100"]);
    expect(swatches[1].same).toEqual(["50"]);
    expect(swatches[2].same).toEqual([]);
  });
});
