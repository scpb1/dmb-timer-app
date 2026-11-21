import { CONFIG_KEYS } from '@/types/config';
import { DEFAULT_PARCEL_SETTINGS, type ParcelsStorage } from '@/types/parcels';
import { getConfig, setConfig } from '@/services/database';
import {
  ensureAndroidChannel,
  getNotificationsApi,
  NOTIFICATION_CHANNELS,
} from '@/services/notifications/nativeNotifications';
import { logger } from '@/utils/logger';
import { loadTimerRecords } from '@/utils/timerRecords';
import {
  getParcelReminderPlan,
  parseParcelsStorage,
  parcelReminderNotificationCopy,
} from '@/utils/parcelCalculations';

const PARCELS_CHANNEL_ID = NOTIFICATION_CHANNELS.parcels.id;
const PARCEL_ID_PREFIX = 'parcel:';
const PARCEL_REMINDER_ID = 'parcel:reminder';
async function cancelParcelNotifications(
  api: NonNullable<ReturnType<typeof getNotificationsApi>>,
): Promise<void> {
  const scheduled = await api.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(PARCEL_ID_PREFIX))
      .map((item) => api.cancelScheduledNotificationAsync(item.identifier)),
  );
}

async function readStorage(): Promise<ParcelsStorage> {
  const raw = await getConfig(CONFIG_KEYS.PARCELS_DATA);
  return parseParcelsStorage(raw);
}

async function readRemindedAnchor(): Promise<string | null> {
  const value = await getConfig(CONFIG_KEYS.PARCEL_REMINDER_ANCHOR);
  return value && value.length > 0 ? value : null;
}

async function writeRemindedAnchor(anchorId: string | null): Promise<void> {
  await setConfig(CONFIG_KEYS.PARCEL_REMINDER_ANCHOR, anchorId ?? '');
}

export async function requestParcelNotificationPermission(): Promise<'granted' | 'denied' | 'unavailable'> {
  const api = getNotificationsApi();
  if (!api) {
    return 'unavailable';
  }

  const current = await api.getPermissionsAsync();
  if (current.status === 'granted') {
    return 'granted';
  }
  const next = await api.requestPermissionsAsync();
  return next.status === 'granted' ? 'granted' : 'denied';
}

/** Ставит одно утреннее напоминание, если давно ничего не уходило. */
export async function rescheduleParcelNotifications(): Promise<void> {
  const api = getNotificationsApi();
  if (!api) {
    return;
  }

  try {
    await ensureAndroidChannel('parcels');
    await cancelParcelNotifications(api);

    const storage = await readStorage();
    const settings = storage.settings ?? DEFAULT_PARCEL_SETTINGS;
    const remindedAnchor = await readRemindedAnchor();
    const timers = await loadTimerRecords();
    const now = new Date();
    const plan = getParcelReminderPlan(
      storage.entries,
      settings,
      timers.enlistmentDate,
      now,
      timers.demobilizationDate,
      remindedAnchor,
    );

    const globalEnabled = (await getConfig(CONFIG_KEYS.NOTIFICATIONS_ENABLED)) === 'true';
    if (!globalEnabled || !settings.reminderEnabled) {
      if (plan.dueAt && now < plan.dueAt && remindedAnchor) {
        await writeRemindedAnchor(null);
      }
      return;
    }

    const permission = await api.getPermissionsAsync();
    if (permission.status !== 'granted') {
      return;
    }

    if (!plan.fireAt || !plan.anchorId) {
      return;
    }

    const copy = parcelReminderNotificationCopy(plan);
    await api.scheduleNotificationAsync({
      identifier: PARCEL_REMINDER_ID,
      content: {
        title: copy.title,
        body: copy.body,
        sound: true,
      },
      trigger: {
        date: plan.fireAt,
        channelId: PARCELS_CHANNEL_ID,
      },
    });
    if (remindedAnchor !== plan.anchorId) {
      await writeRemindedAnchor(plan.anchorId);
    }
  } catch (error) {
    logger.error('Не удалось обновить напоминания посылок', error);
  }
}
