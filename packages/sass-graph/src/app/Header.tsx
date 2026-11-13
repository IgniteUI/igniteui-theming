import {
  IgrBreadcrumb,
  IgrBreadcrumbs,
  IgrButton,
  IgrIcon,
  IgrIconButton,
  IgrNavbar,
  IgrTab,
  IgrTabs,
} from "igniteui-react";
import { systemOf } from "../analysis/systems.js";
import { GuideDialog } from "./Guide.js";
import { Logo } from "./Logo.js";
import { type Route, toHash } from "./route.js";
import { navigate, useStore } from "./store.js";
import { displayName } from "./theme.js";

type Section = "explore" | "report" | "impact";

const SECTION_ROUTE: Record<Section, Route> = {
  explore: { view: "map" },
  report: { view: "report" },
  impact: { view: "impact" },
};

const sectionOf = (route: Route): Section =>
  route.view === "report"
    ? "report"
    : route.view === "impact"
      ? "impact"
      : "explore";

/** Logo home link, history, breadcrumb, the three sections and the guide. */
export function Header() {
  const { model, route, edits, guideOpen, setGuideOpen, startOver, trail, at } =
    useStore();

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

  const section = sectionOf(route);
  const tabs: [Section, string][] = [
    ["explore", "Explore"],
    ["report", "Report"],
    ["impact", edits.size ? `Impact (${edits.size})` : "Impact"],
  ];

  return (
    <IgrNavbar className="app__header">
      <div slot="start" className="header-start">
        <a
          href={import.meta.env.BASE_URL}
          className="brand"
          title="Home: reload on the map"
        >
          <Logo size={26} />
          <h1 className="brand__title">Theming engine</h1>
        </a>
        <IgrIconButton
          variant="flat"
          name="back"
          aria-label="Back"
          title="Back (Alt+←)"
          disabled={at <= 0}
          onClick={() => history.back()}
        />
        <IgrIconButton
          variant="flat"
          name="forward"
          aria-label="Forward"
          title="Forward (Alt+→)"
          disabled={at >= trail.length - 1}
          onClick={() => history.forward()}
        />
      </div>

      <IgrBreadcrumbs aria-label="Breadcrumb" className="crumbs">
        {crumbs.map((c) => (
          <IgrBreadcrumb key={c.text}>
            {c.route ? (
              <a
                href={toHash(c.route)}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(c.route!);
                }}
              >
                {c.text}
              </a>
            ) : (
              <span aria-current="page">{c.text}</span>
            )}
          </IgrBreadcrumb>
        ))}
      </IgrBreadcrumbs>

      <div slot="end" className="header-end">
        <IgrTabs
          className="section-tabs"
          aria-label="Sections"
          onChange={(e) =>
            navigate(
              SECTION_ROUTE[e.detail.id.replace("section-", "") as Section],
            )
          }
        >
          {tabs.map(([id, text]) => (
            <IgrTab
              key={id}
              id={`section-${id}`}
              label={text}
              selected={section === id}
            />
          ))}
        </IgrTabs>
        <IgrButton
          variant="flat"
          onClick={startOver}
          title="Back to the map with default filters. Marked changes are kept."
        >
          <IgrIcon slot="prefix" name="restart" />
          Start over
        </IgrButton>
        <IgrButton variant="outlined" onClick={() => setGuideOpen(true)}>
          <IgrIcon slot="prefix" name="help" />
          How to use
        </IgrButton>
      </div>
      <GuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </IgrNavbar>
  );
}
