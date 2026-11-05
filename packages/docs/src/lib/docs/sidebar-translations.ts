// Japanese labels for the sidebar categories (`sidebar.DocsSidebar.category.<label>`), per version.
import type { Locale, Version } from './config';
import current from '../../../i18n/ja/docs/current.json';
import v24 from '../../../i18n/ja/docs/version-24.0.0.json';

export type SidebarTranslations = Record<string, { message: string }>;

export function sidebarTranslations(
  locale: Locale,
  version: Version
): SidebarTranslations | undefined {
  if (locale !== 'ja') return undefined;
  return (version === 'current' ? current : v24) as SidebarTranslations;
}
