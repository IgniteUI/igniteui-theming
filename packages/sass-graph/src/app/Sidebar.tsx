import { useEffect, useId, useMemo, useRef, useState } from "react";
import { systemOf } from "../analysis/systems.js";
import { search, systemMap } from "../graph/model.js";
import type { GraphNode, NodeKind } from "../parser/types.js";
import { DEFAULT_VIEW, navigate, useFilters, useStore } from "./store.js";
import { displayName, KIND_BG, KIND_LABEL } from "./theme.js";

export function SymbolRow({ node }: { node: GraphNode }) {
  return (
    <button
      type="button"
      onClick={() => navigate({ view: "symbol", id: node.id })}
      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-slate-800"
      title={`${node.file}:${node.line}`}
    >
      <span
        className={`w-10 shrink-0 rounded py-0.5 text-center text-[10px] font-semibold uppercase text-white ${KIND_BG[node.kind]}`}
      >
        {KIND_LABEL[node.kind]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-xs text-slate-100">
          {displayName(node.kind, node.name)}
        </span>
        <span className="block truncate text-[10px] text-slate-400">
          {node.file}
        </span>
      </span>
    </button>
  );
}

function KindDot({ kind }: { kind: NodeKind }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 rounded-full ${KIND_BG[kind]}`}
    />
  );
}

function Toggle({
  checked,
  onChange,
  hint,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** One line under the label saying what the option shows. */
  hint?: string;
  children: React.ReactNode;
}) {
  const hintId = useId();
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={hint ? hintId : undefined}
        />
        {children}
      </label>
      {hint && (
        <p id={hintId} className="ml-5 text-[11px] leading-snug text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Combobox: `/` focuses it, ↑/↓ move, Enter opens, Esc clears. */
function SearchBox() {
  const model = useStore((s) => s.model);
  const route = useStore((s) => s.route);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: clears the search on every navigation, including Start over.
  useEffect(() => {
    setQuery("");
    setActive(0);
  }, [route]);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(
    () => (model ? search(model, query) : []),
    [model, query],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const open = (n: GraphNode) => {
    navigate({ view: "symbol", id: n.id });
    setQuery("");
    setActive(0);
    input.current?.blur();
  };
  const listId = "search-results";
  const showList = query.trim().length > 0;

  return (
    <div className="relative">
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={results[active] ? `result-${active}` : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            open(results[active]);
          } else if (e.key === "Escape") {
            setQuery("");
            input.current?.blur();
          }
        }}
        placeholder="Find a symbol  ( / )"
        aria-label="Find a mixin, function or variable"
        className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500"
      />
      {showList && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border border-slate-700 bg-slate-900 shadow-lg"
        >
          {results.map((n, i) => (
            <div
              key={n.id}
              id={`result-${i}`}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                open(n);
              }}
              onKeyDown={() => {}}
              className={`flex cursor-pointer items-center gap-2 px-2 py-1 ${i === active ? "bg-slate-800" : ""}`}
            >
              <span
                className={`w-10 shrink-0 rounded py-0.5 text-center text-[10px] font-semibold uppercase text-white ${KIND_BG[n.kind]}`}
              >
                {KIND_LABEL[n.kind]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-xs text-slate-100">
                  {displayName(n.kind, n.name)}
                </span>
                <span className="block truncate text-[10px] text-slate-400">
                  {n.file}
                </span>
              </span>
            </div>
          ))}
          {results.length === 0 && (
            <p className="px-2 py-2 text-xs text-slate-400">
              Nothing matches "{query}". Try part of a name.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const {
    model,
    route,
    depth,
    showMixins,
    setShowMixins,
    showFunctions,
    setShowFunctions,
    showVariables,
    setShowVariables,
    showFiles,
    setShowFiles,
    publicOnly,
    setPublicOnly,
    resetFilters,
  } = useStore();
  const filters = useFilters();
  const filtersChanged =
    showMixins !== DEFAULT_VIEW.showMixins ||
    showFunctions !== DEFAULT_VIEW.showFunctions ||
    showVariables !== DEFAULT_VIEW.showVariables ||
    showFiles !== DEFAULT_VIEW.showFiles ||
    publicOnly !== DEFAULT_VIEW.publicOnly ||
    depth !== DEFAULT_VIEW.depth;

  // Every system stays listed, so toggling a filter never moves the controls below.
  const systems = useMemo(() => {
    if (!model) return [];
    const all = systemMap(model, {
      kinds: new Set(["mixin", "function", "variable"]),
      publicOnly: false,
    }).systems;
    const visible = new Set(
      systemMap(model, filters).systems.map((s) => s.system),
    );
    return all.map((s) => ({
      system: s.system,
      visible: visible.has(s.system),
    }));
  }, [model, filters]);
  const current =
    route.view === "system"
      ? route.system
      : route.view === "symbol" && model?.byId.get(route.id)
        ? systemOf(model.byId.get(route.id)!.folder)
        : null;
  const members = useMemo(() => {
    if (!model || route.view !== "system") return [];
    return model.graph.nodes
      .filter(
        (n) =>
          n.kind !== "module" &&
          systemOf(n.folder) === route.system &&
          filters.kinds.has(n.kind) &&
          (!publicOnly || n.access === "public"),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [model, route, filters, publicOnly]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-4 overflow-hidden border-r border-slate-700 bg-slate-900 p-3">
      <SearchBox />

      <div className="text-xs">
        <div className="mb-1 font-semibold text-slate-200">Systems</div>
        <div className="flex flex-wrap gap-1">
          {systems.map((s) => (
            <button
              key={s.system}
              type="button"
              onClick={() => navigate({ view: "system", system: s.system })}
              title={
                s.visible ? undefined : "Nothing here matches the Show filters"
              }
              className={`rounded border px-1.5 py-0.5 font-mono ${
                s.system === current
                  ? "border-sky-500 bg-sky-950 text-sky-300"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              } ${s.visible ? "" : "opacity-40"}`}
            >
              {s.system}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="space-y-1.5 text-xs">
        <legend className="mb-1 flex w-full items-center justify-between font-semibold text-slate-200">
          Show
          <button
            type="button"
            onClick={resetFilters}
            tabIndex={filtersChanged ? 0 : -1}
            aria-hidden={!filtersChanged}
            className={`font-normal text-sky-400 hover:text-sky-300 hover:underline ${filtersChanged ? "" : "invisible"}`}
          >
            Reset filters
          </button>
        </legend>
        <Toggle
          checked={showMixins}
          onChange={setShowMixins}
          hint="Used with @include; they output CSS."
        >
          <KindDot kind="mixin" /> Mixins
        </Toggle>
        <Toggle
          checked={showFunctions}
          onChange={setShowFunctions}
          hint="Called inside values; they return a value."
        >
          <KindDot kind="function" /> Functions
        </Toggle>
        <Toggle
          checked={showVariables}
          onChange={setShowVariables}
          hint="Settings, schemas and presets, e.g. $light-material-schema."
        >
          <KindDot kind="variable" /> Variables
        </Toggle>
        <Toggle
          checked={showFiles}
          onChange={setShowFiles}
          hint="Stylesheets that use a symbol from their own code, outside any mixin or function, e.g. the Tailwind theme files."
        >
          <KindDot kind="module" /> Entry files
        </Toggle>
        <div className="border-t border-slate-800 pt-1.5">
          <Toggle
            checked={publicOnly}
            onChange={setPublicOnly}
            hint="Hides private symbols: a - or _ prefix, or @access private."
          >
            Public API only
          </Toggle>
        </div>
      </fieldset>

      {route.view === "system" && (
        <div className="flex min-h-0 flex-1 flex-col text-xs">
          <div className="mb-1 font-semibold text-slate-200">
            In {route.system} ({members.length})
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {members.map((n) => (
              <SymbolRow key={n.id} node={n} />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
