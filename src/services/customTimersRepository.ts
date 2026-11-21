import { startOfDay } from 'date-fns';

import { CONFIG_KEYS } from '@/types/config';
import { SERVICE_TIMER_ID, type CustomTimerRecord } from '@/types/timer';
import { setConfig } from '@/services/database';
import { pruneNotificationDisabledIds, serializeCustomTimersStorage } from '@/utils/timerRecords';

export interface CustomTimerInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

/** Пустое имя или дата конца не позже начала — запись не создаём. */
export function customTimerRecordFromInput(
  input: CustomTimerInput,
  id: string,
): CustomTimerRecord | null {
  const name = input.name.trim();
  if (!name || startOfDay(input.endDate) <= startOfDay(input.startDate)) {
    return null;
  }

  return {
    id,
    name,
    startDate: startOfDay(input.startDate).toISOString(),
    endDate: startOfDay(input.endDate).toISOString(),
  };
}

export async function persistCustomTimers(
  timers: CustomTimerRecord[],
  notificationDisabledIds: string[],
): Promise<string[]> {
  const pruned = pruneNotificationDisabledIds(notificationDisabledIds, [
    SERVICE_TIMER_ID,
    ...timers.map((timer) => timer.id),
  ]);
  await setConfig(
    CONFIG_KEYS.CUSTOM_TIMERS_DATA,
    serializeCustomTimersStorage({ timers, notificationDisabledIds: pruned }),
  );
  return pruned;
}
