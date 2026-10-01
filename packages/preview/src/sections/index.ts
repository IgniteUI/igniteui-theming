import { color } from "./color/index.js";
import type { SectionDef } from "./types.js";

/**
 * Every pillar of the theming system, in display order. Adding one is a folder and an
 * entry here; the shell reads this and knows nothing else about them.
 */
export const SECTIONS: SectionDef[] = [color];

export const findSection = (id: string | undefined) =>
  SECTIONS.find((section) => section.id === id) ?? SECTIONS[0];

export const findView = (section: SectionDef, id: string | undefined) =>
  section.views.find((view) => view.id === id);
