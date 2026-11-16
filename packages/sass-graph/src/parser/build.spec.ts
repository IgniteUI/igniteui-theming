import { describe, expect, it } from "vitest";
import { buildGraph, resolveUrl } from "./build.js";

const tree = (files: Record<string, string>) =>
  buildGraph(new Map(Object.entries(files)));

const edgesFrom = (g: ReturnType<typeof tree>, from: string) =>
  g.edges
    .filter((e) => e.from === from)
    .map((e) => `${e.type} ${e.to}`)
    .sort();

describe("resolveUrl", () => {
  const files = new Set(["a/_b.scss", "a/c/_index.scss", "d.scss"]);
  it("resolves partials, index files and plain files", () => {
    expect(resolveUrl("a/x.scss", "b", files)).toBe("a/_b.scss");
    expect(resolveUrl("a/x.scss", "./c/", files)).toBe("a/c/_index.scss");
    expect(resolveUrl("a/x.scss", "c", files)).toBe("a/c/_index.scss");
    expect(resolveUrl("a/c/_index.scss", "../../d", files)).toBe("d.scss");
    expect(resolveUrl("a/x.scss", "sass:map", files)).toBeNull();
  });
});

describe("buildGraph", () => {
  it("resolves `as *`, namespaced and built-in references", () => {
    const g = tree({
      "_vars.scss": "$primary: red !default;\n$accent: $primary;",
      "_fns.scss":
        "@use 'vars' as *;\n@function tint($c) { @return mix($c, $primary); }",
      "theme.scss": [
        "@use 'sass:map';",
        "@use 'fns';",
        "@use 'vars' as v;",
        "@mixin theme($schema: v.$accent) {",
        "  $local: map.get($schema, 'x');",
        "  color: fns.tint($local);",
        "}",
      ].join("\n"),
    });

    expect(edgesFrom(g, "_vars.scss#variable:accent")).toEqual([
      "uses-var _vars.scss#variable:primary",
    ]);
    expect(edgesFrom(g, "_fns.scss#function:tint")).toEqual([
      "uses-var _vars.scss#variable:primary",
    ]);
    expect(edgesFrom(g, "theme.scss#mixin:theme")).toEqual([
      "calls _fns.scss#function:tint",
      "uses-var _vars.scss#variable:accent",
    ]);
    expect(edgesFrom(g, "theme.scss#module")).toEqual([
      "imports _fns.scss#module",
      "imports _vars.scss#module",
    ]);
    expect(g.unresolved).toEqual([]);
  });

  it("follows @forward with prefixes and show/hide", () => {
    const g = tree({
      "presets/_material.scss": "$schema: 1;\n$other: 2;",
      "presets/_index.scss":
        "@forward 'material' as material-* show $material-schema;",
      "_index.scss": "@forward 'presets';",
      "use.scss":
        "@use 'index' as *;\n$a: $material-schema;\n$b: $material-other;",
    });

    expect(edgesFrom(g, "use.scss#variable:a")).toEqual([
      "uses-var presets/_material.scss#variable:schema",
    ]);
    expect(g.unresolved).toEqual([
      { from: "use.scss#variable:b", ref: "$material-other" },
    ]);
    expect(edgesFrom(g, "presets/_index.scss#module")).toEqual([
      "forwards presets/_material.scss#module",
    ]);
  });

  it("matches show and hide against the prefixed name, as Sass does", () => {
    const g = tree({
      "_src.scss": "@mixin reset() {}\n@mixin keep() {}\n$gap: 1;",
      "_lib.scss": "@forward 'src' as list-* hide list-keep, $list-gap;",
      "_unprefixed.scss": "@forward 'src' as list-* show reset;",
      "use.scss": [
        "@use 'lib';",
        "@use 'unprefixed';",
        "@mixin x() { @include lib.list-reset(); @include lib.list-keep(); }",
        "@mixin y() { @include unprefixed.list-reset(); }",
        "$z: lib.$list-gap;",
      ].join("\n"),
    });

    expect(edgesFrom(g, "use.scss#mixin:x")).toEqual([
      "includes _src.scss#mixin:reset",
    ]);
    expect(g.unresolved).toEqual([
      { from: "use.scss#mixin:x", ref: "lib.list-keep" },
      { from: "use.scss#mixin:y", ref: "unprefixed.list-reset" },
      { from: "use.scss#variable:z", ref: "lib.$list-gap" },
    ]);
  });

  it("keeps a global reference whose name is also a keyword argument", () => {
    const g = tree({
      "_a.scss": [
        "$primary: red;",
        "@function palette($primary: null) { @return $primary; }",
        "@function theme() { $local: 1; @return palette($primary: $primary, $x: $local); }",
      ].join("\n"),
    });

    expect(edgesFrom(g, "_a.scss#function:theme")).toEqual([
      "calls _a.scss#function:palette",
      "uses-var _a.scss#variable:primary",
    ]);
  });

  it("keeps a global reference when the same function assigns it with !global", () => {
    const g = tree({
      "_a.scss": [
        "$-warned: false;",
        "@function to-hsl() {",
        "  @if not $-warned { $-warned: true !global; }",
        "  @return 1;",
        "}",
      ].join("\n"),
    });

    expect(edgesFrom(g, "_a.scss#function:to-hsl")).toEqual([
      "uses-var _a.scss#variable:-warned",
    ]);
  });

  it("reads !global when the assigned value has an interpolation", () => {
    const g = tree({
      "_a.scss": [
        "$-added: ();",
        "@mixin add($c) {",
        "  @if not list.index($-added, #{$c}) { $-added: list.append($-added, #{$c}) !global; }",
        "}",
      ].join("\n"),
    });

    expect(edgesFrom(g, "_a.scss#mixin:add")).toEqual([
      "uses-var _a.scss#variable:-added",
    ]);
  });

  it("attributes the values of a with() clause to the module", () => {
    const g = tree({
      "_material.scss": "$color-1: black !default;",
      "_index.scss":
        "$color-1: gray !default;\n@forward 'material' as material-* with($color-1: $color-1);",
    });

    expect(edgesFrom(g, "_index.scss#module")).toEqual([
      "forwards _material.scss#module",
      "uses-var _index.scss#variable:color-1",
    ]);
  });

  it("ignores comments, string contents, keyword args, locals and CSS functions", () => {
    const g = tree({
      "_a.scss": "$x: 1;\n@mixin m() {}\n@function f($v) { @return $v; }",
      "b.scss": [
        "@use 'a' as *;",
        "// @include m; $x",
        "/* f($x) */",
        "@mixin n($p) {",
        "  $y: f($v: $p);",
        "  @each $i in (1, 2) { width: calc($i * 1px); }",
        "  content: 'url(#{$x}) $nope';",
        "  @include m();",
        "}",
      ].join("\n"),
    });

    expect(edgesFrom(g, "b.scss#mixin:n")).toEqual([
      "calls _a.scss#function:f",
      "includes _a.scss#mixin:m",
      "uses-var _a.scss#variable:x",
    ]);
    expect(g.unresolved).toEqual([]);
  });

  it("treats private members as file-local and records sassdoc", () => {
    const g = tree({
      "_a.scss": [
        "////",
        "/// @group colors",
        "////",
        "",
        "/// Picks a shade.",
        "/// @access private",
        "@function shade() { @return -helper(); }",
        "@function -helper() { @return 1; }",
      ].join("\n"),
      "b.scss": "@use 'a';\n$z: a.-helper();",
    });

    const shade = g.nodes.find((n) => n.name === "shade")!;
    expect(shade).toMatchObject({
      access: "private",
      group: "colors",
      description: "Picks a shade.",
      line: 7,
    });
    expect(edgesFrom(g, "_a.scss#function:shade")).toEqual([
      "calls _a.scss#function:-helper",
    ]);
    expect(g.unresolved).toEqual([
      { from: "b.scss#variable:z", ref: "a.-helper()" },
    ]);
  });

  it("attributes top-level code to the module node", () => {
    const g = tree({
      "_a.scss": "@mixin m() {}",
      "out.scss": "@use 'a' as *;\n.x { @include m(); }",
    });
    expect(edgesFrom(g, "out.scss#module")).toContain(
      "includes _a.scss#mixin:m",
    );
  });
});
