/**
 * expo-notifications loads push-token registration on Android, which Expo Go dropped in SDK 53+.
 * We lazy-load native notifications only outside that case so Expo Go stays clean.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { Task } from './types';
import { getNotificationsEnabled } from './notificationPrefs';

/** True when native notification module cannot be used (Expo Go / Android store client). */
export const isNotificationsDisabledInCurrentRuntime =
  Platform.OS === 'android' &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type Impl = typeof import('./notifications.impl');

let implPromise: Promise<Impl | null> | null = null;

async function loadImpl(): Promise<Impl | null> {
  if (isNotificationsDisabledInCurrentRuntime) {
    return null;
  }
  implPromise ??= import('./notifications.impl');
  return implPromise;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const mod = await loadImpl();
  if (!mod) return false;
  return mod.requestNotificationPermissions();
}

export async function scheduleTaskNotification(task: Task): Promise<string | null> {
  const mod = await loadImpl();
  if (!mod) return null;
  const enabled = await getNotificationsEnabled();
  if (!enabled) {
    await mod.cancelScheduledNotificationsForTask(task.id);
    return null;
  }
  return mod.scheduleTaskNotificationsAfterSave(task);
}

export async function cancelScheduledNotificationsForTask(taskId: string): Promise<void> {
  const mod = await loadImpl();
  if (!mod) return;
  await mod.cancelScheduledNotificationsForTask(taskId);
}

/** Reschedule all local reminders for the given tasks (respects persisted notification toggle). */
export async function rescheduleAllNotificationsForTasks(tasks: Task[]): Promise<void> {
  const mod = await loadImpl();
  if (!mod) return;
  const enabled = await getNotificationsEnabled();
  await mod.rescheduleAllNotificationsForTasks(tasks, enabled);
}

export async function cancelTaskNotification(notificationId: string): Promise<void> {
  const mod = await loadImpl();
  if (!mod) return;
  return mod.cancelTaskNotification(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  const mod = await loadImpl();
  if (!mod) return;
  return mod.cancelAllNotifications();
}
