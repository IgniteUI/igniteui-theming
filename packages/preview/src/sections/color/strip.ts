/** A row of swatches the reader can pin one of, and the legend that explains it. */
import { html, nothing } from "lit";
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
 * One tooltip for the whole app, moved to whichever swatch is under the pointer or has
 * focus. `igc-tooltip` takes a transient anchor, so a shared instance does the work that
 * one instance per swatch would — and there are a hundred and twenty swatches on a page.
 */
type Tooltip = HTMLElement & {
  show(target: Element): unknown;
  hide(): unknown;
};

let tooltip: Tooltip | null = null;

const sharedTooltip = (): Tooltip => {
  if (!tooltip) {
    tooltip = document.createElement("igc-tooltip") as Tooltip;
    tooltip.setAttribute("placement", "bottom");
    tooltip.setAttribute("show-delay", "120");
    tooltip.setAttribute("hide-delay", "0");
    document.body.append(tooltip);
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
    const tip = sharedTooltip();
    tip.textContent = describe(s, against, measured);
    tip.show(event.currentTarget as Element);
  };
  const hide = () => sharedTooltip().hide();

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
        ${isReference ? "reference" : ratio(measured)}
        ${earned ? html`<span class="grade">${earned}</span>` : nothing}
      </span>
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
        aria-label=${`${row.label} shades — pick one to compare the rest against`}
        @keydown=${onKey}
      >
        ${row.swatches.map((s) => swatch(s, probe, reference, focusable))}
      </div>
    </ig-palette-scope>
  `;
};

/**
 * What the marks mean, and what the probe is currently doing.
 *
 * The line changes with the state rather than describing every state at once: before a
 * shade is pinned the only thing worth saying is that you can pin one.
 */
export const legend = (probe: Probe) => html`
  <div class="keyline">
    ${
      probe.pinned
        ? html`
          <span
            >Every shade measured against its own
            <b>${probe.pinned}</b> &mdash; AAA from 7:1, AA from 4.5:1, UI from 3:1</span
          >
          <button type="button" class="clear" @click=${() => probe.pin(null)}>
            Clear
          </button>
        `
        : html`<span
            >Click a shade to measure every other shade against it. Ratios shown are
            against <b>white, or the page for a neutral</b>.</span
          >`
    }
    <span><span class="key-twin" aria-hidden="true">=</span>same color as another shade</span>
  </div>
`;
