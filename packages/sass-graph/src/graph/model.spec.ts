import { describe, expect, it } from "vitest";
import { buildGraph } from "../parser/build.js";
import type { NodeKind } from "../parser/types.js";
import {
  affectedComponents,
  createModel,
  focusView,
  impactSet,
  search,
} from "./model.js";

const model = createModel(
  buildGraph(
    new Map(
      Object.entries({
        "color/_functions.scss":
          "$base: red;\n@function tint() { @return $base; }",
        "themes/components/button/_button-theme.scss":
          "@use '../../../color/functions' as *;\n@function button-theme() { @return tint(); }",
        "themes/components/chip/_chip-theme.scss":
          "@use '../../../color/functions' as *;\n@function chip-theme() { @return tint(); }",
      }),
    ),
  ),
);

const all: Set<NodeKind> = new Set(["variable", "mixin", "function", "module"]);
const tint = "color/_functions.scss#function:tint";
const base = "color/_functions.scss#variable:base";

describe("model", () => {
  it("builds a focus view with roles and dependency→dependent edges", () => {
    const view = focusView(model, tint, 2, { kinds: all, publicOnly: false });
    const roles = Object.fromEntries(
      view.nodes.map((n) => [n.node.name, n.role]),
    );
    expect(roles).toEqual({
      tint: "selected",
      base: "upstream",
      "button-theme": "downstream",
      "chip-theme": "downstream",
    });
    expect(view.edges).toContainEqual(
      expect.objectContaining({ source: base, target: tint }),
    );
  });

  it("marks a link between two shown nodes as direct", () => {
    const view = focusView(model, tint, 1, { kinds: all, publicOnly: false });
    expect(view.edges).toContainEqual({
      id: `${base}>${tint}`,
      source: base,
      target: tint,
      indirect: false,
    });
  });

  it("links through a hidden variable and marks the link indirect", () => {
    const chain = createModel(
      buildGraph(
        new Map([
          [
            "_a.scss",
            "@function tint() { @return red; }\n$scale: tint();\n@mixin type() { color: $scale; }",
          ],
        ]),
      ),
    );
    const tintFn = "_a.scss#function:tint";
    const type = "_a.scss#mixin:type";
    const view = focusView(chain, type, 2, {
      kinds: new Set<NodeKind>(["mixin", "function"]),
      publicOnly: false,
    });

    expect(view.nodes.map((n) => n.node.name).sort()).toEqual(["tint", "type"]);
    expect(view.edges).toEqual([
      { id: `${tintFn}>${type}`, source: tintFn, target: type, indirect: true },
    ]);
  });

  it("truncates to the limit and reports the rest", () => {
    const view = focusView(
      model,
      tint,
      2,
      { kinds: all, publicOnly: false },
      2,
    );
    expect(view.nodes).toHaveLength(2);
    expect(view.truncated).toBe(2);
  });

  it("groups the impact of a change by component", () => {
    const impact = impactSet(model, [base]);
    expect(impact.get(tint)).toBe(1);
    expect(
      affectedComponents(model, impact.keys()).map((g) => g.component),
    ).toEqual(["button", "chip"]);
  });

  it("ranks exact and prefix matches first", () => {
    expect(search(model, "theme").map((n) => n.name)).toEqual([
      "chip-theme",
      "button-theme",
    ]);
    expect(search(model, "$base")[0].name).toBe("base");
  });
});
