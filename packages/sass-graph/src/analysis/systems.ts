import type { GraphNode } from "../parser/types.js";

/** Systems that are consumers or data rather than engine code. */
export const NON_ENGINE_SYSTEMS: ReadonlySet<string> = new Set([
  "components",
  "animations",
  "schemas",
]);

/** One line per system for the map and the CLI; a system missing here shows no description. */
export const SYSTEM_INFO: Record<string, string> = {
  animations: "Keyframe mixins for entrance, exit and generic animations.",
  bem: "BEM selector helpers: block, elem and mod.",
  color: "Palettes, shade generation, contrast and color access.",
  components: "One theme function per component, built from its schema.",
  config: "Library-wide settings such as the base font size.",
  elevations: "Shadow levels and the elevation() function.",
  json: "JSON exports of components and generators.",
  schemas: "Design tokens per component and theme (data only).",
  tailwind: "Tailwind CSS theme and utility generation.",
  themes: "Schema digestion, CSS variable output and chart themes.",
  typography: "Type scales, type styles and rem/em helpers.",
  utils: "Map, math, string and meta helpers used everywhere.",
};

/**
 * Names the area a folder belongs to: its top-level folder, except that
 * `themes/components/**` is `components` and `themes/schemas/**` is `schemas`.
 */
export function systemOf(folder: string): string {
  if (folder.startsWith("themes/components")) return "components";
  if (folder.startsWith("themes/schemas")) return "schemas";
  return folder.split("/")[0] || "root";
}

/** Mixins and functions outside component themes, animations and schemas. */
export const isEngineCode = (n: GraphNode) =>
  (n.kind === "mixin" || n.kind === "function") &&
  !NON_ENGINE_SYSTEMS.has(systemOf(n.folder));

/** Component theme functions such as `button-theme()`. */
export const isComponentTheme = (n: GraphNode) =>
  n.kind === "function" &&
  systemOf(n.folder) === "components" &&
  n.name.endsWith("-theme");

/** The `<name>` of `themes/components/<name>/…`, or null. */
export function componentOf(folder: string): string | null {
  return folder.match(/^themes\/components\/([^/]+)/)?.[1] ?? null;
}

/** `$name`, `name()`, `@mixin name()` or the file path; mixins are marked because a function can share their name. */
export const label = (n: GraphNode) =>
  n.kind === "variable"
    ? `$${n.name}`
    : n.kind === "module"
      ? n.file
      : n.kind === "mixin"
        ? `@mixin ${n.name}()`
        : `${n.name}()`;
