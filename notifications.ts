import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskReminder(task: Task): Promise<string | null> {
  if (!task.reminder) return null;

  const triggerDate = new Date(task.reminder);
  if (triggerDate <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Reminder: ${task.title}`,
        body: task.description || `Your task is due ${task.dueDate ? 'on ' + task.dueDate : 'soon'}.`,
        data: { taskId: task.id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          color: '#6C63FF',
          vibrationPattern: [0, 250, 250, 250],
        }),
      },
      trigger: {
        date: triggerDate,
      },
    });
    return id;
  } catch (e) {
    console.error('Failed to schedule notification', e);
    return null;
  }
}

export async function cancelTaskReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

export async function scheduleDailyDigest(time: string): Promise<string | null> {
  const [hours, minutes] = time.split(':').map(Number);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Your Daily Task Digest',
        body: 'Tap to review your tasks and get your AI-powered plan for today.',
        data: { type: 'daily_digest' },
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
    return id;
  } catch {
    return null;
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
