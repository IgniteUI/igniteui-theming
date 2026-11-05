// progressive enhancement for the statically rendered `<Tabs>` markup (see src/components/mdx/Tabs.astro).
// Click/Enter selects, arrow keys move focus, `groupId` syncs through localStorage (`it.tab.<groupId>`)
// across the page and other tabs, `queryString` updates the URL.

const STORAGE_PREFIX = 'it.tab.';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function select(
  container: HTMLElement,
  value: string,
  { persist = true } = {}
): void {
  const tabs = Array.from(
    container.querySelectorAll<HTMLElement>(
      ':scope > [role="tablist"] > [role="tab"]'
    )
  );
  if (!tabs.some((t) => t.dataset.value === value)) return;
  for (const tab of tabs) {
    const active = tab.dataset.value === value;
    tab.classList.toggle('it-tabs__item--active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  for (const panel of container.querySelectorAll<HTMLElement>(
    ':scope > div > [role="tabpanel"]'
  )) {
    // TabItem.astro marks panels with data-tab-value (the tabs themselves use data-value).
    panel.hidden = (panel.dataset.tabValue ?? panel.dataset.value) !== value;
  }
  if (!persist) return;
  const { groupId, queryString } = container.dataset;
  if (groupId) {
    writeStorage(STORAGE_PREFIX + groupId, value);
    window.dispatchEvent(
      new CustomEvent('it-tab-change', { detail: { groupId, value } })
    );
  }
  if (queryString) {
    const url = new URL(location.href);
    url.searchParams.set(queryString, value);
    history.replaceState(history.state, '', url);
  }
}

function initTabs(container: HTMLElement): void {
  const { groupId, queryString } = container.dataset;
  const fromQuery = queryString
    ? new URLSearchParams(location.search).get(queryString)
    : null;
  const fromStorage = groupId ? readStorage(STORAGE_PREFIX + groupId) : null;
  const initial = fromQuery ?? fromStorage;
  if (initial) select(container, initial, { persist: false });

  const tablist = container.querySelector<HTMLElement>(
    ':scope > [role="tablist"]'
  );
  tablist?.addEventListener('click', (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLElement>(
      '[role="tab"]'
    );
    if (tab?.dataset.value) select(container, tab.dataset.value);
  });
  tablist?.addEventListener('keydown', (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLElement>(
      '[role="tab"]'
    );
    if (!tab) return;
    const tabs = Array.from(
      tablist.querySelectorAll<HTMLElement>('[role="tab"]')
    );
    const index = tabs.indexOf(tab);
    let focus: HTMLElement | undefined;
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault(); // Space would scroll the page
        if (tab.dataset.value) select(container, tab.dataset.value);
        break;
      case 'ArrowRight':
        focus = tabs[index + 1] ?? tabs[0];
        break;
      case 'ArrowLeft':
        focus = tabs[index - 1] ?? tabs[tabs.length - 1];
        break;
      case 'Home':
        event.preventDefault();
        focus = tabs[0];
        break;
      case 'End':
        event.preventDefault();
        focus = tabs[tabs.length - 1];
        break;
    }
    focus?.focus();
  });

  if (groupId) {
    const sync = (value: string | null) =>
      value && select(container, value, { persist: false });
    window.addEventListener('it-tab-change', (e) => {
      const detail = (e as CustomEvent<{ groupId: string; value: string }>)
        .detail;
      if (detail.groupId === groupId) sync(detail.value);
    });
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_PREFIX + groupId) sync(e.newValue);
    });
  }
}

export function setupTabs(root: ParentNode = document): void {
  for (const container of root.querySelectorAll<HTMLElement>('[data-tabs]')) {
    if (container.dataset.tabsReady) continue;
    container.dataset.tabsReady = '';
    initTabs(container);
  }
}

setupTabs();
