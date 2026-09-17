import data from "virtual:data/color.presets";
import { buildPreset, type PresetModel } from "../../preset-model.js";
import type { ColorState } from "./state.js";

/** Built once per preset and kept, so flipping back and forth is a lookup. */
const cache = new Map<string, PresetModel>();

export const modelFor = ({ preset, theme }: ColorState): PresetModel => {
  const id = `${preset}-${theme}`;
  const hit = cache.get(id);
  if (hit) return hit;

  const record =
    data.presets.find((p) => p.key === preset && p.theme === theme) ??
    data.presets[0];
  const built = buildPreset(record);
  cache.set(id, built);

  return built;
};
