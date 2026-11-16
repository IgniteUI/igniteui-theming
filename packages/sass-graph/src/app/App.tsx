import { ReactFlowProvider } from "@xyflow/react";
import { IgrButton, IgrTab, IgrTabs } from "igniteui-react";
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

const SYMBOL_TABS: [SymbolTab, string][] = [
  ["outline", "Outline"],
  ["graph", "Graph"],
];

function SymbolTabs() {
  const { symbolTab, setSymbolTab } = useStore();
  return (
    <IgrTabs
      className="symbol-tabs"
      onChange={(e) =>
        setSymbolTab(e.detail.id.replace("tab-", "") as SymbolTab)
      }
    >
      {SYMBOL_TABS.map(([tab, text]) => (
        <IgrTab
          key={tab}
          id={`tab-${tab}`}
          label={text}
          selected={symbolTab === tab}
        />
      ))}
    </IgrTabs>
  );
}

function MissingSymbol({ id }: { id: string }) {
  return (
    <div className="empty-state">
      <p>
        No symbol with id <code>{id}</code>. It may have been renamed or removed
        since the link was made.
      </p>
      <IgrButton onClick={() => navigate({ view: "map" })}>
        Back to the map
      </IgrButton>
      <p className="muted">
        Or press <kbd>/</kbd> to search for it.
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
      <div className="symbol-view">
        <SymbolTabs />
        <div className="symbol-view__body">
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

  if (error) return <p className="boot boot--error">{error}</p>;
  if (!model) return <p className="boot">Loading graph…</p>;

  const panel =
    (route.view === "symbol" && model.byId.has(route.id)) ||
    route.view === "impact";

  return (
    <ReactFlowProvider>
      <div className="app" data-panel={panel || undefined}>
        <Header />
        <Sidebar />
        <main className="app__main">
          <Main />
        </main>
        {panel && (
          <aside className="app__panel ig-scrollbar">
            {route.view === "symbol" && (
              <section className="panel-section">
                <h2 className="section-title">Details</h2>
                <DetailsPanel />
              </section>
            )}
            <section className="panel-section">
              <h2 className="section-title">What breaks if I change this?</h2>
              <ImpactPanel />
            </section>
          </aside>
        )}
      </div>
    </ReactFlowProvider>
  );
}
