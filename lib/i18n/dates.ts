import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { getAppLocale } from './locale';

export function getDateFnsLocale() {
  return getAppLocale() === 'he' ? he : enUS;
}

/** Format a date using the current UI locale (Hebrew or English). */
export function formatLocalized(date: Date, pattern: string): string {
  return format(date, pattern, { locale: getDateFnsLocale() });
}

/** @deprecated Use formatLocalized */
export function formatHe(date: Date, pattern: string): string {
  return formatLocalized(date, pattern);
}
