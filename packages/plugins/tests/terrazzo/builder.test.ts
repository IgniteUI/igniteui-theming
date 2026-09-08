import { describe, expect, it } from "vitest";
import { buildSassLeaf } from "../../src/terrazzo/sass-schema/builder.js";
import type { DTCGLeafToken } from "../../src/terrazzo/sass-schema/types.js";

describe("buildSassLeaf", () => {
  describe("reference color tokens", () => {
    it("builds a simple reference color (no modes, alpha = 1)", () => {
      const token: DTCGLeafToken = {
        $type: "reference",
        $value: {
          ref: "{primitive-colors.secondary.500}",
          color: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0.8745, 0.1059, 0.4549],
              alpha: 1,
              hex: "#df1b74",
            },
          },
        },
      };

      const result = buildSassLeaf(token);

      expect(result).toEqual({
        light: {
          color: {
            ref: ["secondary", "500"],
            hex: "#df1b74",
          },
        },
        dark: {
          color: {
            ref: ["secondary", "500"],
            hex: "#df1b74",
          },
        },
      });
    });

    it("includes alpha when < 1", () => {
      const token: DTCGLeafToken = {
        $type: "reference",
        $value: {
          ref: "{primitive-colors.secondary.500}",
          color: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0.8745, 0.1059, 0.4549],
              alpha: 0.08,
              hex: "#df1b7414",
            },
          },
        },
      };

      const result = buildSassLeaf(token);

      expect(result.light.color).toEqual({
        ref: ["secondary", "500"],
        alpha: 0.08,
        hex: "#df1b7414",
      });
    });

    it("includes alpha when 0", () => {
      const token: DTCGLeafToken = {
        $type: "reference",
        $value: {
          ref: "{primitive-colors.secondary.500}",
          color: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0.8745, 0.1059, 0.4549],
              alpha: 0,
              hex: "#df1b7400",
            },
          },
        },
      };

      const result = buildSassLeaf(token);

      expect(result.light.color?.alpha).toBe(0);
    });

    it("handles dark mode override with different ref and hex", () => {
      const token: DTCGLeafToken = {
        $type: "reference",
        $value: {
          ref: "{primitive-colors.gray.100}",
          color: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0.961, 0.961, 0.961],
              alpha: 1,
              hex: "#f5f5f5",
            },
          },
        },
        $extensions: {
          modes: {
            dark: {
              $value: {
                ref: "{primitive-colors.gray.100}",
                color: {
                  $type: "color",
                  $value: {
                    colorSpace: "srgb",
                    components: [0.259, 0.259, 0.259],
                    alpha: 1,
                    hex: "#424242",
                  },
                },
              },
            },
          },
        },
      };

      const result = buildSassLeaf(token);

      expect(result.light.color).toEqual({
        ref: ["gray", "100"],
        hex: "#f5f5f5",
      });
      expect(result.dark.color).toEqual({
        ref: ["gray", "100"],
        hex: "#424242",
      });
    });

    it("duplicates default when no dark mode override", () => {
      const token: DTCGLeafToken = {
        $type: "reference",
        $value: {
          ref: "{primitive-colors.secondary.500}",
          color: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0.8745, 0.1059, 0.4549],
              alpha: 1,
              hex: "#df1b74",
            },
          },
        },
      };

      const result = buildSassLeaf(token);

      expect(result.light).toEqual(result.dark);
    });

    it("handles dark mode override with different ref path", () => {
      const token: DTCGLeafToken = {
        $type: "reference",
        $value: {
          ref: "{primitive-colors.secondary.800}",
          color: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0.7137, 0, 0.3255],
              alpha: 1,
              hex: "#b60053",
            },
          },
        },
        $extensions: {
          modes: {
            dark: {
              $value: {
                ref: "{primitive-colors.secondary.300}",
                color: {
                  $type: "color",
                  $value: {
                    colorSpace: "srgb",
                    components: [0.8235, 0.3451, 0.5608],
                    alpha: 1,
                    hex: "#d2588f",
                  },
                },
              },
            },
          },
        },
      };

      const result = buildSassLeaf(token);

      expect(result.light.color?.ref).toEqual(["secondary", "800"]);
      expect(result.dark.color?.ref).toEqual(["secondary", "300"]);
    });
  });

  describe("literal color tokens", () => {
    it("builds a literal color (no ref)", () => {
      const token: DTCGLeafToken = {
        $type: "color",
        $value: {
          colorSpace: "srgb",
          components: [0, 0, 0],
          alpha: 1,
          hex: "#000000",
        },
      };

      const result = buildSassLeaf(token);

      expect(result.light.color).toEqual({ hex: "#000000" });
      expect(result.dark.color).toEqual({ hex: "#000000" });
      expect(result.light.color?.ref).toBeUndefined();
    });

    it("builds a literal transparent color (alpha = 0)", () => {
      const token: DTCGLeafToken = {
        $type: "color",
        $value: {
          colorSpace: "srgb",
          components: [1, 1, 1],
          alpha: 0,
          hex: "#ffffff00",
        },
      };

      const result = buildSassLeaf(token);

      expect(result.light.color).toEqual({
        alpha: 0,
        hex: "#ffffff00",
      });
    });
  });

  describe("configurable ref stripping", () => {
    it("strips 0 segments when configured", () => {
      const token: DTCGLeafToken = {
        $type: "reference",
        $value: {
          ref: "{primitive-colors.secondary.500}",
          color: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0.8745, 0.1059, 0.4549],
              alpha: 1,
              hex: "#df1b74",
            },
          },
        },
      };

      const result = buildSassLeaf(token, { stripRefSegments: 0 });

      expect(result.light.color?.ref).toEqual([
        "primitive-colors",
        "secondary",
        "500",
      ]);
    });

    it("strips 2 segments when configured", () => {
      const token: DTCGLeafToken = {
        $type: "reference",
        $value: {
          ref: "{primitive-colors.secondary.500}",
          color: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0.8745, 0.1059, 0.4549],
              alpha: 1,
              hex: "#df1b74",
            },
          },
        },
      };

      const result = buildSassLeaf(token, { stripRefSegments: 2 });

      expect(result.light.color?.ref).toEqual(["500"]);
    });
  });
});
