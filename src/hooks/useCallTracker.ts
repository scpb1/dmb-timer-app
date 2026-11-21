import { useCallback, useEffect, useRef, useState } from 'react';
import { formatISO } from 'date-fns';
import * as Crypto from 'expo-crypto';

import { CONFIG_KEYS } from '@/types/config';
import {
  type CallEntry,
  type CallsStorage,
  DEFAULT_CALLS_STORAGE,
  type TrackerMood,
} from '@/types/trackers';
import { createConfigJsonStore } from '@/services/configJsonStore';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { logger } from '@/utils/logger';
import { deleteTrackerFile, saveCallAudio } from '@/utils/trackerMedia';
import { parseCallsStorage, serializeCallsStorage } from '@/utils/trackerStorage';

interface CallEntryInput {
  title?: string;
  durationSeconds: number;
  moods?: TrackerMood[];
  audioUri?: string;
  audioName?: string;
  impressions?: string;
}

interface PendingDeletion {
  entry: CallEntry;
  storageSnapshot: CallsStorage;
}

interface UseCallTrackerResult {
  isLoading: boolean;
  entries: CallEntry[];
  pendingDeletion: PendingDeletion | null;
  reload: () => Promise<void>;
  addEntry: (date: string, input: CallEntryInput) => Promise<boolean>;
  updateEntry: (id: string, date: string, input: CallEntryInput) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
}

const callsStore = createConfigJsonStore<CallsStorage>({
  key: CONFIG_KEYS.TRACKERS_CALLS_DATA,
  parse: parseCallsStorage,
  remember: true,
  serialize: serializeCallsStorage,
});

/** Загружает и управляет записями звонков */
export function useCallTracker(options?: { enabled?: boolean }): UseCallTrackerResult {
  const enabled = options?.enabled !== false;
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<CallEntry[]>([]);
  const storageRef = useRef<CallsStorage>(DEFAULT_CALLS_STORAGE);

  const applyStorage = useCallback((storage: CallsStorage) => {
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
      await deleteTrackerFile(pending.entry.audioUri);
    },
    onRestore: async (pending) => {
      await callsStore.save(pending.storageSnapshot);
      applyStorage(pending.storageSnapshot);
    },
  });

  const reload = useCallback(async () => {
    try {
      const { stored } = await callsStore.load();
      applyStorage(stored);
    } catch (error) {
      logger.error('Ошибка загрузки звонков', error);
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

  const addEntry = useCallback(async (date: string, input: CallEntryInput): Promise<boolean> => {
    try {
      const id = Crypto.randomUUID();
      let audioUri = input.audioUri;

      if (audioUri) {
        const saved = await saveCallAudio(audioUri, id);
        audioUri = saved ?? undefined;
      }

      const record: CallEntry = {
        id,
        date,
        title: input.title?.trim() || undefined,
        durationSeconds: input.durationSeconds,
        moods: input.moods?.length ? input.moods : undefined,
        audioUri,
        audioName: input.audioName,
        impressions: input.impressions?.trim() || undefined,
        createdAt: formatISO(new Date()),
      };

      const nextStorage: CallsStorage = {
        entries: [...storageRef.current.entries, record],
      };
      await callsStore.save(nextStorage);
      applyStorage(nextStorage);
      return true;
    } catch (error) {
      logger.error('Ошибка добавления звонка', error);
      return false;
    }
  }, [applyStorage]);

  const updateEntry = useCallback(async (id: string, date: string, input: CallEntryInput): Promise<boolean> => {
    try {
      const existing = storageRef.current.entries.find((entry) => entry.id === id);
      if (!existing) {
        return false;
      }

      let audioUri = input.audioUri;
      let audioName = input.audioName;

      if (input.audioUri && input.audioUri !== existing.audioUri) {
        const saved = await saveCallAudio(input.audioUri, id);
        audioUri = saved ?? existing.audioUri;
        audioName = input.audioName;
        if (existing.audioUri && existing.audioUri !== audioUri) {
          await deleteTrackerFile(existing.audioUri);
        }
      } else if (!input.audioUri && existing.audioUri) {
        await deleteTrackerFile(existing.audioUri);
      }

      const nextStorage: CallsStorage = {
        entries: storageRef.current.entries.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                date,
                title: input.title?.trim() || undefined,
                durationSeconds: input.durationSeconds,
                moods: input.moods?.length ? input.moods : undefined,
                audioUri,
                audioName,
                impressions: input.impressions?.trim() || undefined,
              }
            : entry,
        ),
      };

      await callsStore.save(nextStorage);
      applyStorage(nextStorage);
      return true;
    } catch (error) {
      logger.error('Ошибка обновления звонка', error);
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
      const nextStorage: CallsStorage = {
        entries: snapshot.entries.filter((entry) => entry.id !== id),
      };

      await callsStore.save(nextStorage);
      applyStorage(nextStorage);
      await scheduleUndo({ entry: target, storageSnapshot: snapshot });
    } catch (error) {
      logger.error('Ошибка удаления звонка', error);
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

export type { CallEntryInput };
