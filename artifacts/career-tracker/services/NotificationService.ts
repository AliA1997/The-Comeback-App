import { Alert, Platform } from 'react-native';

/**
 * NotificationService — Local notification abstraction
 *
 * For a full native build, replace the Alert-based implementation with
 * expo-notifications for system-level alerts even when the app is backgrounded.
 *
 * Expo docs: https://docs.expo.dev/versions/latest/sdk/notifications/
 */

class NotificationServiceImpl {
  async initialize(): Promise<void> {
    // In production with expo-notifications:
    // const { status } = await Notifications.requestPermissionsAsync();
    // if (status !== 'granted') console.warn('[NotificationService] Permission not granted');
  }

  async scheduleTimerCompleteNotification(taskTitle: string): Promise<void> {
    // In production:
    // await Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: 'Timer Complete!',
    //     body: `Great work on: ${taskTitle}`,
    //     sound: true,
    //   },
    //   trigger: null, // fire immediately
    // });
  }

  showTimerCompleteAlert(taskTitle: string, onMarkComplete: () => void, onDismiss: () => void): void {
    if (Platform.OS === 'web') {
      onMarkComplete();
      return;
    }
    Alert.alert(
      'Time is up!',
      `You finished: "${taskTitle}"`,
      [
        {
          text: 'Mark Complete',
          onPress: onMarkComplete,
          style: 'default',
        },
        {
          text: 'Keep Going',
          onPress: onDismiss,
          style: 'cancel',
        },
      ]
    );
  }
}

export const NotificationService = new NotificationServiceImpl();
