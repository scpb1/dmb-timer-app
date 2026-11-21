import { parseISO } from 'date-fns';

import { parseStoredDate } from '@/utils/storedDate';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_CUSTOM_TIMERS_STORAGE,
  SERVICE_TIMER_ID,
  type ActiveTimer,
  type CustomTimerRecord,
  type CustomTimersStorage,
} from '@/types/timer';
import { getConfig } from '@/services/database';

export function serviceTimerNameFrom(partnerName: string): string {
  const trimmed = partnerName.trim();
  return trimmed || 'Служба';
}

export function parseCustomTimersStorage(raw: string | null): CustomTimersStorage {
  if (!raw) {
    return {
      timers: [...DEFAULT_CUSTOM_TIMERS_STORAGE.timers],
      notificationDisabledIds: [...(DEFAULT_CUSTOM_TIMERS_STORAGE.notificationDisabledIds ?? [])],
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CustomTimersStorage>;
    const timers = Array.isArray(parsed?.timers)
      ? parsed.timers.filter(
          (timer): timer is CustomTimerRecord =>
            Boolean(timer?.id && timer.name && timer.startDate && timer.endDate),
        )
      : [];
    const notificationDisabledIds = Array.isArray(parsed.notificationDisabledIds)
      ? parsed.notificationDisabledIds.filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        )
      : [];

    return { timers, notificationDisabledIds };
  } catch {
    return {
      timers: [...DEFAULT_CUSTOM_TIMERS_STORAGE.timers],
      notificationDisabledIds: [...(DEFAULT_CUSTOM_TIMERS_STORAGE.notificationDisabledIds ?? [])],
    };
  }
}

export function serializeCustomTimersStorage(storage: CustomTimersStorage): string {
  return JSON.stringify({
    timers: storage.timers,
    notificationDisabledIds: storage.notificationDisabledIds ?? [],
  });
}

export function isTimerNotificationEnabled(
  timerId: string,
  notificationDisabledIds: string[] | undefined,
): boolean {
  return !(notificationDisabledIds ?? []).includes(timerId);
}

export function withTimerNotificationEnabled(
  notificationDisabledIds: string[] | undefined,
  timerId: string,
  enabled: boolean,
): string[] {
  const next = new Set(notificationDisabledIds ?? []);
  if (enabled) {
    next.delete(timerId);
  } else {
    next.add(timerId);
  }
  return [...next];
}

export function pruneNotificationDisabledIds(
  notificationDisabledIds: string[] | undefined,
  timerIds: Iterable<string>,
): string[] {
  const allowed = new Set(timerIds);
  return (notificationDisabledIds ?? []).filter((id) => allowed.has(id));
}

function toCustomActiveTimer(timer: CustomTimerRecord): ActiveTimer | null {
  const startDate = parseISO(timer.startDate);
  const endDate = parseISO(timer.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return {
    id: timer.id,
    name: timer.name,
    startDate,
    endDate,
    kind: 'custom',
  };
}

export function buildServiceTimer(
  enlistmentDate: Date | null,
  demobilizationDate: Date | null,
  partnerName: string,
): ActiveTimer | null {
  if (!enlistmentDate || !demobilizationDate) {
    return null;
  }

  return {
    id: SERVICE_TIMER_ID,
    name: serviceTimerNameFrom(partnerName),
    startDate: enlistmentDate,
    endDate: demobilizationDate,
    kind: 'service',
  };
}

export function buildTimerList(
  enlistmentDate: Date | null,
  demobilizationDate: Date | null,
  customTimers: CustomTimerRecord[],
  partnerName: string,
): ActiveTimer[] {
  const timers: ActiveTimer[] = [];
  const service = buildServiceTimer(enlistmentDate, demobilizationDate, partnerName);
  if (service) {
    timers.push(service);
  }

  for (const custom of customTimers) {
    const resolved = toCustomActiveTimer(custom);
    if (resolved) {
      timers.push(resolved);
    }
  }

  return timers;
}

export function resolveActiveTimer(
  id: string | null,
  enlistmentDate: Date | null,
  demobilizationDate: Date | null,
  customTimers: CustomTimerRecord[],
  partnerName: string,
): ActiveTimer | null {
  if (id && id !== SERVICE_TIMER_ID) {
    const custom = customTimers.find((timer) => timer.id === id);
    if (custom) {
      const resolved = toCustomActiveTimer(custom);
      if (resolved) {
        return resolved;
      }
    }
  }

  return buildServiceTimer(enlistmentDate, demobilizationDate, partnerName);
}

export interface LoadedTimerRecords {
  partnerName: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
  storage: CustomTimersStorage;
  activeTimer: ActiveTimer | null;
  allTimers: ActiveTimer[];
}

export async function loadTimerRecords(): Promise<LoadedTimerRecords> {
  const [enlistmentRaw, demobilizationRaw, customRaw, activeId, partnerNameRaw] = await Promise.all([
    getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
    getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
    getConfig(CONFIG_KEYS.CUSTOM_TIMERS_DATA),
    getConfig(CONFIG_KEYS.ACTIVE_TIMER_ID),
    getConfig(CONFIG_KEYS.PARTNER_NAME),
  ]);

  const partnerName = partnerNameRaw ?? '';
  const enlistmentDate = parseStoredDate(enlistmentRaw);
  const demobilizationDate = parseStoredDate(demobilizationRaw);
  const storage = parseCustomTimersStorage(customRaw);
  const allTimers = buildTimerList(
    enlistmentDate,
    demobilizationDate,
    storage.timers,
    partnerName,
  );
  const activeTimer = resolveActiveTimer(
    activeId,
    enlistmentDate,
    demobilizationDate,
    storage.timers,
    partnerName,
  );

  return {
    partnerName,
    enlistmentDate,
    demobilizationDate,
    storage,
    activeTimer,
    allTimers,
  };
}
