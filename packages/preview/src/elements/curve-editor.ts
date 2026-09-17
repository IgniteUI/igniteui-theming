import { css, html, LitElement, svg } from "lit";
import { define } from "../define.js";
import { type Curve, ease, IDENTITY_CURVE } from "../scale-math.js";

/** A shade drawn on the curve: where it sits, where the curve put it, what it looks like. */
export interface CurvePoint {
  x: number;
  t: number;
  hex: string;
}

type Handle = "p1" | "p2";

const WIDTH = 900;
const TOP = 16;
const BOTTOM = 176;
const LEFT = WIDTH * 0.05;
const SPAN = WIDTH * 0.9;
const px = (t: number) => LEFT + t * SPAN;
const py = (t: number) => BOTTOM - t * (BOTTOM - TOP);

/**
 * How far past the range a control point may be pulled. Overshoot is the interesting
 * part of a curve — it is what bunches one end — so the bound is generous.
 */
const OVERSHOOT = 0.4;
/** Half the handle mark plus its ring, so one pulled to the limit still draws whole. */
const PAD = 12;
/** The viewBox follows the overshoot bound, so a handle at the limit stays on screen to grab. */
const VIEW_TOP = py(1 + OVERSHOOT) - PAD;
const VIEW_HEIGHT = py(-OVERSHOOT) + PAD - VIEW_TOP;
const CURVE_SAMPLES = 120;

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/**
 * The easing curve, made grabbable. Controlled: the host owns `curve` and hears
 * `curve-change` when a handle is dragged or nudged.
 */
export class CurveEditor extends LitElement {
  static properties = {
    curve: { attribute: false },
    points: { attribute: false },
    low: { type: String },
    high: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      color: var(--plot-ink, currentColor);
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      touch-action: none;
    }

    .tick {
      font-family: var(--mono, ui-monospace, monospace);
      font-size: 10px;
      fill: currentColor;
      opacity: 0.8;
    }

    .axis {
      letter-spacing: 0.08em;
      opacity: 0.6;
    }

    .handle {
      cursor: grab;
    }

    .handle:active {
      cursor: grabbing;
    }

    /* The transparent target takes the pointer; the marks are decoration. */
    .handle circle {
      pointer-events: all;
    }

    .handle rect {
      pointer-events: none;
    }

    .handle rect[tabindex] {
      pointer-events: all;
    }

    .handle rect:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
  `;

  declare curve: Curve | null;
  declare points: CurvePoint[];
  declare low: string;
  declare high: string;

  private dragging: Handle | null = null;

  constructor() {
    super();
    this.curve = null;
    this.points = [];
    this.low = "";
    this.high = "";
  }

  disconnectedCallback() {
    this.release();
    super.disconnectedCallback();
  }

  private get handles(): Curve {
    return this.curve ?? IDENTITY_CURVE;
  }

  private change(next: Curve) {
    this.dispatchEvent(
      new CustomEvent<Curve>("curve-change", { detail: next, bubbles: true }),
    );
  }

  private move(which: Handle, x: number, y: number) {
    const next = [...this.handles] as Curve;
    const at = which === "p1" ? 0 : 2;

    next[at] = clamp(x, 0, 1);
    next[at + 1] = clamp(y, -OVERSHOOT, 1 + OVERSHOOT);
    this.change(next);
  }

  private grab(event: PointerEvent, which: Handle) {
    event.preventDefault();
    this.dragging = which;
    addEventListener("pointermove", this.onDrag);
    addEventListener("pointerup", this.release);
    addEventListener("pointercancel", this.release);
    // Grabbing with the pointer also takes focus, so the arrow keys carry on from
    // wherever the drag ended rather than from whichever handle was last tabbed to.
    (event.currentTarget as SVGGElement)
      .querySelector<SVGRectElement>("[tabindex]")
      ?.focus();
  }

  private onDrag = (event: PointerEvent) => {
    const which = this.dragging;
    const canvas = this.renderRoot.querySelector("svg");
    if (!which || !canvas) return;

    event.preventDefault();
    const box = canvas.getBoundingClientRect();
    const x = (((event.clientX - box.left) / box.width) * WIDTH - LEFT) / SPAN;
    const local =
      VIEW_TOP + ((event.clientY - box.top) / box.height) * VIEW_HEIGHT;
    const y = (BOTTOM - local) / (BOTTOM - TOP);

    this.move(which, x, y);
  };

  private release = () => {
    this.dragging = null;
    removeEventListener("pointermove", this.onDrag);
    removeEventListener("pointerup", this.release);
    removeEventListener("pointercancel", this.release);
  };

  private nudge(event: KeyboardEvent, which: Handle) {
    const step = event.shiftKey ? 0.1 : 0.02;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (!move) return;

    event.preventDefault();
    const at = which === "p1" ? 0 : 2;
    this.move(
      which,
      this.handles[at] + move[0],
      this.handles[at + 1] + move[1],
    );
  }

  private handle(which: Handle) {
    const [x, y] =
      which === "p1" ? this.handles.slice(0, 2) : this.handles.slice(2);
    const [anchorX, anchorY] = which === "p1" ? [0, 0] : [1, 1];
    const cx = px(x);
    const cy = py(y);

    return svg`
      <line x1=${px(anchorX)} y1=${py(anchorY)} x2=${cx} y2=${cy}
        stroke="currentColor" stroke-width="1" opacity=".4" stroke-dasharray="3 3" />
      <g class="handle" @pointerdown=${(event: PointerEvent) => this.grab(event, which)}>
        <!-- A target wider than the mark: ten shade dots share this curve. -->
        <circle cx=${cx} cy=${cy} r="18" fill="transparent" />
        <!-- A ring in the panel color, so the mark reads against the line and the dots. -->
        <rect x=${cx - 7} y=${cy - 7} width="14" height="14" rx="2"
          fill="none" stroke="var(--panel)" stroke-width="6" />
        <rect
          tabindex="0" role="slider"
          aria-label=${which === "p1" ? "First control point" : "Second control point"}
          aria-valuenow=${Math.round(y * 100)}
          aria-valuemin=${Math.round(-OVERSHOOT * 100)}
          aria-valuemax=${Math.round((1 + OVERSHOOT) * 100)}
          x=${cx - 7} y=${cy - 7} width="14" height="14" rx="2"
          fill="var(--panel)" stroke="currentColor" stroke-width="2"
          @keydown=${(event: KeyboardEvent) => this.nudge(event, which)}
        />
      </g>
    `;
  }

  private path() {
    return Array.from({ length: CURVE_SAMPLES + 1 }, (_, k) => {
      const x = k / CURVE_SAMPLES;
      return `${k ? "L" : "M"}${px(x).toFixed(2)} ${py(ease(x, this.curve)).toFixed(2)}`;
    }).join(" ");
  }

  render() {
    return html`
      <svg viewBox=${`0 ${VIEW_TOP} ${WIDTH} ${VIEW_HEIGHT}`} role="img"
        aria-label="Curve mapping shade position to contrast target">
        <line x1=${LEFT} y1=${TOP} x2=${LEFT} y2=${BOTTOM} stroke="var(--line)" stroke-width="1" />
        <line x1=${LEFT} y1=${BOTTOM} x2=${px(1)} y2=${BOTTOM} stroke="var(--line)" stroke-width="1" />
        <!-- Closes the range, so a handle pulled above it reads as overshoot. -->
        <line x1=${LEFT} y1=${TOP} x2=${px(1)} y2=${TOP}
          stroke="var(--line)" stroke-width="1" stroke-dasharray="2 4" />
        <text x=${LEFT + 6} y=${TOP + 11} class="tick">${this.high}</text>
        <text x=${LEFT + 6} y=${BOTTOM - 6} class="tick">${this.low}</text>
        <text x="13" y=${BOTTOM} transform=${`rotate(-90 13 ${BOTTOM})`} class="tick axis">CONTRAST</text>
        ${this.points.map(
          (
            p,
          ) => svg`<line x1=${px(p.x)} y1=${py(p.t)} x2=${px(p.x)} y2=${BOTTOM}
            stroke="var(--line)" stroke-width="1" />`,
        )}
        <path fill="none" stroke="currentColor" stroke-width="2" opacity=".9" d=${this.path()} />
        ${this.points.map(
          (p) => svg`<circle cx=${px(p.x)} cy=${py(p.t)} r="5"
            fill=${p.hex} stroke="currentColor" stroke-width="1.5" />`,
        )}
        ${this.handle("p1")}
        ${this.handle("p2")}
        <text x=${px(0)} y="200" text-anchor="middle" class="tick">50</text>
        <text x=${px(1)} y="200" text-anchor="middle" class="tick">900</text>
      </svg>
    `;
  }
}

define("ig-curve-editor", CurveEditor);

declare global {
  interface HTMLElementTagNameMap {
    "ig-curve-editor": CurveEditor;
  }

  interface HTMLElementEventMap {
    "curve-change": CustomEvent<Curve>;
  }
}
