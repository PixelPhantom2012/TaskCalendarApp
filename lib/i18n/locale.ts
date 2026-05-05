import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { DevSettings, I18nManager, Platform } from 'react-native';
import { LocaleConfig } from 'react-native-calendars';
import { i18n } from './i18nInstance';

const STORAGE_KEY = '@app_ui_locale';

export type AppLocale = 'he' | 'en';

let currentLocale: AppLocale = 'he';

export function getAppLocale(): AppLocale {
  return currentLocale;
}

function syncI18n(locale: AppLocale) {
  currentLocale = locale;
  i18n.locale = locale;
}

/** react-native-calendars / xdate: English strings live under default locale key `''`, not `en`. */
function applyCalendarDefault(locale: AppLocale) {
  LocaleConfig.defaultLocale = locale === 'he' ? 'he' : '';
}

function applyRtl(locale: AppLocale) {
  const rtl = locale === 'he';
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
}

function resolveInitialLocale(stored: string | null): AppLocale {
  if (stored === 'en' || stored === 'he') return stored;
  const loc = Localization.getLocales()[0];
  const code = loc?.languageCode?.toLowerCase() ?? '';
  const tag = loc?.languageTag?.toLowerCase() ?? '';
  if (code === 'he' || code === 'iw' || tag.startsWith('he')) return 'he';
  if (code === 'en' || tag.startsWith('en')) return 'en';
  return 'en';
}

async function reloadApp() {
  if (Platform.OS === 'web') {
    globalThis.location?.reload?.();
    return;
  }
  try {
    const Updates = await import('expo-updates');
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload();
  }
}

/**
 * Call once before rendering the app (e.g. root layout). Sets i18n, RTL, calendar language.
 * On first launch (no stored preference), resolves from device locale and persists the result.
 */
export async function initAppLocale(): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const locale = resolveInitialLocale(stored);
  syncI18n(locale);
  applyCalendarDefault(locale);
  applyRtl(locale);
  if (stored == null) {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
  }
}

/**
 * Persist UI language. Reloads the app so RTL and native layout stay consistent.
 */
export async function setAppLocale(locale: AppLocale): Promise<void> {
  if (locale === currentLocale) return;
  await AsyncStorage.setItem(STORAGE_KEY, locale);
  syncI18n(locale);
  applyCalendarDefault(locale);
  applyRtl(locale);
  await reloadApp();
}
