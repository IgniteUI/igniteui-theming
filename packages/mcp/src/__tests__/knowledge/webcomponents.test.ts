/**
 * Tests for the Web Components, React and Blazor theme examples.
 */

import { describe, expect, it } from "vitest";
import { BLAZOR_USAGE_EXAMPLES } from "../../knowledge/platforms/blazor.js";
import { REACT_USAGE_EXAMPLES } from "../../knowledge/platforms/react.js";
import { WEBCOMPONENTS_USAGE_EXAMPLES } from "../../knowledge/platforms/webcomponents.js";
import { generateThemeSass, THEME_ENTRY_POINT } from "../../utils/sass.js";

const examples = {
  webcomponents: [
    WEBCOMPONENTS_USAGE_EXAMPLES.basic,
    WEBCOMPONENTS_USAGE_EXAMPLES.customPalette,
    WEBCOMPONENTS_USAGE_EXAMPLES.darkTheme,
    WEBCOMPONENTS_USAGE_EXAMPLES.minimalConfig,
  ],
  react: [
    REACT_USAGE_EXAMPLES.basic,
    REACT_USAGE_EXAMPLES.customPalette,
    REACT_USAGE_EXAMPLES.darkTheme,
  ],
  blazor: [
    BLAZOR_USAGE_EXAMPLES.basic,
    BLAZOR_USAGE_EXAMPLES.customPalette,
    BLAZOR_USAGE_EXAMPLES.darkTheme,
  ],
};

describe("theme examples", () => {
  it.each(
    Object.entries(examples),
  )("builds the %s examples on typography() and theme() from the entry point", (_, list) => {
    for (const example of list) {
      expect(example).toContain(`@use '${THEME_ENTRY_POINT}' as *;`);
      expect(example).toContain("@include theme($palette: ");
      expect(example).not.toMatch(
        /@include (palette|elevations|sizing|spacing)\(/,
      );
      expect(example).not.toMatch(
        /--ig-scrollbar|--ig-dir|view-transition|@property/,
      );
    }
  });

  it("renders the generator output", () => {
    expect(WEBCOMPONENTS_USAGE_EXAMPLES.darkTheme).toContain(
      generateThemeSass({
        designSystem: "indigo",
        variant: "dark",
        platform: "webcomponents",
      }).code,
    );
  });

  it("leaves out the typography and the elevations in the minimal example", () => {
    expect(WEBCOMPONENTS_USAGE_EXAMPLES.minimalConfig).not.toContain(
      "typography(",
    );
    expect(WEBCOMPONENTS_USAGE_EXAMPLES.minimalConfig).toContain(
      "$exclude: (elevations)",
    );
  });
});
