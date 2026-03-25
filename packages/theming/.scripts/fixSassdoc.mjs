import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import report from "./report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rulesDir = path.resolve(__dirname, "../rules");

const MAX_ROUNDS = 500;

/**
 * Discover which rule IDs have a `fix` field by reading the YAML files.
 */
function getFixableRuleIds() {
  const fixable = new Set();

  for (const file of readdirSync(rulesDir)) {
    if (!file.endsWith(".yml") && !file.endsWith(".yaml")) continue;

    const content = readFileSync(path.join(rulesDir, file), "utf-8");
    let id = null;
    let hasFix = false;

    for (const line of content.split("\n")) {
      const idMatch = line.match(/^id:\s*(.+)/);
      if (idMatch) id = idMatch[1].trim();

      if (/^fix:/.test(line)) hasFix = true;
    }

    if (id && hasFix) fixable.add(id);
  }

  return fixable;
}

/**
 * Run ast-grep scan and return parsed JSON results.
 */
function scan() {
  try {
    const output = execSync("ast-grep scan --json", {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output);
  } catch (e) {
    // ast-grep may exit non-zero with --error flag, but we use --json here
    if (e.stdout) {
      try {
        return JSON.parse(e.stdout);
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Run ast-grep scan --update-all to apply fixes.
 * ast-grep may exit non-zero if non-fixable diagnostics remain after applying fixes.
 */
function applyFixes() {
  try {
    execSync("ast-grep scan --update-all", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "pipe",
    });
  } catch {
    // ast-grep exits with code 1 when error-level diagnostics remain
    // after applying fixes — this is expected and safe to ignore.
  }
}

// Main
const fixableIds = getFixableRuleIds();

if (fixableIds.size === 0) {
  report.warn("No rules with auto-fix found in rules/");
  process.exit(0);
}

report.info(
  `Fixing sassdoc violations...\nAuto-fixable rules: ${[...fixableIds].join(", ")}`,
);

let round = 0;

while (round < MAX_ROUNDS) {
  const results = scan();
  const fixable = results.filter((m) => fixableIds.has(m.ruleId));
  const manual = results.length - fixable.length;

  if (fixable.length === 0) {
    if (round === 0) {
      report.success(
        manual > 0
          ? `No auto-fixable violations found. ${manual} violation(s) remain (manual fix required).`
          : "No violations found.",
      );
    } else {
      report.success(
        manual > 0
          ? `Applied all auto-fixes in ${round} round(s). ${manual} violation(s) remain (manual fix required).`
          : `Applied all auto-fixes in ${round} round(s). No violations remain.`,
      );
    }
    process.exit(0);
  }

  round++;
  const counts = {};
  for (const m of fixable) {
    counts[m.ruleId] = (counts[m.ruleId] || 0) + 1;
  }
  const breakdown = Object.entries(counts)
    .map(([id, n]) => `${id}: ${n}`)
    .join(", ");

  process.stdout.write(
    `  Round ${round}: ${fixable.length} fixable (${breakdown}), ${manual} manual\n`,
  );

  applyFixes();
}

report.error(
  `Reached maximum of ${MAX_ROUNDS} rounds. Some fixable violations may remain.`,
);
process.exit(1);
