import ELK, {
  type ElkExtendedEdge,
  type ElkNode,
} from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export interface LayoutInput {
  nodes: { id: string; width: number; height: number; parent?: string }[];
  /** Containers; ELK sizes them around their children. */
  groups?: { id: string }[];
  edges: { id: string; source: string; target: string }[];
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface LayoutResult {
  /** Node boxes; a child's position is relative to its group, as React Flow expects. */
  boxes: Map<string, Box>;
  /** Orthogonal edge routes in canvas coordinates, from the source side to the target side. */
  routes: Map<string, Point[]>;
}

/** Room above a group's children for its label. */
export const GROUP_HEADER = 28;

/**
 * Layered left-to-right layout: dependencies on the left, dependents on the right.
 * Edges are routed orthogonally around the boxes.
 */
export async function layout(input: LayoutInput): Promise<LayoutResult> {
  const groups = new Map<string, ElkNode>(
    (input.groups ?? []).map((g) => [
      g.id,
      {
        id: g.id,
        layoutOptions: {
          "elk.padding": `[top=${GROUP_HEADER},left=12,bottom=12,right=12]`,
        },
        children: [],
      },
    ]),
  );
  const top: ElkNode[] = [...groups.values()];
  for (const n of input.nodes) {
    const node = { id: n.id, width: n.width, height: n.height };
    const group = n.parent ? groups.get(n.parent) : undefined;
    if (group) group.children!.push(node);
    else top.push(node);
  }

  const result = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.spacing.nodeNode": "16",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.cycleBreaking.strategy": "GREEDY",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.spacing.edgeNodeBetweenLayers": "24",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "8",
      "elk.spacing.edgeNode": "16",
      // Edge sections in root coordinates, also for edges ELK moves into a group.
      "elk.json.edgeCoords": "ROOT",
    },
    children: top,
    edges: input.edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  });

  const boxes = new Map<string, Box>();
  const routes = new Map<string, Point[]>();
  const route = (edges: ElkExtendedEdge[] = []) => {
    for (const e of edges) {
      const section = e.sections?.[0];
      if (!section) continue;
      routes.set(e.id, [
        section.startPoint,
        ...(section.bendPoints ?? []),
        section.endPoint,
      ]);
    }
  };
  route(result.edges);
  const collect = (nodes: ElkNode[] = []) => {
    for (const c of nodes) {
      route(c.edges);
      boxes.set(c.id, {
        x: c.x ?? 0,
        y: c.y ?? 0,
        width: c.width ?? 0,
        height: c.height ?? 0,
      });
      collect(c.children);
    }
  };
  collect(result.children);
  return { boxes, routes };
}
