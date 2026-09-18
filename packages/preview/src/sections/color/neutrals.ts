import "../../elements/index.js";
import { html, LitElement } from "lit";
import { define } from "../../define.js";
import type { Role, SurfaceBlock } from "../../preset-model.js";
import { modelFor } from "./model.js";
import { ColorStateController, setColorState } from "./state.js";
import { legend, type Probe, strip } from "./strip.js";

/** A page built from nothing but the five surface roles, text included. */
const mock = (surface: SurfaceBlock) => html`
  <ig-palette-scope class="mock" .vars=${surface.fittedVars}>
    <div class="mock-bar"><span class="mock-title"></span><span class="mock-pill"></span></div>
    <div class="mock-well"><span>sunken, a well cut into the page</span></div>
    <div class="mock-card">
      <strong>raised</strong><span>a card resting on the page</span>
      <div class="mock-line"></div>
      <div class="mock-line is-short"></div>
    </div>
    <div class="mock-pop">
      <strong>overlay</strong><span>a menu floating above everything</span>
    </div>
  </ig-palette-scope>
`;

const role = (surface: SurfaceBlock, r: Role) => html`
  <div class="role">
    <span class="role-swatch" style=${`background:${surface.bg}`}>
      <span style=${`background:var(--ig-surface-${r.key})`}></span>
    </span>
    <div>
      <code>${r.key}</code>
      <span class="role-distance">
        ${r.collapsed ? "same as the page" : `${r.away.toFixed(2)}:1 from the page`}
      </span>
    </div>
  </div>
`;

/**
 * Surface stopped being ten numbered shades, and gray stopped being anchored to white.
 * Both are about the page rather than about a color, which is why they share a view.
 */
export class ViewNeutrals extends LitElement {
  private state = new ColorStateController(this);

  private get probe(): Probe {
    return {
      pinned: this.state.value.pinned,
      pin: (pinned) => setColorState({ pinned }),
    };
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const model = modelFor(this.state.value);
    const surface = model.surface;

    return html`
      <article>
        <header>
          <span class="dot" style=${`background:${surface.bg}`}></span>
          <h3>${model.label} ${model.theme}</h3>
          <code>${surface.bg}</code>
        </header>
        <div class="two-up">
          ${mock(surface)}
          <div>
            <div class="stack">${strip(surface.legacySurface, this.probe)}</div>
            <p class="note">
              Ten numbered shades, with nothing to say what each one is for. On a very
              light or very dark page most of them end up the same color as the
              background, because there is simply no room left to go lighter or darker.
            </p>
            <ig-palette-scope class="roles" .vars=${surface.fittedVars}>
              ${surface.roles.map((r) => role(surface, r))}
            </ig-palette-scope>
            <p class="note">
              Five roles, each named after its job. When a role has no room left it
              deliberately settles onto the background, and a shadow carries the sense
              of depth instead. The mock page on the left is built entirely from these
              five roles, text included.
            </p>
          </div>
        </div>
      </article>

      ${legend(this.probe)}

      <h3 class="group">Grayscale</h3>
      <p class="sub">
        The grays are anchored to the page rather than to white, so shade 50 is always
        the one closest to the background, in a light theme and a dark one alike. This
        palette seeds them with <code>${surface.seed}</code>.
      </p>
      <article>
        <div class="stack">${surface.grays.map((row) => strip(row, this.probe))}</div>
        <p class="note">
          Both rows fail the same two pairs, and that is deliberate. The gray family uses
          the <code>material</code> scale by default, which keeps the rhythm our grayscale
          has always had at the cost of two AA pairs. The Scales demo below is where that
          trade is made, and where you can undo it.
        </p>
      </article>
    `;
  }
}

define("ig-view-neutrals", ViewNeutrals);

declare global {
  interface HTMLElementTagNameMap {
    "ig-view-neutrals": ViewNeutrals;
  }
}
