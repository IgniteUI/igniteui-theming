import { describe, expect, it } from "vitest";
import { createModel } from "../graph/model.js";
import { buildGraph } from "../parser/build.js";
import { ids, LIBRARY, libraryModel } from "./fixtures.js";
import { formatReport } from "./format.js";
import { buildReport, type CheckId } from "./report.js";

const report = buildReport(libraryModel());
const check = (id: CheckId) => report.checks.find((c) => c.id === id)!;
const subjects = (id: CheckId) => check(id).findings.map((f) => f.subject);

describe("buildReport", () => {
  it("counts the library", () => {
    expect(report.totals).toEqual({
      files: 7,
      variables: 1,
      mixins: 0,
      functions: 9,
      componentThemes: 5,
    });
  });

  it("ranks engine code by direct users and counts the component themes it reaches", () => {
    expect(check("hotspots").findings[0]).toMatchObject({
      id: ids.extend,
      note: "6 direct users; reaches 5 component themes",
    });
  });

  it("flags a component theme that skips a helper most themes call", () => {
    expect(check("outliers").findings).toEqual([
      expect.objectContaining({
        id: ids.icon,
        note: "Never reaches digest-schema(), which 4 of 5 component themes call",
      }),
    ]);
  });

  it("flags unused private symbols and unused or undocumented public engine code", () => {
    expect(subjects("unused-private")).toEqual(["-unused()"]);
    expect(subjects("unused-public")).toEqual(["var-get()"]);
    expect(subjects("undocumented")).toEqual(["var-get()"]);
  });

  it("does not flag a theme that reaches the helper through another theme", () => {
    const lib = new Map(LIBRARY);
    lib.set(
      "themes/components/icon/_icon-theme.scss",
      "@use '../button/button-theme' as *;\n/// Builds the icon theme.\n@function icon-theme($schema) { @return button-theme($schema); }",
    );
    const r = buildReport(createModel(buildGraph(lib)));
    expect(r.checks.find((c) => c.id === "outliers")!.findings).toEqual([]);
  });

  it("finds dependency cycles", () => {
    const cyclic = createModel(
      buildGraph(
        new Map([
          [
            "_a.scss",
            "@function a() { @return b(); }\n@function b() { @return a(); }",
          ],
        ]),
      ),
    );
    expect(
      buildReport(cyclic).checks.find((c) => c.id === "cycles")!.findings,
    ).toEqual([expect.objectContaining({ subject: "b() ↔ a()" })]);
    expect(check("cycles").findings).toEqual([]);
  });

  it("lists unresolved references as a parser check", () => {
    const broken = createModel(
      buildGraph(new Map([["_a.scss", "@function a() { @return $nope; }"]])),
    );
    expect(
      buildReport(broken).checks.find((c) => c.id === "unresolved")!.findings,
    ).toEqual([
      {
        id: "_a.scss#function:a",
        subject: "$nope",
        file: "_a.scss",
        line: 1,
        note: "in a()",
      },
    ]);
  });

  it("renders a summary table and one section per check in Markdown", () => {
    const md = formatReport(report, "markdown", { pathPrefix: "sass/" });
    expect(md).toContain("| Unused private symbols | 1 |");
    expect(md).toContain("## Dependency cycles (0)\n\n");
    expect(md).toContain("| `-unused()` | `sass/utils/_map.scss:4` |");
  });
});
