import { createModel } from "../graph/model.js";
import { buildGraph } from "../parser/build.js";

const theme = (name: string, body: string): [string, string] => [
  `themes/components/${name}/_${name}-theme.scss`,
  [
    "@use '../../functions' as *;",
    "@use '../../../utils/map' as *;",
    `/// Builds the ${name} theme.`,
    `@function ${name}-theme($schema) { @return ${body}; }`,
  ].join("\n"),
];

/** A small library: one helper every theme calls, one theme that skips it. */
export const LIBRARY = new Map<string, string>([
  [
    "utils/_map.scss",
    [
      "@use 'sass:map';",
      "/// Merges two maps.",
      "@function extend($a, $b) { @return map.merge($a, $b); }",
      "@function -unused() { @return 1; }",
    ].join("\n"),
  ],
  [
    "themes/_functions.scss",
    [
      "@use '../utils/map' as *;",
      "$fallback: ();",
      "/// Turns a schema into a theme map.",
      "@function digest-schema($s) { @return extend($s, $fallback); }",
      "@function var-get() { @return 1; }",
    ].join("\n"),
  ],
  theme("avatar", "extend(digest-schema($schema), ())"),
  theme("badge", "extend(digest-schema($schema), ())"),
  theme("button", "extend(digest-schema($schema), ())"),
  theme("chip", "extend(digest-schema($schema), ())"),
  theme("icon", "extend($schema, ())"),
]);

export const libraryModel = () => createModel(buildGraph(LIBRARY));

export const ids = {
  extend: "utils/_map.scss#function:extend",
  unused: "utils/_map.scss#function:-unused",
  digest: "themes/_functions.scss#function:digest-schema",
  fallback: "themes/_functions.scss#variable:fallback",
  varGet: "themes/_functions.scss#function:var-get",
  button: "themes/components/button/_button-theme.scss#function:button-theme",
  icon: "themes/components/icon/_icon-theme.scss#function:icon-theme",
};
