import { useCallback, useEffect, useRef, useState } from 'react';
import { formatISO, parseISO } from 'date-fns';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import {
  type CustomEventRecord,
  type DisplayEvent,
  type EventDateFormat,
  type EventOverride,
  type EventsStorage,
  type ServiceBoundaryDisplayMode,
  DEFAULT_EVENTS_STORAGE,
  EVENT_NAME_MAX_LENGTH,
} from '@/types/events';
import { getConfig, setConfig } from '@/services/database';
import {
  buildDisplayEvents,
  migrateEventsStorage,
  parseEventsStorage,
} from '@/utils/eventCalculations';
import { DEFAULT_EVENT_ICON, isCatalogIcon } from '@/utils/eventGlyphs';
import { isServiceBoundaryEvent } from '@/utils/serviceBoundaryEvents';
import { normalizeHex } from '@/utils/color';
import { logger } from '@/utils/logger';
import { rescheduleAppNotifications } from '@/services/holidayNotifications';

const UNDO_TIMEOUT_MS = 5000;

interface PendingDeletion {
  event: DisplayEvent;
  storageSnapshot: EventsStorage;
}

interface EventFormData {
  name: string;
  dateFormat: EventDateFormat;
  dddValue: string;
  dppValue: string;
  dateValue: Date | null;
  icon?: string;
  iconColor?: string;
  boundaryDisplay?: ServiceBoundaryDisplayMode;
  boundaryIconThemeDefault?: boolean;
}

function storedIconColor(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  return normalizeHex(value.trim()) ?? undefined;
}

interface UseEventsResult {
  isLoading: boolean;
  events: DisplayEvent[];
  pendingDeletion: PendingDeletion | null;
  addEvent: (form: EventFormData) => Promise<boolean>;
  updateEvent: (eventId: string, form: EventFormData, isCustom: boolean) => Promise<boolean>;
  deleteEvent: (event: DisplayEvent) => Promise<void>;
  undoDelete: () => Promise<void>;
  reload: () => Promise<void>;
}

function validateForm(form: EventFormData): string | null {
  const trimmedName = form.name.trim();

  if (!trimmedName) {
    return 'Введите название';
  }

  if (trimmedName.length > EVENT_NAME_MAX_LENGTH) {
    return `Название не длиннее ${EVENT_NAME_MAX_LENGTH} символов`;
  }

  if (form.dateFormat === 'ddd') {
    const parsed = Number(form.dddValue.trim());
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return 'Введите целое число ддд (дней до дембеля) от 0';
    }
  } else if (form.dateFormat === 'dpp') {
    const parsed = Number(form.dppValue.trim());
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return 'Введите целое число дпп (дней после призыва) от 0';
    }
  } else if (!form.dateValue) {
    return 'Выберите дату';
  }

  return null;
}

function formToCustomRecord(form: EventFormData, id: string): CustomEventRecord {
  return {
    id,
    name: form.name.trim(),
    dateFormat: form.dateFormat,
    dddValue:
      form.dateFormat === 'ddd' ? Number(form.dddValue.trim()) : undefined,
    dppValue:
      form.dateFormat === 'dpp' ? Number(form.dppValue.trim()) : undefined,
    dateValue:
      form.dateFormat === 'date' && form.dateValue
        ? formatISO(form.dateValue, { representation: 'date' })
        : undefined,
    icon: isCatalogIcon(form.icon) ? form.icon : DEFAULT_EVENT_ICON,
    iconColor: storedIconColor(form.iconColor),
  };
}

function formToOverride(form: EventFormData, eventId?: string): EventOverride {
  if (eventId && isServiceBoundaryEvent(eventId)) {
    return {
      name: form.name.trim(),
      icon: isCatalogIcon(form.icon) ? form.icon : undefined,
      iconColor: storedIconColor(form.iconColor),
      boundaryDisplay: form.boundaryDisplay === 'icon' ? 'icon' : 'row',
      boundaryIconThemeDefault: form.boundaryIconThemeDefault ? true : undefined,
    };
  }

  return {
    name: form.name.trim(),
    dateFormat: form.dateFormat,
    dddValue:
      form.dateFormat === 'ddd' ? Number(form.dddValue.trim()) : undefined,
    dppValue:
      form.dateFormat === 'dpp' ? Number(form.dppValue.trim()) : undefined,
    dateValue:
      form.dateFormat === 'date' && form.dateValue
        ? formatISO(form.dateValue, { representation: 'date' })
        : undefined,
    icon: isCatalogIcon(form.icon) ? form.icon : undefined,
    iconColor: storedIconColor(form.iconColor),
  };
}

async function persistStorage(storage: EventsStorage): Promise<void> {
  await setConfig(CONFIG_KEYS.EVENTS_DATA, JSON.stringify(storage));
  void rescheduleAppNotifications();
}

/** Загружает и управляет списком событий службы */
export function useEvents(): UseEventsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [storage, setStorage] = useState<EventsStorage>(DEFAULT_EVENTS_STORAGE);
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
      const [enlistmentRaw, demobilizationRaw, eventsRaw] = await Promise.all([
        getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
        getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
        getConfig(CONFIG_KEYS.EVENTS_DATA),
      ]);

      let parsedStorage = parseEventsStorage(eventsRaw);

      if (!enlistmentRaw || !demobilizationRaw) {
        setStorage(parsedStorage);
        setEvents([]);
        setIsLoading(false);
        return;
      }

      const enlistmentDate = parseISO(enlistmentRaw);
      const demobilizationDate = parseISO(demobilizationRaw);
      const migration = migrateEventsStorage(parsedStorage, enlistmentDate, demobilizationDate);
      parsedStorage = migration.storage;
      if (migration.changed) {
        await persistStorage(parsedStorage);
      }
      setStorage(parsedStorage);
      setEvents(buildDisplayEvents(enlistmentDate, demobilizationDate, parsedStorage));
    } catch (error) {
      logger.error('Ошибка загрузки событий', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const refreshEvents = useCallback(async (nextStorage: EventsStorage) => {
    const [enlistmentRaw, demobilizationRaw] = await Promise.all([
      getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
      getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
    ]);

    if (!enlistmentRaw || !demobilizationRaw) {
      setStorage(nextStorage);
      setEvents([]);
      return;
    }

    const enlistmentDate = parseISO(enlistmentRaw);
    const demobilizationDate = parseISO(demobilizationRaw);
    setStorage(nextStorage);
    setEvents(buildDisplayEvents(enlistmentDate, demobilizationDate, nextStorage));
  }, []);

  const addEvent = useCallback(
    async (form: EventFormData): Promise<boolean> => {
      const error = validateForm(form);
      if (error) {
        return false;
      }

      const id = Crypto.randomUUID();
      const record = formToCustomRecord(form, id);
      const nextStorage: EventsStorage = {
        ...storageRef.current,
        customEvents: [...storageRef.current.customEvents, record],
      };

      await persistStorage(nextStorage);
      await refreshEvents(nextStorage);
      return true;
    },
    [refreshEvents],
  );

  const updateEvent = useCallback(
    async (eventId: string, form: EventFormData, isCustom: boolean): Promise<boolean> => {
      const error = validateForm(form);
      if (error) {
        return false;
      }

      let nextStorage: EventsStorage;

      if (isCustom) {
        nextStorage = {
          ...storageRef.current,
          customEvents: storageRef.current.customEvents.map((record) =>
            record.id === eventId ? formToCustomRecord(form, eventId) : record,
          ),
        };
      } else {
        nextStorage = {
          ...storageRef.current,
          overrides: {
            ...storageRef.current.overrides,
            [eventId]: formToOverride(form, eventId),
          },
        };
      }

      await persistStorage(nextStorage);
      await refreshEvents(nextStorage);
      return true;
    },
    [refreshEvents],
  );

  const deleteEvent = useCallback(
    async (event: DisplayEvent) => {
      if (isServiceBoundaryEvent(event.id)) {
        return;
      }

      clearUndoTimer();

      const snapshot = storageRef.current;
      let nextStorage: EventsStorage;

      if (event.isCustom) {
        nextStorage = {
          ...snapshot,
          customEvents: snapshot.customEvents.filter((record) => record.id !== event.id),
        };
      } else {
        nextStorage = {
          ...snapshot,
          deletedIds: snapshot.deletedIds.includes(event.id)
            ? snapshot.deletedIds
            : [...snapshot.deletedIds, event.id],
        };
      }

      await persistStorage(nextStorage);
      await refreshEvents(nextStorage);

      setPendingDeletion({ event, storageSnapshot: snapshot });

      undoTimerRef.current = setTimeout(() => {
        setPendingDeletion(null);
        undoTimerRef.current = null;
      }, UNDO_TIMEOUT_MS);
    },
    [clearUndoTimer, refreshEvents],
  );

  const undoDelete = useCallback(async () => {
    if (!pendingDeletion) {
      return;
    }

    clearUndoTimer();
    await persistStorage(pendingDeletion.storageSnapshot);
    await refreshEvents(pendingDeletion.storageSnapshot);
    setPendingDeletion(null);
  }, [clearUndoTimer, pendingDeletion, refreshEvents]);

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  return {
    isLoading,
    events,
    pendingDeletion,
    addEvent,
    updateEvent,
    deleteEvent,
    undoDelete,
    reload,
  };
}

export type { EventFormData, UseEventsResult };
