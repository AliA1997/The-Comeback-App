/**
 * NotificationService — Local OS notification abstraction.
 *
 * For a full native build, swap the Alert-based implementation with
 * expo-notifications for system-level alerts even when the app is
 * backgrounded.
 *
 * Expo docs: https://docs.expo.dev/versions/latest/sdk/notifications/
 */
import { Alert, Platform } from 'react-native';

class NotificationServiceImpl {
  async initialize(): Promise<void> {
    // In a native build with expo-notifications:
    //   const { status } = await Notifications.requestPermissionsAsync();
    //   if (status !== 'granted') console.warn('[NotificationService] denied');
  }

  async scheduleTimerCompleteNotification(_taskTitle: string): Promise<void> {
    // expo-notifications.scheduleNotificationAsync(...) in a native build.
  }

  showTimerCompleteAlert(
    taskTitle: string,
    onMarkComplete: () => void,
    onDismiss: () => void
  ): void {
    if (Platform.OS === 'web') {
      onMarkComplete();
      return;
    }
    Alert.alert(
      'Time is up!',
      `You finished: "${taskTitle}"`,
      [
        { text: 'Mark Complete', onPress: onMarkComplete, style: 'default' },
        { text: 'Keep Going', onPress: onDismiss, style: 'cancel' },
      ]
    );
  }
}

export const NotificationService = new NotificationServiceImpl();
