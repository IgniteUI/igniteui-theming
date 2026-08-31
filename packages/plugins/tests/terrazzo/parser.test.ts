import { describe, expect, it } from "vitest";
import { parseRef } from "../../src/terrazzo/sass-schema/builder.js";

describe("parseRef", () => {
  it("strips 1 leading segment by default", () => {
    expect(parseRef("{primitive-colors.secondary.500}")).toEqual([
      "secondary",
      "500",
    ]);
  });

  it("strips curly braces", () => {
    expect(parseRef("{foo.bar.baz}", 0)).toEqual(["foo", "bar", "baz"]);
  });

  it("strips multiple leading segments", () => {
    expect(parseRef("{primitive-colors.secondary.500}", 2)).toEqual(["500"]);
  });

  it("strips 0 segments when configured", () => {
    expect(parseRef("{primitive-colors.secondary.500}", 0)).toEqual([
      "primitive-colors",
      "secondary",
      "500",
    ]);
  });

  it("handles gray ref path", () => {
    expect(parseRef("{primitive-colors.gray.100}")).toEqual(["gray", "100"]);
  });

  it("handles single-segment ref after stripping", () => {
    expect(parseRef("{collection.token}", 1)).toEqual(["token"]);
  });

  it("handles ref with no braces gracefully", () => {
    expect(parseRef("primitive-colors.secondary.500")).toEqual([
      "secondary",
      "500",
    ]);
  });

  it("returns empty array when all segments are stripped", () => {
    expect(parseRef("{a.b}", 2)).toEqual([]);
  });
});
