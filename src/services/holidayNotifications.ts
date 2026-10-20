import { Platform } from 'react-native';
import { addDays, format, isAfter, setHours, setMilliseconds, setMinutes, setSeconds, startOfDay } from 'date-fns';

import { CONFIG_KEYS } from '@/types/config';
import { getConfig, getDiaryCalendarMarks } from '@/services/database';
import {
  buildDisplayHolidays,
  formatHolidayTodayBody,
  parseHolidaysStorage,
} from '@/utils/holidayCalculations';
import { buildDisplayEvents, parseEventsStorage } from '@/utils/eventCalculations';
import { isHolidayNotificationsAvailable } from '@/utils/nativeAvailability';
import { logger } from '@/utils/logger';

const EVENTS_CHANNEL_ID = 'holidays';
const LETTERS_CHANNEL_ID = 'letters';
const HOLIDAY_ID_PREFIX = 'holiday:';
const EVENT_ID_PREFIX = 'event:';
const LETTER_ID_PREFIX = 'letter:';
const ANDROID_IMPORTANCE_HIGH = 6;
const LETTER_REMINDER_DAYS = 8;
const EVENT_HOUR = 9;
const EVENT_MINUTE = 0;

const LETTER_REMINDERS = [
  {
    hour: 9,
    minute: 0,
    title: 'Письмо для него',
    body: 'Доброе утро. Напиши письмо — он будет ждать эти строки.',
  },
  {
    hour: 14,
    minute: 0,
    title: 'Ты ещё не написала',
    body: 'Сегодня письма ещё нет. Удели пару минут — это важно.',
  },
  {
    hour: 18,
    minute: 0,
    title: 'Вечернее письмо',
    body: 'День клонится к вечеру, а письма всё нет. Напиши ему.',
  },
  {
    hour: 21,
    minute: 0,
    title: 'Перед сном',
    body: 'Ложишься, а письмо так и не написано. Несколько строк — и день станет теплее.',
  },
] as const;

type AppNotificationsApi = {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  setNotificationChannelAsync: (
    channelId: string,
    channel: { name: string; importance: number; sound: string },
  ) => Promise<unknown>;
  getAllScheduledNotificationsAsync: () => Promise<Array<{ identifier: string }>>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  scheduleNotificationAsync: (request: {
    identifier: string;
    content: { title: string; body: string; sound: boolean };
    trigger: { date: Date; channelId: string };
  }) => Promise<string>;
};

let notificationsApi: AppNotificationsApi | null | undefined;

function loadAppNotifications(): AppNotificationsApi | null {
  if (notificationsApi !== undefined) {
    return notificationsApi;
  }

  if (!isHolidayNotificationsAvailable()) {
    notificationsApi = null;
    return null;
  }

  try {
    const handlerModule =
      require('expo-notifications/build/NotificationsHandler') as typeof import('expo-notifications/build/NotificationsHandler');
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

    if (typeof handlerModule?.setNotificationHandler !== 'function') {
      notificationsApi = null;
      return null;
    }

    handlerModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

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

async function ensureChannels(api: AppNotificationsApi) {
  if (Platform.OS !== 'android') {
    return;
  }

  await api.setNotificationChannelAsync(EVENTS_CHANNEL_ID, {
    name: 'События и праздники',
    importance: ANDROID_IMPORTANCE_HIGH,
    sound: 'default',
  });
  await api.setNotificationChannelAsync(LETTERS_CHANNEL_ID, {
    name: 'Письма',
    importance: ANDROID_IMPORTANCE_HIGH,
    sound: 'default',
  });
}

function atTime(date: Date, hour: number, minute: number): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(startOfDay(date), hour), minute), 0), 0);
}

function isAppNotificationId(identifier: string): boolean {
  return (
    identifier.startsWith(HOLIDAY_ID_PREFIX) ||
    identifier.startsWith(EVENT_ID_PREFIX) ||
    identifier.startsWith(LETTER_ID_PREFIX)
  );
}

export async function requestHolidayNotificationPermission(): Promise<boolean> {
  const api = loadAppNotifications();
  if (!api) {
    return false;
  }

  const current = await api.getPermissionsAsync();
  if (current.status === 'granted') {
    return true;
  }

  const requested = await api.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function rescheduleAppNotifications(): Promise<void> {
  try {
    const api = loadAppNotifications();
    if (!api) {
      return;
    }

    const granted = await requestHolidayNotificationPermission();
    if (!granted) {
      return;
    }

    await ensureChannels(api);

    const scheduled = await api.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((item) => isAppNotificationId(item.identifier))
        .map((item) => api.cancelScheduledNotificationAsync(item.identifier)),
    );

    const [holidaysRaw, eventsRaw, enlistmentRaw, demobilizationRaw, letterMarks] = await Promise.all([
      getConfig(CONFIG_KEYS.HOLIDAYS_DATA),
      getConfig(CONFIG_KEYS.EVENTS_DATA),
      getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
      getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
      getDiaryCalendarMarks().catch(() => ({ personal: [], letter: [] })),
    ]);

    const now = new Date();
    const serviceRange =
      enlistmentRaw && demobilizationRaw
        ? { start: new Date(enlistmentRaw), end: new Date(demobilizationRaw) }
        : null;

    const holidays = buildDisplayHolidays(
      parseHolidaysStorage(holidaysRaw),
      now,
      serviceRange,
    );

    for (const holiday of holidays) {
      const fireAt = atTime(holiday.date, EVENT_HOUR, EVENT_MINUTE);
      if (!isAfter(fireAt, now)) {
        continue;
      }

      const year = holiday.date.getFullYear();
      await api.scheduleNotificationAsync({
        identifier: `${HOLIDAY_ID_PREFIX}${holiday.id}:${year}`,
        content: {
          title: holiday.name,
          body: formatHolidayTodayBody(holiday.name, holiday.id),
          sound: true,
        },
        trigger: {
          date: fireAt,
          channelId: EVENTS_CHANNEL_ID,
        },
      });
    }

    if (enlistmentRaw && demobilizationRaw) {
      const events = buildDisplayEvents(
        new Date(enlistmentRaw),
        new Date(demobilizationRaw),
        parseEventsStorage(eventsRaw),
        now,
      );

      for (const event of events) {
        const fireAt = atTime(event.date, EVENT_HOUR, EVENT_MINUTE);
        if (!isAfter(fireAt, now)) {
          continue;
        }

        await api.scheduleNotificationAsync({
          identifier: `${EVENT_ID_PREFIX}${event.id}:${format(event.date, 'yyyy-MM-dd')}`,
          content: {
            title: event.name,
            body: `Сегодня ${event.name}`,
            sound: true,
          },
          trigger: {
            date: fireAt,
            channelId: EVENTS_CHANNEL_ID,
          },
        });
      }
    }

    const writtenLetterDates = new Set(letterMarks.letter);
    for (let offset = 0; offset < LETTER_REMINDER_DAYS; offset += 1) {
      const day = addDays(startOfDay(now), offset);
      const stamp = format(day, 'yyyy-MM-dd');
      if (writtenLetterDates.has(stamp)) {
        continue;
      }

      for (const reminder of LETTER_REMINDERS) {
        const fireAt = atTime(day, reminder.hour, reminder.minute);
        if (!isAfter(fireAt, now)) {
          continue;
        }

        await api.scheduleNotificationAsync({
          identifier: `${LETTER_ID_PREFIX}${stamp}:${reminder.hour}`,
          content: {
            title: reminder.title,
            body: reminder.body,
            sound: true,
          },
          trigger: {
            date: fireAt,
            channelId: LETTERS_CHANNEL_ID,
          },
        });
      }
    }
  } catch (error) {
    logger.error('Не удалось обновить уведомления', error);
  }
}

/** @deprecated используй rescheduleAppNotifications */
export const rescheduleHolidayNotifications = rescheduleAppNotifications;
