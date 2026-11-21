import { useCallback, useEffect, useRef, useState } from 'react';
import { formatISO } from 'date-fns';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_PARCEL_SETTINGS,
  DEFAULT_PARCELS_STORAGE,
  type ParcelEntry,
  type ParcelFormData,
  type ParcelSettings,
  type ParcelStatus,
  type ParcelsStorage,
} from '@/types/parcels';
import { getConfig, setConfig } from '@/services/database';
import { loadTimerRecords } from '@/utils/timerRecords';
import { logger } from '@/utils/logger';
import { rescheduleParcelNotifications } from '@/utils/parcelNotifications';
import {
  applyParcelStatusAdvance,
  getParcelReminderPlan,
  parcelEntryFromForm,
  parseParcelsStorage,
  restoreParcelEntry,
  validateParcelForm,
  type ParcelReminderPlan,
  type ParcelServiceRange,
} from '@/utils/parcelCalculations';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

interface PendingDeletion {
  entry: ParcelEntry;
}

interface UseParcelsResult {
  isLoading: boolean;
  entries: ParcelEntry[];
  settings: ParcelSettings;
  pendingDeletion: PendingDeletion | null;
  serviceRange: ParcelServiceRange;
  reminderPlan: ParcelReminderPlan;
  reload: () => Promise<void>;
  saveEntry: (form: ParcelFormData, existingId?: string) => Promise<boolean>;
  advanceStatus: (id: string, nextStatus: ParcelStatus, date: Date) => Promise<string | null>;
  updateSettings: (next: ParcelSettings) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
}

async function persistParcels(storage: ParcelsStorage): Promise<void> {
  await setConfig(CONFIG_KEYS.PARCELS_DATA, JSON.stringify(storage));
  void rescheduleParcelNotifications();
}

/** Загружает посылки и передачки, пишет их в config, ставит напоминание «давно не отправляла». */
export function useParcels(): UseParcelsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<ParcelEntry[]>([]);
  const [settings, setSettings] = useState<ParcelSettings>(DEFAULT_PARCEL_SETTINGS);
  const [serviceRange, setServiceRange] = useState<ParcelServiceRange>({ start: null, end: null });
  const storageRef = useRef<ParcelsStorage>(DEFAULT_PARCELS_STORAGE);

  const applyStorage = useCallback((storage: ParcelsStorage) => {
    storageRef.current = storage;
    setEntries(storage.entries);
    setSettings(storage.settings);
  }, []);

  const {
    pending: pendingDeletion,
    commitCurrent: dismissPendingDelete,
    schedule: scheduleUndo,
    undo: undoDelete,
  } = useUndoableDelete<PendingDeletion>({
    onRestore: async (pending) => {
      const nextStorage = restoreParcelEntry(storageRef.current, pending.entry);
      await persistParcels(nextStorage);
      applyStorage(nextStorage);
    },
  });

  const reload = useCallback(async () => {
    try {
      const [raw, timers] = await Promise.all([getConfig(CONFIG_KEYS.PARCELS_DATA), loadTimerRecords()]);
      applyStorage(parseParcelsStorage(raw));
      setServiceRange({
        start: timers.enlistmentDate,
        end: timers.demobilizationDate,
      });
    } catch (error) {
      logger.error('Ошибка загрузки посылок', error);
      applyStorage({ entries: [], settings: { ...DEFAULT_PARCEL_SETTINGS } });
    } finally {
      setIsLoading(false);
    }
  }, [applyStorage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveEntry = useCallback(
    async (form: ParcelFormData, existingId?: string): Promise<boolean> => {
      const error = validateParcelForm(form);
      if (error) {
        logger.warn('Посылка не сохранена: форма неполная', error);
        return false;
      }

      try {
        const nowIso = formatISO(new Date());
        const existing = existingId
          ? storageRef.current.entries.find((item) => item.id === existingId)
          : undefined;
        const record = parcelEntryFromForm(
          form,
          existing ? { id: existing.id, createdAt: existing.createdAt } : null,
          nowIso,
        );
        if (!record.id) {
          record.id = Crypto.randomUUID();
        }

        const nextEntries = existing
          ? storageRef.current.entries.map((item) => (item.id === existing.id ? record : item))
          : [...storageRef.current.entries, record];
        const nextStorage: ParcelsStorage = {
          ...storageRef.current,
          entries: nextEntries,
        };
        await persistParcels(nextStorage);
        applyStorage(nextStorage);
        return true;
      } catch (error) {
        logger.error('Ошибка сохранения посылки', error);
        return false;
      }
    },
    [applyStorage],
  );

  const advanceStatus = useCallback(
    async (id: string, nextStatus: ParcelStatus, date: Date): Promise<string | null> => {
      const existing = storageRef.current.entries.find((item) => item.id === id);
      if (!existing) {
        return 'Запись не найдена';
      }
      const result = applyParcelStatusAdvance(existing, nextStatus, date);
      if (!result.ok) {
        logger.warn('Не удалось сменить статус посылки', result.error);
        return result.error;
      }

      try {
        const updated: ParcelEntry = {
          ...result.entry,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: formatISO(new Date()),
        };
        const nextStorage: ParcelsStorage = {
          ...storageRef.current,
          entries: storageRef.current.entries.map((item) => (item.id === id ? updated : item)),
        };
        await persistParcels(nextStorage);
        applyStorage(nextStorage);
        return null;
      } catch (error) {
        logger.error('Ошибка смены статуса посылки', error);
        return 'Не удалось сохранить';
      }
    },
    [applyStorage],
  );

  const updateSettings = useCallback(
    async (next: ParcelSettings): Promise<boolean> => {
      try {
        const nextStorage: ParcelsStorage = {
          ...storageRef.current,
          settings: next,
        };
        await persistParcels(nextStorage);
        applyStorage(nextStorage);
        return true;
      } catch (error) {
        logger.error('Ошибка настроек посылок', error);
        return false;
      }
    },
    [applyStorage],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        await dismissPendingDelete();
        const target = storageRef.current.entries.find((item) => item.id === id);
        if (!target) {
          return;
        }

        const snapshot = storageRef.current;
        const nextStorage: ParcelsStorage = {
          ...snapshot,
          entries: snapshot.entries.filter((item) => item.id !== id),
        };
        await persistParcels(nextStorage);
        applyStorage(nextStorage);
        await scheduleUndo({ entry: target });
      } catch (error) {
        logger.error('Ошибка удаления посылки', error);
      }
    },
    [applyStorage, dismissPendingDelete, scheduleUndo],
  );

  const reminderPlan = getParcelReminderPlan(
    entries,
    settings,
    serviceRange.start,
    new Date(),
    serviceRange.end,
  );

  return {
    isLoading,
    entries,
    settings,
    pendingDeletion,
    serviceRange,
    reminderPlan,
    reload,
    saveEntry,
    advanceStatus,
    updateSettings,
    deleteEntry,
    undoDelete,
  };
}
