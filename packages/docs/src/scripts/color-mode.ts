// colour-mode toggle buttons. The blocking script in BaseLayout applies the saved mode before
// first paint; this enables the buttons and keeps every toggle on the page in sync.
import {
  applyColorMode,
  COLOR_MODE_STORAGE_KEY,
  type ColorMode,
} from '../lib/theme/color-mode';
import { translate } from '../lib/i18n/Translate';

const LABELS: Record<ColorMode, { id: string; message: string }> = {
  light: {
    id: 'theme.colorToggle.ariaLabel.mode.light',
    message: 'light mode',
  },
  dark: { id: 'theme.colorToggle.ariaLabel.mode.dark', message: 'dark mode' },
};

function currentMode(): ColorMode {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark';
}

function updateButtons(): void {
  const mode = currentMode();
  const modeLabel = translate(LABELS[mode]);
  const ariaLabel = translate(
    {
      id: 'theme.colorToggle.ariaLabel',
      message: 'Switch between dark and light mode (currently {mode})',
    },
    { mode: modeLabel }
  );
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-color-mode-toggle]'
  )) {
    button.disabled = false;
    button.classList.remove('it-color-mode-toggle__button--disabled');
    button.title = modeLabel;
    button.setAttribute('aria-label', ariaLabel);
  }
}

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    '[data-color-mode-toggle]'
  );
  if (!button) return;
  // Two-state toggle.
  applyColorMode(currentMode() === 'dark' ? 'light' : 'dark');
});

new MutationObserver(updateButtons).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});
window.addEventListener('storage', (event) => {
  if (
    event.key === COLOR_MODE_STORAGE_KEY &&
    (event.newValue === 'light' || event.newValue === 'dark')
  ) {
    applyColorMode(event.newValue);
  }
});
updateButtons();
