/**
 * The article embeds: one script, one custom element per entry in `catalog.ts`.
 *
 *   <script type="module" src="…/embed.js"></script>
 *   <ig-demo-seeds></ig-demo-seeds>
 *   <ig-demo-shades></ig-demo-shades>
 *   <ig-demo-sweep></ig-demo-sweep>
 *   <ig-demo-scales></ig-demo-scales>
 *   <ig-demo-neutrals></ig-demo-neutrals>
 *
 * Each demo draws inside its own shadow root with its own copy of the theme, so the
 * article's styles and the demo's cannot reach each other. Each keeps its own selection:
 * nothing is shared between demos and nothing is written to the page's address.
 *
 * A demo's code and data load when it comes within a screen of the viewport, so a reader
 * who never scrolls to the sweep never downloads it.
 *
 * Attributes:
 * - `scheme="light" | "dark"` — pin the demo's colors; by default it follows the system.
 * - `frame` — set by the standalone iframe pages: load at once and report height to the
 *   parent window.
 */
import { html, LitElement, nothing } from "lit";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";
import { define } from "../define.js";
import { ColorStore } from "../sections/color/state.js";
import {
  CATALOG,
  DEMO_NAMES,
  type DemoInfo,
  type DemoName,
} from "./catalog.js";
import { demoSheet, registerProperties } from "./styles.js";

/** The view each demo wraps, and how to load it. Keyed exactly like the catalog. */
const VIEWS: Record<DemoName, { tag: string; load: () => Promise<unknown> }> = {
  seeds: {
    tag: "ig-view-seeds",
    load: () => import("../sections/color/seeds.js"),
  },
  shades: {
    tag: "ig-view-shades",
    load: () => import("../sections/color/shades.js"),
  },
  sweep: {
    tag: "ig-view-sweep",
    load: () => import("../sections/color/sweep.js"),
  },
  scales: {
    tag: "ig-view-scales",
    load: () => import("../sections/color/scales.js"),
  },
  neutrals: {
    tag: "ig-view-neutrals",
    load: () => import("../sections/color/neutrals.js"),
  },
};

type DemoDef = DemoInfo & (typeof VIEWS)[DemoName];

/** Components the pickers use; the views import what they need themselves. */
const loadControls = () => import("../sections/color/controls.js");

/** How far ahead of the viewport a demo starts loading. */
const LOOKAHEAD = "100% 0px";

const demoElement = (def: DemoDef) =>
  class extends LitElement {
    static styles = [demoSheet];
    static properties = {
      scheme: { reflect: true },
      frame: { type: Boolean },
      ready: { state: true },
    };

    declare scheme?: "light" | "dark";
    declare frame: boolean;
    declare ready: boolean;

    /** This demo's selection, and nobody else's. */
    private readonly store = new ColorStore();
    private observer?: IntersectionObserver;
    private sizer?: ResizeObserver;

    constructor() {
      super();
      this.frame = false;
      this.ready = false;
    }

    connectedCallback() {
      super.connectedCallback();
      registerProperties();

      if (this.frame || !("IntersectionObserver" in window)) {
        this.load();
      } else {
        this.observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) this.load();
          },
          { rootMargin: LOOKAHEAD },
        );
        this.observer.observe(this);
      }

      if (this.frame && parent !== window) this.reportHeight();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.sizer?.disconnect();
      super.disconnectedCallback();
    }

    private async load() {
      this.observer?.disconnect();
      this.observer = undefined;
      if (this.ready) return;

      await Promise.all([
        def.load(),
        def.picker !== "none" ? loadControls() : null,
      ]);
      this.ready = true;
    }

    /** For the iframe pages: the parent sizes the frame to whatever the demo needs. */
    private reportHeight() {
      this.sizer = new ResizeObserver(() => {
        const height = Math.ceil(
          document.documentElement.getBoundingClientRect().height,
        );
        parent.postMessage({ type: "ig-demo:height", height }, "*");
      });
      this.sizer.observe(document.documentElement);
    }

    render() {
      if (!this.ready) {
        return html`<div class="demo-loading" style=${`min-height:${def.reserve}px`}>
          Loading demo…
        </div>`;
      }

      const view = unsafeStatic(def.tag);

      return html`
        <div class="demo">
          ${
            def.picker === "none"
              ? nothing
              : html`<div class="demo-controls">
                  <ig-color-controls
                    .store=${this.store}
                    .themes=${def.picker === "palette+theme"}
                  ></ig-color-controls>
                </div>`
          }
          ${staticHtml`<${view} embedded .store=${this.store}></${view}>`}
        </div>
      `;
    }
  };

for (const name of DEMO_NAMES) {
  define(`ig-demo-${name}`, demoElement({ ...CATALOG[name], ...VIEWS[name] }));
}
