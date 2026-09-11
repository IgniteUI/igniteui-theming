/** Markup for the parts of the page that repeat over data. The chrome lives in index.html. */
import { html, type Raw, raw } from "./html.js";
import type {
  Model,
  Neutral,
  Ramp,
  Role,
  Row,
  Score,
  Swatch,
} from "./model.js";
import { ROLES } from "./palettes.js";

const ratio = (value: number) => `${value.toFixed(1)}:1`;

const swatch = (s: Swatch) => html`
  <i data-token="${s.token}" style="background:var(${raw(s.token)});color:var(${raw(s.token)}-contrast)"
     title="${s.token}  ${s.hex}&#10;${s.ratio.toFixed(2)}:1 against ${s.against}">
    <b>${s.key}</b><em>${ratio(s.ratio)}</em>
  </i>`;

const strip = (row: Row) => html`
  <div class="row ${row.cls}">
    <span class="who">${row.label}</span>
    <div class="strip">${row.swatches.map(swatch)}</div>
    <span class="verdict ${row.ok ? "ok" : "bad"}">${row.verdict}</span>
  </div>`;

const rampBlock = (r: Ramp) => html`
  <article>
    <header>
      <i class="dot" style="background:${r.seed}"></i>
      <h3>${r.label}</h3><code>${r.seed}</code>
      <span class="meta" title="Matched on lightness only. The shade holds the chroma this hue can carry at that lightness, so it is rarely the seed hex.">seed sits at <b>${r.lands}</b>&rsquo;s lightness</span>
    </header>
    <div class="stack">${r.shades.map(strip)}</div>
    <div class="stack">${r.accents.map(strip)}</div>
  </article>`;

const mock = (n: Neutral) => html`
  <div class="mock ${n.fittedCls}">
    <div class="mock-bar"><span></span><span class="pill"></span></div>
    <div class="well"><span>sunken &mdash; a well</span></div>
    <div class="card">
      <strong>raised</strong><span>a card that sits on the page</span>
      <div class="line"></div><div class="line short"></div>
    </div>
    <div class="pop"><strong>overlay</strong><span>a menu above everything</span></div>
  </div>`;

const role = (n: Neutral, r: Role) => html`
  <div class="role">
    <i style="background:${n.bg}"><b style="background:var(--ig-surface-${r.key})"></b></i>
    <div><code>${r.key}</code><em>${r.collapsed ? "on the background" : `${r.away.toFixed(2)}:1 away`}</em></div>
  </div>`;

const surfaceBlock = (n: Neutral) => html`
  <article>
    <header><i class="dot" style="background:${n.bg}"></i><h3>${n.label}</h3><code>${n.bg}</code></header>
    <div class="two">
      ${mock(n)}
      <div>
        <div class="stack">${strip(n.legacySurface)}</div>
        <p class="note">Ten numbered shades, no role names. On a page at either extreme most of them
        collapse onto the background &mdash; the generator has nowhere left to go.</p>
        <div class="roles ${n.fittedCls}">${ROLES.map((k) => role(n, n.roles.find((r) => r.key === k) as Role))}</div>
        <p class="note">Five roles that say what they are for. A role with no room resolves onto the
        background on purpose, and the shadow carries the elevation instead.</p>
      </div>
    </div>
  </article>`;

const grayBlock = (n: Neutral) => html`
  <article>
    <header><i class="dot" style="background:${n.bg}"></i><h3>${n.label}</h3><code>${n.bg}</code></header>
    <div class="stack">${n.grays.map(strip)}</div>
  </article>`;

const tile = (
  key: string,
  now: string | number,
  before: string | number,
  note: string,
) => html`
  <div class="tile"><em>${key}</em><b>${now}</b> <s>was ${before}</s><span>${note}</span></div>`;

const scoreboard = (s: Score) => [
  tile(
    "AA pairs that fail",
    s.fittedAA,
    `${s.legacyAA} of ${s.pairs}`,
    "Across every seed on this page. Five shades apart, both directions.",
  ),
  tile(
    "Duplicate shades",
    s.fittedDup,
    s.legacyDup,
    "Two tokens resolving to the same color, so a border vanishes into its fill.",
  ),
  tile(
    "Surface roles",
    ROLES.length,
    "none",
    "Named layers instead of ten numbers, nine of which no component referenced.",
  ),
];

export const sections = (m: Model): Record<string, Raw> => ({
  score: html`${scoreboard(m.score)}`,
  ramps: html`${m.ramps.map(rampBlock)}`,
  surfaces: html`${m.neutrals.map(surfaceBlock)}`,
  grays: html`${m.neutrals.map(grayBlock)}`,
  flavors: html`<article><div class="stack">${m.flavors.map((f) => strip(f.row))}</div></article>`,
});
