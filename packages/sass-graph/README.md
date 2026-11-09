# @igniteui-theming/sass-graph

Developer tools for the `igniteui-theming` Sass engine (`packages/theming/sass`). They answer three questions:

| Question | Command line | In the explorer |
| --- | --- | --- |
| How does this part of the engine work? | `npm run graph:flow -- function:palette` | **Map** → a system → a symbol's **Outline** |
| What does my change affect? | `npm run graph:impact` | **Impact** (marked changes) |
| What in the engine needs attention? | `npm run graph:report` | **Report** |

The same answers are available to AI agents through an MCP server, and to PR reviewers through a CI comment.

> Private package, not published. Nothing here changes the library.

## How to use

Start from the question you have. Each recipe takes a minute or two.

**"How does palette generation work?"**
1. `npm run graph`, then click **color** on the map. The boxes are files; the dashed boxes are helpers color borrows from `utils` and others.
2. Click `palette()`. The **Outline** reads top to bottom: `palette()` → `shades()` → `family()` → the generator steps, each with its file, line and first doc sentence.
3. Switch the outline to **Used by** to see who calls it. In the terminal: `npm run graph:flow -- function:palette`.

**"I am about to change `digest-schema()`. What breaks?"**
1. Press `/`, type `digest`, Enter. "What breaks if I change this?" on the right says how many symbols and component themes it reaches.
2. Click **Mark as changed**. Mark other symbols you plan to touch; the panel adds them up, and **Impact** draws the combined graph.
3. After editing, run `npm run graph:impact` to see what actually changed against `origin/master`. Comment-only edits do not count.

**"I am reviewing a PR that touches `sass/`."**
Read the **Sass impact** comment the CI posts on the PR: the changed declarations with links, and the component themes they reach. Check that each listed theme is meant to change.

**"Where should we clean up?"**
Open **Report** (or `npm run graph:report`) with the library repos checked out next to this one. Start with *Private symbols the libraries call* (docs to fix), *Component themes that skip a shared helper* and *Unused private symbols*; each row links to the symbol and its source. Nothing is called unused while a library calls or re-exports it. The checks do not see `meta.get-function()` calls, so grep before deleting.

**"I want an agent to help."**
Start Claude Code in the repo and approve the `igniteui-theming-engine` MCP server. Then ask, for example, "use sass_flow to explain how type-style works" or "run sass_impact and summarize what my change affects".

## Command line

Run from the repo root. Every command reads the Sass sources directly, so it is always current; no build step is needed.

### `graph:flow`: how a symbol works

```sh
npm run graph:flow -- function:palette             # what palette() is built from, 4 levels deep
npm run graph:flow -- digest-schema --users        # what uses digest-schema()
npm run graph:flow -- '$base-font-size' --users --vars --depth 2
```

```
palette() is built from:  packages/theming/sass/color/_functions.scss:74
  Generates a color palette.

├─ -scale-for()  packages/theming/sass/color/_functions.scss:160  Picks one family's scale out of the `$scales` argument, …
│  └─ -is-scale-spec()  packages/theming/sass/color/_functions.scss:200  Whether a `$scales` map is a single spec …
└─ shades()  packages/theming/sass/color/_functions.scss:229  Generates color shades for a given color.
   ├─ -contrast-source()  …
```

- A symbol is a name (`palette`), `name()`, `$name` for a variable, `kind:name` (`mixin:type-style`) or a full node id. A bare name means a mixin or function; variables need the `$`.
- A name that matches several symbols, or none, is rejected with the list of candidates or the closest matches.
- Variables and files are hidden unless `--vars` or `--files` is passed. A link that passes through a hidden variable is marked `via hidden variable`.
- Each symbol is expanded once. Later occurrences say `expanded elsewhere`, and a symbol at the depth limit says `+N more, raise --depth`.

### `graph:impact`: what a change affects

```sh
npm run graph:impact                          # working tree against origin/master
npm run graph:impact -- --base HEAD~1
npm run graph:impact -- --format markdown --out impact.md
```

- It compares every declaration in the working tree with `--base`, without comments, so a docs-only edit is reported as comment-only and has no impact.
- It lists added, changed and removed declarations, then every symbol and component theme they reach. A removed symbol is traced in the base version, where its dependents still point at it.
- `--link-base <url>` turns locations into links in Markdown output.
- An unknown `--base` is rejected with a hint to fetch it.

### Library use

`graph:impact`, `graph:report`, the MCP server and `graph:build` also read the Sass of the libraries that use the engine, when their repos sit next to `igniteui-theming` (as in the IgniteUI workspace):

| Library | Folder | Scanned |
| --- | --- | --- |
| igniteui-angular | `../angular` | `projects/igniteui-angular`, `projects/igniteui-angular-elements` |
| igniteui-webcomponents | `../web-components` | `src` |
| igniteui-grid-lite | `../grid-lite` | `src` |
| igniteui-dockmanager | `../dock-manager` | `src` |

- Their files are parsed with the engine, and `igniteui-theming`, `igniteui-theming/sass` and `igniteui-theming/sass/<path>` resolve to engine files the way Sass resolves them. So a library call is a real edge, not a name match.
- Each engine symbol gets: the library files that call it, the libraries that re-export it with `@forward` (after `show`/`hide`), and whether library code reaches it through other engine code.
- Demos and tests are not scanned; they do not ship. A missing repo is reported on stderr and skipped. `--no-consumers` skips all of them.
- `graph:impact` adds "Libraries that call the changed or affected code" with file counts.

### `graph:report`: engine health

```sh
npm run graph:report
npm run graph:report -- --format markdown --out report.md
npm run graph:report -- --format json
```

| Check | Finds |
| --- | --- |
| Hotspots | The 10 engine mixins and functions with the most direct users, the component themes each reaches, and the library files that call it. These need the best tests. |
| Most used by the libraries | The 10 engine symbols the libraries call in the most files. Their signatures are contracts. |
| Component themes that skip a shared helper | Themes that never reach (directly or through another theme) a helper that at least 80% of themes call. |
| Private symbols the libraries call | `@access private` symbols a library calls directly: the docs are wrong, or a library leans on an internal. |
| Unused private symbols | Private symbols that neither the engine nor any library calls. |
| Public engine code nothing uses | Public engine code that nothing calls and no library re-exports: likely dead. |
| API only apps can reach | Public engine code no library calls but a library re-exports, so apps can. Not dead: it needs docs and tests. |
| Public engine code without a description | No sassdoc description; notes which libraries call it. |
| Dependency cycles | Symbols that depend on each other in a loop. |
| Unresolved references | References the parser could not resolve; usually a parser gap. |

"Engine" means mixins and functions outside `themes/components`, `animations` and `themes/schemas`. Without the library repos, the report says so at the top and the "unused" checks only see the engine.

## Explorer

```sh
npm run graph          # parse the library and start the explorer
npm run graph:build    # static build into packages/sass-graph/dist
```

The explorer is dark. Every view has its own URL (`#/system/typography`, `#/symbol/<id>`, `#/report`), so a link shows the same view to someone else.

| View | Behavior |
| --- | --- |
| **Map** | Shown on load, with a "Start here" card on the first visit. One card per system (`color`, `typography`, `elevations`, `utils`, `themes`, `components`, …) with a one-line description and its counts, and one arrow per pair of systems linked by `@include`, function calls or variable use. The number on an arrow counts the links. Click a system to open it. |
| **System** | Every mixin and function of the system in one box per file, plus the outside symbols they use in dashed amber boxes. The sidebar lists the same symbols. |
| **Symbol: Outline** | The default for a symbol. The `graph:flow` tree, either "Built from" or "Used by", with links to each symbol and its source line. It opens collapsed to the first level; chevrons, "Expand all" and "Collapse all" open it further. |
| **Symbol: Graph** | The symbol with what it relies on (amber) and what it affects (red). **Steps away** (1–6, on the canvas) sets how many links out to draw; 1 shows only direct links. |
| **Report** | The `graph:report` checks. Every finding links to its symbol and source. |
| **Impact** | "What breaks if I change this?" on the right of a symbol says how many symbols and component themes it reaches. **Mark as changed** adds it to a list (optionally only some parameters); the Impact view draws everything downstream of the list, and the panel lists the component themes reached. Nothing is evaluated. |

- **Show:** Mixins, Functions, Variables, Entry files and "Public API only", each with a one-line hint. Variables and entry files are off by default. *Entry files* are stylesheets whose own code (outside any mixin or function) uses a symbol, such as the Tailwind theme files. "Reset filters" appears when the filters differ from the defaults.
- **Arrows** take the color of what they carry: green includes a mixin, violet calls a function, blue reads a variable. An arrow through a hidden node is dashed, so chains stay connected.
- **Steady layout:** toggling a filter keeps the controls in place and the old graph on screen until the new layout is ready; cards then glide to their new places.
- **Breadcrumb and history:** `Map › color › palette()` leads back up. ← and → next to it step back and forward through the views you opened, like the browser's buttons, and are disabled at either end.
- **Library use:** a symbol's details list the library files that call it and the libraries that re-export it.
- **Keyboard:** `/` focuses the search, ↑/↓ and Enter open a result, Esc clears it or closes the guide.
- **Help:** "How to use" in the header opens the same recipes as the README.
- **Home:** the logo reloads the app on the map. **Start over** returns to the map with default filters without a reload and keeps marked changes.
- **Panels:** the right panel appears only for a symbol or the Impact view. Arrows and file boxes are drawings, not controls: click a card to open it, and drag anywhere to pan.
- **Graph views:** changing a filter keeps the zoom and position, and opening another view refits it. Hovering a node highlights its neighbors.

## MCP server for agents

`.mcp.json` at the repo root registers `igniteui-theming-engine`, so Claude Code and other MCP clients started in this repo can use it after approval. It is separate from the published `igniteui-theming` MCP server, which serves theme consumers.

| Tool | Does |
| --- | --- |
| `sass_search` | Finds symbols by part of a name. |
| `sass_flow` | The `graph:flow` tree for a symbol (`direction`, `depth`, `variables`, `files`). |
| `sass_impact` | The `graph:impact` summary against `base` (default `origin/master`). |
| `sass_report` | The `graph:report` checks, or one of them with `check`. |

Lookup failures and unknown refs come back as tool errors that carry the same messages as the CLI. Start it by hand with `npm run graph:mcp`.

## CI

`.github/workflows/sass-impact.yml` runs `graph:impact` on every PR that touches `packages/theming/sass`. It compares the PR merged into its base with the base tip, so only the PR's own changes count. The result goes to the job summary and to a single PR comment that is updated on each push. Fork PRs get a read-only token, so they get only the job summary. The CI checkout has no library repos, so the comment counts engine reach only.

## Architecture

```
scripts/
  build-graph.ts         sources → graph.json for the explorer
  cli.ts                 flow | impact | report
  mcp.ts                 STDIO entry of the MCP server
src/parser/              scanner, file parser, module resolution, graph builder
src/graph/
  traverse.ts            adjacency + BFS upstream/downstream with distances
  model.ts               view-models: systemMap, systemView, focusView, impactView, search
  layout.ts              elkjs layered layout, with file boxes
src/analysis/            shared by CLI, MCP and explorer
  systems.ts             systemOf, engine/component predicates, labels
  flow.ts                resolveSymbol, flow tree
  impact.ts              declaration-level diff of two versions + downstream reach
  report.ts              health checks
  consumers.ts           engine + library parse with package aliases → usage per engine symbol
  format.ts              text and Markdown output
src/node/sources.ts      working tree and git-ref readers (Node only)
src/node/consumers.ts    finds and reads the library repos; engineGraph() attaches their usage
src/mcp/server.ts        MCP tools
src/app/                 React + React Flow + Tailwind explorer, zustand store, hash routes
```

### Graph model

- **Nodes:** `variable`, `mixin`, `function` (one per top-level declaration) and `module` (one per file). The id is `<file>#<kind>:<name>`, or `<file>#module` for a file.
- **Edges** (`from` depends on `to`):
  - `uses-var`, `includes` and `calls` are symbol-level. They drive flow, impact and the report.
  - `imports` (`@use`) and `forwards` (`@forward`) are module-level. They are kept in `graph.json` but not drawn.
- Top-level code that is not a declaration (e.g. `@include` inside a rule, or the values in a `@forward … with(…)`) is attributed to the file's `module` node.
- **Systems:** a system is the top-level folder of a file under `sass/`, except that `themes/components/**` is `components` and `themes/schemas/**` is `schemas`.

### Resolution rules

The resolver follows the Sass module system:

- `@use 'x'` creates the namespace `x`. `@use 'x' as y` creates `y`. `@use 'x' as *` merges members into the file's scope. `sass:*` modules are built-ins and ignored.
- URLs resolve the way Sass does: `x.scss`, `_x.scss`, `x/_index.scss`, `x/index.scss`.
- A module's exports are its own non-private members (names not starting with `-` or `_`) plus everything it `@forward`s, after the `as prefix-*` prefix and then `show`/`hide` are applied. As in Sass, `show`/`hide` name the prefixed members.
- Names are normalized so `-` and `_` match, as in Sass.
- Parameters, statement-level assignments and `@each`/`@for` variables shadow globals.
  - `$x: … !global` writes the module variable, so it does not shadow it.
  - `$x:` inside a call is a keyword argument: it neither references nor shadows `$x`.
- An unknown bare function such as `rgb()`, `var()` or `if()` is treated as CSS and ignored. Unresolvable variables, mixins and namespaced members are listed in `graph.json.unresolved`. That list is currently empty for the library.

The parser is a small purpose-built scanner, not a full Sass parser. That keeps it fast (about 250 ms for the whole library) and dependency-free.

## Known limitations

- **Schema map keys:** dependencies that go through map keys (`map.get($schema, 'background')`) are not modeled. Impact through a schema is tracked at the level of the whole schema variable.
- **Dynamic references:** `meta.get-function('name')`, `meta.call`, interpolated names and `@content` blocks are not resolved. The report's "unused" checks can list a symbol that is only called this way.
- **No evaluation:** "impact" means structural reachability. It does not check whether the compiled CSS actually changes. No Sass is compiled.
- **Nesting:** declarations nested inside a top-level `@if`/`@each` are not extracted as nodes. Their references are attributed to the module.
- **Large fan-out:** the symbol graph is capped at 250 nodes (the nearest are kept, and a notice shows how many were hidden). The Outline has no cap.

## Possible next steps

- Model schema-map keys as nodes, e.g. `$light-material-schema → button.background`.
- Real recompile in the sandbox (sass in the browser) with a CSS diff.
- CSS custom properties (`--ig-*`) and placeholder selectors as nodes.
