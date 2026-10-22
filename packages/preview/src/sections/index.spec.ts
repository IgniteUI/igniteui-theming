import { describe, expect, it } from "vitest";
import { findSection, findView, SECTIONS } from "./index.js";

describe("the section registry", () => {
  it("finds a section by id and falls back to the first", () => {
    expect(findSection("color").id).toBe("color");
    expect(findSection("nope")).toBe(SECTIONS[0]);
    expect(findSection(undefined)).toBe(SECTIONS[0]);
  });

  it("finds a view within a section", () => {
    const color = findSection("color");
    expect(findView(color, "sweep")?.tag).toBe("ig-view-sweep");
    expect(findView(color, "nope")).toBeUndefined();
  });

  it("gives every view a unique tag and id", () => {
    for (const section of SECTIONS) {
      const ids = section.views.map((v) => v.id);
      const tags = section.views.map((v) => v.tag);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(tags).size).toBe(tags.length);
    }
  });
});
