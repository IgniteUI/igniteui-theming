// TOC scroll-spy (with the "last item active at the bottom" rule) and the collapsible mobile TOC.
const LINK_CLASS = 'it-toc__link';
const ACTIVE_CLASS = 'it-toc__link--active';
const MIN_LEVEL = 2;
const MAX_LEVEL = 2;

function visibleRect(element: Element): DOMRect {
  const rect = element.getBoundingClientRect();
  if (rect.top === rect.bottom && element.parentElement)
    return visibleRect(element.parentElement);
  return rect;
}

function anchors(): HTMLElement[] {
  const selectors: string[] = [];
  for (let i = MIN_LEVEL; i <= MAX_LEVEL; i += 1)
    selectors.push(`h${i}.it-anchor`);
  return Array.from(document.querySelectorAll<HTMLElement>(selectors.join()));
}

function activeAnchor(
  all: HTMLElement[],
  topOffset: number
): HTMLElement | null {
  const next = all.find((anchor) => visibleRect(anchor).top >= topOffset);
  if (next) {
    const rect = visibleRect(next);
    if (rect.top > 0 && rect.bottom < window.innerHeight / 2) return next;
    return all[all.indexOf(next) - 1] ?? null;
  }
  return all[all.length - 1] ?? null;
}

function setupScrollSpy(): void {
  const links = () =>
    Array.from(
      document.getElementsByClassName(LINK_CLASS)
    ) as HTMLAnchorElement[];
  if (links().length === 0) return;
  const navbarHeight = () =>
    document.querySelector<HTMLElement>('.it-navbar')?.clientHeight ?? 0;
  const anchorValue = (link: HTMLAnchorElement) =>
    decodeURIComponent(link.href.slice(link.href.indexOf('#') + 1));

  const update = () => {
    const all = links();
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 10;
    // Match by anchor id, not element identity: the mobile TOC lists the same links.
    const activeId = atBottom
      ? anchorValue(all[all.length - 1]!)
      : (activeAnchor(anchors(), navbarHeight())?.id ?? null);
    for (const link of all)
      link.classList.toggle(
        ACTIVE_CLASS,
        activeId !== null && anchorValue(link) === activeId
      );
  };
  document.addEventListener('scroll', update, { passive: true });
  // Registered on `document`, where resize never fires, on purpose: a full-page screenshot resize must not
  // re-run the spy.
  document.addEventListener('resize', update);
  update();
}

function setupMobileToc(): void {
  for (const toc of document.querySelectorAll<HTMLElement>(
    '.it-toc-mobile'
  )) {
    const button = toc.querySelector<HTMLButtonElement>(
      '.it-toc-mobile__button'
    );
    const content = toc.querySelector<HTMLElement>('.it-toc-mobile__content');
    if (!button || !content) continue;
    let collapsed = true;
    button.addEventListener('click', () => {
      collapsed = !collapsed;
      toc.classList.toggle('it-toc-mobile--expanded', !collapsed);
      button.classList.toggle('it-toc-mobile__button--expanded', !collapsed);
      button.setAttribute('aria-expanded', String(!collapsed));
      content.style.display = collapsed ? 'none' : 'block';
      content.style.overflow = collapsed ? 'hidden' : 'visible';
      content.style.height = collapsed ? '0px' : 'auto';
    });
  }
}

setupScrollSpy();
setupMobileToc();
