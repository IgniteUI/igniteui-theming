// navbar behaviour — desktop dropdown keyboard toggle and click-outside (CSS handles hover),
// and the mobile sidebar (opened by tapping the breadcrumbs, closed by the backdrop or a link), with the
// body scroll lock.
const DESKTOP_BREAKPOINT = 996;

function setupDropdowns(): void {
  for (const dropdown of document.querySelectorAll<HTMLElement>(
    '.it-navbar__entry.it-dropdown'
  )) {
    const trigger = dropdown.querySelector<HTMLElement>(
      ':scope > .it-navbar__link'
    );
    // Click-to-open; the trigger link then never navigates.
    if (dropdown.hasAttribute('data-click-dropdown')) {
      trigger?.addEventListener('click', (event) => {
        event.preventDefault();
        const shown = dropdown.classList.toggle('it-dropdown--show');
        trigger.setAttribute('aria-expanded', String(shown));
      });
    }
    const setShown = (shown: boolean) => {
      dropdown.classList.toggle('it-dropdown--show', shown);
      trigger?.setAttribute('aria-expanded', String(shown));
    };
    const isShown = () => dropdown.classList.contains('it-dropdown--show');
    trigger?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setShown(!isShown());
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setShown(true);
        dropdown.querySelector<HTMLElement>('.it-dropdown__menu a')?.focus();
      }
    });
    // Escape anywhere inside closes the menu and returns focus to the trigger.
    dropdown.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isShown()) {
        event.preventDefault();
        setShown(false);
        trigger?.focus();
      }
    });
  }
  const closeAll = (event: Event) => {
    for (const dropdown of document.querySelectorAll<HTMLElement>(
      '.it-navbar__entry.it-dropdown.it-dropdown--show'
    )) {
      if (!dropdown.contains(event.target as Node)) {
        dropdown.classList.remove('it-dropdown--show');
        dropdown
          .querySelector(':scope > .it-navbar__link')
          ?.setAttribute('aria-expanded', 'false');
      }
    }
  };
  document.addEventListener('mousedown', closeAll);
  document.addEventListener('touchstart', closeAll, { passive: true });
  document.addEventListener('focusin', closeAll);
}

function setupMobileSidebar(): void {
  const navbar = document.querySelector<HTMLElement>('.it-navbar');
  const sidebar = document.querySelector<HTMLElement>('.it-navbar-sidebar');
  if (!navbar || !sidebar) return;
  const isMobile = () => window.innerWidth <= DESKTOP_BREAKPOINT;
  let shown = false;

  const setShown = (value: boolean) => {
    shown = value;
    navbar.classList.toggle('it-navbar-sidebar--show', shown);
    document.body.style.overflow = shown ? 'hidden' : 'visible';
    for (const toggle of document.querySelectorAll(
      '[aria-controls="it-navbar-sidebar"]'
    )) {
      toggle.setAttribute('aria-expanded', String(shown));
    }
  };
  const toggle = () => setShown(!shown);

  for (const opener of document.querySelectorAll<HTMLElement>(
    '[data-mobile-sidebar-toggle]'
  )) {
    // On mobile the whole breadcrumb row opens the sidebar; the home link inside it must not navigate then.
    opener.addEventListener('click', (event) => {
      if (!isMobile()) return;
      event.preventDefault();
      toggle();
    });
  }
  navbar
    .querySelector('.it-navbar-sidebar__backdrop')
    ?.addEventListener('click', () => setShown(false));
  sidebar
    .querySelector('.it-navbar-sidebar__close')
    ?.addEventListener('click', () => setShown(false));
  // Closing on link navigation mirrors the `onItemClick` handlers of the mobile menus.
  sidebar.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest('a[href]');
    if (link && !link.closest('.it-nav-menu__list-item-collapsible')) setShown(false);
  });
  window.addEventListener('resize', () => {
    if (!isMobile() && shown) setShown(false);
  });
  window.addEventListener('pageshow', () => {
    if (shown) setShown(false);
  });

  // Mobile dropdown items (version list) collapse like the docs sidebar categories.
  for (const item of sidebar.querySelectorAll<HTMLElement>(
    '[data-mobile-dropdown]'
  )) {
    const setCollapsed = (collapsed: boolean) => {
      item.classList.toggle('it-nav-menu__list-item--collapsed', collapsed);
      const list = item.querySelector<HTMLElement>(':scope > .it-nav-menu__list');
      if (list) list.hidden = collapsed;
      item
        .querySelector('.it-nav-menu__caret')
        ?.setAttribute('aria-expanded', String(!collapsed));
    };
    item
      .querySelector('.it-nav-menu__link--sublist')
      ?.addEventListener('click', (event) => {
        if (
          (event.currentTarget as HTMLAnchorElement).getAttribute('href') ===
          '#'
        )
          event.preventDefault();
        setCollapsed(!item.classList.contains('it-nav-menu__list-item--collapsed'));
      });
    item.querySelector('.it-nav-menu__caret')?.addEventListener('click', (event) => {
      event.preventDefault();
      setCollapsed(!item.classList.contains('it-nav-menu__list-item--collapsed'));
    });
  }
}

setupDropdowns();
setupMobileSidebar();
