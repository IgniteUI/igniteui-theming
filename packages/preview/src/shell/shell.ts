import { html, LitElement, nothing } from "lit";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";
import { define } from "../define.js";
import { findSection, findView, SECTIONS } from "../sections/index.js";
import type { SectionDef, ViewDef } from "../sections/types.js";

/** How far ahead of the viewport a view starts loading. */
const LOOKAHEAD = "600px";

/** `#/<section>/<view>?<query>` — the query belongs to the section, not the shell. */
const parseHash = (hash: string) => {
  const [section, view] = hash.replace(/^#\/?/, "").split("?")[0].split("/");
  return { section: findSection(section), viewId: view };
};

/**
 * Navigation, routing and the frame around a section.
 *
 * A section renders as one page: its controls are pinned at the top and every view is
 * stacked below them, so a control the reader moves is visibly the same control for all
 * of them. Views still load one at a time — an observer imports each as it nears the
 * viewport — so stacking costs nothing on first paint.
 */
export class PreviewShell extends LitElement {
  static properties = {
    section: { state: true },
    loaded: { state: true },
    controlsReady: { state: true },
    current: { state: true },
  };

  declare section: SectionDef;
  /** Tags whose module has finished loading. */
  declare loaded: Set<string>;
  declare controlsReady: boolean;
  /** The view the reader is looking at, for the nav. */
  declare current: string;

  private approach?: IntersectionObserver;
  private spy?: IntersectionObserver;
  private bar?: ResizeObserver;

  constructor() {
    super();
    this.section = parseHash(location.hash).section;
    this.loaded = new Set();
    this.controlsReady = false;
    this.current = this.section.views[0]?.id ?? "";
  }

  /** Light DOM: the app is styled by the library's own generated custom properties. */
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    addEventListener("hashchange", this.onHashChange);
    this.approach = new IntersectionObserver(this.onApproach, {
      rootMargin: `${LOOKAHEAD} 0px ${LOOKAHEAD} 0px`,
    });
    this.spy = new IntersectionObserver(this.onSpy, {
      rootMargin: "-20% 0px -70% 0px",
    });
    this.loadControls();
  }

  disconnectedCallback() {
    removeEventListener("hashchange", this.onHashChange);
    this.approach?.disconnect();
    this.spy?.disconnect();
    this.bar?.disconnect();
    super.disconnectedCallback();
  }

  /**
   * The pinned bar's height, as a custom property, so a view scrolled to by link stops
   * below it rather than under it. Measured because the bar wraps on narrow screens.
   */
  firstUpdated() {
    const bar = this.querySelector(".control-bar");
    if (!bar) return;

    this.bar = new ResizeObserver(([entry]) => {
      this.style.setProperty(
        "--control-bar-height",
        `${entry.contentRect.height}px`,
      );
    });
    this.bar.observe(bar);
  }

  private onHashChange = () => {
    const { section, viewId } = parseHash(location.hash);

    if (section !== this.section) {
      this.section = section;
      this.controlsReady = false;
      this.loadControls();
    }

    const view = findView(section, viewId);
    if (view) this.updateComplete.then(() => this.reveal(view.id));
  };

  private async loadControls() {
    const { controls } = this.section;
    if (!controls) return;

    await controls.load();
    if (this.section.controls === controls) this.controlsReady = true;
  }

  private onApproach = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const view = findView(
        this.section,
        (entry.target as HTMLElement).dataset.view,
      );
      if (!view || this.loaded.has(view.tag)) continue;

      this.approach?.unobserve(entry.target);
      view.load().then(() => {
        this.loaded = new Set(this.loaded).add(view.tag);
      });
    }
  };

  /**
   * The observer is only the trigger; which view is current is read from geometry. A
   * batch of entries can be nothing but departures, which says where the reader left,
   * not where they are.
   */
  private onSpy = () => {
    const frames = [...this.querySelectorAll<HTMLElement>("[data-view]")];
    if (!frames.length) return;

    const line = innerHeight * 0.25;
    const passed = frames.filter(
      (frame) => frame.getBoundingClientRect().top <= line,
    );
    const current = (passed.at(-1) ?? frames[0]).dataset.view;

    if (current) this.current = current;
  };

  private reveal(id: string) {
    this.querySelector(`[data-view="${id}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  updated() {
    for (const frame of this.querySelectorAll<HTMLElement>("[data-view]")) {
      const tag = findView(this.section, frame.dataset.view)?.tag ?? "";
      if (!this.loaded.has(tag)) this.approach?.observe(frame);
      this.spy?.observe(frame);
    }
  }

  private frame(view: ViewDef) {
    return html`
      <article class="view-frame" data-view=${view.id}>
        <header>
          <h2>${view.title}</h2>
          <p class="teaches">${view.teaches}</p>
        </header>
        ${
          this.loaded.has(view.tag)
            ? staticHtml`<${unsafeStatic(view.tag)}></${unsafeStatic(view.tag)}>`
            : html`<p class="loading">Compiling&hellip;</p>`
        }
      </article>
    `;
  }

  render() {
    const section = this.section;
    const controls = section.controls;

    return html`
      <header class="masthead">
        <p class="eyebrow">igniteui-theming</p>
        <nav class="sections" aria-label="Sections">
          ${SECTIONS.map(
            (entry) => html`
              <a href=${`#/${entry.id}`} aria-current=${entry.id === section.id ? "page" : nothing}
                >${entry.title}</a
              >
            `,
          )}
        </nav>
      </header>

      <section class="section-intro">
        <h1>${section.title}</h1>
        <p class="blurb">${section.blurb}</p>
      </section>

      <div class="control-bar">
        ${
          controls && this.controlsReady
            ? staticHtml`<${unsafeStatic(controls.tag)}></${unsafeStatic(controls.tag)}>`
            : nothing
        }
        ${
          section.views.length > 1
            ? html`
              <nav class="views" aria-label="Views in ${section.title}">
                ${section.views.map(
                  (entry) => html`
                    <a href=${`#/${section.id}/${entry.id}`}
                      aria-current=${entry.id === this.current ? "true" : nothing}
                      >${entry.title}</a
                    >
                  `,
                )}
              </nav>
            `
            : nothing
        }
      </div>

      ${section.views.map((view) => this.frame(view))}
    `;
  }
}

define("ig-preview-shell", PreviewShell);

declare global {
  interface HTMLElementTagNameMap {
    "ig-preview-shell": PreviewShell;
  }
}
