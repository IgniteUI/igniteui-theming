import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Read every `.scss` file under `root` into a `relative path → source` map. */
export function loadSources(root: string): Map<string, string> {
  const sources = new Map<string, string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".scss")) {
        sources.set(
          relative(root, full).split(sep).join("/"),
          readFileSync(full, "utf8"),
        );
      }
    }
  };
  walk(root);
  return new Map([...sources].sort(([a], [b]) => a.localeCompare(b)));
}
