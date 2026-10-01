import { describe, expect, it } from "vitest";
import { highlightSass } from "./highlight.js";

const SNIPPET = `$palette: palette(
    $primary: #0099ff,
    $scales: ('gray': (range: 1.1 18.1, curve: null))
);`;

describe("highlightSass", () => {
  it("returns a pre painted in the theme, one line per source line", async () => {
    const html = await highlightSass(SNIPPET);

    expect(html).toMatch(/^<pre class="shiki github-dark-default"/);
    expect(html).toContain("background-color:#0d1117");
    expect(html.match(/class="line"/g)).toHaveLength(
      SNIPPET.split("\n").length,
    );
  });

  it("colors the tokens, and not all alike", async () => {
    const html = await highlightSass(SNIPPET);
    const colors = new Set(html.match(/color:#[0-9a-f]{6}/gi));

    expect(html).toMatch(/color:#[0-9a-f]{6}[^>]*>\s*\$primary/i);
    expect(colors.size).toBeGreaterThan(2);
  });

  it("escapes markup in the source", async () => {
    expect(await highlightSass("$x: '<b>';")).not.toContain("<b>");
  });
});
