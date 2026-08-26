/**
 * Renders a side-by-side comparison of the two shade generators as a standalone HTML
 * page. Every value in it comes from compiling the library, not from a fixture.
 *
 *   node .scripts/previewShades.mjs [--out=dist/shades.html] [--seeds=#09f,#f0f]
 */
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import getArgs from "./getArgs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_SEEDS = [
  ["Framework primary", "#0099ff"],
  ["Framework secondary", "#df1b74"],
  ["Warn", "#faa419"],
  ["Success", "#4eb862"],
  ["Near-white seed", "#ffe9b0"],
  ["Near-black seed", "#141225"],
  ["Neon", "#00ff00"],
  ["Washed out", "#a99bb0"],
  ["Pure gray", "#8a8a8a"],
];

const SURFACES = [
  ["Pure white", "#ffffff"],
  ["Off-white", "#f8f8fa"],
  ["Dark", "#1a1a24"],
  ["Pure black", "#000000"],
];

const LADDERS = ["even", "material", "tailwind", "carbon"];

const SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];
const ACCENTS = ["A100", "A200", "A400", "A700"];
const ALL = [...SHADES, ...ACCENTS];

const { out = "dist/shades.html", seeds } = getArgs();
const list = seeds
  ? seeds.split(",").map((s) => [s.trim(), s.trim()])
  : DEFAULT_SEEDS;

const warnings = [];

function compile(body) {
  const css = sass.compileString(
    `@use 'sass:map';\n@use 'sass/color' as *;\n${body}`,
    {
      loadPaths: [ROOT],
      logger: { warn: (msg) => warnings.push(msg.split(" —")[0]) },
    },
  ).css;
  const data = {};
  for (const line of css.split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9-]+):\s*(.+);\s*$/);
    if (m) data[m[1]] = m[2].trim();
  }
  return data;
}

const family = (seed, name, generator, surface = "#fff", keys = ALL) => {
  const gen = generator ? `, $generator: '${generator}'` : "";
  return compile(`
    $p: palette($primary: ${seed}, $secondary: ${seed}, $surface: ${surface}, $gray: #333${gen});
    $s: map.get($p, '${name}');
    out {
      lands-on: ${generator ? "'n/a'" : `seed-lands-on($p, '${name}')`};
      ${keys.map((v) => `s-${v}: #{map.get($s, '${v}-raw')};`).join("\n")}
    }`);
};

const rows = list.map(([label, seed]) => ({
  label,
  seed,
  fitted: family(seed, "primary", null),
  legacy: family(seed, "primary", "legacy"),
}));

const flavors = LADDERS.map((name) => ({
  name,
  gray: compile(`
    $p: palette($primary: #09f, $secondary: #09f, $surface: #fff, $gray: #333, $ladders: ('gray': '${name}'));
    $s: map.get($p, 'gray');
    out { ${SHADES.map((v) => `s-${v}: #{map.get($s, '${v}-raw')};`).join("\n")} }`),
}));

const neutrals = SURFACES.map(([label, bg]) => ({
  label,
  bg,
  gray: family("#09f", "gray", null, bg, SHADES),
  grayLegacy: family("#09f", "gray", "legacy", bg, SHADES),
  surface: family("#09f", "surface", null, bg, SHADES),
  surfaceLegacy: family("#09f", "surface", "legacy", bg, SHADES),
}));

const sw = (hex, key) =>
  `<div class="sw" data-c="${hex}"><b>${key}</b><em class="cr"></em></div>`;
const ramp = (data, keys, id) =>
  `<div class="ramp"${id ? ` data-id="${id}"` : ""}>${keys.map((k) => sw(data[`s-${k}`], k)).join("")}</div>`;

const pair = (title, a, keys, id, note = "") => `
  <div class="col">
    <p class="lbl">${title} <span class="verdict" data-for="${id}"></span></p>
    ${ramp(a, keys, id)}
    ${note ? `<p class="note">${note}</p>` : ""}
  </div>`;

const seedSection = (r) => `
<section>
  <header><i style="background:${r.seed}"></i><h2>${r.label}</h2><code>${r.seed}</code>
    <span class="lands">lands on <b>${(r.fitted["lands-on"] || "").replace(/["']/g, "")}</b></span></header>
  <div class="two">
    ${pair("gamut-relative", r.fitted, SHADES, `f${r.seed}`)}
    ${pair("legacy", r.legacy, SHADES, `l${r.seed}`)}
  </div>
  <div class="two accents">
    <div class="col"><p class="lbl">accent track</p>${ramp(r.fitted, ACCENTS)}</div>
    <div class="col"><p class="lbl">legacy accents</p>${ramp(r.legacy, ACCENTS)}</div>
  </div>
</section>`;

const neutralSection = (n) => `
<section>
  <header><i style="background:${n.bg}"></i><h2>${n.label} surface</h2><code>${n.bg}</code></header>
  <div class="two">
    ${pair(
      "gray &middot; gamut-relative",
      n.gray,
      SHADES,
      `g${n.bg}`,
      "anchored to the surface, so 50 always sits nearest the background",
    )}
    ${pair("gray &middot; legacy", n.grayLegacy, SHADES, `gl${n.bg}`)}
  </div>
  <div class="two">
    ${pair(
      "surface &middot; gamut-relative",
      n.surface,
      SHADES,
      `s${n.bg}`,
      "500 is the background; every other shade is a layer on it, 50 the faintest through 900 the strongest",
    )}
    ${pair("surface &middot; legacy", n.surfaceLegacy, SHADES, `sl${n.bg}`)}
  </div>
</section>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shade generators</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#16141f;--mut:#6b6579;--line:#e4e1ea;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#121120;--fg:#eae7f2;--mut:#948da8;--line:#2c2940;--card:#1a1829}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 ui-sans-serif,system-ui,sans-serif;padding:0 24px 80px}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:1.9rem;letter-spacing:-.02em;margin:44px 0 6px}
.sub{color:var(--mut);max-width:72ch;margin:0 0 10px}
.warns{border:1px solid var(--line);background:var(--card);border-radius:10px;padding:14px 18px;margin:22px 0 34px;font:12px/1.6 ui-monospace,monospace;color:var(--mut)}
.warns b{color:var(--fg);font-family:ui-sans-serif,system-ui,sans-serif}
h3{font-size:1.05rem;margin:44px 0 0}
section{border-top:1px solid var(--line);padding-top:22px;margin-top:26px}
header{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
header i{width:22px;height:22px;border-radius:5px;border:1px solid var(--line)}
header h2{font-size:1rem;margin:0}
header code,.lands{color:var(--mut);font:12px ui-monospace,monospace}
.lands{margin-left:auto}
.two{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(360px,1fr))}
.two.accents{margin-top:10px}
.two.accents .ramp{width:60%}
.lbl{font:600 11px/1 ui-monospace,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--mut);margin:0 0 6px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.verdict{letter-spacing:0;text-transform:none;font-weight:500}
.ok{color:#2e7d3b}.bad{color:#c11a5e}
@media (prefers-color-scheme:dark){.ok{color:#69c97b}.bad{color:#ff8cb0}}
.ramp{display:flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.sw{flex:1;height:56px;background:var(--c);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:11px ui-monospace,monospace}
.sw b{font-weight:600;opacity:.85}.sw em{font-style:normal;opacity:.7;font-size:10px}
.note{color:var(--mut);font-size:12px;margin:6px 0 0}
footer{color:var(--mut);font-size:13px;border-top:1px solid var(--line);margin-top:40px;padding-top:18px}
</style></head><body><div class="wrap">
<h1>Shade generators, side by side</h1>
<p class="sub">Compiled from the library. Numbers are WCAG contrast against white for color ramps,
and against the surface for the neutral and surface families. Every value is a concrete color &mdash;
the generator resolves them at build time.</p>
${warnings.length ? `<div class="warns"><b>Build warnings</b><br>${[...new Set(warnings)].join("<br>")}</div>` : ""}

<h3>Color ramps</h3>
${rows.map(seedSection).join("")}

<h3>Ladder flavors</h3>
<p class="sub">The same generator, a different rhythm. Each curve was fitted to the scale it is named
after; <code>material</code> reproduces this library's original grayscale, which is why it is the default
for <code>gray</code>. Pass one with <code>$ladders: ('gray': 'carbon')</code>, or hand in your own
<code>cubic-bezier</code> control points.</p>
<section>
  ${flavors
    .map(
      (f) => `
    <div class="col" style="margin-bottom:14px">
      <p class="lbl">${f.name} <span class="verdict" data-for="ladder-${f.name}"></span></p>
      ${ramp(f.gray, SHADES, `ladder-${f.name}`)}
    </div>`,
    )
    .join("")}
</section>

<h3>Neutral and surface families</h3>
${neutrals.map(neutralSection).join("")}

<footer>Generated by <code>.scripts/previewShades.mjs</code>. The palettes bundled with the library
stay on the legacy generator, so shipped themes are unchanged.</footer>
</div>
<script>
const probe = document.createElement('span');
probe.style.display = 'none';
document.body.appendChild(probe);

const lin = v => (v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const resolve = value => {
  probe.style.color = '';
  probe.style.color = value;
  return (getComputedStyle(probe).color.match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
};

document.querySelectorAll('.sw').forEach(el => {
  const rgb = resolve(el.dataset.c);
  el.dataset.rgb = rgb.join(',');
  el.style.setProperty('--c', 'rgb(' + rgb.join(',') + ')');
  el.querySelector('.cr').textContent = (1.05 / (lum(rgb) + 0.05)).toFixed(1);
  el.style.color = lum(rgb) > 0.32 ? 'rgba(0,0,0,.72)' : 'rgba(255,255,255,.85)';
});

document.querySelectorAll('.ramp[data-id]').forEach(ramp => {
  const s = [...ramp.querySelectorAll('.sw')].map(el => el.dataset.rgb.split(',').map(Number));
  let fails = 0;

  for (let i = 0; i < 5; i++) {
    const a = 1.05 / (lum(s[i]) + 0.05);
    const b = 1.05 / (lum(s[i + 5]) + 0.05);

    if (b / a < 4.5) fails++;
  }

  const dup = new Set(s.map(String)).size !== s.length;
  const v = document.querySelector('.verdict[data-for="' + ramp.dataset.id + '"]');

  if (!v) return;

  v.className = 'verdict ' + (fails || dup ? 'bad' : 'ok');
  v.textContent = (fails ? fails + '/5 AA pairs fail' : 'all 5 AA pairs pass') + (dup ? ' \\u00b7 duplicate shades' : '');
});
</script></body></html>`;

const dest = path.resolve(ROOT, out);
mkdirSync(path.dirname(dest), { recursive: true });
await writeFile(dest, html, "utf8");
console.log(
  `wrote ${path.relative(ROOT, dest)} (${rows.length} seeds, ${neutrals.length} surfaces)`,
);
