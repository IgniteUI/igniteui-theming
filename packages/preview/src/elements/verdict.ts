import { css, html, LitElement } from "lit";
import { define } from "../define.js";

export interface Finding {
  text: string;
  ok: boolean;
}

/**
 * A pass or fail readout. Offered, not imposed: a demo whose subject has no honest
 * measure simply does not use one.
 */
export class Verdict extends LitElement {
  static properties = { findings: { attribute: false } };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-family: var(--mono, ui-monospace, monospace);
      font-size: var(--text-sm, 13px);
    }

    .ok {
      color: var(--pass, currentColor);
    }

    .no {
      color: var(--fail, currentColor);
    }
  `;

  declare findings: Finding[];

  constructor() {
    super();
    this.findings = [];
  }

  render() {
    return this.findings.map(
      (finding) =>
        html`<span class=${finding.ok ? "ok" : "no"}>${finding.text}</span>`,
    );
  }
}

define("ig-verdict", Verdict);

declare global {
  interface HTMLElementTagNameMap {
    "ig-verdict": Verdict;
  }
}
