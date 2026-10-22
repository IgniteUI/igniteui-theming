/**
 * Caches provider output on disk so a rebuild does not recompile Sass that has not
 * changed. The key covers the provider's declared inputs *and* its own source: editing
 * the provider changes what it produces from identical inputs, which an mtime check on
 * `deps` alone would miss.
 */
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DataProvider } from "./provider.js";

const CACHE_DIR = fileURLToPath(
  new URL("../../node_modules/.cache/ig-preview/", import.meta.url),
);

const sassFilesUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sassFilesUnder(full);
      return entry.name.endsWith(".scss") ? [full] : [];
    })
    .sort();

const filesFor = (dep: string): string[] => {
  const target = dep.startsWith("file:") ? fileURLToPath(dep) : dep;
  return statSync(target).isDirectory() ? sassFilesUnder(target) : [target];
};

/** Hash of everything that can change a provider's output. */
export const fingerprint = (provider: DataProvider): string => {
  const hash = createHash("sha256");
  hash.update(provider.id);
  hash.update(readFileSync(fileURLToPath(provider.module)));

  for (const dep of provider.deps) {
    for (const file of filesFor(dep)) {
      hash.update(file);
      hash.update(readFileSync(file));
    }
  }

  return hash.digest("hex").slice(0, 16);
};

export interface ResolveOptions {
  /** Skip the cache entirely. Used by tests. */
  fresh?: boolean;
  /** Reports whether the value came from disk. Used by tests. */
  onHit?: (hit: boolean) => void;
  /** Where entries live. Tests point this at a temporary directory. */
  dir?: string;
}

export const resolve = async <T>(
  provider: DataProvider<T>,
  options: ResolveOptions = {},
): Promise<T> => {
  const dir = options.dir ?? CACHE_DIR;
  const file = path.join(dir, `${provider.id}.${fingerprint(provider)}.json`);

  if (!options.fresh) {
    try {
      const cached = JSON.parse(readFileSync(file, "utf8")) as T;
      options.onHit?.(true);
      return cached;
    } catch {
      // A miss, an unreadable entry and a corrupt one are all just "build it".
    }
  }

  options.onHit?.(false);
  const built = await provider.build();
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(built), "utf8");

  return built;
};
