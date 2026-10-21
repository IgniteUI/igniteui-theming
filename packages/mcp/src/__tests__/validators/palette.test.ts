/**
 * Tests for palette validators.
 */

import { describe, expect, it } from "vitest";
import {
  invalidColorsResponse,
  validateColorInputs,
} from "../../validators/palette.js";

describe("validateColorInputs", () => {
  it("accepts valid colors and skips undefined entries", async () => {
    const result = await validateColorInputs({
      primary: "#7b2cbf",
      secondary: "rebeccapurple",
      surface: "rgb(250 250 250)",
      gray: undefined,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("reports each value Sass can't parse as a color", async () => {
    const result = await validateColorInputs({
      primary: "notacolor",
      secondary: "#ff9e00",
      surface: "alsonotacolor",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.map((e) => e.field)).toEqual(["primary", "surface"]);
    expect(result.errors[0].currentValue).toBe("notacolor");
  });
});

describe("invalidColorsResponse", () => {
  it("flags the response as an error and names the field", async () => {
    const result = await validateColorInputs({ primary: "notacolor" });
    const response = invalidColorsResponse(result);

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("`primary`");
    expect(response.content[0].text).toContain("notacolor");
  });
});
