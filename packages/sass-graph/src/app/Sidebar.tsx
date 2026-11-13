import {
  IgrButton,
  IgrChip,
  IgrIcon,
  IgrInput,
  IgrList,
  IgrListItem,
  IgrSwitch,
  IgrTooltip,
} from "igniteui-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { systemOf } from "../analysis/systems.js";
import { search, systemMap } from "../graph/model.js";
import type { GraphNode, NodeKind } from "../parser/types.js";
import { KindBadge, SymbolLabel } from "./KindBadge.js";
import { DEFAULT_VIEW, navigate, useFilters, useStore } from "./store.js";

/** A clickable list row that opens the symbol. */
export function SymbolRow({ node }: { node: GraphNode }) {
  const open = () => navigate({ view: "symbol", id: node.id });
  return (
    <IgrListItem
      className="symbol-row"
      role="link"
      tabIndex={0}
      title={`${node.file}:${node.line}`}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
    >
      <SymbolLabel node={node} />
    </IgrListItem>
  );
}

function Toggle({
  checked,
  onChange,
  hint,
  kind,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** What the option shows; appears in a tooltip on hover and focus. */
  hint: string;
  kind?: NodeKind;
  disabled?: boolean;
  children: string;
}) {
  const id = useId();
  return (
    // The wrapper is the anchor, so a disabled switch still explains itself.
    <div className="toggle" id={id}>
      <IgrSwitch
        data-filter={children}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.detail.checked)}
        labelPosition="before"
      >
        <span className="toggle__label">
          {kind && <KindBadge kind={kind} />}
          {children}
        </span>
      </IgrSwitch>
      <IgrTooltip
        anchor={id}
        placement="right"
        showTriggers="pointerenter,focusin"
        hideTriggers="pointerleave,focusout,click"
        className="hint"
      >
        {hint}
      </IgrTooltip>
    </div>
  );
}

/** Search box: `/` focuses it, ↑/↓ move, Enter opens, Esc clears. */
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
  const input = useRef<IgrInput>(null);
  const results = useMemo(
    () => (model ? search(model, query) : []),
    [model, query],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.composedPath()[0] as HTMLElement;
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
  const showList = query.trim().length > 0;

  return (
    <div className="search">
      <IgrInput
        ref={input}
        type="search"
        value={query}
        placeholder="Find a symbol  ( / )"
        aria-label="Find a mixin, function or variable"
        onInput={(e) => {
          setQuery(e.detail);
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
      >
        <IgrIcon slot="prefix" name="search" />
      </IgrInput>
      {showList && (
        <div className="search__results ig-scrollbar">
          {results.length > 0 ? (
            <IgrList>
              {results.map((n, i) => (
                <IgrListItem
                  key={n.id}
                  selected={i === active}
                  className="symbol-row"
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    open(n);
                  }}
                >
                  <SymbolLabel node={n} />
                </IgrListItem>
              ))}
            </IgrList>
          ) : (
            <p className="search__empty">
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
    symbolTab,
    showMixins,
    setShowMixins,
    showFunctions,
    setShowFunctions,
    showVariables,
    setShowVariables,
    publicOnly,
    setPublicOnly,
    resetFilters,
  } = useStore();
  const filters = useFilters();
  const filtersChanged =
    showMixins !== DEFAULT_VIEW.showMixins ||
    showFunctions !== DEFAULT_VIEW.showFunctions ||
    showVariables !== DEFAULT_VIEW.showVariables ||
    publicOnly !== DEFAULT_VIEW.publicOnly;
  const inOutline = route.view === "symbol" && symbolTab === "outline";

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
    <aside className="app__sidebar">
      <SearchBox />

      <section>
        <h2 className="section-title">Filter by system</h2>
        <div className="chips">
          {systems.map((s) => (
            <IgrChip
              key={s.system}
              className="system-chip"
              data-system={s.system}
              data-dimmed={!s.visible || undefined}
              variant={s.system === current ? "primary" : undefined}
              aria-current={s.system === current ? "page" : undefined}
              title={
                s.visible ? undefined : "Nothing here matches the Show filters"
              }
              onClick={() => navigate({ view: "system", system: s.system })}
            >
              {s.system}
            </IgrChip>
          ))}
        </div>
      </section>

      {route.view === "report" ? (
        <section className="stack stack--tight">
          <h2 className="section-title">Filter by type</h2>
          <p className="muted">
            The report always covers the whole engine, so the filters do not
            apply here.
          </p>
        </section>
      ) : (
        <fieldset className="filters">
          <legend className="section-title filters__legend">
            Filter by type
            <IgrButton
              variant="flat"
              className="filters__reset"
              data-hidden={!filtersChanged || undefined}
              tabIndex={filtersChanged ? 0 : -1}
              aria-hidden={!filtersChanged}
              onClick={resetFilters}
            >
              Reset filters
            </IgrButton>
          </legend>
          <Toggle
            kind="mixin"
            checked={showMixins}
            onChange={setShowMixins}
            hint="Used with @include; they output CSS."
          >
            Mixins
          </Toggle>
          <Toggle
            kind="function"
            checked={showFunctions}
            onChange={setShowFunctions}
            hint="Called inside values; they return a value."
          >
            Functions
          </Toggle>
          <Toggle
            kind="variable"
            checked={showVariables}
            onChange={setShowVariables}
            hint="Settings, schemas and presets, e.g. $light-material-schema."
          >
            Variables
          </Toggle>
          <hr className="divider" />
          <Toggle
            checked={publicOnly}
            onChange={setPublicOnly}
            disabled={inOutline}
            hint={
              inOutline
                ? "The outline keeps private helpers, so every step of a flow stays visible. Use the Graph tab to hide them."
                : "Hides private symbols: a - or _ prefix, or @access private."
            }
          >
            Public API only
          </Toggle>
        </fieldset>
      )}

      {route.view === "system" && (
        <section className="members">
          <h2 className="section-title">
            In {route.system} ({members.length})
          </h2>
          <IgrList className="members__list ig-scrollbar">
            {members.map((n) => (
              <SymbolRow key={n.id} node={n} />
            ))}
          </IgrList>
        </section>
      )}
    </aside>
  );
}
