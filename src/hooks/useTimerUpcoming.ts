import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseISO } from 'date-fns';

import { CONFIG_KEYS } from '@/types/config';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import type { TimerSettings } from '@/types/timer';
import { getConfig, setConfig } from '@/services/database';
import {
  buildDisplayEvents,
  formatEventDate,
  getDefaultEventListIds,
  migrateEventsStorageDefaultList,
  parseEventsStorage,
} from '@/utils/eventCalculations';
import {
  buildDisplayHolidays,
  formatHolidayDate,
  parseHolidaysStorage,
} from '@/utils/holidayCalculations';
import {
  encodeTimerUpcomingRef,
  mergeTimerUpcomingItems,
  resolveTimerUpcomingItem,
  timerUpcomingDisplayName,
  type TimerUpcomingItem,
  type TimerUpcomingRef,
} from '@/utils/timerUpcoming';
import { logger } from '@/utils/logger';

export interface TimerUpcomingPinOption {
  value: TimerUpcomingRef;
  label: string;
}

interface UseTimerUpcomingResult {
  isLoading: boolean;
  /** Для карточки под таймером (null, если режим «не показывать») */
  item: TimerUpcomingItem | null;
  /** Для вида «Рамка» — всегда ближайшее или закреплённое */
  frameItem: TimerUpcomingItem | null;
  pinOptions: TimerUpcomingPinOption[];
  events: DisplayEvent[];
  holidays: DisplayHoliday[];
  /** «Список событий по умолчанию» для армейского чеклиста */
  defaultListEventIds: string[];
  reload: () => Promise<void>;
}

function formatPinLabel(item: TimerUpcomingItem): string {
  const name = timerUpcomingDisplayName(item);
  const dateText =
    item.kind === 'event' ? formatEventDate(item.event.date) : formatHolidayDate(item.holiday);
  return `${name} · ${dateText}`;
}

export function useTimerUpcoming(
  settings: Pick<TimerSettings, 'timerUpcomingPreview' | 'timerUpcomingPinnedRef'>,
): UseTimerUpcomingResult {
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [holidays, setHolidays] = useState<DisplayHoliday[]>([]);
  const [defaultListEventIds, setDefaultListEventIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [enlistmentRaw, demobilizationRaw, eventsRaw, holidaysRaw] = await Promise.all([
        getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
        getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
        getConfig(CONFIG_KEYS.EVENTS_DATA),
        getConfig(CONFIG_KEYS.HOLIDAYS_DATA),
      ]);

      if (!enlistmentRaw || !demobilizationRaw) {
        setEvents([]);
        setHolidays([]);
        setDefaultListEventIds([]);
        return;
      }

      const enlistmentDate = parseISO(enlistmentRaw);
      const demobilizationDate = parseISO(demobilizationRaw);
      const serviceRange = { start: enlistmentDate, end: demobilizationDate };
      const now = new Date();

      let eventsStorage = parseEventsStorage(eventsRaw);
      const migration = migrateEventsStorageDefaultList(
        eventsStorage,
        enlistmentDate,
        demobilizationDate,
      );
      eventsStorage = migration.storage;
      if (migration.changed) {
        await setConfig(CONFIG_KEYS.EVENTS_DATA, JSON.stringify(eventsStorage));
      }

      setDefaultListEventIds(
        getDefaultEventListIds(eventsStorage, enlistmentDate, demobilizationDate),
      );
      setEvents(buildDisplayEvents(enlistmentDate, demobilizationDate, eventsStorage, now));
      setHolidays(
        buildDisplayHolidays(parseHolidaysStorage(holidaysRaw), now, serviceRange),
      );
    } catch (error) {
      logger.error('Ошибка загрузки ближайшего события для таймера', error);
      setEvents([]);
      setHolidays([]);
      setDefaultListEventIds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pinOptions = useMemo(() => {
    return mergeTimerUpcomingItems(events, holidays)
      .filter((item) => {
        const isPast = item.kind === 'event' ? item.event.isPast : item.holiday.isPast;
        return !isPast;
      })
      .map((item) => ({
        value: encodeTimerUpcomingRef(item),
        label: formatPinLabel(item),
      }));
  }, [events, holidays]);

  const item = useMemo(
    () =>
      resolveTimerUpcomingItem(
        settings.timerUpcomingPreview,
        settings.timerUpcomingPinnedRef,
        events,
        holidays,
      ),
    [events, holidays, settings.timerUpcomingPinnedRef, settings.timerUpcomingPreview],
  );

  const frameItem = useMemo(() => {
    const mode =
      settings.timerUpcomingPreview === 'off' ? 'nearest' : settings.timerUpcomingPreview;
    return resolveTimerUpcomingItem(
      mode,
      settings.timerUpcomingPinnedRef,
      events,
      holidays,
    );
  }, [events, holidays, settings.timerUpcomingPinnedRef, settings.timerUpcomingPreview]);

  return {
    isLoading,
    item,
    frameItem,
    pinOptions,
    events,
    holidays,
    defaultListEventIds,
    reload,
  };
}
