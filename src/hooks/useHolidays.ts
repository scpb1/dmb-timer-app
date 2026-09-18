import { useCallback, useEffect, useRef, useState } from 'react';
import { parseISO } from 'date-fns';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_HOLIDAYS_STORAGE,
  HOLIDAY_NAME_MAX_LENGTH,
  type CustomHolidayRecord,
  type DisplayHoliday,
  type HolidayOverride,
  type HolidaysStorage,
} from '@/types/holidays';
import { getConfig, setConfig } from '@/services/database';
import {
  buildDisplayHolidays,
  isValidMonthDay,
  parseHolidaysStorage,
  type HolidayServiceRange,
} from '@/utils/holidayCalculations';
import { logger } from '@/utils/logger';

const UNDO_TIMEOUT_MS = 5000;

interface PendingDeletion {
  holiday: DisplayHoliday;
  storageSnapshot: HolidaysStorage;
}

export interface HolidayFormData {
  name: string;
  dateValue: Date | null;
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
  };
}

function formToOverride(form: HolidayFormData): HolidayOverride {
  const { month, day } = monthDayFromDate(form.dateValue as Date);
  return {
    name: form.name.trim(),
    month,
    day,
  };
}

async function persistStorage(storage: HolidaysStorage): Promise<void> {
  await setConfig(CONFIG_KEYS.HOLIDAYS_DATA, JSON.stringify(storage));
}

async function loadServiceRange(): Promise<HolidayServiceRange | null> {
  const [enlistmentRaw, demobilizationRaw] = await Promise.all([
    getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
    getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
  ]);

  if (!enlistmentRaw || !demobilizationRaw) {
    return null;
  }

  return {
    start: parseISO(enlistmentRaw),
    end: parseISO(demobilizationRaw),
  };
}

/** Загружает и управляет списком праздников */
export function useHolidays(): UseHolidaysResult {
  const [isLoading, setIsLoading] = useState(true);
  const [holidays, setHolidays] = useState<DisplayHoliday[]>([]);
  const [storage, setStorage] = useState<HolidaysStorage>(DEFAULT_HOLIDAYS_STORAGE);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);

  const storageRef = useRef(storage);
  storageRef.current = storage;

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      const [holidaysRaw, serviceRange] = await Promise.all([
        getConfig(CONFIG_KEYS.HOLIDAYS_DATA),
        loadServiceRange(),
      ]);
      const parsedStorage = parseHolidaysStorage(holidaysRaw);
      setStorage(parsedStorage);
      setHolidays(buildDisplayHolidays(parsedStorage, new Date(), serviceRange));
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
    const serviceRange = await loadServiceRange();
    setStorage(nextStorage);
    setHolidays(buildDisplayHolidays(nextStorage, new Date(), serviceRange));
  }, []);

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

      await persistStorage(nextStorage);
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

      await persistStorage(nextStorage);
      await refreshHolidays(nextStorage);
      return true;
    },
    [refreshHolidays],
  );

  const deleteHoliday = useCallback(
    async (holiday: DisplayHoliday) => {
      clearUndoTimer();

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

      await persistStorage(nextStorage);
      await refreshHolidays(nextStorage);

      setPendingDeletion({ holiday, storageSnapshot: snapshot });

      undoTimerRef.current = setTimeout(() => {
        setPendingDeletion(null);
        undoTimerRef.current = null;
      }, UNDO_TIMEOUT_MS);
    },
    [clearUndoTimer, refreshHolidays],
  );

  const undoDelete = useCallback(async () => {
    if (!pendingDeletion) {
      return;
    }

    clearUndoTimer();
    await persistStorage(pendingDeletion.storageSnapshot);
    await refreshHolidays(pendingDeletion.storageSnapshot);
    setPendingDeletion(null);
  }, [clearUndoTimer, pendingDeletion, refreshHolidays]);

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

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
