import { describe, expect, it } from "vitest";
import {
  call,
  entries,
  list,
  map,
  num,
  quoted,
  raw,
  statement,
} from "./sass-code.js";

describe("sass-code", () => {
  it("keeps a short map on one line", () => {
    expect(
      statement(
        "scale",
        map([
          ["range", list(1.182, 18.232)],
          ["curve", raw("null")],
        ]),
      ),
    ).toBe("$scale: (range: 1.182 18.232, curve: null);");
  });

  it("breaks a call that will not fit on one line", () => {
    const code = statement(
      "palette",
      call("palette", [
        ["$primary", raw("#0099ff")],
        ["$surface", raw("#fff")],
        [
          "$scales",
          map([
            [
              "'gray'",
              map([
                ["range", list(1.1, 18.1)],
                ["curve", raw("null")],
              ]),
            ],
          ]),
        ],
      ]),
    );

    expect(code).toBe(
      `$palette: palette(
    $primary: #0099ff,
    $surface: #fff,
    $scales: ('gray': (range: 1.1 18.1, curve: null))
);`,
    );
  });

  it("breaks a call that is merely long", () => {
    const code = statement(
      "palette",
      call("palette", [
        ["$primary", raw("#0099ff")],
        ["$secondary", raw("#df1b74")],
        ["$surface", raw("#1a1a24")],
        ["$gray", raw("#333333")],
      ]),
    );

    expect(code.split("\n")).toHaveLength(6);
    expect(code).toContain("\n    $gray: #333333\n");
  });

  it("keeps the trailing comma in a map and drops it in an argument list", () => {
    const code = statement(
      "p",
      call("palette", [["$scales", map([["'gray'", quoted("carbon")]])]]),
    );
    expect(code).toBe("$p: palette($scales: ('gray': 'carbon'));");
  });

  it("ignores extra arguments, so `map(num)` cannot pass an index as the precision", () => {
    expect(
      [0.53, 0, 0.825].map(num).map((v) => (v as { text: string }).text),
    ).toEqual(["0.53", "0", "0.825"]);
  });

  it("trims a number the way a person writes it", () => {
    expect(statement("x", list(num(1.04), num(16.1)))).toBe("$x: 1.04 16.1;");
    expect(statement("y", num(0))).toBe("$y: 0;");
    expect(statement("z", num(0.5296))).toBe("$z: 0.53;");
  });

  it("quotes only what asked to be quoted", () => {
    expect(
      statement(
        "x",
        map([
          ["a", quoted("gray")],
          ["b", raw("gray")],
        ]),
      ),
    ).toBe("$x: (a: 'gray', b: gray);");
  });

  it("drops absent entries so callers do not branch", () => {
    const args = entries({
      $primary: raw("#09f"),
      $gray: undefined,
      $surface: raw("#fff"),
    });

    expect(args.map(([key]) => key)).toEqual(["$primary", "$surface"]);
  });
});
