import { useMemo, useState } from "react";
import {
  DEFAULT_FLOW,
  type FlowNode,
  flow,
  flowSize,
} from "../analysis/flow.js";
import { navigate, useFilters, useStore } from "./store.js";
import { displayName, KIND_BG, KIND_LABEL, sourceUrl } from "./theme.js";

const firstSentence = (text?: string) =>
  text ? (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim() : "";

function Row({ item }: { item: FlowNode }) {
  const { node, repeated, cut, indirect } = item;
  return (
    <div className="flex min-w-0 items-baseline gap-2 py-0.5">
      <span
        className={`w-10 shrink-0 rounded py-0.5 text-center text-[10px] font-semibold uppercase text-white ${KIND_BG[node.kind]}`}
      >
        {KIND_LABEL[node.kind]}
      </span>
      <button
        type="button"
        onClick={() => navigate({ view: "symbol", id: node.id })}
        className="shrink-0 font-mono text-xs font-semibold text-slate-100 hover:text-sky-300 hover:underline"
      >
        {displayName(node.kind, node.name)}
      </button>
      <a
        href={sourceUrl(node.file, node.line)}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 font-mono text-[11px] text-slate-400 hover:text-sky-300 hover:underline"
      >
        {node.file}:{node.line}
      </a>
      {indirect && (
        <span className="shrink-0 rounded border border-dashed border-slate-500 px-1 text-[10px] text-slate-400">
          via variable
        </span>
      )}
      {repeated && (
        <span className="shrink-0 rounded bg-slate-800 px-1 text-[10px] text-slate-400">
          expanded elsewhere
        </span>
      )}
      {cut > 0 && (
        <span className="shrink-0 rounded bg-amber-900/60 px-1 text-[10px] text-amber-200">
          +{cut} deeper
        </span>
      )}
      <span className="min-w-0 max-w-[70ch] truncate text-xs text-slate-400">
        {firstSentence(node.description)}
      </span>
    </div>
  );
}

function Branch({
  item,
  open: initiallyOpen,
  root = false,
}: {
  item: FlowNode;
  /** Initial state; "Expand all" and "Collapse all" remount the tree with a new one. */
  open: boolean;
  root?: boolean;
}) {
  // The root stays open; collapsing it would hide the whole tree.
  const [open, setOpen] = useState(root || initiallyOpen);
  const count = item.children.length;
  return (
    <li>
      <div className="flex items-baseline gap-1">
        {count > 0 && !root ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${item.node.name}, ${count} ${count === 1 ? "child" : "children"}`}
            className="w-4 shrink-0 rounded text-center text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <Row item={item} />
        </div>
        {count > 0 && !open && (
          <span className="shrink-0 text-[10px] text-slate-500">{count}</span>
        )}
      </div>
      {count > 0 && open && (
        <ul className="ml-[1.4rem] border-l border-slate-700 pl-3">
          {item.children.map((child) => (
            <Branch key={child.node.id} item={child} open={initiallyOpen} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** The selected symbol as an indented tree of what it is built from, or what uses it. */
export function FlowView({ id }: { id: string }) {
  const { model, direction, setDirection } = useStore();
  const { kinds } = useFilters();
  const [expansion, setExpansion] = useState({ open: false, version: 0 });

  const tree = useMemo(
    () =>
      model?.byId.has(id)
        ? flow(model, id, {
            direction,
            depth: DEFAULT_FLOW.depth,
            mixins: kinds.has("mixin"),
            functions: kinds.has("function"),
            variables: kinds.has("variable"),
            files: kinds.has("module"),
          })
        : null,
    [model, id, direction, kinds],
  );
  if (!tree) return null;

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex rounded-md bg-slate-800 p-0.5">
          {(
            [
              ["dependencies", "Built from"],
              ["dependents", "Used by"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDirection(value)}
              className={`rounded px-2 py-1 ${
                direction === value
                  ? "bg-slate-700 font-semibold text-white shadow"
                  : "text-slate-300"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(
            [
              [true, "Expand all"],
              [false, "Collapse all"],
            ] as const
          ).map(([open, text]) => (
            <button
              key={text}
              type="button"
              onClick={() =>
                setExpansion((e) => ({ open, version: e.version + 1 }))
              }
              className="rounded border border-slate-600 px-2 py-1 text-slate-300 hover:border-slate-400 hover:text-white"
            >
              {text}
            </button>
          ))}
        </div>
        <span className="text-slate-400">
          {flowSize(tree)} symbols · read top to bottom · click a name to open
          it
        </span>
      </div>
      <ul>
        <Branch
          key={`${id}-${direction}-${expansion.version}`}
          item={tree}
          open={expansion.open}
          root
        />
      </ul>
      {tree.children.length === 0 && (
        <p className="mt-2 text-xs text-slate-400">
          {direction === "dependencies"
            ? "Built only from Sass built-ins and CSS."
            : "Nothing in the library uses it; it is consumer API or dead code."}
        </p>
      )}
    </div>
  );
}
