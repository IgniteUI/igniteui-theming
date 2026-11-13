import type { NodeKind } from "../parser/types.js";

export const KIND_LABEL: Record<NodeKind, string> = {
  variable: "var",
  mixin: "mixin",
  function: "fn",
  module: "file",
};

/** Edge strokes per kind of the symbol an arrow carries; mirrored by the --kind-* properties in index.css. */
export const EDGE_HEX: Record<NodeKind, string> = {
  variable: "#4cc2ff",
  mixin: "#6ccb5f",
  function: "#b4a0ff",
  module: "#a0a0a0",
};

/** Neutral and highlighted edge strokes; mirrored by --edge and --accent in index.css. */
export const EDGE_NEUTRAL = "#8a8a8a";
export const EDGE_LIT = "#ffb900";

export const displayName = (kind: NodeKind, name: string) =>
  kind === "variable" ? `$${name}` : kind === "module" ? name : `${name}()`;

export const sourceUrl = (file: string, line: number) =>
  `https://github.com/IgniteUI/igniteui-theming/blob/master/packages/theming/sass/${file}#L${line}`;
