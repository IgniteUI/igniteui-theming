// docs sidebar category collapse/expand with an auto-height animation. Expanded state for the current
// page is decided at build time in SidebarItem.astro.
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function autoHeightDuration(height: number): number {
  if (prefersReducedMotion()) return 1;
  const constant = height / 36;
  return Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10);
}

function applyCollapsedStyle(el: HTMLElement, collapsed: boolean): void {
  el.style.display = collapsed ? 'none' : 'block';
  el.style.overflow = collapsed ? 'hidden' : 'visible';
  el.style.height = collapsed ? '0px' : 'auto';
}

function animate(el: HTMLElement, collapsed: boolean): void {
  el.style.willChange = 'height';
  const transitionStyles = () => {
    const height = el.scrollHeight;
    el.style.transition = `height ${autoHeightDuration(height)}ms ease-in-out`;
    el.style.height = `${height}px`;
  };
  requestAnimationFrame(() => {
    if (collapsed) {
      transitionStyles();
      requestAnimationFrame(() => {
        el.style.height = '0px';
        el.style.overflow = 'hidden';
      });
    } else {
      el.style.display = 'block';
      requestAnimationFrame(transitionStyles);
    }
  });
}

function setupCategory(item: HTMLElement): void {
  const collapsible = item.querySelector<HTMLElement>(
    ':scope > .it-nav-menu__list-item-collapsible'
  );
  const list = item.querySelector<HTMLElement>(':scope > ul.it-nav-menu__list');
  const link = collapsible?.querySelector<HTMLAnchorElement>(
    '.it-nav-menu__link--sublist'
  );
  const caret = collapsible?.querySelector<HTMLButtonElement>('.it-nav-menu__caret');
  if (!collapsible || !list || !link) return;
  const hasHref =
    link.getAttribute('href') && link.getAttribute('href') !== '#';

  list.addEventListener('transitionend', (event) => {
    if (event.propertyName !== 'height') return;
    applyCollapsedStyle(
      list,
      item.classList.contains('it-nav-menu__list-item--collapsed')
    );
  });

  const setCollapsed = (collapsed: boolean) => {
    item.classList.toggle('it-nav-menu__list-item--collapsed', collapsed);
    item.classList.toggle('it-menu__list-item--collapsed', collapsed);
    caret?.setAttribute('aria-expanded', String(!collapsed));
    if (!hasHref) link.setAttribute('aria-expanded', String(!collapsed));
    for (const child of list.querySelectorAll<HTMLElement>('a.it-nav-menu__link'))
      child.tabIndex = collapsed ? -1 : 0;
    animate(list, collapsed);
  };
  const isCollapsed = () =>
    item.classList.contains('it-nav-menu__list-item--collapsed');
  const isCurrentPage = () =>
    collapsible.classList.contains('it-nav-menu__list-item-collapsible--active');

  // An unlinked label toggles. A linked label (conventional index doc, e.g. v24 "BEM",
  // whose page is reachable only through it) navigates and expands, and toggles only on its own page.
  link.addEventListener('click', (event) => {
    if (hasHref && !isCurrentPage()) {
      setCollapsed(false);
      return;
    }
    event.preventDefault();
    setCollapsed(!isCollapsed());
  });
  caret?.addEventListener('click', (event) => {
    event.preventDefault();
    setCollapsed(!isCollapsed());
  });
}

for (const item of document.querySelectorAll<HTMLElement>(
  '.it-sidebar-item--category'
)) {
  setupCategory(item);
}
