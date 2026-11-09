import { describe, expect, it } from "vitest";
import { LIBRARY } from "./fixtures.js";
import { formatImpact } from "./format.js";
import { analyzeImpact } from "./impact.js";

const edit = (changes: Record<string, string | null>) => {
  const head = new Map(LIBRARY);
  for (const [file, source] of Object.entries(changes)) {
    if (source === null) head.delete(file);
    else head.set(file, source);
  }
  return head;
};

const summary = (head: Map<string, string>) =>
  analyzeImpact(LIBRARY, head).changes.map(
    (c) => `${c.kind} ${c.node.kind}:${c.node.name}`,
  );

describe("analyzeImpact", () => {
  it("reports a changed function and every component theme it reaches", () => {
    const head = edit({
      "utils/_map.scss": LIBRARY.get("utils/_map.scss")!.replace(
        "map.merge($a, $b)",
        "map.deep-merge($a, $b)",
      ),
    });
    const impact = analyzeImpact(LIBRARY, head);

    expect(summary(head)).toEqual(["changed function:extend"]);
    expect(impact.components).toEqual([
      "avatar",
      "badge",
      "button",
      "chip",
      "icon",
    ]);
    expect(impact.systems).toEqual([{ system: "themes", count: 1 }]);
  });

  it("ignores an edit that only touches comments", () => {
    const head = edit({
      "utils/_map.scss": LIBRARY.get("utils/_map.scss")!.replace(
        "/// Merges two maps.",
        "/// Merges two maps, the second one wins.",
      ),
    });
    const impact = analyzeImpact(LIBRARY, head);

    expect(impact.changes).toEqual([]);
    expect(impact.commentOnly).toEqual(["utils/_map.scss"]);
    expect(formatImpact(impact, "text")).toContain(
      "No code changes. 1 file(s) changed only in comments.",
    );
  });

  it("reports added and removed declarations, and traces a removal in the base version", () => {
    const head = edit({
      "themes/_functions.scss": LIBRARY.get("themes/_functions.scss")!
        .replace("@function var-get() { @return 1; }", "")
        .replace(
          "/// Turns a schema",
          "@function var-read() { @return 2; }\n/// Turns a schema",
        ),
    });

    expect(summary(head)).toEqual([
      "removed function:var-get",
      "added function:var-read",
    ]);
  });

  it("lists the dependents of a removed symbol as affected", () => {
    const head = edit({
      "themes/_functions.scss": LIBRARY.get("themes/_functions.scss")!.replace(
        /\/\/\/ Turns[^\n]*\n@function digest-schema[^\n]*\n/,
        "",
      ),
    });
    const impact = analyzeImpact(LIBRARY, head);

    expect(summary(head)).toEqual(["removed function:digest-schema"]);
    expect(impact.components).toEqual(["avatar", "badge", "button", "chip"]);
  });

  it("reports a deleted file as removed declarations and a removed file", () => {
    expect(summary(edit({ "utils/_map.scss": null }))).toEqual([
      "removed function:extend",
      "removed function:-unused",
      "removed module:_map.scss",
    ]);
  });

  it("renders a Markdown table with links when a link base is given", () => {
    const head = edit({
      "themes/_functions.scss": LIBRARY.get("themes/_functions.scss")!.replace(
        "@return 1;",
        "@return 3;",
      ),
    });
    const md = formatImpact(analyzeImpact(LIBRARY, head), "markdown", {
      pathPrefix: "sass/",
      linkBase: "https://x.test/blob/abc/sass/",
    });

    expect(md).toContain(
      "| changed | `var-get()` | [`sass/themes/_functions.scss:5`](https://x.test/blob/abc/sass/themes/_functions.scss#L5) |",
    );
    expect(md).toContain(
      "**1** declaration(s) changed in 1 file(s). They reach **0** other symbols and **0** component themes.",
    );
  });
});
