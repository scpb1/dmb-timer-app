import { useCallback, useEffect, useRef, useState } from 'react';
import { formatISO } from 'date-fns';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import {
  type MeetingEntry,
  type MeetingMediaItem,
  type MeetingsStorage,
  DEFAULT_MEETINGS_STORAGE,
  type TrackerMood,
} from '@/types/trackers';
import { createConfigJsonStore } from '@/services/configJsonStore';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { logger } from '@/utils/logger';
import { deleteMeetingMedia, saveMeetingMedia } from '@/utils/trackerMedia';
import { parseMeetingsStorage, serializeMeetingsStorage } from '@/utils/trackerStorage';

interface MeetingEntryInput {
  title?: string;
  startTime?: string;
  endTime?: string;
  durationSeconds: number;
  moods?: TrackerMood[];
  mediaItems?: MeetingMediaItem[];
  impressions?: string;
}

interface PendingDeletion {
  entry: MeetingEntry;
  storageSnapshot: MeetingsStorage;
}

interface UseMeetingTrackerResult {
  isLoading: boolean;
  entries: MeetingEntry[];
  pendingDeletion: PendingDeletion | null;
  reload: () => Promise<void>;
  addEntry: (date: string, input: MeetingEntryInput) => Promise<boolean>;
  updateEntry: (id: string, date: string, input: MeetingEntryInput) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
}

const meetingsStore = createConfigJsonStore<MeetingsStorage>({
  key: CONFIG_KEYS.TRACKERS_MEETINGS_DATA,
  parse: parseMeetingsStorage,
  remember: true,
  serialize: serializeMeetingsStorage,
});

/** Загружает и управляет записями встреч */
export function useMeetingTracker(options?: { enabled?: boolean }): UseMeetingTrackerResult {
  const enabled = options?.enabled !== false;
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<MeetingEntry[]>([]);
  const storageRef = useRef<MeetingsStorage>(DEFAULT_MEETINGS_STORAGE);

  const applyStorage = useCallback((storage: MeetingsStorage) => {
    storageRef.current = storage;
    setEntries(storage.entries);
  }, []);

  const {
    pending: pendingDeletion,
    commitCurrent: commitPendingDelete,
    schedule: scheduleUndo,
    undo: undoDelete,
  } = useUndoableDelete<PendingDeletion>({
    onCommit: async (pending) => {
      await deleteMeetingMedia(pending.entry.mediaItems);
    },
    onRestore: async (pending) => {
      await meetingsStore.save(pending.storageSnapshot);
      applyStorage(pending.storageSnapshot);
    },
  });

  const reload = useCallback(async () => {
    try {
      const { stored } = await meetingsStore.load();
      applyStorage(stored);
    } catch (error) {
      logger.error('Ошибка загрузки встреч', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [applyStorage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void reload();
  }, [enabled, reload]);

  const addEntry = useCallback(async (date: string, input: MeetingEntryInput): Promise<boolean> => {
    try {
      const id = Crypto.randomUUID();
      const mediaItems = input.mediaItems?.length
        ? await saveMeetingMedia(id, input.mediaItems)
        : undefined;

      const record: MeetingEntry = {
        id,
        date,
        title: input.title?.trim() || undefined,
        startTime: input.startTime,
        endTime: input.endTime,
        durationSeconds: input.durationSeconds,
        moods: input.moods?.length ? input.moods : undefined,
        mediaItems,
        impressions: input.impressions?.trim() || undefined,
        createdAt: formatISO(new Date()),
      };

      const nextStorage: MeetingsStorage = {
        entries: [...storageRef.current.entries, record],
      };
      await meetingsStore.save(nextStorage);
      applyStorage(nextStorage);
      return true;
    } catch (error) {
      logger.error('Ошибка добавления встречи', error);
      return false;
    }
  }, [applyStorage]);

  const updateEntry = useCallback(async (id: string, date: string, input: MeetingEntryInput): Promise<boolean> => {
    try {
      const existing = storageRef.current.entries.find((entry) => entry.id === id);
      if (!existing) {
        return false;
      }

      const nextItems = input.mediaItems ?? [];
      const nextUris = new Set(nextItems.map((item) => item.uri));
      await deleteMeetingMedia((existing.mediaItems ?? []).filter((item) => !nextUris.has(item.uri)));
      const mediaItems = nextItems.length > 0 ? await saveMeetingMedia(id, nextItems) : undefined;

      const nextStorage: MeetingsStorage = {
        entries: storageRef.current.entries.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                date,
                title: input.title?.trim() || undefined,
                startTime: input.startTime,
                endTime: input.endTime,
                durationSeconds: input.durationSeconds,
                moods: input.moods?.length ? input.moods : undefined,
                mediaItems,
                impressions: input.impressions?.trim() || undefined,
              }
            : entry,
        ),
      };

      await meetingsStore.save(nextStorage);
      applyStorage(nextStorage);
      return true;
    } catch (error) {
      logger.error('Ошибка обновления встречи', error);
      return false;
    }
  }, [applyStorage]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await commitPendingDelete();

      const target = storageRef.current.entries.find((entry) => entry.id === id);
      if (!target) {
        return;
      }

      const snapshot = storageRef.current;
      const nextStorage: MeetingsStorage = {
        entries: snapshot.entries.filter((entry) => entry.id !== id),
      };

      await meetingsStore.save(nextStorage);
      applyStorage(nextStorage);
      await scheduleUndo({ entry: target, storageSnapshot: snapshot });
    } catch (error) {
      logger.error('Ошибка удаления встречи', error);
    }
  }, [applyStorage, commitPendingDelete, scheduleUndo]);

  return {
    isLoading,
    entries,
    pendingDeletion,
    reload,
    addEntry,
    updateEntry,
    deleteEntry,
    undoDelete,
  };
}

export type { MeetingEntryInput };
