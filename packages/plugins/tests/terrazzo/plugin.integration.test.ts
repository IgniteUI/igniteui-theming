import { describe, expect, it } from "vitest";
import {
  buildSassLeaf,
  parseRef,
} from "../../src/terrazzo/sass-schema/builder.js";
import { serializeToSass } from "../../src/terrazzo/sass-schema/serializer.js";
import type {
  DTCGLeafToken,
  SassModeLeaf,
  SassTree,
} from "../../src/terrazzo/sass-schema/types.js";
// biome-ignore lint/correctness/useImportExtensions: .json is the correct extension for JSON file imports
import containedFixture from "./fixtures/components-button-contained.json";
// biome-ignore lint/correctness/useImportExtensions: .json is the correct extension for JSON file imports
import flatFixture from "./fixtures/components-button-flat.json";

/**
 * Check whether a node is a DTCG leaf token (has $type property).
 */
function isDTCGLeaf(node: unknown): node is DTCGLeafToken {
  return typeof node === "object" && node !== null && "$type" in node;
}

/**
 * Flatten a nested DTCG document into dot-separated token entries.
 * Simulates what Terrazzo does when parsing a JSON file.
 */
function flattenDTCG(
  obj: Record<string, unknown>,
  prefix = "",
): { id: string; originalValue: DTCGLeafToken }[] {
  const entries: { id: string; originalValue: DTCGLeafToken }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isDTCGLeaf(value)) {
      entries.push({ id: path, originalValue: value });
    } else if (typeof value === "object" && value !== null) {
      entries.push(...flattenDTCG(value as Record<string, unknown>, path));
    }
  }

  return entries;
}

/**
 * Simulate the plugin pipeline: flatten → group by component (first segment) → build sass tree → serialize.
 * Uses compact output by default; pass `pretty: true` to get indented output.
 */
function simulatePlugin(
  fixture: Record<string, unknown>,
  pretty = false,
): Record<string, string> {
  const flatTokens = flattenDTCG(fixture);

  // Group by first segment (component name)
  const groups: Record<string, { path: string[]; value: DTCGLeafToken }[]> = {};

  for (const token of flatTokens) {
    const segments = token.id.split(".");
    if (segments.length < 2) continue;

    const [component, ...rest] = segments;
    if (!groups[component]) groups[component] = [];

    groups[component].push({ path: rest, value: token.originalValue });
  }

  // Build Sass output for each group
  const outputs: Record<string, string> = {};

  for (const [component, entries] of Object.entries(groups)) {
    const tree: SassTree = {};

    for (const entry of entries) {
      const sassLeaf = buildSassLeaf(entry.value, { stripRefSegments: 1 });
      let current = tree;

      for (let i = 0; i < entry.path.length - 1; i++) {
        if (!current[entry.path[i]]) current[entry.path[i]] = {};
        current = current[entry.path[i]] as SassTree;
      }

      current[entry.path[entry.path.length - 1]] = sassLeaf;
    }

    outputs[component] = serializeToSass(tree, component, pretty);
  }

  return outputs;
}

describe("Plugin Integration", () => {
  describe('contained button fixture (groups under "button")', () => {
    it("produces a single $button variable", () => {
      const sass = simulatePlugin(containedFixture).button;

      expect(sass).toBeDefined();
      expect(sass).toMatch(/^\$button: \(/);
      expect(sass).toMatch(/\);\n$/);
    });

    it('preserves "contained" as a nested key', () => {
      const sass = simulatePlugin(containedFixture).button;
      expect(sass).toContain("contained: (");
    });

    it("correctly transforms a reference color (contained.background.idle)", () => {
      const sass = simulatePlugin(containedFixture).button;

      expect(sass).toContain("ref: (secondary, 500)");
      expect(sass).toContain("hex: #df1b74");
    });

    it("correctly transforms a reference with dark mode override (contained.background.disabled)", () => {
      const sass = simulatePlugin(containedFixture).button;

      // light mode: 100 → #f5f5f5
      expect(sass).toContain("hex: #f5f5f5");

      // dark mode: 100 → #424242
      expect(sass).toContain("hex: #424242");
    });

    it("correctly transforms a literal color (contained.label.foreground.idle)", () => {
      const sass = simulatePlugin(containedFixture).button;
      expect(sass).toContain("hex: #000000");
    });

    it("does not include alpha when alpha is 1", () => {
      const sass = simulatePlugin(containedFixture).button;
      expect(sass).not.toContain("alpha:");
    });
  });

  describe('flat button fixture (groups under "button")', () => {
    it('produces a $button variable with "flat" nested key', () => {
      const sass = simulatePlugin(flatFixture).button;

      expect(sass).toBeDefined();
      expect(sass).toMatch(/^\$button: \(/);
      expect(sass).toContain("flat: (");
    });

    it("includes alpha for opacity-merged tokens (flat.background.hover)", () => {
      const sass = simulatePlugin(flatFixture).button;

      expect(sass).toContain("alpha: 0.08");
      expect(sass).toContain("hex: #df1b7414");
    });

    it("includes alpha: 0 for transparent literal color (flat.background.idle)", () => {
      const sass = simulatePlugin(flatFixture).button;

      expect(sass).toContain("alpha: 0");
      expect(sass).toContain("hex: #ffffff00");
    });

    it("handles dark mode override on icon foreground", () => {
      const sass = simulatePlugin(flatFixture).button;

      expect(sass).toContain("ref: (secondary, 800)");
      expect(sass).toContain("hex: #b60053");
      expect(sass).toContain("ref: (secondary, 300)");
      expect(sass).toContain("hex: #d2588f");
    });
  });

  describe("parseRef integration", () => {
    it("parses real ref strings from the fixture", () => {
      expect(parseRef("{primitive-colors.secondary.500}")).toEqual([
        "secondary",
        "500",
      ]);
      expect(parseRef("{primitive-colors.gray.100}")).toEqual(["gray", "100"]);
      expect(parseRef("{primitive-colors.secondary.800}")).toEqual([
        "secondary",
        "800",
      ]);
    });
  });

  describe("full pipeline snapshot", () => {
    it("produces expected Sass for a minimal button with contained variant (pretty)", () => {
      const tree: SassTree = {
        contained: {
          background: {
            idle: {
              light: {
                color: { ref: ["secondary", "500"], hex: "#df1b74" },
              },
              dark: {
                color: { ref: ["secondary", "500"], hex: "#df1b74" },
              },
            } as SassModeLeaf,
            disabled: {
              light: { color: { ref: ["gray", "100"], hex: "#f5f5f5" } },
              dark: { color: { ref: ["gray", "100"], hex: "#424242" } },
            } as SassModeLeaf,
          },
          label: {
            foreground: {
              idle: {
                light: { color: { hex: "#000000" } },
                dark: { color: { hex: "#000000" } },
              } as SassModeLeaf,
            },
          },
        },
      };

      expect(serializeToSass(tree, "button", true)).toBe(
        `$button: (
  contained: (
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
      disabled: (
        light: (
          color: (
            ref: (gray, 100),
            hex: #f5f5f5,
          ),
        ),
        dark: (
          color: (
            ref: (gray, 100),
            hex: #424242,
          ),
        ),
      ),
    ),
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
  ),
);
`,
      );
    });
  });

  describe("border serialization integration", () => {
    it("serializes a tree mixing color and border leaves", () => {
      const tree: SassTree = {
        contained: {
          background: {
            idle: {
              light: {
                color: { ref: ["secondary", "500"], hex: "#df1b74" },
              },
              dark: {
                color: { ref: ["secondary", "500"], hex: "#df1b74" },
              },
            } as SassModeLeaf,
          },
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
        },
      };
      const sass = serializeToSass(tree, "button");

      // Color leaf is present
      expect(sass).toContain("ref: (secondary, 500)");
      expect(sass).toContain("hex: #df1b74");

      // Border leaf is present alongside color
      expect(sass).toContain("border: (");
      expect(sass).toContain("style: solid");
    });

    it("serializes different light/dark borders through the pipeline", () => {
      const tree: SassTree = {
        outline: {
          idle: {
            light: {
              border: {
                ref: ["borders", "default"],
                color: { hex: "#e0e0e0" },
                width: { value: "1px" },
                style: "solid",
              },
            },
            dark: {
              border: {
                ref: ["borders", "default"],
                color: { hex: "#555555" },
                width: { value: "1px" },
                style: "solid",
              },
            },
          } as SassModeLeaf,
        },
      };
      const sass = serializeToSass(tree, "card");

      expect(sass).toContain("hex: #e0e0e0");
      expect(sass).toContain("hex: #555555");
      expect(sass).toContain("ref: (borders, default)");
    });

    it("produces expected Sass for a component with border tokens (pretty)", () => {
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
          focus: {
            light: {
              border: {
                color: { ref: ["primary", "500"], hex: "#1976d2" },
                width: { value: "2px" },
                style: "solid",
              },
            },
            dark: {
              border: {
                color: { ref: ["primary", "300"], hex: "#64b5f6" },
                width: { value: "2px" },
                style: "solid",
              },
            },
          } as SassModeLeaf,
        },
      };

      expect(serializeToSass(tree, "input", true)).toBe(
        `$input: (
  outline: (
    idle: (
      light: (
        border: (
          color: (
            hex: #e0e0e0,
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
            hex: #424242,
          ),
          width: (
            value: 1px,
          ),
          style: solid,
        ),
      ),
    ),
    focus: (
      light: (
        border: (
          color: (
            ref: (primary, 500),
            hex: #1976d2,
          ),
          width: (
            value: 2px,
          ),
          style: solid,
        ),
      ),
      dark: (
        border: (
          color: (
            ref: (primary, 300),
            hex: #64b5f6,
          ),
          width: (
            value: 2px,
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

    it("handles a border leaf with only a color sub-value", () => {
      const tree: SassTree = {
        separator: {
          idle: {
            light: { border: { color: { hex: "#cccccc" } } },
            dark: { border: { color: { hex: "#444444" } } },
          } as SassModeLeaf,
        },
      };
      const sass = serializeToSass(tree, "divider");

      expect(sass).toContain("hex: #cccccc");
      expect(sass).toContain("hex: #444444");
      expect(sass).not.toContain("width:");
      expect(sass).not.toContain("style:");
    });

    it("handles a border leaf with color alpha", () => {
      const tree: SassTree = {
        outline: {
          idle: {
            light: {
              border: {
                color: { alpha: 0.3, hex: "#00000033" },
                width: { value: "1px" },
              },
            },
            dark: {
              border: {
                color: { alpha: 0.3, hex: "#ffffff33" },
                width: { value: "1px" },
              },
            },
          } as SassModeLeaf,
        },
      };
      const sass = serializeToSass(tree, "card");

      expect(sass).toContain("alpha: 0.3");
      expect(sass).toContain("hex: #00000033");
      expect(sass).toContain("hex: #ffffff33");
    });
  });

  describe("output validation — tree branches named after value keys", () => {
    it("correctly nests outlined.border.color as branch > branch > leaf (not misidentified)", () => {
      // The serializer must NOT misidentify the "border" branch as a mode leaf just because its child is named "color".
      const tree: SassTree = {
        outlined: {
          border: {
            color: {
              light: { color: { hex: "#ffffff" } },
              dark: { color: { hex: "#000000" } },
            } as SassModeLeaf,
          },
        },
      };

      expect(serializeToSass(tree, "button", true)).toBe(
        `$button: (
  outlined: (
    border: (
      color: (
        light: (
          color: (
            hex: #ffffff,
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

    it("handles outlined.border.color with dark mode override", () => {
      const tree: SassTree = {
        outlined: {
          border: {
            color: {
              light: { color: { ref: ["gray", "300"], hex: "#e0e0e0" } },
              dark: { color: { ref: ["gray", "700"], hex: "#616161" } },
            } as SassModeLeaf,
            width: {
              light: { dimension: { value: "1px" } },
              dark: { dimension: { value: "1px" } },
            } as SassModeLeaf,
            style: {
              light: { dimension: { value: "solid" } },
              dark: { dimension: { value: "solid" } },
            } as SassModeLeaf,
          },
        },
      };
      const sass = serializeToSass(tree, "button");

      // border.color branch serialized correctly (not collapsed)
      expect(sass).toContain("ref: (gray, 300)");
      expect(sass).toContain("hex: #e0e0e0");
      expect(sass).toContain("ref: (gray, 700)");
      expect(sass).toContain("hex: #616161");

      // border.width and border.style branches also present
      expect(sass).toContain("value: 1px");
      expect(sass).toContain("value: solid");
    });

    it("does not confuse a 'dimension' tree branch with a dimension mode leaf", () => {
      const tree: SassTree = {
        spacing: {
          dimension: {
            horizontal: {
              light: { dimension: { value: "8px" } },
              dark: { dimension: { value: "8px" } },
            } as SassModeLeaf,
          },
        },
      };
      const sass = serializeToSass(tree, "layout", true);

      // "dimension" is a tree branch, "horizontal" is the mode leaf
      expect(sass).toContain("dimension: (");
      expect(sass).toContain("horizontal: (");
      expect(sass).toContain("value: 8px,");
    });

    it("handles a mixed tree with both colliding branch names and real mode leaves", () => {
      const tree: SassTree = {
        outlined: {
          border: {
            color: {
              light: { color: { hex: "#e0e0e0" } },
              dark: { color: { hex: "#424242" } },
            } as SassModeLeaf,
          },
          background: {
            idle: {
              light: { color: { hex: "#ffffff" } },
              dark: { color: { hex: "#121212" } },
            } as SassModeLeaf,
          },
        },
      };
      const sass = serializeToSass(tree, "button", true);

      // border.color is a branch > leaf (3 nesting levels before mode)
      expect(sass).toContain("border: (\n      color: (\n        light:");

      // background.idle is a branch > leaf (2 nesting levels before mode)
      expect(sass).toContain("background: (\n      idle: (\n        light:");

      // All hex values are present and correct
      expect(sass).toContain("hex: #e0e0e0,");
      expect(sass).toContain("hex: #424242,");
      expect(sass).toContain("hex: #ffffff,");
      expect(sass).toContain("hex: #121212,");
    });
  });
});
