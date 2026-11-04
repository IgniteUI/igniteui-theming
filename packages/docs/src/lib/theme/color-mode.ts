// the colour-mode and window-size hooks the React islands use.
import { useCallback, useEffect, useState } from 'react';

export type ColorMode = 'light' | 'dark';

export const COLOR_MODE_STORAGE_KEY = 'it-color-mode';
/** Fallback keys the choice may have been saved under (en and ja builds). */
export const FALLBACK_COLOR_MODE_STORAGE_KEYS = ['theme-6b8', 'theme-75e'];
export const DEFAULT_COLOR_MODE: ColorMode = 'dark';

function readColorMode(): ColorMode {
  if (typeof document === 'undefined') return DEFAULT_COLOR_MODE;
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark';
}

/** Applies a mode to `<html>` and persists it; the head bootstrap script does the same on load. */
export function applyColorMode(mode: ColorMode): void {
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.setAttribute('data-theme-choice', mode);
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable */
  }
}

/** `useColorMode()`: reads `html[data-theme]` through a MutationObserver; `setColorMode` persists to the same key. */
export function useColorMode() {
  // Start from the SSR default so hydration matches the server markup; the effect applies the real mode.
  const [colorMode, setState] = useState<ColorMode>(DEFAULT_COLOR_MODE);
  useEffect(() => {
    setState(readColorMode());
    const observer = new MutationObserver(() => setState(readColorMode()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  const setColorMode = useCallback(
    (mode: ColorMode | null) => applyColorMode(mode ?? DEFAULT_COLOR_MODE),
    []
  );
  return { colorMode, setColorMode, isDarkTheme: colorMode === 'dark' };
}

export type WindowSize = 'desktop' | 'mobile' | 'ssr';
const DESKTOP_BREAKPOINT = 996;


export const ThemeClassNames = {
  tabs: { container: 'it-tabs' },
} as const;
