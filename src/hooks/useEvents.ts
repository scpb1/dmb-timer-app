import { useCallback, useEffect, useRef, useState } from 'react';
import { formatISO } from 'date-fns';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import {
  type CardHighlightMode,
  type CustomEventRecord,
  type DisplayEvent,
  type EventDateFormat,
  type EventOverride,
  type EventsStorage,
  type ServiceBoundaryDisplayMode,
  DEFAULT_EVENTS_STORAGE,
  EVENT_NAME_MAX_LENGTH,
} from '@/types/events';
import { createConfigJsonStore } from '@/services/configJsonStore';
import {
  buildDisplayEvents,
  eventPercentValidationError,
  migrateEventsStorage,
  parseEventPercentInput,
  parseEventsStorage,
} from '@/utils/eventCalculations';
import { DEFAULT_EVENT_ICON, normalizeStoredIconName } from '@/utils/eventGlyphs';
import { eventHighlightMode } from '@/utils/cardHighlight';
import { isServiceBoundaryEvent } from '@/utils/serviceBoundaryEvents';
import { normalizeHex } from '@/utils/color';
import { logger } from '@/utils/logger';
import { rescheduleAppNotifications } from '@/services/holidayNotifications';
import { loadTimerRecords } from '@/utils/timerRecords';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

interface PendingDeletion {
  event: DisplayEvent;
  storageSnapshot: EventsStorage;
}

interface EventFormData {
  name: string;
  dateFormat: EventDateFormat;
  dddValue: string;
  dppValue: string;
  percentValue: string;
  dateValue: Date | null;
  icon?: string;
  iconColor?: string;
  highlightMode?: CardHighlightMode;
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
  } else if (form.dateFormat === 'percent') {
    return eventPercentValidationError(form.percentValue);
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
    percentValue:
      form.dateFormat === 'percent' ? parseEventPercentInput(form.percentValue) ?? undefined : undefined,
    dateValue:
      form.dateFormat === 'date' && form.dateValue
        ? formatISO(form.dateValue, { representation: 'date' })
        : undefined,
    icon: normalizeStoredIconName(form.icon) ?? DEFAULT_EVENT_ICON,
    iconColor: storedIconColor(form.iconColor),
    highlightMode: eventHighlightMode({ highlightMode: form.highlightMode }),
  };
}

function formToOverride(form: EventFormData, eventId?: string): EventOverride {
  if (eventId && isServiceBoundaryEvent(eventId)) {
    return {
      name: form.name.trim(),
      icon: normalizeStoredIconName(form.icon),
      iconColor: storedIconColor(form.iconColor),
      boundaryDisplay: form.highlightMode === 'icon' ? 'icon' : 'row',
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
    percentValue:
      form.dateFormat === 'percent' ? parseEventPercentInput(form.percentValue) ?? undefined : undefined,
    dateValue:
      form.dateFormat === 'date' && form.dateValue
        ? formatISO(form.dateValue, { representation: 'date' })
        : undefined,
    icon: normalizeStoredIconName(form.icon),
    iconColor: storedIconColor(form.iconColor),
    highlightMode: eventHighlightMode({ highlightMode: form.highlightMode }),
  };
}

const eventsStore = createConfigJsonStore<EventsStorage, DisplayEvent[]>({
  key: CONFIG_KEYS.EVENTS_DATA,
  parse: parseEventsStorage,
  validate: async (stored) => {
    const timerRecords = await loadTimerRecords();
    if (!timerRecords.enlistmentDate || !timerRecords.demobilizationDate) {
      return { value: stored, changed: false };
    }
    const migration = migrateEventsStorage(
      stored,
      timerRecords.enlistmentDate,
      timerRecords.demobilizationDate,
    );
    return { value: migration.storage, changed: migration.changed };
  },
  toDisplay: async (stored) => {
    const { activeTimer } = await loadTimerRecords();
    if (!activeTimer) {
      return [];
    }
    return buildDisplayEvents(activeTimer.startDate, activeTimer.endDate, stored);
  },
  afterPersist: () => {
    void rescheduleAppNotifications();
  },
});

/** Загружает и управляет списком событий службы */
export function useEvents(): UseEventsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [storage, setStorage] = useState<EventsStorage>(DEFAULT_EVENTS_STORAGE);
  const storageRef = useRef(storage);
  storageRef.current = storage;
  const refreshEventsRef = useRef<(nextStorage: EventsStorage) => Promise<void>>(async () => {});

  const {
    pending: pendingDeletion,
    schedule: scheduleUndo,
    undo: undoDelete,
  } = useUndoableDelete<PendingDeletion>({
    onRestore: async (pending) => {
      await refreshEventsRef.current(pending.storageSnapshot);
    },
  });

  const reload = useCallback(async () => {
    try {
      const { stored, display } = await eventsStore.load();
      storageRef.current = stored;
      setStorage(stored);
      setEvents(display);
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
    const display = await eventsStore.save(nextStorage);
    storageRef.current = nextStorage;
    setStorage(nextStorage);
    setEvents(display);
  }, []);

  refreshEventsRef.current = refreshEvents;

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

      await refreshEvents(nextStorage);
      await scheduleUndo({ event, storageSnapshot: snapshot });
    },
    [refreshEvents, scheduleUndo],
  );

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
