import { glob, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPONENTS = path.join(__dirname, "..", "sass", "themes", "components");

/** Returns the name, the argument names and the body of each `@function` in `source`. */
function functionsOf(source: string) {
  const header = /^@function\s+([\w-]+)\s*\(([\s\S]*?)\)\s*\{/gm;
  const matches = Array.from(source.matchAll(header));

  return matches.map((match, index) => ({
    name: match[1],
    args: Array.from(match[2].matchAll(/\$([\w-]+)\s*:/g), (arg) => arg[1]),
    body: source.slice(
      match.index + match[0].length,
      matches[index + 1]?.index ?? source.length,
    ),
  }));
}

describe("component theme functions", () => {
  it("read every argument that they declare", async () => {
    const unused: string[] = [];
    let count = 0;

    for await (const file of glob("**/_*-theme.scss", { cwd: COMPONENTS })) {
      const source = await readFile(path.join(COMPONENTS, file), "utf8");

      for (const { name, args, body } of functionsOf(source)) {
        count++;

        for (const arg of args) {
          if (!new RegExp(`\\$${arg}(?![\\w-])`).test(body)) {
            unused.push(`${name}($${arg})`);
          }
        }
      }
    }

    expect(count).toBeGreaterThan(0);
    expect(unused).toEqual([]);
  });
});
