export type Route =
  | { view: "map" }
  | { view: "system"; system: string }
  | { view: "symbol"; id: string }
  | { view: "impact" }
  | { view: "report" };

/** `#/`, `#/system/color`, `#/symbol/<id>`, `#/impact`, `#/report`; anything else is the map. */
export function parseHash(hash: string): Route {
  const [view, ...rest] = hash.replace(/^#\/?/, "").split("/");
  const arg = decodeURIComponent(rest.join("/"));
  if (view === "system" && arg) return { view, system: arg };
  if (view === "symbol" && arg) return { view, id: arg };
  if (view === "impact" || view === "report") return { view };
  return { view: "map" };
}

export function toHash(route: Route): string {
  switch (route.view) {
    case "system":
      return `#/system/${encodeURIComponent(route.system)}`;
    case "symbol":
      return `#/symbol/${encodeURIComponent(route.id)}`;
    case "map":
      return "#/";
    default:
      return `#/${route.view}`;
  }
}
