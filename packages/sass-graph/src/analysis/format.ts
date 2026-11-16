import type { FlowNode, FlowOptions } from "./flow.js";
import type { Impact } from "./impact.js";
import type { Report } from "./report.js";
import { label } from "./systems.js";

export interface FormatOptions {
  /** Prefix for file paths, e.g. `packages/theming/sass/`. */
  pathPrefix?: string;
  /** Markdown only: URL prefix that turns locations into links (`…/blob/<sha>/packages/theming/sass/`). */
  linkBase?: string;
}

const firstSentence = (text?: string) =>
  text ? (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim() : "";

function location(
  file: string,
  line: number,
  opts: FormatOptions,
  md: boolean,
) {
  const text = `${opts.pathPrefix ?? ""}${file}:${line}`;
  if (!md) return text;
  return opts.linkBase
    ? `[\`${text}\`](${opts.linkBase}${file}#L${line})`
    : `\`${text}\``;
}

/** Indented tree, one symbol per line with its location and first doc sentence. */
export function formatFlow(
  tree: FlowNode,
  options: Pick<FlowOptions, "direction">,
  opts: FormatOptions = {},
): string {
  const lines: string[] = [];
  const verb =
    options.direction === "dependencies" ? "is built from" : "is used by";
  lines.push(
    `${label(tree.node)} ${verb}:  ${location(tree.node.file, tree.node.line, opts, false)}`,
  );
  if (tree.node.description)
    lines.push(`  ${firstSentence(tree.node.description)}`);
  lines.push("");

  const walk = (node: FlowNode, prefix: string) => {
    node.children.forEach((child, i) => {
      const last = i === node.children.length - 1;
      const branch = `${prefix}${last ? "└─ " : "├─ "}`;
      const marks = [
        child.indirect ? "via hidden variable" : "",
        child.repeated ? "expanded elsewhere" : "",
        child.cut ? `+${child.cut} more, raise --depth` : "",
      ].filter(Boolean);
      const doc = firstSentence(child.node.description);
      lines.push(
        `${branch}${label(child.node)}  ${location(child.node.file, child.node.line, opts, false)}${
          marks.length ? `  (${marks.join(", ")})` : ""
        }${doc ? `  ${doc}` : ""}`,
      );
      walk(child, `${prefix}${last ? "   " : "│  "}`);
    });
  };
  walk(tree, "");
  if (!tree.children.length) lines.push("(nothing)");
  return lines.join("\n");
}

/** Summary of an impact analysis, as Markdown (for PR comments) or plain text. */
export function formatImpact(
  impact: Impact,
  format: "markdown" | "text",
  opts: FormatOptions = {},
): string {
  const md = format === "markdown";
  const out: string[] = [];
  const h = (text: string) => out.push(md ? `### ${text}` : text, "");

  h("Sass impact");
  if (!impact.changes.length) {
    out.push(
      impact.commentOnly.length
        ? `No code changes. ${impact.commentOnly.length} file(s) changed only in comments.`
        : "No changes under the Sass root.",
    );
    return out.join("\n");
  }

  const files = new Set(impact.changes.map((c) => c.node.file));
  const strong = (s: string | number) => (md ? `**${s}**` : `${s}`);
  out.push(
    `${strong(impact.changes.length)} declaration(s) changed in ${files.size} file(s). They reach ${strong(impact.affected.size)} other symbols and ${strong(impact.components.length)} component themes.`,
    "",
  );

  if (md) {
    out.push("| Change | Symbol | Location |", "| --- | --- | --- |");
    for (const c of impact.changes) {
      out.push(
        `| ${c.kind} | \`${label(c.node)}\` | ${location(c.node.file, c.node.line, opts, true)} |`,
      );
    }
  } else {
    for (const c of impact.changes) {
      out.push(
        `  ${c.kind.padEnd(8)} ${label(c.node)}  ${location(c.node.file, c.node.line, opts, false)}`,
      );
    }
  }
  out.push("");

  if (impact.libraries.length) {
    out.push(
      `Libraries that call the changed or affected code: ${impact.libraries
        .map((l) => `${l.name} ${l.files} ${l.files === 1 ? "file" : "files"}`)
        .join(", ")}.`,
      "",
    );
    for (const l of impact.libraries) {
      if (!l.components.length) continue;
      out.push(
        `${l.name} components affected (${l.components.length}): ${l.components.join(", ")}.`,
        "",
      );
    }
  }
  if (impact.components.length) {
    const list = impact.components.join(", ");
    out.push(
      md
        ? `<details><summary>Component themes reached (${impact.components.length})</summary>\n\n${list}\n\n</details>`
        : `Component themes reached (${impact.components.length}): ${list}`,
      "",
    );
  }
  if (impact.systems.length) {
    const list = impact.systems.map((s) => `${s.system} ${s.count}`).join(", ");
    out.push(
      md
        ? `<details><summary>Other affected symbols by system</summary>\n\n${list}\n\n</details>`
        : `Other affected symbols by system: ${list}`,
      "",
    );
  }
  if (impact.commentOnly.length) {
    out.push(
      `Comment-only changes, ignored: ${impact.commentOnly.map((f) => `${opts.pathPrefix ?? ""}${f}`).join(", ")}`,
      "",
    );
  }
  return out.join("\n").trimEnd();
}

/** The health report, as Markdown or plain text. */
export function formatReport(
  report: Report,
  format: "markdown" | "text",
  opts: FormatOptions = {},
): string {
  const md = format === "markdown";
  const t = report.totals;
  const out: string[] = [];
  out.push(
    md ? "# Sass engine report" : "Sass engine report",
    "",
    `${t.files} files · ${t.variables} variables · ${t.mixins} mixins · ${t.functions} functions · ${t.componentThemes} component themes`,
    "",
    report.consumers
      ? `Libraries scanned: ${report.consumers.map((c) => `${c.name} (${c.files} Sass files)`).join(", ")}.`
      : "Libraries not scanned: the consumer repos were not found, so the unused checks only see the engine.",
    "",
  );
  if (md) {
    out.push("| Check | Findings |", "| --- | --- |");
    for (const c of report.checks)
      out.push(`| ${c.title} | ${c.findings.length} |`);
    out.push("");
  }

  for (const c of report.checks) {
    out.push(
      md
        ? `## ${c.title} (${c.findings.length})`
        : `${c.title} (${c.findings.length})`,
      "",
      c.description,
      "",
    );
    if (!c.findings.length) {
      out.push("None.", "");
      continue;
    }
    if (md) {
      out.push("| Symbol | Location | Note |", "| --- | --- | --- |");
      for (const f of c.findings) {
        out.push(
          `| \`${f.subject}\` | ${location(f.file, f.line, opts, true)} | ${f.note} |`,
        );
      }
    } else {
      for (const f of c.findings) {
        out.push(
          `  ${f.subject}  ${location(f.file, f.line, opts, false)}  ${f.note}`,
        );
      }
    }
    out.push("");
  }
  return out.join("\n").trimEnd();
}
