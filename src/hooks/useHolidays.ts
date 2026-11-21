import { useCallback, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import type { CardHighlightMode } from '@/types/events';
import {
  DEFAULT_HOLIDAYS_STORAGE,
  HOLIDAY_NAME_MAX_LENGTH,
  type CustomHolidayRecord,
  type DisplayHoliday,
  type HolidayOverride,
  type HolidaysStorage,
} from '@/types/holidays';
import { holidayHighlightMode } from '@/utils/cardHighlight';
import { createConfigJsonStore } from '@/services/configJsonStore';
import {
  buildDisplayHolidays,
  isValidMonthDay,
  migrateHolidaysStorageIcons,
  parseHolidaysStorage,
  type HolidayServiceRange,
} from '@/utils/holidayCalculations';
import { DEFAULT_HOLIDAY_ICON, normalizeStoredIconName } from '@/utils/eventGlyphs';
import { normalizeHex } from '@/utils/color';
import { rescheduleAppNotifications } from '@/services/holidayNotifications';
import { loadTimerRecords } from '@/utils/timerRecords';
import { logger } from '@/utils/logger';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

interface PendingDeletion {
  holiday: DisplayHoliday;
  storageSnapshot: HolidaysStorage;
}

export interface HolidayFormData {
  name: string;
  dateValue: Date | null;
  icon?: string;
  iconColor?: string;
  highlightMode?: CardHighlightMode;
}

function storedIconColor(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  return normalizeHex(value.trim()) ?? undefined;
}

interface UseHolidaysResult {
  isLoading: boolean;
  holidays: DisplayHoliday[];
  pendingDeletion: PendingDeletion | null;
  addHoliday: (form: HolidayFormData) => Promise<boolean>;
  updateHoliday: (holidayId: string, form: HolidayFormData, isCustom: boolean) => Promise<boolean>;
  deleteHoliday: (holiday: DisplayHoliday) => Promise<void>;
  undoDelete: () => Promise<void>;
  reload: () => Promise<void>;
}

function monthDayFromDate(date: Date): { month: number; day: number } {
  return { month: date.getMonth() + 1, day: date.getDate() };
}

function validateForm(form: HolidayFormData): string | null {
  const trimmedName = form.name.trim();

  if (!trimmedName) {
    return 'Введите название';
  }

  if (trimmedName.length > HOLIDAY_NAME_MAX_LENGTH) {
    return `Название не длиннее ${HOLIDAY_NAME_MAX_LENGTH} символов`;
  }

  if (!form.dateValue) {
    return 'Выберите дату';
  }

  const { month, day } = monthDayFromDate(form.dateValue);
  if (!isValidMonthDay(month, day)) {
    return 'Некорректная дата праздника';
  }

  return null;
}

function formToCustomRecord(form: HolidayFormData, id: string): CustomHolidayRecord {
  const { month, day } = monthDayFromDate(form.dateValue as Date);
  return {
    id,
    name: form.name.trim(),
    month,
    day,
    icon: normalizeStoredIconName(form.icon) ?? DEFAULT_HOLIDAY_ICON,
    iconColor: storedIconColor(form.iconColor),
    highlightMode: holidayHighlightMode({ highlightMode: form.highlightMode }),
  };
}

function formToOverride(form: HolidayFormData): HolidayOverride {
  const { month, day } = monthDayFromDate(form.dateValue as Date);
  return {
    name: form.name.trim(),
    month,
    day,
    icon: normalizeStoredIconName(form.icon),
    iconColor: storedIconColor(form.iconColor),
    highlightMode: holidayHighlightMode({ highlightMode: form.highlightMode }),
  };
}

async function loadActiveTimerRange(): Promise<HolidayServiceRange | null> {
  const { activeTimer } = await loadTimerRecords();
  if (!activeTimer) {
    return null;
  }

  return {
    start: activeTimer.startDate,
    end: activeTimer.endDate,
  };
}

const holidaysStore = createConfigJsonStore<HolidaysStorage, DisplayHoliday[]>({
  key: CONFIG_KEYS.HOLIDAYS_DATA,
  parse: parseHolidaysStorage,
  validate: async (stored) => {
    const migration = migrateHolidaysStorageIcons(stored);
    return { value: migration.storage, changed: migration.changed };
  },
  toDisplay: async (stored) => {
    const serviceRange = await loadActiveTimerRange();
    return buildDisplayHolidays(stored, new Date(), serviceRange);
  },
  afterPersist: () => {
    void rescheduleAppNotifications();
  },
});

/** Загружает и управляет списком праздников */
export function useHolidays(): UseHolidaysResult {
  const [isLoading, setIsLoading] = useState(true);
  const [holidays, setHolidays] = useState<DisplayHoliday[]>([]);
  const [storage, setStorage] = useState<HolidaysStorage>(DEFAULT_HOLIDAYS_STORAGE);
  const storageRef = useRef(storage);
  storageRef.current = storage;
  const refreshHolidaysRef = useRef<(nextStorage: HolidaysStorage) => Promise<void>>(async () => {});

  const {
    pending: pendingDeletion,
    schedule: scheduleUndo,
    undo: undoDelete,
  } = useUndoableDelete<PendingDeletion>({
    onRestore: async (pending) => {
      await refreshHolidaysRef.current(pending.storageSnapshot);
    },
  });

  const reload = useCallback(async () => {
    try {
      const previousRaw = holidaysStore.currentRaw();
      const { stored, display, raw } = await holidaysStore.load();
      storageRef.current = stored;
      setStorage(stored);
      setHolidays(display);
      if (raw !== previousRaw) {
        void rescheduleAppNotifications();
      }
    } catch (error) {
      logger.error('Ошибка загрузки праздников', error);
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const refreshHolidays = useCallback(async (nextStorage: HolidaysStorage) => {
    const display = await holidaysStore.save(nextStorage);
    storageRef.current = nextStorage;
    setStorage(nextStorage);
    setHolidays(display);
  }, []);

  refreshHolidaysRef.current = refreshHolidays;

  const addHoliday = useCallback(
    async (form: HolidayFormData): Promise<boolean> => {
      const error = validateForm(form);
      if (error) {
        return false;
      }

      const id = Crypto.randomUUID();
      const record = formToCustomRecord(form, id);
      const nextStorage: HolidaysStorage = {
        ...storageRef.current,
        customHolidays: [...storageRef.current.customHolidays, record],
      };

      await refreshHolidays(nextStorage);
      return true;
    },
    [refreshHolidays],
  );

  const updateHoliday = useCallback(
    async (holidayId: string, form: HolidayFormData, isCustom: boolean): Promise<boolean> => {
      const error = validateForm(form);
      if (error) {
        return false;
      }

      const nextStorage: HolidaysStorage = isCustom
        ? {
            ...storageRef.current,
            customHolidays: storageRef.current.customHolidays.map((record) =>
              record.id === holidayId ? formToCustomRecord(form, holidayId) : record,
            ),
          }
        : {
            ...storageRef.current,
            overrides: {
              ...storageRef.current.overrides,
              [holidayId]: formToOverride(form),
            },
          };

      await refreshHolidays(nextStorage);
      return true;
    },
    [refreshHolidays],
  );

  const deleteHoliday = useCallback(
    async (holiday: DisplayHoliday) => {
      const snapshot = storageRef.current;
      const nextStorage: HolidaysStorage = holiday.isCustom
        ? {
            ...snapshot,
            customHolidays: snapshot.customHolidays.filter((record) => record.id !== holiday.id),
          }
        : {
            ...snapshot,
            deletedIds: snapshot.deletedIds.includes(holiday.id)
              ? snapshot.deletedIds
              : [...snapshot.deletedIds, holiday.id],
          };

      await refreshHolidays(nextStorage);
      await scheduleUndo({ holiday, storageSnapshot: snapshot });
    },
    [refreshHolidays, scheduleUndo],
  );

  return {
    isLoading,
    holidays,
    pendingDeletion,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    undoDelete,
    reload,
  };
}
