import type { Role } from "../graph/model.js";
import type { NodeKind } from "../parser/types.js";

export const KIND_LABEL: Record<NodeKind, string> = {
  variable: "var",
  mixin: "mixin",
  function: "fn",
  module: "file",
};

/** Kind colors (badge background). */
export const KIND_BG: Record<NodeKind, string> = {
  variable: "bg-blue-500",
  mixin: "bg-emerald-500",
  function: "bg-violet-500",
  module: "bg-slate-400",
};

/** Edge strokes per kind of the symbol an arrow carries; the same hues as `KIND_BG`, lighter for a dark canvas. */
export const EDGE_HEX: Record<NodeKind, string> = {
  variable: "#60a5fa",
  mixin: "#34d399",
  function: "#a78bfa",
  module: "#94a3b8",
};

export const ROLE_CLASS: Record<Role, string> = {
  selected: "ring-2 ring-sky-500 border-sky-500 bg-slate-900",
  changed: "ring-2 ring-rose-600 border-rose-500 bg-rose-950",
  upstream: "border-amber-500 bg-amber-950/50",
  downstream: "border-rose-700 bg-rose-950/50",
  neutral: "border-slate-600 bg-slate-900",
};

export const displayName = (kind: NodeKind, name: string) =>
  kind === "variable" ? `$${name}` : kind === "module" ? name : `${name}()`;

export const sourceUrl = (file: string, line: number) =>
  `https://github.com/IgniteUI/igniteui-theming/blob/master/packages/theming/sass/${file}#L${line}`;
