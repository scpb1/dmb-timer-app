import { useCallback, useEffect, useRef, useState } from 'react';
import { formatISO } from 'date-fns';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';

import { CONFIG_KEYS } from '@/types/config';
import {
  type CallEntry,
  type CallsStorage,
  DEFAULT_CALLS_STORAGE,
  normalizeMoods,
  type TrackerMood,
} from '@/types/trackers';
import { getConfig, setConfig } from '@/services/database';
import { logger } from '@/utils/logger';

interface CallEntryInput {
  title?: string;
  durationSeconds: number;
  moods?: TrackerMood[];
  audioUri?: string;
  audioName?: string;
  impressions?: string;
}

const UNDO_TIMEOUT_MS = 5000;

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

type LegacyCallEntry = CallEntry & {
  mood?: TrackerMood;
  note?: string;
};

function migrateCallEntry(entry: LegacyCallEntry): CallEntry {
  const { mood, note, ...rest } = entry;
  return {
    ...rest,
    moods: normalizeMoods(rest.moods, mood),
    impressions: rest.impressions ?? note,
  };
}

function parseCallsStorage(raw: string | null): CallsStorage {
  if (!raw) {
    return DEFAULT_CALLS_STORAGE;
  }

  try {
    const parsed = JSON.parse(raw) as CallsStorage;
    if (!Array.isArray(parsed.entries)) {
      return DEFAULT_CALLS_STORAGE;
    }
    return { entries: parsed.entries.map((entry) => migrateCallEntry(entry as LegacyCallEntry)) };
  } catch {
    return DEFAULT_CALLS_STORAGE;
  }
}

async function persistCalls(storage: CallsStorage): Promise<void> {
  await setConfig(CONFIG_KEYS.TRACKERS_CALLS_DATA, JSON.stringify(storage));
}

async function ensureCallsDirectory(): Promise<string> {
  const dir = `${FileSystem.documentDirectory}tracker-calls/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

async function saveAudioFile(sourceUri: string, entryId: string): Promise<string | null> {
  try {
    const dir = await ensureCallsDirectory();
    const extension = sourceUri.split('.').pop()?.split('?')[0] ?? 'm4a';
    const dest = `${dir}${entryId}.${extension}`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch (error) {
    logger.error('Ошибка сохранения аудио', error);
    return null;
  }
}

/** Загружает и управляет записями звонков */
export function useCallTracker(): UseCallTrackerResult {
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<CallEntry[]>([]);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const storageRef = useRef<CallsStorage>(DEFAULT_CALLS_STORAGE);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeletionRef = useRef<PendingDeletion | null>(null);
  pendingDeletionRef.current = pendingDeletion;

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const commitPendingMedia = useCallback(async (pending: PendingDeletion) => {
    if (!pending.entry.audioUri) {
      return;
    }

    try {
      const info = await FileSystem.getInfoAsync(pending.entry.audioUri);
      if (info.exists) {
        await FileSystem.deleteAsync(pending.entry.audioUri, { idempotent: true });
      }
    } catch (error) {
      logger.error('Ошибка удаления аудио', error);
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      const raw = await getConfig(CONFIG_KEYS.TRACKERS_CALLS_DATA);
      const storage = parseCallsStorage(raw);
      storageRef.current = storage;
      setEntries(storage.entries);
    } catch (error) {
      logger.error('Ошибка загрузки звонков', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addEntry = useCallback(async (date: string, input: CallEntryInput): Promise<boolean> => {
    try {
      const id = Crypto.randomUUID();
      let audioUri = input.audioUri;

      if (audioUri) {
        const saved = await saveAudioFile(audioUri, id);
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

      await persistCalls(nextStorage);
      storageRef.current = nextStorage;
      setEntries(nextStorage.entries);
      return true;
    } catch (error) {
      logger.error('Ошибка добавления звонка', error);
      return false;
    }
  }, []);

  const updateEntry = useCallback(async (id: string, date: string, input: CallEntryInput): Promise<boolean> => {
    try {
      const existing = storageRef.current.entries.find((entry) => entry.id === id);
      if (!existing) {
        return false;
      }

      let audioUri = input.audioUri;
      let audioName = input.audioName;

      if (input.audioUri && input.audioUri !== existing.audioUri) {
        const saved = await saveAudioFile(input.audioUri, id);
        audioUri = saved ?? existing.audioUri;
        audioName = input.audioName;
        if (existing.audioUri && existing.audioUri !== audioUri) {
          try {
            await FileSystem.deleteAsync(existing.audioUri, { idempotent: true });
          } catch (error) {
            logger.error('Ошибка удаления старого аудио', error);
          }
        }
      } else if (!input.audioUri && existing.audioUri) {
        try {
          await FileSystem.deleteAsync(existing.audioUri, { idempotent: true });
        } catch (error) {
          logger.error('Ошибка удаления аудио', error);
        }
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

      await persistCalls(nextStorage);
      storageRef.current = nextStorage;
      setEntries(nextStorage.entries);
      return true;
    } catch (error) {
      logger.error('Ошибка обновления звонка', error);
      return false;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      clearUndoTimer();
      if (pendingDeletion) {
        await commitPendingMedia(pendingDeletion);
        setPendingDeletion(null);
      }

      const target = storageRef.current.entries.find((entry) => entry.id === id);
      if (!target) {
        return;
      }

      const snapshot = storageRef.current;
      const nextStorage: CallsStorage = {
        entries: snapshot.entries.filter((entry) => entry.id !== id),
      };

      await persistCalls(nextStorage);
      storageRef.current = nextStorage;
      setEntries(nextStorage.entries);
      setPendingDeletion({ entry: target, storageSnapshot: snapshot });

      undoTimerRef.current = setTimeout(() => {
        void commitPendingMedia({ entry: target, storageSnapshot: snapshot });
        setPendingDeletion(null);
        undoTimerRef.current = null;
      }, UNDO_TIMEOUT_MS);
    } catch (error) {
      logger.error('Ошибка удаления звонка', error);
    }
  }, [clearUndoTimer, commitPendingMedia, pendingDeletion]);

  const undoDelete = useCallback(async () => {
    if (!pendingDeletion) {
      return;
    }

    clearUndoTimer();
    await persistCalls(pendingDeletion.storageSnapshot);
    storageRef.current = pendingDeletion.storageSnapshot;
    setEntries(pendingDeletion.storageSnapshot.entries);
    setPendingDeletion(null);
  }, [clearUndoTimer, pendingDeletion]);

  useEffect(() => () => {
    clearUndoTimer();
    if (pendingDeletionRef.current) {
      void commitPendingMedia(pendingDeletionRef.current);
    }
  }, [clearUndoTimer, commitPendingMedia]);

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
