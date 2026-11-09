import { systemOf } from "../analysis/systems.js";
import { GuideDialog } from "./Guide.js";
import { Logo } from "./Logo.js";
import type { Route } from "./route.js";
import { navigate, useStore } from "./store.js";
import { displayName } from "./theme.js";

function Crumb({ route, text }: { route?: Route; text: string }) {
  if (!route) {
    return <span className="font-semibold text-slate-100">{text}</span>;
  }
  return (
    <button
      type="button"
      onClick={() => navigate(route)}
      className="text-sky-400 hover:underline"
    >
      {text}
    </button>
  );
}

/** Title, a breadcrumb back to the map, and links to the report and the sandbox impact. */
export function Header() {
  const { model, route, edits, guideOpen, setGuideOpen, startOver, trail, at } =
    useStore();
  const step = (
    text: string,
    label: string,
    enabled: boolean,
    go: () => void,
  ) => (
    <button
      type="button"
      onClick={go}
      disabled={!enabled}
      aria-label={label}
      title={`${label} (${label === "Back" ? "Alt+←" : "Alt+→"})`}
      className="rounded px-1.5 py-0.5 text-slate-300 hover:bg-slate-800 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {text}
    </button>
  );

  const crumbs: { route?: Route; text: string }[] = [];
  if (route.view === "map") crumbs.push({ text: "Map" });
  else crumbs.push({ route: { view: "map" }, text: "Map" });
  if (route.view === "system") crumbs.push({ text: route.system });
  if (route.view === "symbol") {
    const node = model?.byId.get(route.id);
    if (node) {
      const system = systemOf(node.folder);
      crumbs.push(
        { route: { view: "system", system }, text: system },
        { text: displayName(node.kind, node.name) },
      );
    }
  }
  if (route.view === "impact")
    crumbs.push({ text: "Impact of marked changes" });
  if (route.view === "report") crumbs.push({ text: "Report" });

  const tab = (target: Route, text: string, active: boolean) => (
    <button
      type="button"
      onClick={() => navigate(target)}
      className={`rounded px-2.5 py-1 ${active ? "bg-slate-700 font-semibold text-white shadow" : "text-slate-300 hover:text-white"}`}
    >
      {text}
    </button>
  );

  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-slate-700 bg-slate-900 px-4">
      <a
        href={import.meta.env.BASE_URL}
        className="flex shrink-0 items-center gap-2 rounded"
        title="Home: reload on the map"
      >
        <Logo size={26} />
        <h1 className="text-sm font-bold text-slate-100">Theming engine</h1>
      </a>
      <div className="flex shrink-0 items-center text-sm">
        {step("←", "Back", at > 0, () => history.back())}
        {step("→", "Forward", at < trail.length - 1, () => history.forward())}
      </div>
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1.5 truncate font-mono text-xs"
      >
        {crumbs.map((c, i) => (
          <span key={c.text} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-500">›</span>}
            <Crumb route={c.route} text={c.text} />
          </span>
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 rounded-md bg-slate-800 p-0.5 text-xs">
        {tab(
          { view: "map" },
          "Explore",
          route.view === "map" ||
            route.view === "system" ||
            route.view === "symbol",
        )}
        {tab({ view: "report" }, "Report", route.view === "report")}
        {tab(
          { view: "impact" },
          edits.size ? `Impact (${edits.size})` : "Impact",
          route.view === "impact",
        )}
      </div>
      <button
        type="button"
        onClick={startOver}
        title="Back to the map with default filters. Marked changes are kept."
        className="shrink-0 rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:border-sky-500 hover:text-white"
      >
        ⟲ Start over
      </button>
      <button
        type="button"
        onClick={() => setGuideOpen(true)}
        className="shrink-0 rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:border-sky-500 hover:text-white"
      >
        How to use
      </button>
      <GuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </header>
  );
}
