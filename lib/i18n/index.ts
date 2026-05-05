import type { TranslationDict } from './he';
import { i18n } from './i18nInstance';

export function t(key: string, options?: Record<string, string | number>): string {
  return i18n.t(key, options);
}

export { i18n } from './i18nInstance';
export type { TranslationDict };
