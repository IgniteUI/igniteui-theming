import { useEffect, useRef } from "react";
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

export const SHORTCUTS: [string, string][] = [
  ["/", "Find a symbol"],
  ["↑ ↓ Enter", "Pick a search result"],
  ["Esc", "Clear the search or close this guide"],
];

/** Task-first instructions: what to click for each question the tool answers. */
export function GuideContent({ onAction }: { onAction?: () => void }) {
  return (
    <div className="space-y-4 text-sm">
      <ol className="space-y-3">
        {TASKS.map((t, i) => (
          <li
            key={t.title}
            className="rounded-lg border border-slate-600 bg-slate-950/60 p-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-slate-100">
                <span className="mr-2 text-sky-400">{i + 1}.</span>
                {t.title}
              </h3>
              {t.go && (
                <button
                  type="button"
                  onClick={() => {
                    t.go?.();
                    onAction?.();
                  }}
                  className="shrink-0 text-xs text-sky-400 hover:text-sky-300 hover:underline"
                >
                  {t.action} →
                </button>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {t.steps}
            </p>
            {t.cli && (
              <p className="mt-1.5 text-xs text-slate-400">
                Terminal:{" "}
                <code className="rounded bg-slate-800 px-1 text-slate-200">
                  {t.cli}
                </code>
              </p>
            )}
          </li>
        ))}
      </ol>
      <div className="text-xs text-slate-400">
        <span className="font-semibold text-slate-300">
          Reading the graph:{" "}
        </span>
        arrows point from what is used to what uses it. Dashed arrows pass
        through hidden variables or files. Amber means relied on, red means
        affected.
      </div>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {SHORTCUTS.map(([key, what]) => (
          <div key={key} className="flex gap-1.5">
            <dt>
              <kbd className="rounded border border-slate-600 bg-slate-800 px-1 font-mono text-[11px] text-slate-200">
                {key}
              </kbd>
            </dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Modal dialog with the guide; closes on Esc, the backdrop or the close button. */
export function GuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      aria-labelledby="guide-title"
      className="m-auto w-[min(640px,92vw)] rounded-xl border border-slate-500 bg-slate-800 p-0 text-slate-100 shadow-2xl shadow-black/60 backdrop:bg-black/70"
    >
      <div className="max-h-[85vh] overflow-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="guide-title" className="text-base font-bold">
            How to use the engine explorer
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the guide"
            className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            ✕
          </button>
        </div>
        <GuideContent onAction={onClose} />
      </div>
    </dialog>
  );
}
