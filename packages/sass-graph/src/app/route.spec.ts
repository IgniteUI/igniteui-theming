import { describe, expect, it } from "vitest";
import { parseHash, type Route, toHash } from "./route.js";

describe("route", () => {
  const routes: Route[] = [
    { view: "map" },
    { view: "system", system: "color" },
    { view: "symbol", id: "color/_functions.scss#function:palette" },
    { view: "impact" },
    { view: "report" },
  ];

  it("round-trips every route through the hash", () => {
    for (const route of routes) expect(parseHash(toHash(route))).toEqual(route);
  });

  it("encodes the # and / of a symbol id", () => {
    expect(toHash(routes[2])).toBe(
      "#/symbol/color%2F_functions.scss%23function%3Apalette",
    );
  });

  it("falls back to the map for an empty or unknown hash", () => {
    expect(parseHash("")).toEqual({ view: "map" });
    expect(parseHash("#/nope")).toEqual({ view: "map" });
    expect(parseHash("#/system/")).toEqual({ view: "map" });
  });
});
