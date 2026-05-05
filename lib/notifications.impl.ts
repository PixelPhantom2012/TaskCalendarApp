import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Task } from './types';
import { upcomingOccurrenceDateStrings, projectTaskToOccurrence } from './recurrence';

const REMINDER_BATCH_SIZE = 48;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
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

export async function scheduleTaskNotification(task: Task): Promise<string | null> {
  if (task.notify_before_minutes === 0) return null;

  const now = new Date();
  const dateStrings = upcomingOccurrenceDateStrings(task, now, REMINDER_BATCH_SIZE);
  let firstId: string | null = null;

  for (const ds of dateStrings) {
    const projected = projectTaskToOccurrence(task, ds);
    const triggerDate = new Date(projected.start_at);
    triggerDate.setMinutes(triggerDate.getMinutes() - task.notify_before_minutes);

    if (triggerDate <= now) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title,
        body: `Starts in ${task.notify_before_minutes} minute${task.notify_before_minutes !== 1 ? 's' : ''}`,
        data: { taskId: task.id },
        color: task.color,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    if (firstId === null) {
      firstId = id;
    }
  }

  return firstId;
}

export async function cancelTaskNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
