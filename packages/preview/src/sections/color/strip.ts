/** A row of swatches the reader can pin one of, and the legend that explains it. */
import { html, nothing, type TemplateResult } from "lit";
import { contrast } from "../../color.js";
import type { Row, Swatch } from "../../preset-model.js";
import { describe, grade, listKeys, ratio } from "./grade.js";

/**
 * A pinned shade number, and how to change it.
 *
 * It is a number rather than one swatch on purpose: pinning `100` makes every numbered
 * row measure against its own `100`, so the legacy answer and the fitted answer appear
 * side by side. The reader performs the comparison instead of being told it.
 */
export interface Probe {
  pinned: string | null;
  pin: (key: string | null) => void;
}

/**
 * One tooltip per document or shadow root, moved to whichever swatch is under the pointer
 * or has focus. `igc-tooltip` takes a transient anchor, so a shared instance does the
 * work that one instance per swatch would — and there are a hundred and twenty swatches
 * on a page.
 *
 * Per root rather than per page: an embedded demo lives in a shadow root, and a tooltip
 * appended to the host page's body would neither inherit the demo's tokens nor sit in its
 * stylesheet.
 */
type Tooltip = HTMLElement & {
  show(target: Element): unknown;
  hide(): unknown;
};

const tooltips = new WeakMap<Node, Tooltip>();

const tooltipFor = (anchor: Element): Tooltip => {
  const root = anchor.getRootNode();
  const home = root instanceof ShadowRoot ? root : document.body;
  let tooltip = tooltips.get(home);

  if (!tooltip) {
    tooltip = document.createElement("igc-tooltip") as Tooltip;
    tooltip.setAttribute("placement", "bottom");
    tooltip.setAttribute("show-delay", "120");
    tooltip.setAttribute("hide-delay", "0");
    home.append(tooltip);
    tooltips.set(home, tooltip);
  }

  return tooltip;
};

const swatch = (
  s: Swatch,
  probe: Probe,
  reference: Swatch | null,
  focusable: string,
) => {
  const isReference = reference?.key === s.key;
  const measured =
    reference && !isReference ? contrast(s.rgb, reference.rgb) : s.ratio;
  const against = reference && !isReference ? reference.key : null;
  const earned = against ? grade(measured) : null;

  const show = (event: Event) => {
    const anchor = event.currentTarget as Element;
    const tip = tooltipFor(anchor);
    tip.textContent = describe(s, against, measured);
    tip.show(anchor);
  };
  const hide = (event: Event) =>
    tooltipFor(event.currentTarget as Element).hide();

  return html`
    <button
      type="button"
      role="radio"
      aria-checked=${isReference}
      tabindex=${s.key === focusable ? 0 : -1}
      data-key=${s.key}
      class=${[
        "swatch",
        isReference ? "is-reference" : "",
        against && !earned ? "is-short" : "",
      ].join(" ")}
      style=${`background:var(${s.token});color:var(${s.token}-contrast)`}
      @click=${() => probe.pin(isReference ? null : s.key)}
      @pointerenter=${show}
      @focus=${show}
      @pointerleave=${hide}
      @blur=${hide}
    >
      <span class="swatch-key">${s.key}</span>
      <span class="swatch-ratio">
        ${
          isReference
            ? html`<span aria-hidden="true">ref</span
                ><span class="visually-hidden">reference</span>`
            : ratio(measured)
        }
      </span>
      ${earned ? html`<span class="grade">${earned}</span>` : nothing}
      ${
        s.same.length
          ? html`<span class="twin" aria-hidden="true">=</span
              ><span class="visually-hidden">same color as ${listKeys(s.same)}</span>`
          : nothing
      }
    </button>
  `;
};

/** Every swatch paints from the palette its own scope carries, not a document stylesheet. */
export const strip = (row: Row, probe: Probe) => {
  const reference =
    row.probeable && probe.pinned
      ? (row.swatches.find((s) => s.key === probe.pinned) ?? null)
      : null;
  const focusable = reference?.key ?? row.swatches[0].key;

  // Arrow keys move and pin in one go, which is what a radio group does. Escape clears,
  // because a pinned shade is an inspection the reader needs a way out of.
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      probe.pin(null);
      return;
    }

    const keys = row.swatches.map((s) => s.key);
    const from = keys.indexOf(
      (event.target as HTMLElement).dataset.key ?? focusable,
    );
    const moves: Record<string, number> = {
      ArrowLeft: from - 1,
      ArrowRight: from + 1,
      Home: 0,
      End: keys.length - 1,
    };
    const to = moves[event.key];
    if (to === undefined) return;

    event.preventDefault();
    const next = keys[Math.min(keys.length - 1, Math.max(0, to))];
    probe.pin(next);

    const group = event.currentTarget as HTMLElement;
    requestAnimationFrame(() =>
      group
        .querySelector<HTMLElement>(`[data-key="${next}"]`)
        ?.focus({ preventScroll: true }),
    );
  };

  return html`
    <ig-palette-scope class="row" .vars=${row.vars}>
      <span class="who">${row.label}</span>
      <div
        class="strip"
        role="radiogroup"
        aria-label=${`${row.label} shades. Pick one to compare the others against it.`}
        @keydown=${onKey}
      >
        ${row.swatches.map((s) => swatch(s, probe, reference, focusable))}
      </div>
    </ig-palette-scope>
  `;
};

/** What a legend describes: the reference the ratios start from, and the rows it covers. */
export interface LegendContext {
  /** What every ratio is measured against until a shade is pinned. */
  against: TemplateResult | string;
  /** The rows below the legend. The `=` key only appears when one of them has a repeat. */
  rows: readonly Row[];
}

/**
 * What the marks mean, and what the probe is currently doing.
 *
 * The line changes with the state rather than describing every state at once: before a
 * shade is pinned the only thing worth saying is that you can pin one. Each part is said
 * only when it is true of the rows shown: a view without repeated colors has no `=` key.
 */
export const legend = (probe: Probe, { against, rows }: LegendContext) => html`
  <div class="keyline">
    ${
      probe.pinned
        ? html`
          <span
            >Every shade is now measured against its own <b>${probe.pinned}</b>. AAA needs
            7:1, AA needs 4.5:1, and 3:1 is enough for things like borders and icons.</span
          >
          <button type="button" class="clear" @click=${() => probe.pin(null)}>
            Clear
          </button>
        `
        : html`<span
            >Click any shade to measure every other shade in its row against it. Until
            then, each ratio is against <b>${against}</b>.</span
          >`
    }
    ${
      rows.some((row) => row.swatches.some((s) => s.same.length > 0))
        ? html`<span
            ><span class="key-twin" aria-hidden="true">=</span>the same color as another
            shade in the row</span
          >`
        : nothing
    }
  </div>
`;
