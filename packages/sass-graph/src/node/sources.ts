import { execFileSync } from "node:child_process";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSources } from "../parser/load.js";

/** `packages/theming/sass` of this checkout. */
export const SASS_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../theming/sass",
);

// Runs from the repository root, so paths in and out are repository-relative.
const git = (args: string[], input?: string) =>
  execFileSync("git", args, {
    cwd: repoRoot(),
    input,
    maxBuffer: 256 * 1024 * 1024,
  });

let top: string | undefined;
function repoRoot(): string {
  top ??= execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: SASS_ROOT,
  })
    .toString()
    .trim();
  return top;
}

/** Path of the Sass root relative to the repository root, with forward slashes. */
export function sassRootInRepo(): string {
  return relative(repoRoot(), SASS_ROOT).split(sep).join("/");
}

/** Resolves `ref` to a commit, with an error that names the ref. */
export function resolveCommit(ref: string): string {
  try {
    return git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`])
      .toString()
      .trim();
  } catch {
    throw new Error(
      `"${ref}" is not a commit in this repository. Fetch it first (git fetch origin master) or pass another --base.`,
    );
  }
}

/** Every `.scss` file under the Sass root as it is in commit `ref`. */
export function sourcesAt(ref: string): Map<string, string> {
  const commit = resolveCommit(ref);
  const root = sassRootInRepo();
  const paths = git(["ls-tree", "-r", "-z", "--name-only", commit, "--", root])
    .toString()
    .split("\0")
    .filter((p) => p.endsWith(".scss"));
  const out = git(
    ["cat-file", "--batch"],
    paths.map((p) => `${commit}:${p}\n`).join(""),
  );

  // Output per object: "<oid> blob <size>\n<content>\n".
  const sources = new Map<string, string>();
  let offset = 0;
  for (const path of paths) {
    const headerEnd = out.indexOf(10, offset);
    const size = Number(
      out.subarray(offset, headerEnd).toString().split(" ")[2],
    );
    const start = headerEnd + 1;
    sources.set(
      path.slice(root.length + 1),
      out.subarray(start, start + size).toString("utf8"),
    );
    offset = start + size + 1;
  }
  return new Map([...sources].sort(([a], [b]) => a.localeCompare(b)));
}

/** Every `.scss` file under the Sass root in the working tree. */
export const workingSources = () => loadSources(SASS_ROOT);

export const SASS_PREFIX = () => `${sassRootInRepo()}/`;
