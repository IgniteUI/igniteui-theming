/** A view is a custom element. The shell supplies its frame from this metadata. */
export interface ViewDef {
  id: string;
  title: string;
  /** What a reader learns here, in one line. Rendered by the shell, not the view. */
  teaches: string;
  /** Custom element tag the loader defines. */
  tag: string;
  /** Imported as the view nears the viewport, so a section's code and data stay out of the initial load. */
  load: () => Promise<unknown>;
}

/**
 * A persistent element pinned above a section's views. Every view in the section reads
 * the same state it writes, which is what lets one control drive the whole page.
 */
export interface ControlsDef {
  tag: string;
  load: () => Promise<unknown>;
}

/** One pillar of the theming system. */
export interface SectionDef {
  id: string;
  title: string;
  blurb: string;
  /** Optional: a pillar whose views share no state does not need one. */
  controls?: ControlsDef;
  views: ViewDef[];
}
