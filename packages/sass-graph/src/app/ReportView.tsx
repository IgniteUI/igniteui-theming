import { IgrCard, IgrCardContent, IgrCardHeader } from "igniteui-react";
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
    <div className="report ig-scrollbar">
      <div className="report__inner">
        <header className="report__header">
          <h2 className="page-title">Engine report</h2>
          <p className="muted">
            {t.files} files · {t.variables} variables · {t.mixins} mixins ·{" "}
            {t.functions} functions · {t.componentThemes} component themes. Same
            output as <code>npm run graph:report</code>.
          </p>
          <p className={report.consumers ? "muted" : "warn-text"}>
            {report.consumers
              ? `Library use counted from ${report.consumers.map((c) => `${c.name} (${c.files} Sass files)`).join(", ")}.`
              : "Library use is not counted: graph.json was built without the consumer repos, so the unused checks only see the engine."}
          </p>
        </header>

        <nav className="report__summary" aria-label="Checks">
          {report.checks.map((c) => (
            <a
              key={c.id}
              href={`#check-${c.id}`}
              className="summary-card"
              data-clean={c.findings.length === 0 || undefined}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(`check-${c.id}`)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="summary-card__count">{c.findings.length}</span>
              <span className="summary-card__title">{c.title}</span>
            </a>
          ))}
        </nav>

        {report.checks.map((c) => (
          <IgrCard key={c.id} id={`check-${c.id}`} className="check">
            <IgrCardHeader>
              <h3 slot="title" className="check__title">
                {c.title} ({c.findings.length})
              </h3>
              <p slot="subtitle" className="check__description">
                {c.description}
              </p>
            </IgrCardHeader>
            <IgrCardContent>
              {c.findings.length === 0 ? (
                <p className="ok-text">None.</p>
              ) : (
                <table className="findings">
                  <tbody>
                    {c.findings.map((f) => (
                      <tr key={`${f.subject}|${f.file}|${f.line}|${f.note}`}>
                        <td>
                          {f.id ? (
                            <button
                              type="button"
                              className="link link--strong mono"
                              onClick={() =>
                                navigate({ view: "symbol", id: f.id! })
                              }
                            >
                              {f.subject}
                            </button>
                          ) : (
                            <span className="mono">{f.subject}</span>
                          )}
                        </td>
                        <td>
                          <a
                            className="link mono muted"
                            href={sourceUrl(f.file, f.line)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {f.file}:{f.line}
                          </a>
                        </td>
                        <td className="findings__note">{f.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </IgrCardContent>
          </IgrCard>
        ))}
      </div>
    </div>
  );
}
