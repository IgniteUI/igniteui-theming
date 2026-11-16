import {
  IgrButton,
  IgrChip,
  IgrExpansionPanel,
  IgrIconButton,
} from "igniteui-react";
import { useMemo } from "react";
import { type LibraryReach, libraryReach } from "../analysis/consumers.js";
import { affectedComponents, impactSet } from "../graph/model.js";
import type { GraphNode } from "../parser/types.js";
import { navigate, selectedIdOf, useStore } from "./store.js";
import { displayName } from "./theme.js";

/** Marks parameters of the selected mixin or function as changed. */
function ParamPicker({ node }: { node: GraphNode }) {
  const { edits, setEdit } = useStore();
  const edited = edits.get(node.id);
  const changed = new Set(edited ? edited.split(",").filter(Boolean) : []);
  const set = (param: string, on: boolean) => {
    const next = new Set(changed);
    if (on) next.add(param);
    else next.delete(param);
    setEdit(node.id, next.size ? [...next].join(",") : null);
  };
  const options = [...(node.params ?? []), "body"];

  return (
    <IgrExpansionPanel
      className="panel"
      open={changed.size > 0 && !changed.has("body")}
    >
      <span slot="title">Only some parameters change</span>
      <div className="stack stack--tight">
        <p className="muted">
          The reach is the same; this records what you plan to touch.
        </p>
        <div className="chips">
          {options.map((p) => (
            <IgrChip
              key={p}
              className="mono"
              selectable
              selected={changed.has(p)}
              variant={changed.has(p) ? "danger" : undefined}
              onSelect={(e) => set(p, e.detail)}
            >
              {p}
            </IgrChip>
          ))}
        </div>
      </div>
    </IgrExpansionPanel>
  );
}

/** Library files and components that call the changed code or anything it reaches. */
function LibraryImpact({ reach }: { reach: LibraryReach[] }) {
  if (!reach.length) return null;
  return (
    <div className="stack stack--tight">
      {reach.map((l) => (
        <IgrExpansionPanel key={l.name} className="panel">
          <span slot="title">
            <span className="mono">{l.name}</span>: {l.components.length}{" "}
            {l.components.length === 1 ? "component" : "components"}, {l.files}{" "}
            {l.files === 1 ? "file" : "files"}
          </span>
          {l.components.length ? (
            <div className="chips">
              {l.components.map((c) => (
                <IgrChip key={c} className="mono">
                  {c}
                </IgrChip>
              ))}
            </div>
          ) : (
            <p className="muted">Only shared theme files call it.</p>
          )}
        </IgrExpansionPanel>
      ))}
    </div>
  );
}

/** What the selected symbol reaches, and a button to add it to the marked changes. */
function SelectedImpact({ node }: { node: GraphNode }) {
  const { model, edits, setEdit } = useStore();
  const reach = useMemo(() => {
    if (!model) return null;
    const affected = impactSet(model, [node.id]);
    const libraries = libraryReach(model.graph.consumers, [
      node.id,
      ...affected.keys(),
    ]);
    return {
      size: affected.size,
      components: affectedComponents(model, affected.keys()),
      libraries,
      libraryComponents: libraries.reduce((n, l) => n + l.components.length, 0),
    };
  }, [model, node.id]);
  if (!reach) return null;
  const marked = edits.has(node.id);

  return (
    <div className="stack">
      <p>
        If <code>{displayName(node.kind, node.name)}</code> changes,{" "}
        <strong className="danger-text">{reach.size}</strong> symbols and{" "}
        <strong className="danger-text">{reach.components.length}</strong>{" "}
        engine component themes are affected
        {model?.graph.consumers ? (
          <>
            , and{" "}
            <strong className="danger-text">{reach.libraryComponents}</strong>{" "}
            library components call it or something it reaches.
          </>
        ) : (
          ". Library use was not scanned."
        )}
      </p>
      {reach.components.length > 0 && (
        <p className="muted">
          {reach.components
            .slice(0, 12)
            .map((c) => c.component)
            .join(", ")}
          {reach.components.length > 12 &&
            `, +${reach.components.length - 12} more`}
        </p>
      )}
      <LibraryImpact reach={reach.libraries} />
      <IgrButton
        className="block-button"
        variant={marked ? "outlined" : "contained"}
        onClick={() =>
          setEdit(
            node.id,
            marked ? null : node.kind === "variable" ? "value" : "body",
          )
        }
      >
        {marked ? "Marked as changed · undo" : "Mark as changed"}
      </IgrButton>
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
  const libraries = useMemo(
    () =>
      model
        ? libraryReach(model.graph.consumers, [
            ...edits.keys(),
            ...impact.keys(),
          ])
        : [],
    [model, edits, impact],
  );
  if (!model || edits.size === 0) return null;

  return (
    <div className="stack marked">
      <div className="row row--between">
        <h3 className="subsection-title">Marked changes ({edits.size})</h3>
        <IgrButton variant="flat" onClick={clearEdits}>
          Clear all
        </IgrButton>
      </div>
      <ul className="marked__list">
        {[...edits.keys()].map((id) => {
          const n = model.byId.get(id)!;
          const name = displayName(n.kind, n.name);
          return (
            <li key={id}>
              <button
                type="button"
                className="link mono danger-text"
                onClick={() => navigate({ view: "symbol", id })}
              >
                {name}
              </button>
              <IgrIconButton
                variant="flat"
                name="close"
                aria-label={`Unmark ${name}`}
                onClick={() => setEdit(id, null)}
              />
            </li>
          );
        })}
      </ul>
      <div className="callout callout--danger">
        Together they reach <strong>{impact.size}</strong> symbols in{" "}
        <strong>{components.length}</strong> engine component themes
        {libraries.length > 0 &&
          ` and ${libraries.reduce((n, l) => n + l.components.length, 0)} library components`}
        .{" "}
        <button
          type="button"
          className="link"
          onClick={() => navigate({ view: "impact" })}
        >
          Show the impact graph
        </button>
      </div>
      <LibraryImpact reach={libraries} />
      {components.map((c) => (
        <IgrExpansionPanel key={c.component} className="panel">
          <span slot="title">
            <span className="mono">{c.component}</span>{" "}
            <span className="muted">({c.ids.length})</span>
          </span>
          <ul className="plain-list">
            {c.ids.map((id) => {
              const n = model.byId.get(id)!;
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="link mono"
                    onClick={() => navigate({ view: "symbol", id })}
                  >
                    {displayName(n.kind, n.name)}
                  </button>
                </li>
              );
            })}
          </ul>
        </IgrExpansionPanel>
      ))}
    </div>
  );
}

export function ImpactPanel() {
  const model = useStore((s) => s.model);
  const selectedId = useStore((s) => selectedIdOf(s.route));
  const node = selectedId ? model?.byId.get(selectedId) : undefined;

  return (
    <div className="stack">
      {node ? (
        <SelectedImpact node={node} />
      ) : (
        <p className="muted">
          Open a symbol to see what it reaches and to mark it as changed.
        </p>
      )}
      <MarkedChanges />
    </div>
  );
}
