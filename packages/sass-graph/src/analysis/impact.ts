import { createModel, type GraphModel, impactSet } from "../graph/model.js";
import { buildGraph, moduleId, symbolId } from "../parser/build.js";
import { parseFile } from "../parser/parse-file.js";
import type { GraphNode, ParsedFile } from "../parser/types.js";
import {
  type ConsumerUsage,
  type LibraryReach,
  libraryReach,
} from "./consumers.js";
import { componentOf, systemOf } from "./systems.js";

export type ChangeKind = "added" | "changed" | "removed";

export interface Change {
  kind: ChangeKind;
  node: GraphNode;
}

export interface Impact {
  /** Changed declarations and files, comment-only edits excluded. */
  changes: Change[];
  /** Files whose text differs but whose code does not. */
  commentOnly: string[];
  /** Symbols reached from the changes, with their hop distance. */
  affected: Map<string, { node: GraphNode; distance: number }>;
  /** Component themes reached, sorted by name. */
  components: string[];
  /** Affected symbols per system, components excluded. */
  systems: { system: string; count: number }[];
  /** Consumer libraries that call a changed or affected symbol, with their files and components; empty without usage data. */
  libraries: LibraryReach[];
}

/** `kind:name` → code of each declaration, plus the file's top-level code. */
function codeMap(pf: ParsedFile): Map<string, string> {
  const map = new Map<string, string>();
  for (const d of pf.declarations) {
    const key = `${d.kind}:${d.name}`;
    // A variable assigned twice in one file is one node; compare both lines.
    map.set(key, map.has(key) ? `${map.get(key)}\n${d.code}` : d.code);
  }
  map.set("module", pf.moduleCode);
  return map;
}

const idFor = (file: string, key: string) => {
  if (key === "module") return moduleId(file);
  const [kind, name] = key.split(/:(.*)/s) as [
    "variable" | "mixin" | "function",
    string,
  ];
  return symbolId(file, kind, name);
};

/**
 * Compares two versions of the library (`relative path → source`) and lists
 * what changed, then everything downstream of it. Removed symbols are traced
 * in the base version, where their dependents still point at them.
 */
export function analyzeImpact(
  base: Map<string, string>,
  head: Map<string, string>,
  headModel: GraphModel = createModel(buildGraph(head)),
  usage?: ConsumerUsage,
): Impact {
  const changes: Change[] = [];
  const commentOnly: string[] = [];
  let baseModel: GraphModel | undefined;
  const baseNode = (id: string) => {
    baseModel ??= createModel(buildGraph(base));
    return baseModel.byId.get(id);
  };

  const files = [...new Set([...base.keys(), ...head.keys()])].sort();
  for (const file of files) {
    const before = base.get(file);
    const after = head.get(file);
    if (before === after) continue;
    const a =
      before === undefined ? new Map() : codeMap(parseFile(file, before));
    const b = after === undefined ? new Map() : codeMap(parseFile(file, after));
    let changed = false;
    for (const key of new Set([...a.keys(), ...b.keys()])) {
      if (a.get(key) === b.get(key)) continue;
      changed = true;
      const id = idFor(file, key);
      if (!b.has(key)) {
        const node = baseNode(id);
        if (node) changes.push({ kind: "removed", node });
      } else {
        const node = headModel.byId.get(id);
        if (node)
          changes.push({ kind: a.has(key) ? "changed" : "added", node });
      }
    }
    if (!changed) commentOnly.push(file);
  }

  const affected = new Map<string, { node: GraphNode; distance: number }>();
  const changedIds = new Set(changes.map((c) => c.node.id));
  const record = (model: GraphModel, roots: string[]) => {
    for (const [id, distance] of impactSet(model, roots)) {
      if (changedIds.has(id)) continue;
      // Dependents of a removed symbol are looked up in the current version.
      const node = headModel.byId.get(id) ?? model.byId.get(id)!;
      const prev = affected.get(id);
      if (!prev || distance < prev.distance)
        affected.set(id, { node, distance });
    }
  };
  record(
    headModel,
    changes.filter((c) => c.kind !== "removed").map((c) => c.node.id),
  );
  const removed = changes.filter((c) => c.kind === "removed");
  if (removed.length) {
    record(
      baseModel!,
      removed.map((c) => c.node.id),
    );
  }

  const components = new Set<string>();
  const systems = new Map<string, number>();
  for (const { node } of changes) {
    const component = componentOf(node.folder);
    if (component) components.add(component);
  }
  for (const { node } of affected.values()) {
    const component = componentOf(node.folder);
    if (component) components.add(component);
    else if (node.kind !== "module") {
      const system = systemOf(node.folder);
      systems.set(system, (systems.get(system) ?? 0) + 1);
    }
  }

  return {
    changes,
    commentOnly,
    affected,
    libraries: libraryReach(usage, [...changedIds, ...affected.keys()]),
    components: [...components].sort(),
    systems: [...systems]
      .map(([system, count]) => ({ system, count }))
      .sort((a, b) => b.count - a.count || a.system.localeCompare(b.system)),
  };
}
