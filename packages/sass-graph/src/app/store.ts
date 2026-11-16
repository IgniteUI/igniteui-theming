import { useMemo } from "react";
import { create } from "zustand";
import type { Filters, GraphModel } from "../graph/model.js";
import type { NodeKind } from "../parser/types.js";
import { parseHash, type Route, toHash } from "./route.js";
import { guideSeen, markGuideSeen } from "./storage.js";

export type SymbolTab = "outline" | "graph";
export type Direction = "dependencies" | "dependents";

interface State {
  model: GraphModel | null;
  /** Mirrors `location.hash`; change it with `navigate`. */
  route: Route;
  hoverId: string | null;
  depth: number;
  showMixins: boolean;
  showFunctions: boolean;
  showVariables: boolean;
  publicOnly: boolean;
  symbolTab: SymbolTab;
  direction: Direction;
  /** Sandbox: node id → what changed (`value`, or a comma list of parameters and `body`). */
  edits: Map<string, string>;
  guideOpen: boolean;
  /** The first-visit card on the map, until it is dismissed once. */
  welcome: boolean;

  setModel: (model: GraphModel) => void;
  setRoute: (route: Route) => void;
  /** Routes visited in this tab and the current position, for Back and Forward. */
  trail: string[];
  at: number;
  /** Records a hash change: a new step after `navigate`, otherwise a browser back or forward. */
  visit: (hash: string) => void;
  setHover: (id: string | null) => void;
  setDepth: (depth: number) => void;
  setShowMixins: (value: boolean) => void;
  setShowFunctions: (value: boolean) => void;
  setShowVariables: (value: boolean) => void;
  setPublicOnly: (value: boolean) => void;
  setSymbolTab: (tab: SymbolTab) => void;
  setDirection: (direction: Direction) => void;
  setEdit: (id: string, value: string | null) => void;
  clearEdits: () => void;
  setGuideOpen: (open: boolean) => void;
  dismissWelcome: () => void;
  /** Restores the filters, depth and tabs; `startOver` also returns to the map. */
  resetFilters: () => void;
  startOver: () => void;
}

/** What "Start over" restores; marked changes are the user's work and stay. */
export const DEFAULT_VIEW = {
  depth: 2,
  showMixins: true,
  showFunctions: true,
  showVariables: false,
  publicOnly: false,
  symbolTab: "outline" as SymbolTab,
  direction: "dependencies" as Direction,
};

export const useStore = create<State>((set) => ({
  model: null,
  route: parseHash(typeof location === "undefined" ? "" : location.hash),
  trail: [
    toHash(parseHash(typeof location === "undefined" ? "" : location.hash)),
  ],
  at: 0,
  hoverId: null,
  ...DEFAULT_VIEW,
  edits: new Map(),
  guideOpen: false,
  welcome: !guideSeen(),

  setModel: (model) => set({ model }),
  setRoute: (route) => set({ route, hoverId: null }),
  visit: (hash) =>
    set((s) => {
      const route = parseHash(hash);
      const key = toHash(route);
      const pushed = pendingPush;
      pendingPush = false;
      if (!pushed) {
        if (s.trail[s.at - 1] === key)
          return { route, hoverId: null, at: s.at - 1 };
        if (s.trail[s.at + 1] === key)
          return { route, hoverId: null, at: s.at + 1 };
      }
      if (s.trail[s.at] === key) return { route, hoverId: null };
      const trail = [...s.trail.slice(0, s.at + 1), key];
      return { route, hoverId: null, trail, at: trail.length - 1 };
    }),
  setHover: (hoverId) => set({ hoverId }),
  setDepth: (depth) => set({ depth }),
  setShowMixins: (showMixins) => set({ showMixins }),
  setShowFunctions: (showFunctions) => set({ showFunctions }),
  setShowVariables: (showVariables) => set({ showVariables }),
  setPublicOnly: (publicOnly) => set({ publicOnly }),
  setSymbolTab: (symbolTab) => set({ symbolTab }),
  setDirection: (direction) => set({ direction }),
  setEdit: (id, value) =>
    set((s) => {
      const edits = new Map(s.edits);
      if (value === null) edits.delete(id);
      else edits.set(id, value);
      return { edits };
    }),
  clearEdits: () => set({ edits: new Map() }),
  setGuideOpen: (guideOpen) => set({ guideOpen }),
  resetFilters: () =>
    set({
      showMixins: DEFAULT_VIEW.showMixins,
      showFunctions: DEFAULT_VIEW.showFunctions,
      showVariables: DEFAULT_VIEW.showVariables,
      publicOnly: DEFAULT_VIEW.publicOnly,
    }),
  startOver: () => {
    set({ ...DEFAULT_VIEW, hoverId: null, guideOpen: false });
    navigate({ view: "map" });
  },
  dismissWelcome: () => {
    markGuideSeen();
    set({ welcome: false });
  },
}));

// Set by `navigate`, so the next hashchange counts as a new step even if it matches a neighbour.
let pendingPush = false;

/** Moves to `route`; the hashchange listener in `App` updates the store. */
export function navigate(route: Route): void {
  const hash = toHash(route);
  if (location.hash === hash) return;
  pendingPush = true;
  location.hash = hash;
}

export const selectedIdOf = (route: Route) =>
  route.view === "symbol" ? route.id : null;

/** The kinds the Show switches leave visible, plus entry files, and the public-only switch. */
export function useFilters(): Filters {
  const mixins = useStore((s) => s.showMixins);
  const functions = useStore((s) => s.showFunctions);
  const variables = useStore((s) => s.showVariables);
  const publicOnly = useStore((s) => s.publicOnly);
  return useMemo(() => {
    const kinds = new Set<NodeKind>();
    if (mixins) kinds.add("mixin");
    if (functions) kinds.add("function");
    if (variables) kinds.add("variable");
    kinds.add("module");
    return { kinds, publicOnly };
  }, [mixins, functions, variables, publicOnly]);
}
