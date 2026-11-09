import {
  Background,
  Controls,
  type Edge,
  MarkerType,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SYSTEM_INFO, systemOf } from "../analysis/systems.js";
import { type Box, layout } from "../graph/layout.js";
import {
  focusView,
  impactSet,
  impactView,
  type SubGraph,
  systemMap,
  systemView,
  type ViewEdge,
} from "../graph/model.js";
import type { NodeKind } from "../parser/types.js";
import { GuideContent } from "./Guide.js";
import {
  type FileFlowNode,
  nodeTypes,
  SYMBOL_SIZE,
  SYSTEM_SIZE,
  type SymbolFlowNode,
  type SystemFlowNode,
} from "./nodes.js";
import { toHash } from "./route.js";
import { navigate, useFilters, useStore } from "./store.js";
import { EDGE_HEX } from "./theme.js";

function Arrow({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg width="34" height="8" aria-hidden="true" className="shrink-0">
      <line
        x1="0"
        y1="4"
        x2="28"
        y2="4"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={dashed ? "4 3" : undefined}
      />
      <path d="M28 0 L34 4 L28 8 Z" fill={color} />
    </svg>
  );
}

function Legend() {
  const route = useStore((s) => s.route);
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 space-y-0.5 rounded-md border border-slate-600 bg-slate-800 shadow-lg shadow-black/50 px-3 py-2 text-[11px] text-slate-200">
      <div className="mb-1 text-slate-400">
        Arrows point from what is used to what uses it
      </div>
      {route.view === "map" ? (
        <div className="flex items-center gap-2">
          <Arrow color="#64748b" /> links between systems; the number counts
          them
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Arrow color={EDGE_HEX.mixin} /> includes a mixin
          </div>
          <div className="flex items-center gap-2">
            <Arrow color={EDGE_HEX.function} /> calls a function
          </div>
          <div className="flex items-center gap-2">
            <Arrow color={EDGE_HEX.variable} /> reads a variable
          </div>
        </>
      )}
      <div className="flex items-center gap-2">
        <Arrow color="#94a3b8" dashed /> through a hidden variable or file
      </div>
      <div className="flex gap-3 pt-1">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm border border-amber-500 bg-amber-950/50" />
          relied on
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm border border-rose-700 bg-rose-950/50" />
          affected
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm border border-rose-500 bg-rose-950" />
          marked
        </span>
      </div>
    </div>
  );
}

/** How many links away from the symbol (or the marked changes) the graph reaches. */
function StepsControl() {
  const { depth, setDepth, route } = useStore();
  const subject =
    route.view === "impact" ? "the marked changes" : "the selected symbol";
  return (
    <fieldset className="absolute right-3 top-3 z-10 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-200 shadow-lg shadow-black/50">
      <legend className="float-left mr-2 py-0.5">Steps away</legend>
      <div className="flex">
        <div className="flex rounded bg-slate-950 p-0.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={depth === n}
              aria-label={`${n} step${n > 1 ? "s" : ""} away`}
              onClick={() => setDepth(n)}
              className={`w-6 rounded py-0.5 font-mono ${
                depth === n
                  ? "bg-sky-600 font-semibold text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <p className="clear-left mt-1 max-w-[34ch] text-[11px] leading-snug text-slate-400">
        How many links away from {subject} to draw. 1 shows only direct links.
      </p>
    </fieldset>
  );
}

function Welcome() {
  const dismiss = useStore((s) => s.dismissWelcome);
  return (
    <div className="absolute inset-x-0 top-12 z-10 mx-auto w-[min(620px,90%)] rounded-xl border border-sky-600 bg-slate-800 p-4 shadow-2xl shadow-black/60">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Start here</h2>
          <p className="text-xs text-slate-400">
            Each card is one system of the Sass engine. Arrows show which system
            uses which; the number counts the links.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500"
        >
          Got it
        </button>
      </div>
      <GuideContent onAction={dismiss} />
    </div>
  );
}

type FlowNode = SymbolFlowNode | SystemFlowNode | FileFlowNode;

interface Scene {
  nodes: FlowNode[];
  edges: ViewEdge[];
  truncated: number;
  empty?: string;
}

const symbolNodes = (
  sub: SubGraph,
  edits: ReadonlyMap<string, string>,
  grouped: boolean,
): FlowNode[] =>
  sub.nodes.map((v) => ({
    id: v.node.id,
    type: "symbol" as const,
    position: { x: 0, y: 0 },
    ...(grouped && {
      parentId: `file:${v.node.file}`,
      extent: "parent" as const,
    }),
    data: {
      node: v.node,
      role: v.role,
      distance: v.distance,
      dimmed: false,
      edited: edits.has(v.node.id),
      inFile: grouped,
    },
  }));

/** One box per file; React Flow needs parents before their children. */
function fileBoxes(sub: SubGraph): FileFlowNode[] {
  const outside = new Map<string, boolean>();
  for (const v of sub.nodes) {
    const isOutside = v.role === "upstream";
    outside.set(v.node.file, (outside.get(v.node.file) ?? true) && isOutside);
  }
  return [...outside].map(([file, isOutside]) => ({
    id: `file:${file}`,
    type: "file" as const,
    position: { x: 0, y: 0 },
    selectable: false,
    draggable: false,
    data: { file, outside: isOutside },
  }));
}

const empty = (message: string): Scene => ({
  nodes: [],
  edges: [],
  truncated: 0,
  empty: message,
});

/** Builds the un-positioned scene for the current route. */
function useScene(): Scene {
  const { model, route, depth, edits } = useStore();
  const filters = useFilters();

  return useMemo(() => {
    if (!model) return { nodes: [], edges: [], truncated: 0 };

    switch (route.view) {
      case "map": {
        const affected = impactSet(model, edits.keys());
        for (const id of edits.keys()) affected.set(id, 0);
        const { systems, edges } = systemMap(model, filters, affected);
        return {
          nodes: systems.map((summary) => ({
            id: summary.system,
            type: "system" as const,
            position: { x: 0, y: 0 },
            data: { summary, dimmed: false },
          })),
          edges,
          truncated: 0,
        };
      }
      case "system": {
        if (
          !model.graph.nodes.some((n) => systemOf(n.folder) === route.system)
        ) {
          return empty(
            `There is no system named "${route.system}". Pick one in the sidebar or on the map.`,
          );
        }
        const sub = systemView(model, route.system, filters);
        if (!sub.nodes.length) {
          return empty(
            `Nothing in "${route.system}" matches the Show filters. Turn on more kinds; a data-only system such as schemas needs Variables.`,
          );
        }
        return {
          nodes: [...fileBoxes(sub), ...symbolNodes(sub, edits, true)],
          edges: sub.edges,
          truncated: 0,
        };
      }
      case "symbol": {
        if (!model.byId.has(route.id)) {
          return empty(
            `No symbol with id "${route.id}". Search for it instead.`,
          );
        }
        const sub = focusView(model, route.id, depth, filters);
        return {
          nodes: symbolNodes(sub, edits, false),
          edges: sub.edges,
          truncated: sub.truncated,
        };
      }
      case "impact": {
        if (!edits.size) {
          return empty(
            'Nothing is marked as changed. Open a symbol and use "What breaks if I change this?".',
          );
        }
        const sub = impactView(model, new Set(edits.keys()), depth, filters);
        return {
          nodes: symbolNodes(sub, edits, false),
          edges: sub.edges,
          truncated: sub.truncated,
        };
      }
      default:
        return { nodes: [], edges: [], truncated: 0 };
    }
  }, [model, route, depth, filters, edits]);
}

export function GraphView() {
  const scene = useScene();
  const { route, hoverId, setHover, welcome } = useStore();
  const { fitView } = useReactFlow();
  // The last scene that has a layout; it stays on screen while the next one is laid out.
  const [laid, setLaid] = useState<{
    scene: Scene;
    shape: string;
    boxes: Map<string, Box>;
  }>({ scene, shape: "", boxes: new Map() });
  const [busy, setBusy] = useState(false);
  const [fitRequest, setFitRequest] = useState(0);
  // Refits only when the route changes, so filter changes keep the viewport.
  const fitKey = toHash(route);
  const fittedKey = useRef<string | null>(null);

  const shapeKey = useMemo(
    () => `${scene.nodes.map((n) => n.id).join("|")}#${scene.edges.length}`,
    [scene],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: layout depends only on shape.
  useEffect(() => {
    let cancelled = false;
    if (!scene.nodes.length) {
      setLaid({ scene, shape: shapeKey, boxes: new Map() });
      // An empty scene unmounts the canvas, so the next one has to fit again.
      fittedKey.current = null;
      return;
    }
    setBusy(true);
    const size = route.view === "map" ? SYSTEM_SIZE : SYMBOL_SIZE;
    layout({
      groups: scene.nodes
        .filter((n) => n.type === "file")
        .map((n) => ({ id: n.id })),
      nodes: scene.nodes
        .filter((n) => n.type !== "file")
        .map((n) => ({ id: n.id, parent: n.parentId, ...size })),
      edges: scene.edges,
    }).then((result) => {
      if (cancelled) return;
      setLaid({ scene, shape: shapeKey, boxes: result });
      setBusy(false);
      if (fittedKey.current !== fitKey) {
        fittedKey.current = fitKey;
        setFitRequest((v) => v + 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shapeKey]);

  useEffect(() => {
    if (fitRequest) fitView({ maxZoom: 1.2 });
  }, [fitRequest, fitView]);

  // Same shape: the current scene, so data changes show at once. New shape: the last laid-out one.
  const shown = laid.shape === shapeKey ? scene : laid.scene;
  const boxes = laid.boxes;

  // Hover: highlight the hovered node and its direct neighbours.
  const neighbours = useMemo(() => {
    if (!hoverId) return null;
    const set = new Set([hoverId]);
    for (const e of shown.edges) {
      if (e.source === hoverId) set.add(e.target);
      if (e.target === hoverId) set.add(e.source);
    }
    return set;
  }, [hoverId, shown.edges]);

  const nodes = useMemo(
    () =>
      shown.nodes
        .filter((n) => boxes.has(n.id))
        .map((n) => {
          const box = boxes.get(n.id)!;
          if (n.type === "file") {
            return {
              ...n,
              position: { x: box.x, y: box.y },
              style: { width: box.width, height: box.height },
            } as FlowNode;
          }
          return {
            ...n,
            position: { x: box.x, y: box.y },
            data: {
              ...n.data,
              dimmed: neighbours ? !neighbours.has(n.id) : false,
            },
          } as FlowNode;
        }),
    [shown.nodes, boxes, neighbours],
  );

  const kindOf = useMemo(() => {
    const map = new Map<string, NodeKind>();
    for (const n of shown.nodes) {
      if (n.type === "symbol") map.set(n.id, n.data.node.kind);
    }
    return map;
  }, [shown.nodes]);

  const edges = useMemo<Edge[]>(
    () =>
      shown.edges.map((e) => {
        const lit = hoverId && (e.source === hoverId || e.target === hoverId);
        // An arrow takes the color of what it carries: the kind of the symbol at its tail.
        const kind = kindOf.get(e.source);
        const stroke = lit ? "#38bdf8" : kind ? EDGE_HEX[kind] : "#64748b";
        return {
          ...e,
          selectable: false,
          focusable: false,
          interactionWidth: 0,
          zIndex: 1,
          animated: Boolean(lit),
          label: e.weight,
          labelStyle: { fontSize: 10, fill: "#cbd5e1" },
          labelBgStyle: { fill: "#0f172a" },
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
          style: {
            stroke,
            strokeWidth: lit ? 2.5 : 1.25,
            strokeDasharray: e.indirect ? "4 3" : undefined,
            opacity: neighbours && !lit ? 0.12 : 0.85,
          },
        };
      }),
    [shown.edges, hoverId, neighbours, kindOf],
  );

  if (scene.empty) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-400">
        {scene.empty}
      </div>
    );
  }

  const symbols = nodes.filter((n) => n.type !== "file").length;
  return (
    <div className="relative h-full w-full">
      <ReactFlow
        colorMode="dark"
        fitView
        fitViewOptions={{ maxZoom: 1.2 }}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        edgesFocusable={false}
        edgesReconnectable={false}
        nodesDraggable={false}
        panOnDrag
        minZoom={0.05}
        onNodeMouseEnter={(_, n) => n.type !== "file" && setHover(n.id)}
        onNodeMouseLeave={() => setHover(null)}
        onNodeClick={(_, n) => {
          if (n.type === "system") navigate({ view: "system", system: n.id });
          else if (n.type === "symbol") navigate({ view: "symbol", id: n.id });
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} color="#1e293b" />
        <Controls showInteractive={false} />
      </ReactFlow>
      <Legend />
      {(route.view === "symbol" || route.view === "impact") && <StepsControl />}
      {route.view === "map" && welcome && <Welcome />}
      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[70ch] flex-col items-start gap-1 text-xs">
        <span className="rounded-md border border-slate-600 bg-slate-800 shadow-lg shadow-black/50 px-2 py-1 text-slate-200">
          {symbols} {route.view === "map" ? "systems" : "symbols"} ·{" "}
          {edges.length} links
          {busy && " · laying out…"}
          {route.view === "map" &&
            " · numbers count the links · click a system to open it"}
        </span>
        {route.view === "system" && SYSTEM_INFO[route.system] && (
          <span className="rounded-md border border-slate-600 bg-slate-800 shadow-lg shadow-black/50 px-2 py-1 text-slate-200">
            <strong className="text-slate-100">{route.system}</strong>:{" "}
            {SYSTEM_INFO[route.system]} Dashed boxes are helpers from other
            systems.
          </span>
        )}
        {scene.truncated > 0 && (
          <span className="rounded-md border border-amber-600 bg-amber-950 px-2 py-1 text-amber-100 shadow-lg shadow-black/50">
            {scene.truncated} more reachable symbols hidden. Choose fewer steps
            away, or use the Outline tab.
          </span>
        )}
      </div>
    </div>
  );
}
