import {
  dueNotificationRequests,
  letterReminderRequests,
} from '@/services/notifications/notificationPlan';

import { FEATURES } from '@/constants';
import { CONFIG_KEYS } from '@/types/config';
import { getConfig, getDiaryCalendarMarks, setConfig } from '@/services/database';
import { buildDisplayHolidays, parseHolidaysStorage } from '@/utils/holidayCalculations';
import { buildDisplayEvents, parseEventsStorage } from '@/utils/eventCalculations';
import {
  EVENT_NOTIFICATION_ID_PREFIX,
  HOLIDAY_NOTIFICATION_ID_PREFIX,
  groupEventNotifications,
  groupHolidayNotifications,
} from '@/utils/timerNotifications';
import { isTimerNotificationEnabled, loadTimerRecords } from '@/utils/timerRecords';
import { rescheduleParcelNotifications } from '@/utils/parcelNotifications';
import { logger } from '@/utils/logger';
import {
  ensureAndroidChannel,
  getNotificationsApi,
  NOTIFICATION_CHANNELS,
  type NativeNotificationsApi,
} from '@/services/notifications/nativeNotifications';
import { registerMemoryCacheReset } from '@/services/memoryCaches';

const EVENTS_CHANNEL_ID = NOTIFICATION_CHANNELS.holidays.id;
const LETTERS_CHANNEL_ID = NOTIFICATION_CHANNELS.letters.id;
const LETTER_ID_PREFIX = 'letter:';
const LETTER_REMINDER_DAYS = 8;
const EVENT_HOUR = 0;
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

async function ensureChannels(): Promise<void> {
  await ensureAndroidChannel('holidays');
  await ensureAndroidChannel('letters');
}

function isAppNotificationId(identifier: string): boolean {
  return (
    identifier.startsWith(HOLIDAY_NOTIFICATION_ID_PREFIX) ||
    identifier.startsWith(EVENT_NOTIFICATION_ID_PREFIX) ||
    identifier.startsWith(LETTER_ID_PREFIX)
  );
}

let notificationsEnabledCache: boolean | null = null;

/** Уже прочитанное значение, чтобы экран настроек не рисовал тумблер из «выкл». */
export function peekNotificationsEnabled(): boolean | null {
  return notificationsEnabledCache;
}

export async function readNotificationsEnabled(): Promise<boolean> {
  const value = await getConfig(CONFIG_KEYS.NOTIFICATIONS_ENABLED);
  const enabled = value === 'true';
  notificationsEnabledCache = enabled;
  return enabled;
}

export async function writeNotificationsEnabled(enabled: boolean): Promise<void> {
  notificationsEnabledCache = enabled;
  await setConfig(CONFIG_KEYS.NOTIFICATIONS_ENABLED, enabled ? 'true' : 'false');
}

export function clearNotificationsEnabledCache(): void {
  notificationsEnabledCache = null;
}

registerMemoryCacheReset(clearNotificationsEnabledCache);

async function cancelAppNotifications(api: NativeNotificationsApi): Promise<void> {
  const scheduled = await api.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => isAppNotificationId(item.identifier))
      .map((item) => api.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export type AppNotificationsPreferenceResult = 'granted' | 'denied' | 'unavailable';

/** Сохраняет выбор пользователя и перепланирует или снимает локальные пуши. */
export async function applyAppNotificationsPreference(
  enabled: boolean,
): Promise<AppNotificationsPreferenceResult> {
  await writeNotificationsEnabled(enabled);

  const api = getNotificationsApi();
  if (!api) {
    return 'unavailable';
  }

  if (!enabled) {
    await cancelAppNotifications(api);
    await rescheduleParcelNotifications();
    return 'granted';
  }

  await rescheduleAppNotifications();
  const current = await api.getPermissionsAsync();
  if (current.status !== 'granted') {
    await writeNotificationsEnabled(false);
    await rescheduleParcelNotifications();
    return 'denied';
  }
  await rescheduleParcelNotifications();
  return 'granted';
}

export async function requestHolidayNotificationPermission(): Promise<boolean> {
  const api = getNotificationsApi();
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

function warnRejectedSchedules(label: string, results: PromiseSettledResult<unknown>[]): void {
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  if (rejected.length === 0) {
    return;
  }
  logger.warn(`${label}: не поставлено ${rejected.length} из ${results.length}`, rejected[0]?.reason);
}

async function runRescheduleAppNotifications(token: number): Promise<void> {
  const stale = () => token !== rescheduleGeneration;
  try {
    const api = getNotificationsApi();
    if (!api || stale()) {
      return;
    }

    const enabled = await readNotificationsEnabled();
    if (stale()) {
      return;
    }
    await cancelAppNotifications(api);
    if (stale()) {
      return;
    }

    if (!enabled) {
      return;
    }

    const granted = await requestHolidayNotificationPermission();
    if (!granted) {
      return;
    }

    await ensureChannels();

    const [holidaysRaw, eventsRaw, timerRecords] = await Promise.all([
      getConfig(CONFIG_KEYS.HOLIDAYS_DATA),
      getConfig(CONFIG_KEYS.EVENTS_DATA),
      loadTimerRecords(),
    ]);

    const now = new Date();
    const holidaysStorage = parseHolidaysStorage(holidaysRaw);
    const eventsStorage = parseEventsStorage(eventsRaw);
    const enabledTimers = timerRecords.allTimers.filter((timer) =>
      isTimerNotificationEnabled(timer.id, timerRecords.storage.notificationDisabledIds),
    );

    const holidayNotifications = groupHolidayNotifications(
      enabledTimers.map((timer) => ({
        holidays: buildDisplayHolidays(holidaysStorage, now, {
          start: timer.startDate,
          end: timer.endDate,
        }),
      })),
    );

    const eventNotifications = groupEventNotifications(
      enabledTimers.map((timer) => ({
        timer: { id: timer.id, name: timer.name },
        events: buildDisplayEvents(timer.startDate, timer.endDate, eventsStorage, now),
      })),
    );

    const occurrenceRequests = dueNotificationRequests(
      [...holidayNotifications, ...eventNotifications],
      now,
      EVENTS_CHANNEL_ID,
      EVENT_HOUR,
      EVENT_MINUTE,
    );
    warnRejectedSchedules(
      'События и праздники',
      await Promise.allSettled(
        occurrenceRequests.map((request) => api.scheduleNotificationAsync(request)),
      ),
    );

    if (FEATURES.letterNotifications) {
      const letterMarks = await getDiaryCalendarMarks().catch(() => ({
        personal: [],
        letter: [] as string[],
      }));
      const letterRequests = letterReminderRequests(
        now,
        new Set(letterMarks.letter),
        LETTER_REMINDERS,
        LETTER_REMINDER_DAYS,
        LETTERS_CHANNEL_ID,
        LETTER_ID_PREFIX,
      );
      warnRejectedSchedules(
        'Письма',
        await Promise.allSettled(
          letterRequests.map((request) => api.scheduleNotificationAsync(request)),
        ),
      );
    }
  } catch (error) {
    logger.error('Не удалось обновить уведомления', error);
  }
}

const RESCHEDULE_DEBOUNCE_MS = 400;
let rescheduleTimer: ReturnType<typeof setTimeout> | null = null;
let rescheduleChain: Promise<void> = Promise.resolve();
let rescheduleWaiters: (() => void)[] = [];
let rescheduleGeneration = 0;

/** Схлопывает пачку вызовов и не даёт старому прогону дописать расписание после нового. */
export function rescheduleAppNotifications(): Promise<void> {
  const generation = ++rescheduleGeneration;
  return new Promise((resolve) => {
    rescheduleWaiters.push(resolve);
    if (rescheduleTimer) {
      clearTimeout(rescheduleTimer);
    }
    rescheduleTimer = setTimeout(() => {
      rescheduleTimer = null;
      const waiters = rescheduleWaiters;
      rescheduleWaiters = [];
      rescheduleChain = rescheduleChain
        .catch(() => undefined)
        .then(() => {
          if (generation !== rescheduleGeneration) {
            return;
          }
          return runRescheduleAppNotifications(generation);
        })
        .finally(() => {
          waiters.forEach((done) => done());
        });
    }, RESCHEDULE_DEBOUNCE_MS);
  });
}

