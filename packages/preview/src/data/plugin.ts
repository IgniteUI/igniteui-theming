import type { Plugin } from "vite";
import { resolve } from "./cache.js";
import "./color/index.js";
import { get } from "./registry.js";

const PREFIX = "virtual:data/";

/** Provider output that carries the Sass warnings its build raised. */
const warningsOf = (data: unknown): string[] =>
  typeof data === "object" && data !== null && "warnings" in data
    ? (data.warnings as string[])
    : [];

/** Serves each registered provider as `virtual:data/<id>`, built once and cached. */
export const dataProviders = (): Plugin => ({
  name: "preview-data-providers",
  resolveId(id) {
    return id.startsWith(PREFIX) ? `\0${id}` : null;
  },
  async load(id) {
    if (!id.startsWith(`\0${PREFIX}`)) return null;

    const providerId = id.slice(PREFIX.length + 1);
    const data = await resolve(get(providerId));

    // Reported here rather than at compile time, so a build served from cache says the
    // same thing as the build that produced it.
    for (const warning of warningsOf(data))
      this.warn(`${providerId}: ${warning}`);

    // `JSON.parse` of a string beats an object literal of the same size: the literal is
    // parsed as source, which for a few hundred kilobytes is the bulk of a tab switch.
    return `export default JSON.parse(${JSON.stringify(JSON.stringify(data))});`;
  },
});
