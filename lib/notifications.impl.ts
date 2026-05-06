import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Task } from './types';
import { upcomingOccurrenceDateStrings, projectTaskToOccurrence } from './recurrence';
import { t } from '@/lib/i18n';

const REMINDER_BATCH_SIZE = 48;
const YEARLY_HORIZON_DAYS = 400;
export const ANDROID_CHANNEL_ID = 'task-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function taskIdFromScheduledContent(data: Record<string, unknown> | undefined): string | undefined {
  if (!data || typeof data.taskId !== 'string') return undefined;
  return data.taskId;
}

/** Cancel every scheduled local notification created for this task id. */
export async function cancelScheduledNotificationsForTask(taskId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const req of scheduled) {
    const tid = taskIdFromScheduledContent(req.content.data as Record<string, unknown> | undefined);
    if (tid === taskId) {
      await Notifications.cancelScheduledNotificationAsync(req.identifier);
    }
  }
}

/** Cancel notifications for all given task ids (subset of user tasks). */
async function cancelScheduledNotificationsForTaskIds(taskIds: Set<string>): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const req of scheduled) {
    const tid = taskIdFromScheduledContent(req.content.data as Record<string, unknown> | undefined);
    if (tid && taskIds.has(tid)) {
      await Notifications.cancelScheduledNotificationAsync(req.identifier);
    }
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A6FE3',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Schedule reminders for one task; caller must have cancelled old ids first. */
async function scheduleFreshNotificationsForTask(task: Task): Promise<string | null> {
  if (task.notify_before_minutes === 0) return null;

  const now = new Date();
  const horizonDays = task.repeat === 'yearly' ? YEARLY_HORIZON_DAYS : 366;
  const dateStrings = upcomingOccurrenceDateStrings(task, now, REMINDER_BATCH_SIZE, horizonDays);
  let firstId: string | null = null;

  const notifTitle =
    task.kind === 'birthday' ? `\uD83C\uDF82 ${task.title}` : task.title;

  const mins = task.notify_before_minutes;
  const body =
    mins === 1440
      ? t('notifications.reminderBodyDay')
      : t('notifications.reminderBodyMinutes', { count: String(mins) });

  for (const ds of dateStrings) {
    const projected = projectTaskToOccurrence(task, ds);
    const triggerDate = new Date(projected.start_at);
    triggerDate.setMinutes(triggerDate.getMinutes() - task.notify_before_minutes);

    if (triggerDate <= now) continue;

    const content = {
      title: notifTitle,
      body,
      data: { taskId: task.id, kind: task.kind },
      color: task.color,
      channelId: ANDROID_CHANNEL_ID,
    } as Notifications.NotificationContentInput;

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    if (firstId === null) firstId = id;
  }

  return firstId;
}

/** Cancel old triggers for this task then schedule from current task state. */
export async function scheduleTaskNotificationsAfterSave(task: Task): Promise<string | null> {
  await cancelScheduledNotificationsForTask(task.id);
  return scheduleFreshNotificationsForTask(task);
}

/** Full resync: cancel scheduled reminders for these task ids, then reschedule when `remindersEnabled`. */
export async function rescheduleAllNotificationsForTasks(
  tasks: Task[],
  remindersEnabled: boolean
): Promise<void> {
  const ids = new Set(tasks.map((x) => x.id));
  await cancelScheduledNotificationsForTaskIds(ids);
  if (!remindersEnabled) return;
  for (const task of tasks) {
    await scheduleFreshNotificationsForTask(task);
  }
}

export async function cancelTaskNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
