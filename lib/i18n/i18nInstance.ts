import { I18n } from 'i18n-js';
import { he } from './he';
import { en } from './en';

export const i18n = new I18n({ he, en });
i18n.defaultLocale = 'he';
i18n.locale = 'he';
i18n.enableFallback = true;
