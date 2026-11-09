import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { SYSTEM_INFO } from "../analysis/systems.js";
import type { Role, SystemSummary } from "../graph/model.js";
import type { GraphNode } from "../parser/types.js";
import { displayName, KIND_BG, KIND_LABEL, ROLE_CLASS } from "./theme.js";

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

const handle = "!h-1.5 !w-1.5 !min-w-0 !border-0 !bg-slate-400";

export function SymbolNode({ data }: NodeProps<SymbolFlowNode>) {
  const { node, role, distance, dimmed, edited, inFile } = data;
  return (
    <div
      className={`flex h-[50px] w-[230px] cursor-pointer items-center gap-2 rounded-md border px-2 shadow-sm transition-opacity ${
        ROLE_CLASS[edited ? "changed" : role]
      } ${dimmed ? "opacity-25" : ""}`}
      title={`${node.file}:${node.line}${node.description ? `\n${node.description}` : ""}`}
    >
      <Handle type="target" position={Position.Left} className={handle} />
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white ${KIND_BG[node.kind]}`}
      >
        {KIND_LABEL[node.kind]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-xs font-semibold text-slate-100">
          {displayName(node.kind, node.name)}
        </div>
        <div className="truncate text-[10px] text-slate-400">
          {inFile
            ? node.access === "private"
              ? "private"
              : "public"
            : node.file}
        </div>
      </div>
      {distance > 0 && !inFile && (
        <span
          className="shrink-0 text-[10px] text-slate-500"
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
    <div
      className={`flex h-[84px] w-[240px] cursor-pointer flex-col justify-center gap-0.5 rounded-lg border border-slate-600 bg-slate-900 px-3 shadow-sm transition-opacity hover:border-sky-500 ${
        dimmed ? "opacity-25" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className={handle} />
      <div className="truncate font-mono text-sm font-semibold text-slate-100">
        {summary.system}
      </div>
      {SYSTEM_INFO[summary.system] && (
        <div className="line-clamp-2 text-[10px] leading-snug text-slate-300">
          {SYSTEM_INFO[summary.system]}
        </div>
      )}
      <div className="flex gap-2 text-[10px] text-slate-400">
        {summary.mixins > 0 && <span>{summary.mixins} mixins</span>}
        {summary.functions > 0 && <span>{summary.functions} fns</span>}
        {summary.variables > 0 && <span>{summary.variables} vars</span>}
        {summary.affected > 0 && (
          <span className="font-semibold text-rose-400">
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
    <div
      className={`h-full w-full rounded-lg border ${
        data.outside
          ? "border-dashed border-amber-700 bg-amber-950/30"
          : "border-slate-600 bg-slate-800/60"
      }`}
    >
      <div className="truncate px-3 pt-1.5 font-mono text-[11px] font-semibold text-slate-300">
        {data.file}
      </div>
    </div>
  );
}

export const nodeTypes = {
  symbol: SymbolNode,
  system: SystemNode,
  file: FileNode,
};
