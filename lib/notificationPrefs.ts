import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@app_notifications_enabled';

/** Default: reminders on (matches previous Settings UI default). */
export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, enabled ? '1' : '0');
}
