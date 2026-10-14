import fs from "node:fs";
import path from "node:path";
import { sassSchemaPlugin } from "@igniteui-theming/plugins";
import { defineConfig } from "@terrazzo/cli";
import type { ConfigInit } from "@terrazzo/parser";

const TOKENS_DIR = "./tokens";
const TOKENS_PATTERN = /^components-.*\.json$/;

const tokenFiles = fs
  .readdirSync(TOKENS_DIR)
  .filter((file: string) => TOKENS_PATTERN.test(file))
  .map((file: string) => `./${path.join(TOKENS_DIR, file)}`);

const config: ConfigInit = defineConfig({
  tokens: tokenFiles,
  plugins: [
    sassSchemaPlugin({
      filePrefix: "_",
      stripRefSegments: 1,
      modes: ["light", "dark"],
      pretty: true,
    }),
  ],
  outDir: "./tokens/output/sass/schemas/components/",
  lint: {
    rules: {
      "core/valid-color": "off",
    },
  },
});

export default config;
