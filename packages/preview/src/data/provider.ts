/**
 * A dataset the preview derives from Sass at build time.
 *
 * Every pillar of the theming system needs something compiled — palettes, type scales,
 * shadow maps — and each one declares it the same way so no section has to invent its
 * own build step.
 */
export interface DataProvider<T = unknown> {
  /** Unique, dot-separated: `color.sweep`. Also the `virtual:data/<id>` specifier. */
  id: string;
  /** `import.meta.url` of the declaring module, so editing it invalidates its cache. */
  module: string;
  /** Sass files or directories whose contents change the output. Directories are walked for `.scss`. */
  deps: string[];
  build(): Promise<T> | T;
}

export const defineProvider = <T>(provider: DataProvider<T>): DataProvider<T> =>
  provider;
