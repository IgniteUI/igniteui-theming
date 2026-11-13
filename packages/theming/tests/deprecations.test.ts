import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass-embedded";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("deprecations", () => {
  it("compiles the e2e theme without a deprecation warning", async () => {
    const deprecations: string[] = [];

    await sass.compileAsync(path.join(__dirname, "e2e", "theme.scss"), {
      verbose: true,
      logger: {
        warn(message, { deprecation, deprecationType, span }) {
          if (deprecation) {
            deprecations.push(
              `[${deprecationType?.id}] ${span?.url?.pathname}:${span?.start.line} ${message}`,
            );
          }
        },
      },
    });

    expect(deprecations).toEqual([]);
  });
});
