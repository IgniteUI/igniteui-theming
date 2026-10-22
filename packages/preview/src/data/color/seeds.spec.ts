/**
 * The article quotes these two seeds and their endpoints. If the generator changes, this
 * is what says the article's table is out of date.
 */
import { describe, expect, it } from "vitest";
import { contrast } from "../../color.js";
import { familyRow } from "../../preset-model.js";
import { resolve } from "../cache.js";
import { seedData } from "./seeds.js";

const data = await resolve(seedData);
const WHITE = [255, 255, 255] as const;

const rowOf = (key: string, generator: "legacy" | "fitted") => {
  const seed = data.seeds.find((s) => s.key === key);
  if (!seed) throw new Error(key);
  return familyRow(seed[generator], generator, "primary");
};

const hexes = (key: string, generator: "legacy" | "fitted") =>
  rowOf(key, generator).swatches.map((s) => s.hex.toLowerCase());

describe("the two seeds the article opens with", () => {
  it("legacy keeps every shade of the dark seed dark", () => {
    for (const s of rowOf("dark", "legacy").swatches) {
      expect(contrast(s.rgb, [...WHITE])).toBeGreaterThan(10);
    }
  });

  it("legacy turns the pale seed's first four shades into the same white", () => {
    const row = rowOf("pale", "legacy");
    const first = row.swatches.slice(0, 4).map((s) => s.hex.toLowerCase());
    expect(new Set(first)).toEqual(new Set(["#ffffff"]));
    expect(row.swatches[0].same).toEqual(["100", "200", "300"]);
  });

  it("fitted gives both seeds ten distinct shades", () => {
    for (const key of ["dark", "pale"]) {
      expect(new Set(hexes(key, "fitted")).size).toBe(10);
    }
  });

  it("matches the endpoints the article quotes", () => {
    expect(hexes("dark", "legacy")[0]).toBe("#012d5a");
    expect(hexes("dark", "legacy")[9]).toBe("#001021");
    expect(hexes("dark", "fitted")[0]).toBe("#e4ecf8");
    expect(hexes("dark", "fitted")[9]).toBe("#0a1623");
    expect(hexes("pale", "fitted")[0]).toBe("#e4edf7");
    expect(hexes("pale", "fitted")[9]).toBe("#0b1621");
  });

  it("paints legacy pale 900 as the browser does", () => {
    // The literal is hsl(210, 100.8%, 57.6%). CSS Color 4 only clamps saturation below
    // 0%, so the extra 0.8% reaches the conversion and red lands on 0x26, not 0x27.
    expect(hexes("pale", "legacy")[9]).toBe("#2693ff");
  });
});
