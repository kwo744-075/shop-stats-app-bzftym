
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface CheckInTime {
  hour: number;
  minute: number;
  label: string;
}

// Check-in notification times: 11:50am, 2:15pm, 4:50pm, 7:55pm
export const CHECK_IN_TIMES: CheckInTime[] = [
  { hour: 11, minute: 50, label: '12pm check-in' },
  { hour: 14, minute: 15, label: '2:30pm check-in' },
  { hour: 16, minute: 50, label: '5pm check-in' },
  { hour: 19, minute: 55, label: '8pm check-in' }
];

// Daily reset time: 12:01am
export const DAILY_RESET_TIME = {
  hour: 0,
  minute: 1,
  label: 'Daily Reset'
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // On Android, create notification channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('check-in-reminders', {
        name: 'Check-in Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('daily-reset', {
        name: 'Daily Reset',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 100],
        lightColor: '#3b82f6',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.log('Error requesting notification permissions:', error);
    return false;
  }
};

export const scheduleCheckInNotifications = async (): Promise<void> => {
  try {
    // Cancel any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Request permissions first
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      return;
    }

    // Schedule notifications for each check-in time
    for (const time of CHECK_IN_TIMES) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for check-ins! 📊',
          body: `Don't forget your ${time.label} - submit your check-in now.`,
          sound: 'default',
          data: {
            type: 'check-in-reminder',
            checkInTime: time.label,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: time.hour,
          minute: time.minute,
          repeats: true,
          ...(Platform.OS === 'android' && { channelId: 'check-in-reminders' }),
        },
      });

      console.log(`Scheduled notification for ${time.label} at ${time.hour}:${time.minute.toString().padStart(2, '0')} - ID: ${notificationId}`);
    }

    // Schedule daily reset notification (silent, for app functionality)
    const resetNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Reset Complete 🔄',
        body: 'All data has been reset for the new day. Ready for fresh check-ins!',
        sound: 'default',
        data: {
          type: 'daily-reset',
          action: 'reset-complete',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: DAILY_RESET_TIME.hour,
        minute: DAILY_RESET_TIME.minute,
        repeats: true,
        ...(Platform.OS === 'android' && { channelId: 'daily-reset' }),
      },
    });

    console.log(`Scheduled daily reset notification at ${DAILY_RESET_TIME.hour}:${DAILY_RESET_TIME.minute.toString().padStart(2, '0')} - ID: ${resetNotificationId}`);

    console.log('All notifications scheduled successfully');
  } catch (error) {
    console.log('Error scheduling notifications:', error);
  }
};

export const cancelAllCheckInNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.log('Error cancelling notifications:', error);
  }
};

export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled notifications:', notifications);
    return notifications;
  } catch (error) {
    console.log('Error getting scheduled notifications:', error);
    return [];
  }
};

// Function to handle notification responses (when user taps notification)
export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
  const data = response.notification.request.content.data;
  
  if (data?.type === 'check-in-reminder') {
    console.log('User tapped check-in reminder notification');
    // Could navigate to check-in screen here if needed
  } else if (data?.type === 'daily-reset') {
    console.log('Daily reset notification received');
    // App should handle the reset automatically
  }
};

// Set up notification response listener
export const setupNotificationListeners = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  
  return () => {
    subscription.remove();
  };
};
