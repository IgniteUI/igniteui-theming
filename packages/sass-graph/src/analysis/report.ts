import { type GraphModel, impactSet } from "../graph/model.js";
import { upstream } from "../graph/traverse.js";
import type { GraphNode } from "../parser/types.js";
import { type ConsumerUsage, directUsers } from "./consumers.js";
import {
  componentOf,
  isComponentTheme,
  isEngineCode,
  label,
  systemOf,
} from "./systems.js";

export type CheckId =
  | "hotspots"
  | "library-favorites"
  | "outliers"
  | "private-used"
  | "unused-private"
  | "unused-public"
  | "app-only-api"
  | "undocumented"
  | "cycles"
  | "unresolved";

export interface Finding {
  /** Graph node id, when the finding is about one symbol. */
  id?: string;
  subject: string;
  file: string;
  line: number;
  note: string;
}

export interface Check {
  id: CheckId;
  title: string;
  /** What the check looks for and what to do about a finding. */
  description: string;
  findings: Finding[];
}

export interface Report {
  totals: {
    files: number;
    variables: number;
    mixins: number;
    functions: number;
    componentThemes: number;
  };
  /** Libraries whose Sass was scanned, or null when none was found. */
  consumers: { name: string; files: number }[] | null;
  checks: Check[];
}

/** Share of component themes that must call a helper before the others count as outliers. */
export const OUTLIER_THRESHOLD = 0.8;
export const HOTSPOT_COUNT = 10;

const finding = (n: GraphNode, note: string): Finding => ({
  id: n.id,
  subject: label(n),
  file: n.file,
  line: n.line,
  note,
});

const dependents = (model: GraphModel, n: GraphNode) =>
  model.adjacency.in.get(n.id)?.length ?? 0;

/** `igniteui-angular 137 files, igniteui-grid-lite 6`. */
function usedIn(usage: ConsumerUsage | undefined, id: string): string {
  return directUsers(usage, id)
    .map((u) => `${u.consumer} ${u.files} ${u.files === 1 ? "file" : "files"}`)
    .join(", ");
}

function favorites(usage: ConsumerUsage, engine: GraphNode[]): Finding[] {
  const files = (n: GraphNode) =>
    directUsers(usage, n.id).reduce((sum, u) => sum + u.files, 0);
  return engine
    .map((n) => ({ n, total: files(n) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total || a.n.name.localeCompare(b.n.name))
    .slice(0, HOTSPOT_COUNT)
    .map(({ n }) => finding(n, usedIn(usage, n.id)));
}

function hotspots(
  model: GraphModel,
  engine: GraphNode[],
  usage: ConsumerUsage | undefined,
): Finding[] {
  return engine
    .map((n) => ({ n, users: dependents(model, n) }))
    .sort((a, b) => b.users - a.users || a.n.name.localeCompare(b.n.name))
    .slice(0, HOTSPOT_COUNT)
    .map(({ n, users }) => {
      const reach = new Set<string>();
      for (const id of impactSet(model, [n.id]).keys()) {
        const c = componentOf(model.byId.get(id)!.folder);
        if (c) reach.add(c);
      }
      const outside = usedIn(usage, n.id);
      return finding(
        n,
        `${users} direct users; reaches ${reach.size} component themes${outside ? `; libraries: ${outside}` : ""}`,
      );
    });
}

function outliers(model: GraphModel, themes: GraphNode[]): Finding[] {
  const calls = new Map<string, Set<string>>();
  for (const t of themes) {
    for (const dep of model.adjacency.out.get(t.id) ?? []) {
      const n = model.byId.get(dep)!;
      if (n.kind !== "mixin" && n.kind !== "function") continue;
      if (!calls.has(dep)) calls.set(dep, new Set());
      calls.get(dep)!.add(t.id);
    }
  }
  // A theme that reaches the helper through another theme is on the shared path.
  const reach = new Map(
    themes.map((t) => [t.id, upstream(model.adjacency, t.id)]),
  );
  const found: Finding[] = [];
  for (const [helper, users] of calls) {
    if (users.size < themes.length * OUTLIER_THRESHOLD) continue;
    const h = model.byId.get(helper)!;
    for (const t of themes) {
      if (reach.get(t.id)!.has(helper)) continue;
      found.push(
        finding(
          t,
          `Never reaches ${label(h)}, which ${users.size} of ${themes.length} component themes call`,
        ),
      );
    }
  }
  return found.sort((a, b) => a.subject.localeCompare(b.subject));
}

/** Strongly connected groups of more than one symbol (Tarjan). */
function cycles(model: GraphModel): GraphNode[][] {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const groups: GraphNode[][] = [];
  let next = 0;

  const visit = (v: string) => {
    index.set(v, next);
    low.set(v, next);
    next++;
    stack.push(v);
    onStack.add(v);
    for (const w of model.adjacency.out.get(v) ?? []) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, index.get(w)!));
      }
    }
    if (low.get(v) !== index.get(v)) return;
    const group: GraphNode[] = [];
    let w: string;
    do {
      w = stack.pop()!;
      onStack.delete(w);
      group.push(model.byId.get(w)!);
    } while (w !== v);
    if (group.length > 1) groups.push(group);
  };

  for (const n of model.graph.nodes) {
    if (n.kind !== "module" && !index.has(n.id)) visit(n.id);
  }
  return groups;
}

/** Runs every check over the whole library. */
export function buildReport(model: GraphModel): Report {
  const nodes = model.graph.nodes;
  const count = (kind: string) => nodes.filter((n) => n.kind === kind).length;
  const engine = nodes.filter(isEngineCode);
  const themes = nodes.filter(isComponentTheme);
  const byLocation = (a: Finding, b: Finding) =>
    a.file.localeCompare(b.file) || a.line - b.line;
  const usage = model.graph.consumers;
  const reached = new Set(usage?.reached ?? []);
  const calledByLibrary = (n: GraphNode) =>
    directUsers(usage, n.id).length > 0 || reached.has(n.id);
  const reexportedBy = (n: GraphNode) => usage?.reexported[n.id] ?? [];
  const scope = usage
    ? `the engine and ${usage.consumers.map((c) => c.name).join(", ")}`
    : "the engine";
  // Without consumer data an "unused" finding may still be library API.
  const caveat = usage
    ? ""
    : " The consumer repos were not scanned, so igniteui-angular or igniteui-webcomponents may still use these; run with them checked out next to igniteui-theming.";

  const checks: Check[] = [
    {
      id: "hotspots",
      title: "Hotspots",
      description: `The ${HOTSPOT_COUNT} engine mixins and functions with the most direct users. A change to one of these reaches the most code, so they need the best tests.`,
      findings: hotspots(model, engine, usage),
    },
    {
      id: "library-favorites",
      title: "Most used by the libraries",
      description: usage
        ? `The ${HOTSPOT_COUNT} engine mixins and functions that the libraries call in the most files. Their signatures are effectively public contracts.`
        : "Needs the consumer repos next to igniteui-theming; none was found.",
      findings: usage ? favorites(usage, engine) : [],
    },
    {
      id: "outliers",
      title: "Component themes that skip a shared helper",
      description: `Component themes that never reach a helper (directly or through another theme) which at least ${OUTLIER_THRESHOLD * 100}% of component themes call. Either the theme has a reason, or it drifted from the shared path.`,
      findings: outliers(model, themes),
    },
    {
      id: "private-used",
      title: "Private symbols the libraries call",
      description: usage
        ? "Symbols documented `@access private` that a library calls directly. Either the docs are wrong and the symbol is API, or the library depends on an internal that can change without notice."
        : "Needs the consumer repos next to igniteui-theming; none was found.",
      findings: nodes
        .filter(
          (n) =>
            n.kind !== "module" &&
            n.access === "private" &&
            !n.name.startsWith("-") &&
            directUsers(usage, n.id).length > 0,
        )
        .map((n) => finding(n, `Called by ${usedIn(usage, n.id)}`))
        .sort(byLocation),
    },
    {
      id: "unused-private",
      title: "Unused private symbols",
      description: `Private (\`-\`/\`_\` prefix or \`@access private\`) symbols that nothing in ${scope} uses. Dead code, or mis-documented. Dynamic calls through \`meta.get-function()\` are not traced; check those before deleting.${caveat}`,
      findings: nodes
        .filter(
          (n) =>
            n.kind !== "module" &&
            n.access === "private" &&
            dependents(model, n) === 0 &&
            !calledByLibrary(n),
        )
        .map((n) => {
          const via = reexportedBy(n);
          return finding(
            n,
            via.length
              ? `${systemOf(n.folder)}; no callers, but re-exported by ${via.join(", ")} through a module @forward`
              : `${systemOf(n.folder)}; no callers`,
          );
        })
        .sort(byLocation),
    },
    {
      id: "unused-public",
      title: "Public engine code nothing uses",
      description: `Public engine mixins and functions that nothing in ${scope} calls${usage ? " and no library re-exports" : ""}. Likely dead code.${caveat}`,
      findings: engine
        .filter(
          (n) =>
            n.access === "public" &&
            dependents(model, n) === 0 &&
            !calledByLibrary(n) &&
            reexportedBy(n).length === 0,
        )
        .map((n) => finding(n, systemOf(n.folder)))
        .sort(byLocation),
    },
    {
      id: "app-only-api",
      title: "API only apps can reach",
      description: usage
        ? "Public engine code that no library calls, but that a library re-exports with @forward, so apps can call it. It is not dead: it needs docs, tests and care when changing."
        : "Needs the consumer repos next to igniteui-theming; none was found.",
      findings: usage
        ? engine
            .filter(
              (n) =>
                n.access === "public" &&
                dependents(model, n) === 0 &&
                !calledByLibrary(n) &&
                reexportedBy(n).length > 0,
            )
            .map((n) =>
              finding(n, `Re-exported by ${reexportedBy(n).join(", ")}`),
            )
            .sort(byLocation)
        : [],
    },
    {
      id: "undocumented",
      title: "Public engine code without a description",
      description:
        "Public engine mixins and functions with no sassdoc description above them.",
      findings: engine
        .filter((n) => n.access === "public" && !n.description)
        .map((n) => {
          const outside = usedIn(usage, n.id);
          return finding(
            n,
            outside
              ? `${systemOf(n.folder)}; called by ${outside}`
              : systemOf(n.folder),
          );
        })
        .sort(byLocation),
    },
    {
      id: "cycles",
      title: "Dependency cycles",
      description:
        "Groups of symbols that depend on each other in a loop. A cycle makes the order of evaluation hard to follow.",
      findings: cycles(model).map((group) => {
        const first = group[0];
        return {
          id: first.id,
          subject: group.map(label).join(" ↔ "),
          file: first.file,
          line: first.line,
          note: `${group.length} symbols`,
        };
      }),
    },
    {
      id: "unresolved",
      title: "Unresolved references",
      description:
        "References the parser could not resolve. Usually a parser gap rather than a bug in the library.",
      findings: model.graph.unresolved.map((u) => {
        const n = model.byId.get(u.from)!;
        return {
          id: n.id,
          subject: u.ref,
          file: n.file,
          line: n.line,
          note: `in ${label(n)}`,
        };
      }),
    },
  ];

  return {
    totals: {
      files: count("module"),
      variables: count("variable"),
      mixins: count("mixin"),
      functions: count("function"),
      componentThemes: themes.length,
    },
    consumers: usage?.consumers ?? null,
    checks,
  };
}
