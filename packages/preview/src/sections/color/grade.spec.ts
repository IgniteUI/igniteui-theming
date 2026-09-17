import { describe, expect, it } from "vitest";
import type { Swatch } from "../../preset-model.js";
import { describe as describeSwatch, grade, listKeys, ratio } from "./grade.js";

const swatch = (extra: Partial<Swatch> = {}): Swatch => ({
  key: "500",
  token: "--ig-primary-500",
  rgb: [0, 153, 255],
  ratio: 3.02,
  hex: "#0099ff",
  against: "white",
  clipped: false,
  same: [],
  ...extra,
});

describe("grade", () => {
  it("awards the best threshold a ratio clears", () => {
    expect(grade(7)).toBe("AAA");
    expect(grade(4.5)).toBe("AA");
    expect(grade(3.2)).toBe("UI");
    expect(grade(2.9)).toBeNull();
  });

  it("prints a ratio to one decimal", () => {
    expect(ratio(4.456)).toBe("4.5:1");
  });
});

describe("listKeys", () => {
  it("reads as a sentence", () => {
    expect(listKeys(["50"])).toBe("50");
    expect(listKeys(["50", "100"])).toBe("50 and 100");
    expect(listKeys(["50", "100", "200"])).toBe("50, 100 and 200");
  });
});

describe("describe", () => {
  it("names the token, the color and the ratio against the row's anchor", () => {
    expect(describeSwatch(swatch(), null, 3.02)).toBe(
      "--ig-primary-500  #0099ff   3.02:1 vs white",
    );
  });

  it("grades the ratio when a reference is pinned", () => {
    expect(describeSwatch(swatch(), "100", 4.8)).toContain(
      "4.80:1 vs 100 · AA",
    );
    expect(describeSwatch(swatch(), "100", 1.2)).toContain("below 3:1");
  });

  it("says what is wrong with the shade", () => {
    const text = describeSwatch(
      swatch({ same: ["600"], clipped: true }),
      null,
      1,
    );
    expect(text).toContain("same color as 600");
    expect(text).toContain("outside sRGB");
  });
});
