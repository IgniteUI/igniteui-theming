import "../../elements/index.js";
import data from "virtual:data/color.scales";
import { html, LitElement, nothing } from "lit";
import {
  AA,
  contrast,
  PAIR_DISTANCE,
  readableOn,
  shadePairs,
  toRgb,
} from "../../color.js";
import type { ScaleSubject } from "../../data/color/scales.js";
import { define } from "../../define.js";
import type { CurvePoint } from "../../elements/curve-editor.js";
import {
  call,
  type Entry,
  entries,
  list,
  map,
  num,
  raw,
  statement,
} from "../../sass-code.js";
import {
  type Anchor,
  type Curve,
  ease,
  lookup,
  position,
  rampFromTable,
  readingFor,
  SCALE_PRESETS,
  type Scale,
  type ScalePreset,
  sameScale,
  target,
} from "../../scale-math.js";
import { SHADES } from "../../variants.js";
import { ColorStateController, type ColorStore } from "./state.js";

/** The two ends of the range cannot cross; this keeps them apart on the sliders. */
const MIN_RANGE = 0.5;
/** Past the subject's ceiling by more than this, the dark end is visibly compressing. */
const CEILING_SLACK = 0.05;

interface Step {
  key: string;
  x: number;
  t: number;
  target: number;
  hex: string;
  reached: number;
}

/** Range and curve, made editable. */
export class ViewScales extends LitElement {
  static properties = {
    store: { attribute: false },
    embedded: { type: Boolean },
    subject: { state: true },
    lo: { state: true },
    hi: { state: true },
    curve: { state: true },
    anchor: { state: true },
  };

  /** A store of its own; without one the view follows the page's. */
  declare store?: ColorStore;
  /**
   * In an article there is no palette picker above the editor, so it offers the
   * selected palette's subjects in both themes — the dark page is where the ceiling
   * shows — and tucks the step table away.
   */
  declare embedded: boolean;
  declare subject: string;
  declare lo: number;
  declare hi: number;
  declare curve: Curve | null;
  /** What a gray subject's range is measured against. Other families ignore it. */
  declare anchor: Anchor;

  private state = new ColorStateController(this);

  constructor() {
    super();
    this.embedded = false;
    this.subject = "";
    this.anchor = "surface";
    this.apply(SCALE_PRESETS[0]);
  }

  createRenderRoot() {
    return this;
  }

  /**
   * The first render happens before `igc-slider` has upgraded, so Lit's `value` property
   * lands while the element still holds default bounds and gets quantised against them.
   * One re-render after the definition resolves is enough; `updated()` then asserts the
   * real value.
   */
  async firstUpdated() {
    await customElements.whenDefined("igc-slider");
    this.requestUpdate();
  }

  /**
   * Keeps each slider's thumb on the number its label reports. Both steps are 0.01, the
   * precision the labels print at, so the two can always agree exactly.
   */
  updated() {
    const sliders = [
      ["scale-lo", this.lo],
      ["scale-hi", this.hi],
    ] as const;

    for (const [id, value] of sliders) {
      const slider = this.querySelector<HTMLElement & { value: number }>(
        `#${id}`,
      );
      if (slider && slider.value !== value) slider.value = value;
    }
  }

  /**
   * Only the subjects the selected palette actually has. The section's control bar owns
   * the seed, so this view shows what that seed produces rather than a menu of seeds of
   * its own.
   */
  private get available(): ScaleSubject[] {
    const { preset, theme } = this.state.value;
    const tags = this.embedded
      ? [`${preset}-light`, `${preset}-dark`]
      : [`${preset}-${theme}`];
    const matching = data.subjects.filter((s) =>
      tags.some((tag) => s.presets.includes(tag)),
    );

    return matching.length ? matching : data.subjects;
  }

  /** Falls back rather than resetting, so switching palette keeps the reader's place. */
  private get current(): ScaleSubject {
    const available = this.available;
    return available.find((s) => s.key === this.subject) ?? available[0];
  }

  private get scale(): Scale {
    return {
      range: [this.lo, this.hi],
      curve: this.curve,
      anchor: this.anchor,
    };
  }

  private get reading() {
    return readingFor(this.current, this.scale);
  }

  /**
   * The ramp in scale order, nearest the anchor first. For a white-anchored gray on a dark
   * page that runs from shade 900 to 50, so the chart, the strip and the ladder all read
   * the same way and the keys show the reversal.
   */
  private get ramp(): Step[] {
    const { table, anchor: reference, flip } = this.reading;
    const anchor = toRgb(reference);
    const last = SHADES.length - 1;

    return SHADES.map((_, k) => {
      const i = flip ? last - k : k;
      const x = position(k);
      const t = ease(x, this.curve);
      const wanted = target(this.scale.range, t);
      const hex = `#${lookup(table, i, wanted)}`;

      return {
        key: SHADES[i],
        x,
        t,
        target: wanted,
        hex,
        reached: contrast(toRgb(hex), anchor),
      };
    });
  }

  private apply({ range, curve, anchor }: Scale) {
    this.lo = range[0];
    this.hi = range[1];
    this.curve = curve ? ([...curve] as Curve) : null;
    this.anchor = anchor ?? "surface";
  }

  private get code() {
    const { family, seed, surface } = this.current;
    const neutral = family === "gray";

    return statement(
      "palette",
      call(
        "palette",
        entries({
          $primary: raw(neutral ? "#0099ff" : seed),
          $secondary: raw("#df1b74"),
          $surface: raw(neutral ? surface : "#fff"),
          $gray: neutral ? raw(seed) : undefined,
          $scales: map([
            [
              `'${family}'`,
              map([
                ["range", list(num(this.lo), num(this.hi))],
                [
                  "curve",
                  this.curve ? list(...this.curve.map(num)) : raw("null"),
                ],
                ...(neutral && this.anchor === "white"
                  ? [["anchor", raw("'white'")] as Entry]
                  : []),
              ]),
            ],
          ]),
        }),
      ),
    );
  }

  private preset(preset: ScalePreset) {
    const { table, flip } = readingFor(this.current, preset);
    const hexes = rampFromTable(table, preset, flip);
    const failing = shadePairs(hexes.map((h) => toRgb(`#${h}`))).filter(
      (pair) => pair.contrast < AA,
    ).length;
    const pairs = SHADES.length - PAIR_DISTANCE;

    return html`
      <button type="button" class="scale-preset" aria-current=${String(sameScale(preset, this.scale))}
        @click=${() => this.apply(preset)}>
        <span class="preset-name">${preset.name}<span class="preset-why">${preset.why}</span></span>
        <span class="preset-mini">
          ${hexes.map((h) => html`<span style=${`background:#${h}`}></span>`)}
        </span>
        <span class=${`preset-record ${failing ? "is-failing" : "is-passing"}`}>
          ${pairs - failing} of ${pairs} pairs
        </span>
      </button>
    `;
  }

  private subjects(subject: ScaleSubject) {
    return html`
      <div class="scale-settings">
        <span class="tag" id="scale-subject">Subject</span>
        <igc-button-group
          selection="single"
          aria-labelledby="scale-subject"
          @igcSelect=${({ detail }: CustomEvent<string | undefined>) => {
            if (detail) this.subject = detail;
          }}
        >
          ${this.available.map(
            (entry) => html`
              <igc-toggle-button value=${entry.key} ?selected=${entry === subject}>
                ${this.embedded ? entry.short : entry.label}
              </igc-toggle-button>
            `,
          )}
        </igc-button-group>
        ${subject.family === "gray" ? this.anchors() : nothing}
      </div>
      <p class="note subject-note">${this.readingNote(subject)}</p>
    `;
  }

  /** Gray only: what the range is measured against. */
  private anchors() {
    return html`
        <span class="tag" id="scale-anchor">Measured from</span>
        <igc-button-group
          selection="single"
          aria-labelledby="scale-anchor"
          @igcSelect=${({ detail }: CustomEvent<string | undefined>) => {
            if (detail === "surface" || detail === "white")
              this.anchor = detail;
          }}
        >
          <igc-toggle-button value="surface" ?selected=${this.anchor === "surface"}>
            The page
          </igc-toggle-button>
          <igc-toggle-button value="white" ?selected=${this.anchor === "white"}>
            White
          </igc-toggle-button>
        </igc-button-group>
    `;
  }

  private readingNote(subject: ScaleSubject) {
    const { anchor, ceiling, flip } = this.reading;

    if (subject.family !== "gray") {
      return html`${subject.note} Against <code>${anchor}</code> it tops out at
        <b>${ceiling.toFixed(2)}:1</b>.`;
    }

    if (this.anchor === "white") {
      return html`Measured from white, as the original grayscale was: the same ten grays
        in every theme${flip ? html`, so on this dark page they run in reverse, <b>900</b> to <b>50</b>` : ""}.`;
    }

    return html`Measured from the page, <code>${anchor}</code>: shade 50 sits nearest it and
      each number steps away. It tops out at <b>${ceiling.toFixed(2)}:1</b>.`;
  }

  private controls() {
    const { ceiling, anchor, flip } = this.reading;
    const reference = anchor === "#ffffff" ? "white" : "the page";
    const [near, far] = flip ? ["900", "50"] : ["50", "900"];
    const overshoot = this.hi > ceiling + CEILING_SLACK;
    const curveLabel = this.curve
      ? this.curve.map((v) => v.toFixed(2)).join(", ")
      : "linear";

    return html`
      <div class="controls">
        <div class="control">
          <label class="control-label" for="scale-lo">Nearest shade <b>${this.lo.toFixed(2)}:1</b></label>
          <igc-slider
            id="scale-lo"
            aria-label=${`Contrast of shade ${near} against ${reference}`}
            .min=${1}
            .max=${4}
            .step=${0.01}
            .value=${this.lo}
            @igcInput=${({ detail }: CustomEvent<number>) => {
              this.lo = Math.min(detail, this.hi - MIN_RANGE);
            }}
          ></igc-slider>
          <p class="control-hint">How much shade ${near} stands out from ${reference}. At 1:1 it would be ${reference} itself.</p>
        </div>
        <div class="control">
          <label class="control-label" for="scale-hi">Farthest shade <b>${this.hi.toFixed(2)}:1</b></label>
          <igc-slider
            id="scale-hi"
            aria-label=${`Contrast of shade ${far} against ${reference}`}
            .min=${6}
            .max=${21}
            .step=${0.01}
            .value=${this.hi}
            @igcInput=${({ detail }: CustomEvent<number>) => {
              this.hi = Math.max(detail, this.lo + MIN_RANGE);
            }}
          ></igc-slider>
          <p class=${`control-hint ${overshoot ? "is-over" : ""}`}>
            ${
              overshoot
                ? html`That is more than this subject can reach (${ceiling.toFixed(2)}:1).
                  The far end gets squeezed and pairs start to fail.`
                : `How much shade ${far} stands out. Black on white is 21:1, the most contrast there is.`
            }
          </p>
        </div>
        <div class="control">
          <span class="control-label">Curve <b>${curveLabel}</b></span>
          <p class="control-hint">Drag the two handles on the chart, or nudge them with the arrow keys.</p>
          <igc-button variant="outlined" class="control-action" @click=${() => {
            this.curve = null;
          }}>Straight line</igc-button>
        </div>
      </div>
    `;
  }

  /**
   * Every guaranteed pair as a bar spanning the two shades, on a twenty-column grid, with
   * its label on a line of its own starting where the bar does. Every row is the same
   * height, and a label never has to find room beside its bar.
   */
  private ladder(ramp: Step[]) {
    return html`
      <div class="ladder">
        ${shadePairs(ramp.map((s) => toRgb(s.hex))).map((pair) => {
          const state = pair.contrast >= AA ? "is-passing" : "is-failing";
          const start = pair.i * 2 + 2;

          return html`
            <div class="ladder-row">
              <span class=${`ladder-tag ${state}`} style=${`grid-column:${start} / -1`}>
                ${ramp[pair.i].key}&ndash;${ramp[pair.j].key} ${pair.contrast.toFixed(1)}:1
              </span>
              <span class=${`ladder-bar ${state}`} style=${`grid-column:${start} / ${pair.j * 2 + 2}`}></span>
            </div>
          `;
        })}
      </div>
    `;
  }

  private table(ramp: Step[]) {
    return html`
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Shade</th><th>Position</th><th>After curve</th><th>Target</th><th>Reached</th><th>Color</th></tr>
          </thead>
          <tbody>
            ${ramp.map(
              (s) => html`
                <tr>
                  <td>${s.key}</td>
                  <td>${s.x.toFixed(3)}</td>
                  <td>${s.t.toFixed(3)}</td>
                  <td>${s.target.toFixed(2)}:1</td>
                  <td class=${Math.abs(s.reached - s.target) > s.target * 0.05 ? "is-miss" : ""}>
                    ${s.reached.toFixed(2)}:1
                  </td>
                  <td><span class="dot" style=${`background:${s.hex}`}></span>${s.hex}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    const subject = this.current;
    const ramp = this.ramp;
    const points: CurvePoint[] = ramp.map(({ x, t, hex }) => ({ x, t, hex }));

    return html`
      <div class="scale-presets">${SCALE_PRESETS.map((p) => this.preset(p))}</div>

      ${this.subjects(subject)}
      ${this.controls()}

      <div class="stage">
        <ig-curve-editor
          .curve=${this.curve}
          .points=${points}
          low=${`${this.lo.toFixed(2)}:1`}
          high=${`${this.hi.toFixed(2)}:1`}
          from=${ramp[0].key}
          to=${ramp[ramp.length - 1].key}
          @curve-change=${({ detail }: CustomEvent<Curve>) => {
            this.curve = detail;
          }}
        ></ig-curve-editor>

        <div class="strip">
          ${ramp.map(
            (s) => html`
              <span class="swatch" style=${`background:${s.hex};color:${readableOn(toRgb(s.hex))}`}
                title=${`${s.key}  ${s.hex}\n${s.reached.toFixed(2)}:1 against ${this.reading.anchor}`}>
                <span class="swatch-key">${s.key}</span>
                <span class="swatch-ratio">${s.reached.toFixed(1)}:1</span>
              </span>
            `,
          )}
        </div>

        ${this.ladder(ramp)}
      </div>

      ${
        this.embedded
          ? html`<details class="steps">
              <summary>Every shade, step by step</summary>
              ${this.table(ramp)}
            </details>`
          : this.table(ramp)
      }

      <ig-code-block label="This scale as Sass" .code=${this.code}></ig-code-block>
    `;
  }
}

define("ig-view-scales", ViewScales);

declare global {
  interface HTMLElementTagNameMap {
    "ig-view-scales": ViewScales;
  }
}
