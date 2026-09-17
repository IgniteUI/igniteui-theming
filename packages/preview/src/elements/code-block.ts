import { css, html, LitElement } from "lit";
import { define } from "../define.js";

type State = "idle" | "copied" | "selected";

/**
 * The Sass that reproduces what a demo is showing, with a control that copies it.
 *
 * Where the clipboard is unavailable — an insecure origin, a browser that refuses
 * without a gesture it recognises, a denied permission — the text is selected instead
 * and the control says which keys to press. A copy button that silently does nothing is
 * worse than one that admits it cannot.
 */
export class CodeBlock extends LitElement {
  static properties = {
    code: { type: String },
    label: { type: String },
    state: { state: true },
  };

  static styles = css`
    :host {
      display: block;
    }

    header {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
      margin-block-end: var(--space-2, 8px);
    }

    .label {
      font-family: var(--mono, ui-monospace, monospace);
      font-size: var(--text-xs, 11px);
      font-weight: 500;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: var(--muted, currentColor);
    }

    button {
      margin-inline-start: auto;
      font-family: var(--mono, ui-monospace, monospace);
      font-size: var(--text-xs, 11px);
      font-weight: 500;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: inherit;
      background: transparent;
      border: 1px solid var(--line, currentColor);
      border-radius: var(--radius-sm, 3px);
      padding: 5px 11px;
      cursor: pointer;
    }

    button:hover {
      border-color: var(--muted, currentColor);
    }

    button:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    pre {
      margin: 0;
      padding: var(--space-4, 16px);
      background: var(--line-soft, rgb(0 0 0 / 5%));
      border-radius: var(--radius-sm, 3px);
      overflow-x: auto;
      font-family: var(--mono, ui-monospace, monospace);
      font-size: var(--text-sm, 12px);
      line-height: 1.65;
    }
  `;

  declare code: string;
  declare label: string;
  declare state: State;

  constructor() {
    super();
    this.code = "";
    this.label = "What to paste";
    this.state = "idle";
  }

  private get shortcut() {
    return navigator.platform?.startsWith("Mac") ? "⌘C" : "Ctrl+C";
  }

  private select() {
    const pre = this.renderRoot.querySelector("pre");
    const selection = getSelection();

    if (!pre || !selection) return;

    const range = document.createRange();
    range.selectNodeContents(pre);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private async copy() {
    try {
      await navigator.clipboard.writeText(this.code);
      this.state = "copied";
    } catch {
      this.select();
      this.state = "selected";
    }

    setTimeout(() => {
      this.state = "idle";
    }, 2000);
  }

  private get action() {
    if (this.state === "copied") return "Copied";
    if (this.state === "selected") return `Press ${this.shortcut}`;
    return "Copy";
  }

  render() {
    return html`
      <header>
        <span class="label">${this.label}</span>
        <button type="button" @click=${this.copy}>${this.action}</button>
      </header>
      <pre role="region" aria-label=${this.label}><code>${this.code}</code></pre>
    `;
  }
}

define("ig-code-block", CodeBlock);

declare global {
  interface HTMLElementTagNameMap {
    "ig-code-block": CodeBlock;
  }
}
