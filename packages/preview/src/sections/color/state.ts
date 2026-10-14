import type { ReactiveController, ReactiveControllerHost } from "lit";
import {
  isPresetKey,
  isTheme,
  type PresetKey,
  type Theme,
} from "../../variants.js";

/**
 * What the color views read. In the preview app one store serves the whole section: the
 * point there is that a single seed set flows through the shades, the surface roles and
 * the scale editor at once. An embed gets a store of its own, so a demo in an article does
 * not move because the reader changed one three sections earlier.
 */
export interface ColorState {
  /** A palette the library ships, by name. */
  preset: PresetKey;
  /** Which variant of it — the two differ in more than their background. */
  theme: Theme;
  /**
   * The shade number every numbered strip measures against, or null.
   *
   * Store state rather than per-view: it is one key space, and a reader who pins 100 in
   * one place has asked the same question of every strip that has a 100. It stays out of
   * the hash — a palette is a selection worth linking to, an inspection is not.
   */
  pinned: string | null;
}

export const DEFAULT_COLOR_STATE: ColorState = {
  preset: "material",
  theme: "light",
  pinned: null,
};

/** The selection lives in the hash, so a link carries it and a reload keeps it. */
export const readColorState = (hash: string): ColorState => {
  const query = new URLSearchParams(hash.split("?")[1] ?? "");
  const preset = query.get("preset");
  const theme = query.get("theme");

  return {
    preset: isPresetKey(preset) ? preset : DEFAULT_COLOR_STATE.preset,
    theme: isTheme(theme) ? theme : DEFAULT_COLOR_STATE.theme,
    pinned: null,
  };
};

/** The hash with the selection written into its query, path untouched. */
export const writeColorState = (hash: string, state: ColorState) => {
  const [path, query = ""] = hash.split("?");
  const params = new URLSearchParams(query);

  params.set("preset", state.preset);
  params.set("theme", state.theme);

  return `${path || "#/color"}?${params}`;
};

/** A selection and the hosts watching it. */
export class ColorStore {
  private state: ColorState;
  private readonly listeners = new Set<() => void>();

  /** `onChange` runs after every real change, before the hosts are told. */
  constructor(
    initial: Partial<ColorState> = {},
    private readonly onChange?: (state: ColorState) => void,
  ) {
    this.state = { ...DEFAULT_COLOR_STATE, ...initial };
  }

  get value(): ColorState {
    return this.state;
  }

  set(patch: Partial<ColorState>) {
    const next = { ...this.state, ...patch };

    if (
      next.preset === this.state.preset &&
      next.theme === this.state.theme &&
      next.pinned === this.state.pinned
    ) {
      return;
    }

    this.state = next;
    this.onChange?.(next);
    for (const listener of this.listeners) listener();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

let page: ColorStore | undefined;

/**
 * The preview app's store, mirrored into the hash. Created on first use rather than at
 * import, so an embed — which always brings its own store — never reads or writes the
 * address bar of the page it sits on.
 */
export const pageColorStore = (): ColorStore => {
  page ??= new ColorStore(readColorState(location.hash), (next) =>
    // `replaceState` rather than assigning the hash: the selection is not a navigation,
    // and a `hashchange` here would send the shell scrolling to the view in the path.
    history.replaceState(null, "", writeColorState(location.hash, next)),
  );

  return page;
};

/** A host that may be handed a store. Without one it reads the page's. */
export interface ColorStoreHost extends ReactiveControllerHost {
  store?: ColorStore;
}

/**
 * Re-renders its host whenever the selection changes. A controller rather than an event
 * on the shell so a view is independent of where it is mounted.
 */
export class ColorStateController implements ReactiveController {
  private readonly host: ColorStoreHost;
  private readonly listener = () => this.host.requestUpdate();
  private bound?: ColorStore;
  private release?: () => void;

  constructor(host: ColorStoreHost) {
    this.host = host;
    host.addController(this);
  }

  get store(): ColorStore {
    return this.host.store ?? pageColorStore();
  }

  get value(): ColorState {
    return this.store.value;
  }

  set(patch: Partial<ColorState>) {
    this.store.set(patch);
  }

  private bind() {
    const store = this.store;
    if (store === this.bound) return;

    this.release?.();
    this.bound = store;
    this.release = store.subscribe(this.listener);
  }

  hostConnected() {
    this.bind();
  }

  /** A store handed over after connection takes effect on the next render. */
  hostUpdate() {
    if (this.bound) this.bind();
  }

  hostDisconnected() {
    this.release?.();
    this.release = undefined;
    this.bound = undefined;
  }
}
