/**
 * Terrazzo plugin that transforms DTCG JSON tokens into Sass map files.
 *
 * Pipeline:
 *   tokens (flat Terrazzo dict)
 *     → group by component (first ID segment)
 *     → rebuild nested tree from remaining ID segments
 *     → transform each leaf to Sass mode leaf format
 *     → serialize tree to Sass map string
 *     → outputFile() per component
 */

import type { Plugin } from "@terrazzo/parser";
import { buildSassLeaf } from "./builder.js";
import { isSassModeLeaf } from "./guards.js";
import { serializeToSass } from "./serializer.js";
import type {
  DTCGLeafToken,
  SassModeLeaf,
  SassSchemaPluginConfig,
  SassTree,
} from "./types.js";

export type { SassSchemaPluginConfig };

const DEFAULT_CONFIG: Required<SassSchemaPluginConfig> = {
  filePrefix: "_",
  stripRefSegments: 1,
  modes: ["light", "dark"],
  pretty: false,
};

/**
 * Create a Terrazzo plugin that outputs Sass schema maps from DTCG tokens.
 */
export default function sassSchemaPlugin(
  config: SassSchemaPluginConfig = {},
): Plugin {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    name: "sass-schema-transformer",
    async build({ tokens, outputFile }) {
      // Step 1: Group tokens by component (first ID segment).
      // Token IDs are dot-separated paths like "badge.info.background".
      // We group by the first segment ("badge") and build a nested tree from all remaining segments.
      const groups = groupTokensByComponent(tokens);

      // Step 2: For each component group, transform leaves and serialize
      for (const [component, tokenEntries] of Object.entries(groups)) {
        const sassTree = buildSassTree(tokenEntries, cfg);

        const sassContent = serializeToSass(sassTree, component, cfg.pretty);
        const fileName = `${cfg.filePrefix}${component}.scss`;

        outputFile(fileName, sassContent);
      }
    },
  };
}

/**
 * A token entry with its remaining path segments and original value.
 */
interface TokenEntry {
  /** Remaining path segments after stripping the component prefix. */
  path: string[];
  /** The original DTCG leaf token value. */
  value: DTCGLeafToken;
}

/**
 * Group flat tokens by their component key (first ID segment).
 *
 * For a token ID like "badge.info.background":
 *   - component = "badge"
 *   - remaining path = ["info", "background"]
 *
 * For a token ID like "button.flat.background.idle":
 *   - component = "button"
 *   - remaining path = ["flat", "background", "idle"]
 */
function groupTokensByComponent(
  tokens: Record<string, { id: string; originalValue: unknown }>,
): Record<string, TokenEntry[]> {
  const groups: Record<string, TokenEntry[]> = {};

  for (const token of Object.values(tokens)) {
    const segments = token.id.split(".");

    if (segments.length < 2) {
      continue;
    }

    const [component, ...rest] = segments;

    if (!groups[component]) {
      groups[component] = [];
    }

    groups[component].push({
      path: rest,
      value: token.originalValue as DTCGLeafToken,
    });
  }

  return groups;
}

/**
 * Build a SassTree from a flat list of token entries.
 *
 * Each entry has a path (array of keys) and a DTCG leaf value.
 * We reconstruct the nested tree structure and transform each leaf.
 */
function buildSassTree(
  entries: TokenEntry[],
  config: Required<SassSchemaPluginConfig>,
): SassTree {
  const tree: SassTree = {};

  for (const entry of entries) {
    const sassLeaf = buildSassLeaf(entry.value, {
      stripRefSegments: config.stripRefSegments,
      modes: config.modes,
    });

    setNestedValue(tree, entry.path, sassLeaf);
  }

  return tree;
}

/**
 * Set a value at a nested path in an object tree.
 */
function setNestedValue(
  obj: SassTree,
  path: string[],
  value: SassModeLeaf,
): void {
  let current = obj;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];

    if (
      !current[key] ||
      typeof current[key] !== "object" ||
      isSassModeLeaf(current[key])
    ) {
      current[key] = {};
    }

    current = current[key] as SassTree;
  }

  const lastKey = path[path.length - 1];
  current[lastKey] = value;
}

export { buildSassLeaf, parseRef } from "./builder.js";
export { serializeToSass } from "./serializer.js";
export type {
  DTCGLeafToken,
  SassColorLeaf,
  SassDimensionLeaf,
  SassModeLeaf,
  SassTree,
} from "./types.js";
