import { IgrChip, IgrExpansionPanel, IgrList } from "igniteui-react";
import { useMemo } from "react";
import { directUsers } from "../analysis/consumers.js";
import { downstream, upstream } from "../graph/traverse.js";
import type { GraphNode } from "../parser/types.js";
import { KindBadge } from "./KindBadge.js";
import { SymbolRow } from "./Sidebar.js";
import { selectedIdOf, useStore } from "./store.js";
import { displayName, sourceUrl } from "./theme.js";

function NodeList({ title, ids }: { title: string; ids: string[] }) {
  const model = useStore((s) => s.model);
  if (!model || ids.length === 0) return null;
  const nodes = ids
    .map((id) => model.byId.get(id))
    .filter((n): n is GraphNode => Boolean(n))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <IgrExpansionPanel className="panel">
      <span slot="title">
        {title} ({nodes.length})
      </span>
      <IgrList className="panel__list ig-scrollbar">
        {nodes.map((n) => (
          <SymbolRow key={n.id} node={n} />
        ))}
      </IgrList>
    </IgrExpansionPanel>
  );
}

/** Which consumer libraries call or re-export the symbol, from the usage in graph.json. */
function LibraryUse({ id }: { id: string }) {
  const usage = useStore((s) => s.model?.graph.consumers);
  if (!usage) return null;
  const callers = directUsers(usage, id);
  const reexported = usage.reexported[id] ?? [];
  return (
    <div className="stack">
      <h3 className="subsection-title">Used by the libraries</h3>
      {callers.length === 0 && reexported.length === 0 && (
        <p className="muted">No library calls or re-exports it.</p>
      )}
      {callers.map((c) => (
        <IgrExpansionPanel key={c.consumer} className="panel">
          <span slot="title">
            <span className="mono">{c.consumer}</span> calls it in {c.files}{" "}
            {c.files === 1 ? "file" : "files"}
          </span>
          <ul className="file-list ig-scrollbar">
            {usage.direct[id][c.consumer].map((f) => (
              <li key={f} title={f}>
                {f}
              </li>
            ))}
          </ul>
        </IgrExpansionPanel>
      ))}
      {reexported.length > 0 && (
        <p className="muted">
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
    return <p className="muted">Select a node to see its details.</p>;
  }

  return (
    <div className="stack">
      <div className="details-head">
        <div className="details-head__name">
          <KindBadge kind={node.kind} />
          <span className="mono strong">
            {displayName(node.kind, node.name)}
          </span>
        </div>
        <a
          className="link mono"
          href={sourceUrl(node.file, node.line)}
          target="_blank"
          rel="noreferrer"
        >
          {node.file}:{node.line}
        </a>
        <span className="muted">
          {node.access}
          {node.group && ` · group: ${node.group}`}
        </span>
      </div>

      {node.description && <p>{node.description}</p>}

      {node.params && node.params.length > 0 && (
        <div className="stack stack--tight">
          <h3 className="subsection-title">Parameters</h3>
          <div className="chips">
            {node.params.map((p) => (
              <IgrChip key={p} className="mono">
                {p}
              </IgrChip>
            ))}
          </div>
        </div>
      )}

      {node.value !== undefined && (
        <div className="stack stack--tight">
          <h3 className="subsection-title">Value</h3>
          <pre className="code-block ig-scrollbar">{node.value}</pre>
        </div>
      )}

      <div className="stats">
        <div className="stat" data-tone="upstream">
          <span className="stat__value">{counts.allUp}</span>
          relies on (transitive)
        </div>
        <div className="stat" data-tone="downstream">
          <span className="stat__value">{counts.allDown}</span>
          affected if changed
        </div>
      </div>

      <NodeList title="Direct dependencies" ids={counts.deps} />
      <NodeList title="Direct dependents" ids={counts.users} />
      <LibraryUse id={node.id} />
    </div>
  );
}
