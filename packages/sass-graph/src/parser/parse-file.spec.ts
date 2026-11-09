import { describe, expect, it } from "vitest";
import { parseFile } from "./parse-file.js";
import { codeOf } from "./scan.js";

describe("codeOf", () => {
  it("drops comments and collapses whitespace", () => {
    expect(
      codeOf("/// Doc\n@function f() {\n  // note\n  @return 1; /* x */\n}"),
    ).toBe("@function f() { @return 1; }");
  });

  it("keeps string contents, which can change behavior", () => {
    expect(codeOf("$a: map.get($s, 'background');")).toBe(
      "$a: map.get($s, 'background');",
    );
    expect(codeOf("$a: '// not a comment';")).toBe("$a: '// not a comment';");
  });
});

describe("parseFile", () => {
  it("records each declaration's code and the file's top-level code", () => {
    const pf = parseFile(
      "_a.scss",
      "@use 'b';\n/// Doc\n$x: 1;\n@mixin m() { a: $x; }\n.c { @include m; }",
    );

    expect(pf.declarations.map((d) => d.code)).toEqual([
      "$x: 1;",
      "@mixin m() { a: $x; }",
    ]);
    expect(pf.moduleCode).toBe("@use 'b'; .c { @include m; }");
  });
});
