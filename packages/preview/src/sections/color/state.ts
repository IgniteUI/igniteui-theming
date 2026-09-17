import type { ReactiveController, ReactiveControllerHost } from "lit";
import {
  isPresetKey,
  isTheme,
  type PresetKey,
  type Theme,
} from "../../variants.js";

/**
 * What every view in the color section reads. One store rather than one control per
 * view: the point of the section is that a single seed set flows through the shades, the
 * surface roles and the scale editor at once, and a reader should be able to see that by
 * moving one control.
 */
export interface ColorState {
  /** A palette the library ships, by name. */
  preset: PresetKey;
  /** Which variant of it — the two differ in more than their background. */
  theme: Theme;
  /**
   * The shade number every numbered strip measures against, or null.
   *
   * Section state rather than per-view: it is one key space, and a reader who pins 100 in
   * one place has asked the same question of every strip that has a 100. It stays out of
   * the hash — a palette is a selection worth linking to, an inspection is not.
   */
  pinned: string | null;
}

const FALLBACK: ColorState = {
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
    preset: isPresetKey(preset) ? preset : FALLBACK.preset,
    theme: isTheme(theme) ? theme : FALLBACK.theme,
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

let state = readColorState(location.hash);
const listeners = new Set<() => void>();

export const getColorState = (): ColorState => state;

export const setColorState = (patch: Partial<ColorState>) => {
  const next = { ...state, ...patch };

  if (
    next.preset === state.preset &&
    next.theme === state.theme &&
    next.pinned === state.pinned
  ) {
    return;
  }

  state = next;

  // `replaceState` rather than assigning the hash: the selection is not a navigation,
  // and a `hashchange` here would send the shell scrolling to the view in the path.
  history.replaceState(null, "", writeColorState(location.hash, next));

  for (const listener of listeners) listener();
};

/**
 * Re-renders its host whenever the selection changes. A controller rather than an event
 * on the shell so a view is independent of where it is mounted.
 */
export class ColorStateController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private readonly listener = () => this.host.requestUpdate();

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  get value(): ColorState {
    return state;
  }

  hostConnected() {
    listeners.add(this.listener);
  }

  hostDisconnected() {
    listeners.delete(this.listener);
  }
}
