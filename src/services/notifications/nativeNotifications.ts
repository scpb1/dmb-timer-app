import { Platform } from 'react-native';

import { isHolidayNotificationsAvailable } from '@/utils/nativeAvailability';
import { logger } from '@/utils/logger';

const ANDROID_IMPORTANCE_HIGH = 6;

export const NOTIFICATION_CHANNELS = {
  holidays: { id: 'holidays', name: 'События и праздники' },
  letters: { id: 'letters', name: 'Письма' },
  parcels: { id: 'parcels', name: 'Посылки и передачки' },
} as const;

export type NotificationChannelKey = keyof typeof NOTIFICATION_CHANNELS;

export type NativeNotificationsApi = {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  setNotificationChannelAsync: (
    channelId: string,
    channel: { name: string; importance: number; sound: string },
  ) => Promise<unknown>;
  getAllScheduledNotificationsAsync: () => Promise<{ identifier: string }[]>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  scheduleNotificationAsync: (request: {
    identifier: string;
    content: { title: string; body: string; sound: boolean };
    trigger: { date: Date; channelId: string };
  }) => Promise<string>;
};

let notificationsApi: NativeNotificationsApi | null | undefined;
let handlerInstalled = false;

function installIncomingHandler(): void {
  if (handlerInstalled) {
    return;
  }
  const handlerModule =
    require('expo-notifications/build/NotificationsHandler') as typeof import('expo-notifications/build/NotificationsHandler');
  if (typeof handlerModule?.setNotificationHandler !== 'function') {
    return;
  }
  handlerModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerInstalled = true;
}

/** Один кэш нативного модуля. Обработчик входящих ставится здесь и только один раз. */
export function getNotificationsApi(): NativeNotificationsApi | null {
  if (notificationsApi !== undefined) {
    return notificationsApi;
  }

  if (!isHolidayNotificationsAvailable()) {
    notificationsApi = null;
    return null;
  }

  try {
    const permissions =
      require('expo-notifications/build/NotificationPermissions') as typeof import('expo-notifications/build/NotificationPermissions');
    const setNotificationChannelAsync = (
      require('expo-notifications/build/setNotificationChannelAsync') as typeof import('expo-notifications/build/setNotificationChannelAsync')
    ).default;
    const getAllScheduledNotificationsAsync = (
      require('expo-notifications/build/getAllScheduledNotificationsAsync') as typeof import('expo-notifications/build/getAllScheduledNotificationsAsync')
    ).default;
    const cancelScheduledNotificationAsync = (
      require('expo-notifications/build/cancelScheduledNotificationAsync') as typeof import('expo-notifications/build/cancelScheduledNotificationAsync')
    ).default;
    const scheduleNotificationAsync = (
      require('expo-notifications/build/scheduleNotificationAsync') as typeof import('expo-notifications/build/scheduleNotificationAsync')
    ).default;

    installIncomingHandler();
    if (!handlerInstalled) {
      notificationsApi = null;
      return null;
    }

    notificationsApi = {
      getPermissionsAsync: permissions.getPermissionsAsync,
      requestPermissionsAsync: permissions.requestPermissionsAsync,
      setNotificationChannelAsync,
      getAllScheduledNotificationsAsync,
      cancelScheduledNotificationAsync,
      scheduleNotificationAsync,
    };
    return notificationsApi;
  } catch (error) {
    logger.warn('Нативный модуль уведомлений недоступен', error);
    notificationsApi = null;
    return null;
  }
}

export async function ensureAndroidChannel(channel: NotificationChannelKey): Promise<void> {
  const api = getNotificationsApi();
  if (!api || Platform.OS !== 'android') {
    return;
  }

  const spec = NOTIFICATION_CHANNELS[channel];
  await api.setNotificationChannelAsync(spec.id, {
    name: spec.name,
    importance: ANDROID_IMPORTANCE_HIGH,
    sound: 'default',
  });
}

export {
  letterReminderRequests,
  dueNotificationRequests,
  replaceScheduledNotifications,
} from '@/services/notifications/notificationPlan';
export type {
  NotificationScheduleRequest,
  PlannedNotification,
} from '@/services/notifications/notificationPlan';
