import { useMemo } from "react";
import { directUsers } from "../analysis/consumers.js";
import { downstream, upstream } from "../graph/traverse.js";
import type { GraphNode } from "../parser/types.js";
import { SymbolRow } from "./Sidebar.js";
import { selectedIdOf, useStore } from "./store.js";
import { displayName, KIND_BG, KIND_LABEL, sourceUrl } from "./theme.js";

function NodeList({ title, ids }: { title: string; ids: string[] }) {
  const model = useStore((s) => s.model);
  if (!model || ids.length === 0) return null;
  const nodes = ids
    .map((id) => model.byId.get(id))
    .filter((n): n is GraphNode => Boolean(n))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <details className="text-xs">
      <summary className="cursor-pointer font-semibold text-slate-200">
        {title} ({nodes.length})
      </summary>
      <div className="mt-1 max-h-48 overflow-auto">
        {nodes.map((n) => (
          <SymbolRow key={n.id} node={n} />
        ))}
      </div>
    </details>
  );
}

/** Which consumer libraries call or re-export the symbol, from the usage in graph.json. */
function LibraryUse({ id }: { id: string }) {
  const usage = useStore((s) => s.model?.graph.consumers);
  if (!usage) return null;
  const callers = directUsers(usage, id);
  const reexported = usage.reexported[id] ?? [];
  return (
    <div className="text-xs">
      <div className="font-semibold text-slate-200">Used by the libraries</div>
      {callers.length === 0 && reexported.length === 0 && (
        <p className="mt-1 text-slate-400">
          No library calls or re-exports it.
        </p>
      )}
      {callers.map((c) => (
        <details key={c.consumer} className="mt-1">
          <summary className="cursor-pointer text-slate-300">
            <span className="font-mono">{c.consumer}</span> calls it in{" "}
            {c.files} {c.files === 1 ? "file" : "files"}
          </summary>
          <ul className="ml-4 mt-1 max-h-40 overflow-auto font-mono text-[11px] text-slate-400">
            {usage.direct[id][c.consumer].map((f) => (
              <li key={f} className="truncate" title={f}>
                {f}
              </li>
            ))}
          </ul>
        </details>
      ))}
      {reexported.length > 0 && (
        <p className="mt-1 text-slate-400">
          Re-exported by {reexported.join(", ")}, so apps can call it.
        </p>
      )}
    </div>
  );
}

export function DetailsPanel() {
  const model = useStore((s) => s.model);
  const selectedId = useStore((s) => selectedIdOf(s.route));
  const node = selectedId ? model?.byId.get(selectedId) : undefined;

  const counts = useMemo(() => {
    if (!model || !node) return null;
    return {
      deps: model.adjacency.out.get(node.id) ?? [],
      users: model.adjacency.in.get(node.id) ?? [],
      allUp: upstream(model.adjacency, node.id).size,
      allDown: downstream(model.adjacency, node.id).size,
    };
  }, [model, node]);

  if (!node || !counts) {
    return (
      <p className="text-xs text-slate-400">
        Select a node to see its details.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white ${KIND_BG[node.kind]}`}
          >
            {KIND_LABEL[node.kind]}
          </span>
          <span className="break-all font-mono text-sm font-semibold text-slate-100">
            {displayName(node.kind, node.name)}
          </span>
        </div>
        <a
          href={sourceUrl(node.file, node.line)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block break-all font-mono text-[11px] text-sky-400 hover:underline"
        >
          {node.file}:{node.line}
        </a>
        <div className="mt-1 flex gap-2 text-[11px] text-slate-400">
          <span>{node.access}</span>
          {node.group && <span>group: {node.group}</span>}
        </div>
      </div>

      {node.description && (
        <p className="text-xs text-slate-200">{node.description}</p>
      )}

      {node.params && node.params.length > 0 && (
        <div className="text-xs">
          <div className="font-semibold text-slate-200">Parameters</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {node.params.map((p) => (
              <code key={p} className="rounded bg-slate-800 px-1 text-[11px]">
                {p}
              </code>
            ))}
          </div>
        </div>
      )}

      {node.value !== undefined && (
        <div className="text-xs">
          <div className="font-semibold text-slate-200">Value</div>
          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-slate-800 p-2 text-[11px]">
            {node.value}
          </pre>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded bg-amber-950/50 p-2">
          <div className="text-lg font-bold text-amber-300">{counts.allUp}</div>
          relies on (transitive)
        </div>
        <div className="rounded bg-rose-950/50 p-2">
          <div className="text-lg font-bold text-rose-400">
            {counts.allDown}
          </div>
          affected if changed
        </div>
      </div>

      <NodeList title="Direct dependencies" ids={counts.deps} />
      <NodeList title="Direct dependents" ids={counts.users} />
      <LibraryUse id={node.id} />
    </div>
  );
}
