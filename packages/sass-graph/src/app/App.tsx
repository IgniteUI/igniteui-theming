import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useState } from "react";
import { createModel } from "../graph/model.js";
import type { SassGraph } from "../parser/types.js";
import { DetailsPanel } from "./DetailsPanel.js";
import { FlowView } from "./FlowView.js";
import { GraphView } from "./GraphView.js";
import { Header } from "./Header.js";
import { ImpactPanel } from "./ImpactPanel.js";
import { ReportView } from "./ReportView.js";
import { Sidebar } from "./Sidebar.js";
import { navigate, type SymbolTab, useStore } from "./store.js";

function SymbolTabs() {
  const { symbolTab, setSymbolTab } = useStore();
  const tabs: [SymbolTab, string][] = [
    ["outline", "Outline"],
    ["graph", "Graph"],
  ];
  return (
    <div className="flex shrink-0 gap-1 border-b border-slate-700 bg-slate-900 px-3 pt-2 text-xs">
      {tabs.map(([tab, text]) => (
        <button
          key={tab}
          type="button"
          onClick={() => setSymbolTab(tab)}
          className={`-mb-px rounded-t border px-3 py-1 ${
            symbolTab === tab
              ? "border-slate-700 border-b-slate-900 bg-slate-900 font-semibold text-slate-100"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function MissingSymbol({ id }: { id: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-slate-400">
      <p>
        No symbol with id <code className="text-slate-200">{id}</code>. It may
        have been renamed or removed since the link was made.
      </p>
      <button
        type="button"
        onClick={() => navigate({ view: "map" })}
        className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
      >
        Back to the map
      </button>
      <p className="text-xs">
        Or press <kbd className="rounded border border-slate-600 px-1">/</kbd>{" "}
        to search for it.
      </p>
    </div>
  );
}

function Main() {
  const { route, symbolTab, model } = useStore();
  if (route.view === "report") return <ReportView />;
  if (route.view === "symbol" && !model?.byId.has(route.id)) {
    return <MissingSymbol id={route.id} />;
  }
  if (route.view === "symbol") {
    return (
      <div className="flex h-full flex-col">
        <SymbolTabs />
        <div className="min-h-0 flex-1">
          {symbolTab === "outline" ? <FlowView id={route.id} /> : <GraphView />}
        </div>
      </div>
    );
  }
  return <GraphView />;
}

export function App() {
  const { model, setModel, route, visit } = useStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}graph.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json() as Promise<SassGraph>;
      })
      .then((graph) => setModel(createModel(graph)))
      .catch((e: Error) =>
        setError(
          `Could not load graph.json (${e.message}). Run "npm run graph:build" first.`,
        ),
      );
  }, [setModel]);

  useEffect(() => {
    const sync = () => visit(location.hash);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [visit]);

  if (error) return <div className="p-6 text-sm text-rose-400">{error}</div>;
  if (!model)
    return <div className="p-6 text-sm text-slate-400">Loading graph…</div>;

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100">
        <Header />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <Main />
          </main>
          {((route.view === "symbol" && model.byId.has(route.id)) ||
            route.view === "impact") && (
            <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-auto border-l border-slate-700 bg-slate-900 p-3">
              {route.view === "symbol" && (
                <section>
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Details
                  </h2>
                  <DetailsPanel />
                </section>
              )}
              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  What breaks if I change this?
                </h2>
                <ImpactPanel />
              </section>
            </aside>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
