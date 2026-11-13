const SEEN_KEY = "sass-graph:guide-seen";

/** Whether the first-visit card was dismissed; browser storage can be unavailable, so it falls back to "not seen". */
export function guideSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGuideSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage is blocked; the card shows again next time.
  }
}
