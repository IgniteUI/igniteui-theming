import {
  IgrButton,
  IgrButtonGroup,
  IgrIcon,
  IgrToggleButton,
  IgrTree,
  IgrTreeItem,
} from "igniteui-react";
import { useMemo, useRef } from "react";
import {
  DEFAULT_FLOW,
  type FlowNode,
  flow,
  flowSize,
} from "../analysis/flow.js";
import { KindBadge } from "./KindBadge.js";
import { type Direction, navigate, useFilters, useStore } from "./store.js";
import { displayName, sourceUrl } from "./theme.js";

const firstSentence = (text?: string) =>
  text ? (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim() : "";

function Row({ item }: { item: FlowNode }) {
  const { node, repeated, cut, indirect, children } = item;
  return (
    <span className="flow-row">
      <KindBadge kind={node.kind} />
      <button
        type="button"
        className="link link--strong mono"
        onClick={(e) => {
          e.stopPropagation();
          navigate({ view: "symbol", id: node.id });
        }}
      >
        {displayName(node.kind, node.name)}
      </button>
      <a
        className="link mono muted"
        href={sourceUrl(node.file, node.line)}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {node.file}:{node.line}
      </a>
      {indirect && <span className="tag tag--dashed">via variable</span>}
      {repeated && <span className="tag">expanded elsewhere</span>}
      {cut > 0 && <span className="tag tag--warn">+{cut} deeper</span>}
      {children.length > 0 && (
        <span className="tag" title="Direct children">
          {children.length}
        </span>
      )}
      <span className="flow-row__note">{firstSentence(node.description)}</span>
    </span>
  );
}

function Branch({ item }: { item: FlowNode }) {
  return (
    <IgrTreeItem>
      <span slot="label">
        <Row item={item} />
      </span>
      {item.children.map((child) => (
        <Branch key={child.node.id} item={child} />
      ))}
    </IgrTreeItem>
  );
}

const DIRECTIONS: [Direction, string][] = [
  ["dependencies", "Built from"],
  ["dependents", "Used by"],
];

/** The selected symbol as a tree of what it is built from, or what uses it. */
export function FlowView({ id }: { id: string }) {
  const { model, direction, setDirection } = useStore();
  const { kinds } = useFilters();
  const treeRef = useRef<IgrTree>(null);

  const tree = useMemo(
    () =>
      model?.byId.has(id)
        ? flow(model, id, {
            direction,
            depth: DEFAULT_FLOW.depth,
            mixins: kinds.has("mixin"),
            functions: kinds.has("function"),
            variables: kinds.has("variable"),
            files: kinds.has("module"),
          })
        : null,
    [model, id, direction, kinds],
  );
  if (!tree) return null;

  return (
    <div className="flow ig-scrollbar">
      <div className="toolbar">
        <IgrButtonGroup
          selection="single-required"
          aria-label="Direction"
          onSelect={(e) => e.detail && setDirection(e.detail as Direction)}
        >
          {DIRECTIONS.map(([value, text]) => (
            <IgrToggleButton
              key={value}
              value={value}
              selected={direction === value}
            >
              {text}
            </IgrToggleButton>
          ))}
        </IgrButtonGroup>
        <IgrButton variant="flat" onClick={() => treeRef.current?.expand()}>
          <IgrIcon slot="prefix" name="expand_all" />
          Expand all
        </IgrButton>
        <IgrButton
          variant="flat"
          onClick={() => {
            const tree = treeRef.current;
            // Every branch below the root; the root stays open.
            tree?.collapse([
              ...tree.querySelectorAll<IgrTreeItem>(
                "igc-tree-item igc-tree-item",
              ),
            ]);
          }}
        >
          <IgrIcon slot="prefix" name="collapse_all" />
          Collapse all
        </IgrButton>
        <span className="muted">
          {flowSize(tree)} symbols · read top to bottom · click a name to open
          it
        </span>
      </div>
      <IgrTree
        ref={treeRef}
        key={`${id}-${direction}`}
        className="flow__tree"
        aria-label={`${direction === "dependencies" ? "Built from" : "Used by"} tree`}
      >
        <IgrTreeItem expanded>
          <span slot="label">
            <Row item={tree} />
          </span>
          {tree.children.map((child) => (
            <Branch key={child.node.id} item={child} />
          ))}
        </IgrTreeItem>
      </IgrTree>
      {tree.children.length === 0 && (
        <p className="muted">
          {direction === "dependencies"
            ? "Built only from Sass built-ins and CSS."
            : "Nothing in the library uses it; it is consumer API or dead code."}
        </p>
      )}
    </div>
  );
}
