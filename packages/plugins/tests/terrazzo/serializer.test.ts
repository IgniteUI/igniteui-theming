import { describe, expect, it } from "vitest";
import { serializeToSass } from "../../src/terrazzo/sass-schema/serializer.js";
import type {
  SassBorderLeaf,
  SassModeLeaf,
  SassTree,
} from "../../src/terrazzo/sass-schema/types.js";

const refColorLeaf = (ref: string[], hex: string): SassModeLeaf => ({
  light: { color: { ref, hex } },
  dark: { color: { ref, hex } },
});

const literalColorLeaf = (hex: string): SassModeLeaf => ({
  light: { color: { hex } },
  dark: { color: { hex } },
});

const alphaColorLeaf = (
  ref: string[],
  alpha: number,
  hex: string,
): SassModeLeaf => ({
  light: { color: { ref, alpha, hex } },
  dark: { color: { ref, alpha, hex } },
});

const borderLeaf = (border: SassBorderLeaf): SassModeLeaf => ({
  light: { border },
  dark: { border },
});

describe("serializeToSass — compact (default)", () => {
  it("produces a valid $variable declaration", () => {
    const tree: SassTree = {
      background: {
        idle: refColorLeaf(["secondary", "500"], "#df1b74"),
      },
    };
    const result = serializeToSass(tree, "button-contained");

    expect(result).toMatch(/^\$button-contained: \(/);
    expect(result).toMatch(/\);\n$/);
  });

  it("serializes a reference color leaf with parenthesized ref", () => {
    const tree: SassTree = {
      background: {
        idle: refColorLeaf(["secondary", "500"], "#df1b74"),
      },
    };
    const result = serializeToSass(tree, "button-contained");

    expect(result).toContain("ref: (secondary, 500)");
    expect(result).toContain("hex: #df1b74");
  });

  it("serializes a literal color leaf without ref", () => {
    const tree: SassTree = {
      label: { foreground: { idle: literalColorLeaf("#000000") } },
    };
    const result = serializeToSass(tree, "button-contained");

    expect(result).toContain("hex: #000000");
    expect(result).not.toContain("ref:");
  });

  it("serializes alpha when present", () => {
    const tree: SassTree = {
      background: {
        hover: alphaColorLeaf(["secondary", "500"], 0.08, "#df1b7414"),
      },
    };
    const result = serializeToSass(tree, "button-flat");

    expect(result).toContain("alpha: 0.08");
    expect(result).toContain("ref: (secondary, 500)");
    expect(result).toContain("hex: #df1b7414");
  });

  it("handles alpha: 0", () => {
    const tree: SassTree = {
      background: {
        idle: {
          light: { color: { alpha: 0, hex: "#ffffff00" } },
          dark: { color: { alpha: 0, hex: "#ffffff00" } },
        } as SassModeLeaf,
      },
    };
    const result = serializeToSass(tree, "button-flat");

    expect(result).toContain("alpha: 0");
    expect(result).toContain("hex: #ffffff00");
  });

  it("serializes different light/dark values", () => {
    const tree: SassTree = {
      background: {
        disabled: {
          light: { color: { ref: ["grays", "grays-100"], hex: "#f5f5f5" } },
          dark: { color: { ref: ["grays", "grays-100"], hex: "#424242" } },
        } as SassModeLeaf,
      },
    };
    const result = serializeToSass(tree, "button-contained");

    expect(result).toContain("hex: #f5f5f5");
    expect(result).toContain("hex: #424242");
  });
});

describe("serializeToSass — pretty", () => {
  it("serializes a simple reference color leaf", () => {
    const tree: SassTree = {
      background: {
        idle: refColorLeaf(["secondary", "500"], "#df1b74"),
      },
    };

    expect(serializeToSass(tree, "button-contained", true)).toBe(
      `$button-contained: (
  background: (
    idle: (
      light: (
        color: (
          ref: (secondary, 500),
          hex: #df1b74,
        ),
      ),
      dark: (
        color: (
          ref: (secondary, 500),
          hex: #df1b74,
        ),
      ),
    ),
  ),
);
`,
    );
  });

  it("serializes a deeply nested tree", () => {
    const tree: SassTree = {
      label: { foreground: { idle: literalColorLeaf("#000000") } },
    };

    expect(serializeToSass(tree, "test", true)).toBe(
      `$test: (
  label: (
    foreground: (
      idle: (
        light: (
          color: (
            hex: #000000,
          ),
        ),
        dark: (
          color: (
            hex: #000000,
          ),
        ),
      ),
    ),
  ),
);
`,
    );
  });

  it("serializes alpha when present", () => {
    const result = serializeToSass(
      {
        background: {
          hover: alphaColorLeaf(["secondary", "500"], 0.08, "#df1b7414"),
        },
      },
      "button-flat",
      true,
    );

    expect(result).toContain("ref: (secondary, 500),");
    expect(result).toContain("alpha: 0.08,");
    expect(result).toContain("hex: #df1b7414,");
  });

  it("handles alpha: 0", () => {
    const tree: SassTree = {
      background: {
        idle: {
          light: { color: { alpha: 0, hex: "#ffffff00" } },
          dark: { color: { alpha: 0, hex: "#ffffff00" } },
        } as SassModeLeaf,
      },
    };
    const result = serializeToSass(tree, "button-flat", true);

    expect(result).toContain("alpha: 0,");
    expect(result).toContain("hex: #ffffff00,");
  });
});

describe("serializeToSass — border (compact)", () => {
  it("serializes a full border with color, width, and style", () => {
    const tree: SassTree = {
      outline: {
        idle: borderLeaf({
          color: { hex: "#333333" },
          width: { value: "1px" },
          style: "solid",
        }),
      },
    };
    const result = serializeToSass(tree, "card");

    expect(result).toContain("border: (");
    expect(result).toContain("color: (hex: #333333)");
    expect(result).toContain("width: (value: 1px)");
    expect(result).toContain("style: solid");
  });

  it("serializes a border with ref", () => {
    const tree: SassTree = {
      outline: {
        idle: borderLeaf({
          ref: ["borders", "default"],
          color: { hex: "#000000" },
          width: { value: "2px" },
          style: "dashed",
        }),
      },
    };
    const result = serializeToSass(tree, "card");

    expect(result).toContain("ref: (borders, default)");
    expect(result).toContain("hex: #000000");
    expect(result).toContain("value: 2px");
    expect(result).toContain("style: dashed");
  });

  it("serializes a border with only color", () => {
    const tree: SassTree = {
      divider: {
        idle: borderLeaf({ color: { hex: "#cccccc" } }),
      },
    };
    const result = serializeToSass(tree, "layout");

    expect(result).toContain("border: (color: (hex: #cccccc))");
    expect(result).not.toContain("width:");
    expect(result).not.toContain("style:");
  });

  it("serializes a border with only width", () => {
    const tree: SassTree = {
      outline: {
        focus: borderLeaf({ width: { value: "3px" } }),
      },
    };
    const result = serializeToSass(tree, "input");

    expect(result).toContain("border: (width: (value: 3px))");
    expect(result).not.toContain("color:");
    expect(result).not.toContain("style:");
  });

  it("serializes a border with color that has alpha", () => {
    const tree: SassTree = {
      outline: {
        idle: borderLeaf({
          color: { alpha: 0.5, hex: "#00000080" },
          width: { value: "1px" },
          style: "solid",
        }),
      },
    };
    const result = serializeToSass(tree, "card");

    expect(result).toContain("alpha: 0.5");
    expect(result).toContain("hex: #00000080");
  });

  it("serializes a border with color ref", () => {
    const tree: SassTree = {
      outline: {
        idle: borderLeaf({
          color: { ref: ["grays", "300"], hex: "#e0e0e0" },
          style: "solid",
        }),
      },
    };
    const result = serializeToSass(tree, "card");

    expect(result).toContain("color: (ref: (grays, 300), hex: #e0e0e0)");
    expect(result).toContain("style: solid");
  });

  it("serializes a border with width ref", () => {
    const tree: SassTree = {
      outline: {
        idle: borderLeaf({
          width: { ref: ["spacing", "xs"], value: "1px" },
        }),
      },
    };
    const result = serializeToSass(tree, "card");

    expect(result).toContain(
      "border: (width: (ref: (spacing, xs), value: 1px))",
    );
  });

  it("serializes different light/dark border values", () => {
    const tree: SassTree = {
      outline: {
        idle: {
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
        } as SassModeLeaf,
      },
    };
    const result = serializeToSass(tree, "card");

    expect(result).toContain("hex: #e0e0e0");
    expect(result).toContain("hex: #424242");
  });
});

describe("serializeToSass — border (pretty)", () => {
  it("serializes a full border with indentation", () => {
    const tree: SassTree = {
      outline: {
        idle: borderLeaf({
          color: { hex: "#333333" },
          width: { value: "1px" },
          style: "solid",
        }),
      },
    };

    expect(serializeToSass(tree, "card", true)).toBe(
      `$card: (
  outline: (
    idle: (
      light: (
        border: (
          color: (
            hex: #333333,
          ),
          width: (
            value: 1px,
          ),
          style: solid,
        ),
      ),
      dark: (
        border: (
          color: (
            hex: #333333,
          ),
          width: (
            value: 1px,
          ),
          style: solid,
        ),
      ),
    ),
  ),
);
`,
    );
  });

  it("serializes a border with ref in pretty mode", () => {
    const tree: SassTree = {
      outline: {
        idle: borderLeaf({
          ref: ["borders", "thin"],
          color: { hex: "#cccccc" },
          style: "solid",
        }),
      },
    };
    const result = serializeToSass(tree, "card", true);

    expect(result).toContain("ref: (borders, thin),");
    expect(result).toContain("hex: #cccccc,");
    expect(result).toContain("style: solid,");
  });
});
