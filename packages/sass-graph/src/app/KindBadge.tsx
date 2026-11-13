import type { GraphNode, NodeKind } from "../parser/types.js";
import { displayName, KIND_LABEL } from "./theme.js";

export function KindBadge({ kind }: { kind: NodeKind }) {
  return (
    <span className="kind" data-kind={kind}>
      {KIND_LABEL[kind]}
    </span>
  );
}

/** List-item content: kind badge at the start, monospace name as title, file as subtitle. */
export function SymbolLabel({ node }: { node: GraphNode }) {
  return (
    <>
      <span slot="start">
        <KindBadge kind={node.kind} />
      </span>
      <span slot="title" className="symbol-label__name">
        {displayName(node.kind, node.name)}
      </span>
      <span slot="subtitle" className="symbol-label__file">
        {node.file}
      </span>
    </>
  );
}
