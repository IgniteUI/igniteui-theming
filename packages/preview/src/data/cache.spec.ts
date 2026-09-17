import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { fingerprint, resolve } from "./cache.js";
import type { DataProvider } from "./provider.js";
import { get, register, reset } from "./registry.js";

const dir = mkdtempSync(path.join(tmpdir(), "ig-preview-"));
const cacheDir = mkdtempSync(path.join(tmpdir(), "ig-preview-cache-"));
const dep = path.join(dir, "input.scss");
const self = path.join(dir, "provider.ts");

const provider = (id: string, value: string): DataProvider<string> => ({
  id,
  module: pathToFileURL(self).href,
  deps: [dep],
  build: () => value,
});

beforeEach(() => {
  reset();
  writeFileSync(dep, "$a: 1;");
  writeFileSync(self, "export const p = 1;");
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
  rmSync(cacheDir, { recursive: true, force: true });
});

describe("fingerprint", () => {
  it("is stable while inputs and provider source are unchanged", () => {
    expect(fingerprint(provider("t", "x"))).toBe(
      fingerprint(provider("t", "x")),
    );
  });

  it("changes when a declared dependency changes", () => {
    const before = fingerprint(provider("t", "x"));
    writeFileSync(dep, "$a: 2;");
    expect(fingerprint(provider("t", "x"))).not.toBe(before);
  });

  it("changes when the provider's own source changes", () => {
    const before = fingerprint(provider("t", "x"));
    writeFileSync(self, "export const p = 2;");
    expect(fingerprint(provider("t", "x"))).not.toBe(before);
  });
});

describe("resolve", () => {
  it("builds on a miss and reads from disk on the next call", async () => {
    const hits: boolean[] = [];
    const onHit = (hit: boolean) => hits.push(hit);

    await resolve(provider("hit", "first"), { dir: cacheDir, onHit });
    await resolve(provider("hit", "first"), { dir: cacheDir, onHit });

    expect(hits).toEqual([false, true]);
  });

  it("rebuilds when a dependency changed, even though the id is the same", async () => {
    await resolve(provider("dep", "first"), { dir: cacheDir });
    writeFileSync(dep, "$a: 3;");

    const hits: boolean[] = [];
    const value = await resolve(provider("dep", "second"), {
      dir: cacheDir,
      onHit: (hit) => hits.push(hit),
    });

    expect(hits).toEqual([false]);
    expect(value).toBe("second");
  });
});

describe("registry", () => {
  it("rejects two providers claiming the same id", () => {
    register(provider("clash", "a"));
    expect(() =>
      register({ ...provider("clash", "b"), module: "file:///elsewhere.ts" }),
    ).toThrow(/Duplicate data provider id "clash"/);
  });

  it("names the registered ids when one is missing", () => {
    register(provider("color.palettes", "a"));
    expect(() => get("color.nope")).toThrow(/Registered: color\.palettes/);
  });
});
