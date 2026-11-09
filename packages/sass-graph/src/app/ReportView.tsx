import { useMemo } from "react";
import { buildReport } from "../analysis/report.js";
import { navigate, useStore } from "./store.js";
import { sourceUrl } from "./theme.js";

/** The health report: one section per check, every finding linked to its symbol and source. */
export function ReportView() {
  const model = useStore((s) => s.model);
  const report = useMemo(() => (model ? buildReport(model) : null), [model]);
  if (!report) return null;
  const t = report.totals;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h2 className="text-lg font-bold text-slate-100">Engine report</h2>
          <p className="text-xs text-slate-400">
            {t.files} files · {t.variables} variables · {t.mixins} mixins ·{" "}
            {t.functions} functions · {t.componentThemes} component themes. Same
            output as <code>npm run graph:report</code>.
          </p>
          <p
            className={`mt-1 text-xs ${report.consumers ? "text-slate-400" : "text-amber-300"}`}
          >
            {report.consumers
              ? `Library use counted from ${report.consumers.map((c) => `${c.name} (${c.files} Sass files)`).join(", ")}.`
              : "Library use is not counted: graph.json was built without the consumer repos, so the unused checks only see the engine."}
          </p>
        </header>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {report.checks.map((c) => (
            <a
              key={c.id}
              href={`#check-${c.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(`check-${c.id}`)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 p-3 hover:border-sky-500"
            >
              <div
                className={`text-xl font-bold ${c.findings.length ? "text-slate-100" : "text-emerald-400"}`}
              >
                {c.findings.length}
              </div>
              <div className="text-xs text-slate-300">{c.title}</div>
            </a>
          ))}
        </nav>

        {report.checks.map((c) => (
          <section
            key={c.id}
            id={`check-${c.id}`}
            className="rounded-lg border border-slate-700 bg-slate-900"
          >
            <div className="border-b border-slate-800 p-3">
              <h3 className="text-sm font-semibold text-slate-100">
                {c.title} ({c.findings.length})
              </h3>
              <p className="mt-1 text-xs text-slate-300">{c.description}</p>
            </div>
            {c.findings.length === 0 ? (
              <p className="p-3 text-xs text-emerald-400">None.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <tbody>
                  {c.findings.map((f) => (
                    <tr
                      key={`${f.subject}|${f.file}|${f.line}|${f.note}`}
                      className="border-t border-slate-800 align-top"
                    >
                      <td className="px-3 py-1.5">
                        {f.id ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate({ view: "symbol", id: f.id! })
                            }
                            className="font-mono font-semibold text-slate-100 hover:text-sky-300 hover:underline"
                          >
                            {f.subject}
                          </button>
                        ) : (
                          <span className="font-mono">{f.subject}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <a
                          href={sourceUrl(f.file, f.line)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-slate-400 hover:text-sky-300 hover:underline"
                        >
                          {f.file}:{f.line}
                        </a>
                      </td>
                      <td className="max-w-[70ch] px-3 py-1.5 text-slate-300">
                        {f.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
