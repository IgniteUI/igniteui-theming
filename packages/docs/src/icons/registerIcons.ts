import { registerIconFromText } from 'igniteui-webcomponents';

// The icon SVGs are inlined at build time (Vite `?raw`), so every page registers them synchronously while
// the web components are defined — no runtime fetch, and no icons popping in after the first paint.
const ICON_FILES = import.meta.glob('../../public/svg/icons/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** `../../public/svg/icons/arrows/left_arrow.svg` → `left_arrow` */
const iconName = (file: string) =>
  file.slice(file.lastIndexOf('/') + 1).replace(/\.svg$/, '');

export function registerIcons(): void {
  for (const [file, svg] of Object.entries(ICON_FILES)) {
    registerIconFromText(iconName(file), svg);
  }
}
