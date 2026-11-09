import { useMemo } from "react";
import { affectedComponents, impactSet } from "../graph/model.js";
import type { GraphNode } from "../parser/types.js";
import { navigate, selectedIdOf, useStore } from "./store.js";
import { displayName } from "./theme.js";

/** Marks parameters of the selected mixin or function as changed. */
function ParamPicker({ node }: { node: GraphNode }) {
  const { edits, setEdit } = useStore();
  const edited = edits.get(node.id);
  const changed = new Set(edited ? edited.split(",").filter(Boolean) : []);
  const toggle = (param: string) => {
    const next = new Set(changed);
    if (next.has(param)) next.delete(param);
    else next.add(param);
    setEdit(node.id, next.size ? [...next].join(",") : null);
  };
  const options = [...(node.params ?? []), "body"];

  return (
    <details
      className="text-xs"
      open={changed.size > 0 && !changed.has("body")}
    >
      <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
        Only some parameters change
      </summary>
      <p className="mt-1 text-slate-400">
        The reach is the same; this records what you plan to touch.
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {options.map((p) => (
          <label
            key={p}
            className={`cursor-pointer rounded border px-1.5 py-0.5 font-mono text-[11px] focus-within:ring-2 focus-within:ring-sky-500 ${
              changed.has(p)
                ? "border-rose-500 bg-rose-950/50 text-rose-300"
                : "border-slate-600 text-slate-300 hover:border-slate-400"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={changed.has(p)}
              onChange={() => toggle(p)}
            />
            {p}
          </label>
        ))}
      </div>
    </details>
  );
}

/** What the selected symbol reaches, and a button to add it to the marked changes. */
function SelectedImpact({ node }: { node: GraphNode }) {
  const { model, edits, setEdit } = useStore();
  const reach = useMemo(() => {
    if (!model) return null;
    const affected = impactSet(model, [node.id]);
    return {
      size: affected.size,
      components: affectedComponents(model, affected.keys()),
    };
  }, [model, node.id]);
  if (!reach) return null;
  const marked = edits.has(node.id);

  return (
    <div className="space-y-2 text-xs">
      <p className="text-slate-300">
        If{" "}
        <code className="font-semibold text-slate-100">
          {displayName(node.kind, node.name)}
        </code>{" "}
        changes, <strong className="text-rose-300">{reach.size}</strong> symbols
        and <strong className="text-rose-300">{reach.components.length}</strong>{" "}
        component themes are affected.
      </p>
      {reach.components.length > 0 && (
        <p className="text-slate-400">
          {reach.components
            .slice(0, 12)
            .map((c) => c.component)
            .join(", ")}
          {reach.components.length > 12 &&
            `, +${reach.components.length - 12} more`}
        </p>
      )}
      <button
        type="button"
        onClick={() =>
          setEdit(
            node.id,
            marked ? null : node.kind === "variable" ? "value" : "body",
          )
        }
        className={`w-full rounded-md px-3 py-1.5 font-semibold ${
          marked
            ? "border border-rose-500 text-rose-300 hover:bg-rose-950/50"
            : "bg-sky-600 text-white hover:bg-sky-500"
        }`}
      >
        {marked ? "Marked as changed · undo" : "Mark as changed"}
      </button>
      {node.kind !== "variable" && <ParamPicker node={node} />}
    </div>
  );
}

/** Every marked change, their combined reach and the component themes it touches. */
function MarkedChanges() {
  const { model, edits, setEdit, clearEdits } = useStore();
  const impact = useMemo(
    () => (model ? impactSet(model, edits.keys()) : new Map<string, number>()),
    [model, edits],
  );
  const components = useMemo(
    () => (model ? affectedComponents(model, impact.keys()) : []),
    [model, impact],
  );
  if (!model || edits.size === 0) return null;

  return (
    <div className="space-y-3 border-t border-slate-700 pt-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-200">
          Marked changes ({edits.size})
        </span>
        <button
          type="button"
          onClick={clearEdits}
          className="text-slate-400 hover:text-slate-200"
        >
          Clear all
        </button>
      </div>
      <ul className="space-y-0.5">
        {[...edits.keys()].map((id) => {
          const n = model.byId.get(id)!;
          return (
            <li key={id} className="flex items-center gap-1">
              <button
                type="button"
                className="flex-1 truncate text-left font-mono text-rose-300 hover:underline"
                onClick={() => navigate({ view: "symbol", id })}
              >
                {displayName(n.kind, n.name)}
              </button>
              <button
                type="button"
                className="rounded px-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label={`Unmark ${displayName(n.kind, n.name)}`}
                onClick={() => setEdit(id, null)}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <div className="rounded bg-rose-950/50 p-2 text-rose-200">
        Together they reach <strong>{impact.size}</strong> symbols in{" "}
        <strong>{components.length}</strong> component themes.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => navigate({ view: "impact" })}
        >
          Show the impact graph
        </button>
      </div>
      {components.length > 0 && (
        <ul className="max-h-64 space-y-0.5 overflow-auto">
          {components.map((c) => (
            <li key={c.component}>
              <details>
                <summary className="cursor-pointer">
                  <span className="font-mono">{c.component}</span>{" "}
                  <span className="text-slate-500">({c.ids.length})</span>
                </summary>
                <ul className="ml-4">
                  {c.ids.map((id) => {
                    const n = model.byId.get(id)!;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className="font-mono text-sky-400 hover:underline"
                          onClick={() => navigate({ view: "symbol", id })}
                        >
                          {displayName(n.kind, n.name)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ImpactPanel() {
  const model = useStore((s) => s.model);
  const selectedId = useStore((s) => selectedIdOf(s.route));
  const node = selectedId ? model?.byId.get(selectedId) : undefined;

  return (
    <div className="space-y-3">
      {node ? (
        <SelectedImpact node={node} />
      ) : (
        <p className="text-xs text-slate-400">
          Open a symbol to see what it reaches and to mark it as changed.
        </p>
      )}
      <MarkedChanges />
    </div>
  );
}
