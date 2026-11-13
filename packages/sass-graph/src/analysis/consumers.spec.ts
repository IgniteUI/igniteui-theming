import { describe, expect, it } from "vitest";
import { createModel } from "../graph/model.js";
import { buildGraph } from "../parser/build.js";
import {
  consumerUsage,
  directUsers,
  engineAlias,
  libraryComponentOf,
  libraryReach,
} from "./consumers.js";
import { ids, LIBRARY } from "./fixtures.js";
import { formatImpact, formatReport } from "./format.js";
import { analyzeImpact } from "./impact.js";
import { buildReport, type CheckId } from "./report.js";

const ENGINE = new Map([
  ...LIBRARY,
  ["themes/_index.scss", "@forward 'functions';"],
  ["utils/_index.scss", "@forward 'map';"],
  [
    "themes/_private.scss",
    "/// @access private\n@function tokens() { @return 1; }\n/// @access private\n@function unused-helper() { @return 2; }",
  ],
]);

const lib = (files: Record<string, string>) => ({
  name: "lib",
  sources: new Map(Object.entries(files)),
});

describe("engineAlias", () => {
  it("maps package URLs onto the engine like Sass does", () => {
    expect(engineAlias("igniteui-theming/sass/color/functions")).toBe(
      "color/functions",
    );
    expect(engineAlias("~igniteui-theming/sass/utils")).toBe("utils");
    expect(engineAlias("igniteui-theming/sass")).toBe("index");
    expect(engineAlias("igniteui-theming")).toBe("@package/index");
    expect(engineAlias("./local")).toBeUndefined();
  });
});

describe("libraryComponentOf", () => {
  it("names the folder that holds the themes folder", () => {
    expect(
      libraryComponentOf(
        "projects/igniteui-angular/card/src/card/themes/_base.scss",
      ),
    ).toBe("card");
    expect(
      libraryComponentOf(
        "projects/igniteui-angular/grids/pivot-grid/src/themes/_base.scss",
      ),
    ).toBe("pivot-grid");
    expect(
      libraryComponentOf("src/components/list/themes/light/_themes.scss"),
    ).toBe("list");
  });

  it("has no component for shared theme files or files outside a themes folder", () => {
    expect(
      libraryComponentOf("src/styles/themes/base/_fluent.scss"),
    ).toBeNull();
    expect(libraryComponentOf("src/_a.scss")).toBeNull();
  });
});

describe("libraryReach", () => {
  it("collects files and components per library across symbols", () => {
    const usage = {
      consumers: [],
      reexported: {},
      reached: [],
      direct: {
        a: { lib: ["x/card/themes/_base.scss", "x/styles/themes/_s.scss"] },
        b: { lib: ["x/card/themes/_base.scss", "x/chip/themes/_base.scss"] },
      },
    };
    expect(libraryReach(usage, ["a", "b"])).toEqual([
      { name: "lib", files: 3, components: ["card", "chip"] },
    ]);
  });
});

describe("consumerUsage", () => {
  const usage = consumerUsage(ENGINE, [
    lib({
      "src/_a.scss":
        "@use 'igniteui-theming/sass/utils' as *;\n.x { a: extend((), ()); }",
      "src/_b.scss":
        "@use 'igniteui-theming' as t;\n@function f() { @return t.digest-schema(()); }",
      "src/_c.scss":
        "@forward 'igniteui-theming/sass/themes/functions' hide var-get;",
      "src/_d.scss":
        "@use 'igniteui-theming/sass/themes/private' as p;\n.y { a: p.tokens(); }",
      "src/_e.scss": "@use 'some-other-package' as *;\n.z { a: $nope; }",
    }),
  ]);

  it("records direct calls through a path, the package root and a namespace", () => {
    expect(usage.direct[ids.extend]).toEqual({ lib: ["src/_a.scss"] });
    expect(usage.direct[ids.digest]).toEqual({ lib: ["src/_b.scss"] });
  });

  it("records what a consumer re-exports, after its hide list", () => {
    expect(usage.reexported[ids.digest]).toEqual(["lib"]);
    expect(usage.reexported[ids.varGet]).toBeUndefined();
  });

  it("marks engine code reached through a called symbol", () => {
    expect(usage.reached).toContain(ids.extend);
    expect(usage.reached).toContain("themes/_functions.scss#variable:fallback");
  });

  it("counts the consumer's files and ignores its own unresolved imports", () => {
    expect(usage.consumers).toEqual([{ name: "lib", files: 5 }]);
  });

  it("lists direct users with file counts", () => {
    expect(directUsers(usage, ids.extend)).toEqual([
      { consumer: "lib", files: 1 },
    ]);
  });

  describe("in the report", () => {
    const graph = buildGraph(ENGINE);
    graph.consumers = usage;
    const report = buildReport(createModel(graph));
    const subjects = (id: CheckId) =>
      report.checks.find((c) => c.id === id)!.findings.map((f) => f.subject);

    it("states which libraries were scanned", () => {
      expect(report.consumers).toEqual([{ name: "lib", files: 5 }]);
      expect(formatReport(report, "text")).toContain(
        "Libraries scanned: lib (5 Sass files).",
      );
    });

    it("flags a private symbol that a library calls", () => {
      expect(subjects("private-used")).toEqual(["tokens()"]);
    });

    it("does not call a symbol unused when a library calls it", () => {
      expect(subjects("unused-private")).toEqual([
        "unused-helper()",
        "-unused()",
      ]);
      expect(subjects("unused-public")).toEqual(["var-get()"]);
    });

    it("lists the most used symbols by library file count", () => {
      expect(
        report.checks.find((c) => c.id === "library-favorites")!.findings,
      ).toContainEqual(
        expect.objectContaining({ subject: "extend()", note: "lib 1 file" }),
      );
    });
  });

  it("lists API that only apps reach through a re-export", () => {
    const graph = buildGraph(ENGINE);
    graph.consumers = consumerUsage(ENGINE, [
      lib({
        "_index.scss": "@forward 'igniteui-theming/sass/themes/functions';",
      }),
    ]);
    const report = buildReport(createModel(graph));
    expect(
      report.checks.find((c) => c.id === "app-only-api")!.findings,
    ).toEqual([
      expect.objectContaining({
        subject: "var-get()",
        note: "Re-exported by lib",
      }),
    ]);
    expect(
      report.checks.find((c) => c.id === "unused-public")!.findings,
    ).toEqual([]);
  });

  it("says when no library was scanned", () => {
    const report = buildReport(createModel(buildGraph(ENGINE)));
    expect(report.consumers).toBeNull();
    expect(formatReport(report, "text")).toContain("Libraries not scanned");
    expect(
      report.checks.find((c) => c.id === "unused-public")!.description,
    ).toContain("The consumer repos were not scanned");
  });

  it("names the libraries that call changed or affected code in an impact", () => {
    const head = new Map(ENGINE);
    head.set(
      "utils/_map.scss",
      ENGINE.get("utils/_map.scss")!.replace("map.merge", "map.deep-merge"),
    );
    const impact = analyzeImpact(
      ENGINE,
      head,
      createModel(buildGraph(head)),
      usage,
    );
    expect(impact.libraries).toEqual([
      { name: "lib", files: 2, components: [] },
    ]);
    expect(formatImpact(impact, "text")).toContain(
      "Libraries that call the changed or affected code: lib 2 files.",
    );
  });
});
