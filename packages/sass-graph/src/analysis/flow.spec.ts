import { describe, expect, it } from "vitest";
import { ids, libraryModel } from "./fixtures.js";
import {
  type FlowNode,
  flow,
  resolveSymbol,
  SymbolLookupError,
} from "./flow.js";
import { formatFlow } from "./format.js";

const model = libraryModel();
const names = (n: FlowNode) => n.children.map((c) => c.node.name);

describe("resolveSymbol", () => {
  it("finds a symbol by name, name(), kind:name, $name and id", () => {
    expect(resolveSymbol(model, "extend").id).toBe(ids.extend);
    expect(resolveSymbol(model, "extend()").id).toBe(ids.extend);
    expect(resolveSymbol(model, "function:extend").id).toBe(ids.extend);
    expect(resolveSymbol(model, "$fallback").id).toBe(ids.fallback);
    expect(resolveSymbol(model, ids.digest).id).toBe(ids.digest);
  });

  it("treats - and _ in a name as the same character, as Sass does", () => {
    expect(resolveSymbol(model, "digest_schema").id).toBe(ids.digest);
  });

  it("rejects an unknown name and suggests close matches", () => {
    expect(() => resolveSymbol(model, "digest")).toThrow(SymbolLookupError);
    expect(() => resolveSymbol(model, "digest")).toThrow(
      /No symbol named "digest"\. Closest matches:\n {2}digest-schema\(\)/,
    );
  });

  it("rejects an ambiguous name and lists one query per candidate", () => {
    const mixed = libraryModel();
    mixed.graph.nodes.push({
      ...mixed.byId.get(ids.extend)!,
      id: "utils/_map.scss#mixin:extend",
      kind: "mixin",
    });
    expect(() => resolveSymbol(mixed, "extend")).toThrow(
      /"extend" matches 2 symbols\. Pass one of:\n {2}function:extend .*\n {2}mixin:extend /,
    );
  });
});

describe("flow", () => {
  it("lists what a symbol is built from, hiding variables by default", () => {
    const tree = flow(model, ids.button);
    expect(names(tree)).toEqual(["digest-schema", "extend"]);
    expect(names(tree.children[0])).toEqual(["extend"]);
  });

  it("expands a symbol once and marks the other occurrences as repeated", () => {
    const tree = flow(model, ids.button);
    const [digest, extend] = tree.children;
    expect(extend.repeated).toBe(false);
    expect(digest.children[0].repeated).toBe(true);
  });

  it("shows variables with the variables option", () => {
    expect(names(flow(model, ids.digest))).toEqual(["extend"]);
    expect(names(flow(model, ids.digest, { variables: true }))).toEqual([
      "fallback",
      "extend",
    ]);
  });

  it("counts the links cut by the depth limit", () => {
    const tree = flow(model, ids.button, { depth: 1 });
    expect(tree.children[0].cut).toBe(1);
    expect(tree.children[0].children).toEqual([]);
  });

  it("lists what uses a symbol with the dependents direction", () => {
    expect(
      names(flow(model, ids.digest, { direction: "dependents", depth: 1 })),
    ).toEqual(["avatar-theme", "badge-theme", "button-theme", "chip-theme"]);
  });

  it("prints a tree with locations, doc sentences and marks", () => {
    const text = formatFlow(
      flow(model, ids.button, { depth: 1 }),
      { direction: "dependencies" },
      { pathPrefix: "sass/" },
    );
    expect(text.split("\n")).toEqual([
      "button-theme() is built from:  sass/themes/components/button/_button-theme.scss:4",
      "  Builds the button theme.",
      "",
      "├─ digest-schema()  sass/themes/_functions.scss:4  (+1 more, raise --depth)  Turns a schema into a theme map.",
      "└─ extend()  sass/utils/_map.scss:3  Merges two maps.",
    ]);
  });
});
