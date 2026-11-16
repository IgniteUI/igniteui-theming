import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { SYSTEM_INFO } from "../analysis/systems.js";
import type { Role, SystemSummary } from "../graph/model.js";
import type { GraphNode } from "../parser/types.js";
import { KindBadge } from "./KindBadge.js";
import { displayName } from "./theme.js";

export const SYMBOL_SIZE = { width: 230, height: 50 };
export const SYSTEM_SIZE = { width: 240, height: 84 };

export type SymbolNodeData = {
  node: GraphNode;
  role: Role;
  distance: number;
  dimmed: boolean;
  edited: boolean;
  /** Hides the file line when the node sits inside its file's box. */
  inFile: boolean;
};

export type SystemNodeData = {
  summary: SystemSummary;
  dimmed: boolean;
};

export type FileNodeData = {
  file: string;
  /** True for files outside the system being shown. */
  outside: boolean;
};

export type SymbolFlowNode = Node<SymbolNodeData, "symbol">;
export type SystemFlowNode = Node<SystemNodeData, "system">;
export type FileFlowNode = Node<FileNodeData, "file">;

const handle = "card-handle";

export function SymbolNode({ data }: NodeProps<SymbolFlowNode>) {
  const { node, role, distance, dimmed, edited, inFile } = data;
  return (
    <div
      className="symbol-card"
      data-role={edited ? "changed" : role}
      data-dimmed={dimmed || undefined}
      title={`${node.file}:${node.line}${node.description ? `\n${node.description}` : ""}`}
    >
      <Handle type="target" position={Position.Left} className={handle} />
      <KindBadge kind={node.kind} />
      <div className="symbol-card__text">
        <div className="symbol-card__name">
          {displayName(node.kind, node.name)}
        </div>
        <div className="symbol-card__meta">
          {inFile ? node.access : node.file}
        </div>
      </div>
      {distance > 0 && !inFile && (
        <span
          className="symbol-card__distance"
          title="Hops from the selected symbol"
        >
          {distance}
        </span>
      )}
      <Handle type="source" position={Position.Right} className={handle} />
    </div>
  );
}

export function SystemNode({ data }: NodeProps<SystemFlowNode>) {
  const { summary, dimmed } = data;
  return (
    <div className="system-card" data-dimmed={dimmed || undefined}>
      <Handle type="target" position={Position.Left} className={handle} />
      <div className="system-card__name">{summary.system}</div>
      {SYSTEM_INFO[summary.system] && (
        <div className="system-card__info">{SYSTEM_INFO[summary.system]}</div>
      )}
      <div className="system-card__counts">
        {summary.mixins > 0 && <span>{summary.mixins} mixins</span>}
        {summary.functions > 0 && <span>{summary.functions} fns</span>}
        {summary.variables > 0 && <span>{summary.variables} vars</span>}
        {summary.affected > 0 && (
          <span className="danger-text strong">
            {summary.affected} affected
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className={handle} />
    </div>
  );
}

export function FileNode({ data }: NodeProps<FileFlowNode>) {
  return (
    <div className="file-box" data-outside={data.outside || undefined}>
      <div className="file-box__name">{data.file}</div>
    </div>
  );
}

export const nodeTypes = {
  symbol: SymbolNode,
  system: SystemNode,
  file: FileNode,
};
