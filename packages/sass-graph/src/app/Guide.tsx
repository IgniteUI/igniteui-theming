import {
  IgrButton,
  IgrCard,
  IgrCardActions,
  IgrCardContent,
  IgrCardHeader,
  IgrDialog,
} from "igniteui-react";
import { navigate } from "./store.js";

const TASKS: {
  title: string;
  steps: string;
  cli?: string;
  go?: () => void;
  action?: string;
}[] = [
  {
    title: "Learn how a part of the engine works",
    steps:
      "Click a system on the map, e.g. color or typography. Its mixins and functions are grouped by file, and the dashed boxes are helpers it borrows from other systems. Click any symbol for its outline: what it is built from, top to bottom.",
    cli: "npm run graph:flow -- function:palette",
    go: () => navigate({ view: "system", system: "color" }),
    action: "Open color",
  },
  {
    title: "Check a change before you make it",
    steps:
      'Find the symbol (press /), open it, and read "What breaks if I change this?" on the right. Mark it as changed to add it up with other changes, then open Impact for the graph.',
    cli: "npm run graph:impact",
  },
  {
    title: "Find what needs attention",
    steps:
      "Open Report: the most-used helpers, component themes that skip the shared path, unused and undocumented code. Every finding links to its symbol and source line.",
    cli: "npm run graph:report",
    go: () => navigate({ view: "report" }),
    action: "Open the report",
  },
];

const SHORTCUTS: [string, string][] = [
  ["/", "Find a symbol"],
  ["↑ ↓ Enter", "Pick a search result"],
  ["Esc", "Clear the search or close this guide"],
];

/** Task-first instructions: what to click for each question the tool answers. */
export function GuideContent({ onAction }: { onAction?: () => void }) {
  return (
    <div className="guide">
      <ol className="guide__tasks">
        {TASKS.map((t, i) => (
          <li key={t.title}>
            <IgrCard className="guide__task">
              <IgrCardHeader>
                <h3 slot="title" className="guide__title">
                  <span className="guide__step">{i + 1}.</span> {t.title}
                </h3>
              </IgrCardHeader>
              <IgrCardContent>
                <p>{t.steps}</p>
                {t.cli && (
                  <p className="muted">
                    Terminal: <code>{t.cli}</code>
                  </p>
                )}
              </IgrCardContent>
              {t.go && (
                <IgrCardActions>
                  <IgrButton
                    slot="start"
                    variant="flat"
                    onClick={() => {
                      t.go?.();
                      onAction?.();
                    }}
                  >
                    {t.action}
                  </IgrButton>
                </IgrCardActions>
              )}
            </IgrCard>
          </li>
        ))}
      </ol>
      <p className="muted">
        <strong>Reading the graph:</strong> arrows point from what is used to
        what uses it. Dashed arrows pass through hidden variables or files.
        Amber means relied on, red means affected.
      </p>
      <dl className="shortcuts">
        {SHORTCUTS.map(([key, what]) => (
          <div key={key}>
            <dt>
              <kbd>{key}</kbd>
            </dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Modal guide; closes on Esc, a click outside or the Close button. */
export function GuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <IgrDialog
      open={open}
      closeOnOutsideClick
      onClosed={onClose}
      className="guide-dialog"
    >
      <span slot="title">How to use the engine explorer</span>
      <GuideContent onAction={onClose} />
      <IgrButton slot="footer" variant="flat" onClick={onClose}>
        Close
      </IgrButton>
    </IgrDialog>
  );
}
