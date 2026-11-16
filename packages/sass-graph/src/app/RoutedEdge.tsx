import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import type { Point } from "../graph/layout.js";

export type RoutedEdgeData = {
  /** ELK route in canvas coordinates; the edge falls back to a bezier without one. */
  points?: Point[];
};

export type RoutedFlowEdge = Edge<RoutedEdgeData, "routed">;

const RADIUS = 8;

/** SVG path through orthogonal points, with rounded corners. */
function roundedPath(points: Point[]): string {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    const r = Math.min(
      RADIUS,
      Math.hypot(b.x - a.x, b.y - a.y) / 2,
      Math.hypot(c.x - b.x, c.y - b.y) / 2,
    );
    const toward = (from: Point, to: Point) => {
      const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      return {
        x: from.x + ((to.x - from.x) / len) * r,
        y: from.y + ((to.y - from.y) / len) * r,
      };
    };
    const before = toward(b, a);
    const after = toward(b, c);
    d += ` L ${before.x} ${before.y} Q ${b.x} ${b.y} ${after.x} ${after.y}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}

/** Middle of the longest segment, where a label has the most room. */
function labelPoint(points: Point[]): Point {
  let best = { x: points[0].x, y: points[0].y, len: -1 };
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len > best.len) best = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, len };
  }
  return best;
}

/** Draws the edge along the route ELK computed around the boxes. */
export function RoutedEdge(props: EdgeProps<RoutedFlowEdge>) {
  const points = props.data?.points;
  let path: string;
  let label: Point;
  if (points && points.length >= 2) {
    path = roundedPath(points);
    label = labelPoint(points);
  } else {
    const [bezier, x, y] = getBezierPath(props);
    path = bezier;
    label = { x, y };
  }
  return (
    <BaseEdge
      id={props.id}
      path={path}
      labelX={label.x}
      labelY={label.y}
      label={props.label}
      labelStyle={props.labelStyle}
      labelShowBg={props.labelShowBg}
      labelBgStyle={props.labelBgStyle}
      labelBgPadding={props.labelBgPadding}
      labelBgBorderRadius={props.labelBgBorderRadius}
      markerEnd={props.markerEnd}
      style={props.style}
      interactionWidth={0}
    />
  );
}

export const edgeTypes = { routed: RoutedEdge };
