import { describe, expect, it } from "vitest";
import {
  isSassModeLeaf,
  SASS_VALUE_KEYS,
} from "../../src/terrazzo/sass-schema/guards.js";
import type { SassModeLeaf } from "../../src/terrazzo/sass-schema/types.js";

describe("SASS_VALUE_KEYS", () => {
  it("contains all expected keys", () => {
    expect(SASS_VALUE_KEYS).toContain("color");
    expect(SASS_VALUE_KEYS).toContain("dimension");
    expect(SASS_VALUE_KEYS).toContain("border");
  });
});

describe("isSassModeLeaf — correctly identifies mode leaves", () => {
  it("recognizes a color mode leaf", () => {
    const leaf: SassModeLeaf = {
      light: { color: { hex: "#ffffff" } },
      dark: { color: { hex: "#000000" } },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });

  it("recognizes a color mode leaf with ref and alpha", () => {
    const leaf: SassModeLeaf = {
      light: {
        color: { ref: ["primary", "500"], alpha: 0.5, hex: "#1976d280" },
      },
      dark: { color: { ref: ["primary", "300"], hex: "#64b5f6" } },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });

  it("recognizes a dimension mode leaf", () => {
    const leaf: SassModeLeaf = {
      light: { dimension: { value: "1px" } },
      dark: { dimension: { value: "2px" } },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });

  it("recognizes a dimension mode leaf with ref", () => {
    const leaf: SassModeLeaf = {
      light: { dimension: { ref: ["spacing", "sm"], value: "8px" } },
      dark: { dimension: { ref: ["spacing", "sm"], value: "8px" } },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });

  it("recognizes a border mode leaf with all sub-values", () => {
    const leaf: SassModeLeaf = {
      light: {
        border: {
          color: { hex: "#e0e0e0" },
          width: { value: "1px" },
          style: "solid",
        },
      },
      dark: {
        border: {
          color: { hex: "#424242" },
          width: { value: "1px" },
          style: "solid",
        },
      },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });

  it("recognizes a border mode leaf with only style", () => {
    const leaf: SassModeLeaf = {
      light: { border: { style: "dashed" } },
      dark: { border: { style: "dashed" } },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });

  it("recognizes a border mode leaf with only width", () => {
    const leaf: SassModeLeaf = {
      light: { border: { width: { value: "2px" } } },
      dark: { border: { width: { value: "2px" } } },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });

  it("recognizes a border mode leaf with only color", () => {
    const leaf: SassModeLeaf = {
      light: { border: { color: { hex: "#cccccc" } } },
      dark: { border: { color: { hex: "#333333" } } },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });

  it("recognizes a single-mode leaf", () => {
    const leaf: SassModeLeaf = {
      light: { color: { hex: "#ffffff" } },
    };

    expect(isSassModeLeaf(leaf)).toBe(true);
  });
});

describe("isSassModeLeaf — rejects tree branches and invalid values", () => {
  it("rejects null", () => {
    expect(isSassModeLeaf(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isSassModeLeaf(undefined)).toBe(false);
  });

  it("rejects a string", () => {
    expect(isSassModeLeaf("color")).toBe(false);
  });

  it("rejects a number", () => {
    expect(isSassModeLeaf(42)).toBe(false);
  });

  it("rejects an empty object", () => {
    expect(isSassModeLeaf({})).toBe(false);
  });

  it('rejects a tree branch whose child is named "color" but contains a mode leaf (not a color leaf)', () => {
    // The "color" key matches SASS_VALUE_KEYS, but its value is a mode leaf, not a SassColorLeaf.
    const treeBranch = {
      color: {
        light: { color: { hex: "#ffffff" } },
        dark: { color: { hex: "#000000" } },
      },
    };

    expect(isSassModeLeaf(treeBranch)).toBe(false);
  });

  it('rejects a tree branch whose child is named "dimension" but contains a mode leaf', () => {
    const treeBranch = {
      dimension: {
        light: { dimension: { value: "1px" } },
        dark: { dimension: { value: "2px" } },
      },
    };

    expect(isSassModeLeaf(treeBranch)).toBe(false);
  });

  it('rejects a tree branch whose child is named "border" but contains a mode leaf', () => {
    const treeBranch = {
      border: {
        light: {
          border: {
            color: { hex: "#e0e0e0" },
            style: "solid",
          },
        },
        dark: {
          border: {
            color: { hex: "#424242" },
            style: "solid",
          },
        },
      },
    };

    expect(isSassModeLeaf(treeBranch)).toBe(false);
  });

  it("rejects a tree branch with nested groups", () => {
    const treeBranch = {
      background: {
        idle: {
          light: { color: { hex: "#ffffff" } },
          dark: { color: { hex: "#000000" } },
        },
      },
    };

    expect(isSassModeLeaf(treeBranch)).toBe(false);
  });

  it("rejects when first entry value is a primitive", () => {
    expect(isSassModeLeaf({ light: "not an object" })).toBe(false);
  });

  it("rejects when first entry value is null", () => {
    expect(isSassModeLeaf({ light: null })).toBe(false);
  });

  it("rejects an object whose first entry has no recognized value-type keys", () => {
    expect(isSassModeLeaf({ light: { unknown: "data" } })).toBe(false);
  });
});
