# Embedding the color demos

The preview app is not shipped. The v30 article gets its demos from a separate build:
one script and five custom elements, plus a standalone page per demo for platforms that
only accept iframes.

## Build

```sh
npm run build:embed -w packages/preview
```

Output, all URLs relative, so the folder can be hosted under any path:

```
packages/preview/dist-embed/
  embed.js            load once per page (16 KB gzipped)
  chunks/             each demo's code and data, fetched when it nears the viewport
  frames/<demo>.html  one demo per page, for <iframe src>
  frames/resize.js    optional: sizes those iframes to their content
  pages/              the test pages (below); not needed on the blog
```

## Host

Put `dist-embed/` on any static host (GitHub Pages, the Infragistics CDN, an S3 bucket).
Two requirements:

- **CORS.** A module script loaded from another origin needs
  `Access-Control-Allow-Origin` on its responses. GitHub Pages and jsDelivr send `*`.
- **The blog's CSP**, if it has one, must allow scripts from that host.

## Embed with the script (preferred)

```html
<script type="module" src="https://HOST/dist-embed/embed.js"></script>

<ig-demo-seeds></ig-demo-seeds>
<ig-demo-shades></ig-demo-shades>
<ig-demo-sweep></ig-demo-sweep>
<ig-demo-scales></ig-demo-scales>
<ig-demo-neutrals></ig-demo-neutrals>
```

The script tag goes once, anywhere on the page. The tags go wherever the article needs
them, in any order, and each can appear more than once.

Each demo:

- draws inside its own shadow root, so the blog's CSS cannot reach in and ours cannot
  leak out;
- keeps its own selection. Changing the palette in one demo moves nothing else, and
  nothing is written to the page's URL;
- loads its code and data when it comes within a screen of the viewport, behind a
  placeholder sized close to the finished demo;
- sizes itself to the column it sits in, not the window (container queries), so it
  holds up in a 700px article column and on a phone.

Attribute: `scheme="light"` or `scheme="dark"` pins the demo's colors. Without it the
demo follows the reader's system setting.

The only thing that leaves the shadow root: the `@property` registrations the Ignite UI
components need (`--ig-spacing`, `--ig-size-*`) go into one `<style>` in the page head,
because a registration is only honoured from a document stylesheet. They are namespaced
`--ig-*`.

One caveat: `igniteui-webcomponents` themes itself with a single page-wide call
(`configureTheme("indigo", …)`). On a page that already uses Ignite UI Web Components with
a different theme, the two will conflict. Use the iframes there.

## Embed with iframes (fallback)

For dev.to, Medium, or any CMS that strips scripts:

```html
<iframe src="https://HOST/dist-embed/frames/seeds.html" title="Seed comparison"
        style="width:100%;border:0;height:480px" loading="lazy"></iframe>
```

`?scheme=light` or `?scheme=dark` on the URL pins the colors. The frame posts its height
to the parent; if the page can run one script, add
`<script src="https://HOST/dist-embed/frames/resize.js"></script>` and every demo iframe
sizes itself. Where no script is allowed, the `height` above is what you get, so use
roughly:

| Demo | Height at a 760px column |
| --- | --- |
| seeds | 480px |
| shades | 400px |
| sweep | 990px |
| scales | 1220px |
| neutrals | 990px |

## What each demo contains

The embedded views drop the preview app's explanatory paragraphs. The article carries
the explanation; each demo keeps its controls and short legends only.

| Tag | Shows | Controls |
| --- | --- | --- |
| `ig-demo-seeds` | `hsl(210 80% 10%)` and `hsl(210 80% 90%)`, all ten shades, legacy and fitted, `=` on repeats | click a shade to measure the rest against it |
| `ig-demo-shades` | one family of a shipped palette, legacy and fitted (accents hidden) | palette, family, probe (no light/dark: a chromatic family is the same in both) |
| `ig-demo-sweep` | 1,080 seeds, both generators, and the gamut slice | hue, saturation, sweep |
| `ig-demo-scales` | the four presets, range sliders, curve editor, pair ladder, Sass output; step table behind a disclosure | subject: primary, gray on light, gray on dark |
| `ig-demo-neutrals` | grayscale first, then the surface roles and the mock page | palette, theme, probe |

The seeds live in `src/data/color/seeds.ts` (`SEEDS`). The article quotes them, and
`seeds.spec.ts` pins every hex the article's table uses, so a generator change that
invalidates the table fails a test.

## Adding a demo

1. A view in `src/sections/color/` that accepts `embedded` and `.store`.
2. An entry in `CATALOG` in `src/embed/catalog.ts`: its title, which pickers the frame
   shows, and the placeholder height.
3. Its loader in `VIEWS` in `src/embed/index.ts`. TypeScript fails until 2 and 3 agree.

The tag (`ig-demo-<key>`), its iframe page and its place on the demos test page all come
from the catalog.

## Test pages

```
packages/preview/pages/
  articles/<slug>.md   one article per file
  _article.html        the article page: typography, code blocks, where demos sit
  _demos.html          every demo in the catalog, under a hostile stylesheet
  _index.html          the list of both
```

A Vite plugin (`src/pages/`) renders these; nothing is generated into the source tree.

- **An article** is Markdown. The first `# heading` is its title. A demo is its tag on a
  line of its own, `<ig-demo-seeds></ig-demo-seeds>` (`<ig-view-*>` works too); an
  italic paragraph straight after it is its caption. `css` and `scss` code blocks are
  highlighted the way the demos' Sass output is. Add a file and it is on the index.
- **The demos page** puts every catalog entry under CSS written to break it. Nothing from
  that stylesheet should show inside a demo.

Commands:

- `npm run dev:embed -w packages/preview` opens `/pages/` on the Vite dev server. Pages
  are rendered on request and load `src/embed/index.ts`, which Vite compiles; editing a
  page or an article reloads the browser.
- `npm run preview:embed -w packages/preview` builds `dist-embed/`, serves it and opens
  `/pages/`. Those pages load the bundled `embed.js`: this is what a blog gets.

Do not use `npx http-server ./` inside `dist-embed/`: in an npm workspace, `npx` runs from
the nearest `package.json`, so it serves `packages/preview/` instead. If you want
http-server, give it the path from the repo root: `npx http-server packages/preview/dist-embed`
and open `/pages/`.
