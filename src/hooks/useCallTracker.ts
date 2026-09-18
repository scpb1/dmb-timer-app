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
  durationSeconds: number;
  moods?: TrackerMood[];
  audioUri?: string;
  audioName?: string;
  impressions?: string;
}

interface UseCallTrackerResult {
  isLoading: boolean;
  entries: CallEntry[];
  reload: () => Promise<void>;
  addEntry: (date: string, input: CallEntryInput) => Promise<boolean>;
  updateEntry: (id: string, input: CallEntryInput) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<void>;
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
  const storageRef = useRef<CallsStorage>(DEFAULT_CALLS_STORAGE);

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

  const updateEntry = useCallback(async (id: string, input: CallEntryInput): Promise<boolean> => {
    try {
      const existing = storageRef.current.entries.find((entry) => entry.id === id);
      if (!existing) {
        return false;
      }

      let audioUri = input.audioUri ?? existing.audioUri;
      let audioName = input.audioName ?? existing.audioName;

      if (input.audioUri && input.audioUri !== existing.audioUri) {
        const saved = await saveAudioFile(input.audioUri, id);
        audioUri = saved ?? existing.audioUri;
        audioName = input.audioName;
      }

      const nextStorage: CallsStorage = {
        entries: storageRef.current.entries.map((entry) =>
          entry.id === id
            ? {
                ...entry,
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
      const target = storageRef.current.entries.find((entry) => entry.id === id);
      if (target?.audioUri) {
        const info = await FileSystem.getInfoAsync(target.audioUri);
        if (info.exists) {
          await FileSystem.deleteAsync(target.audioUri, { idempotent: true });
        }
      }

      const nextStorage: CallsStorage = {
        entries: storageRef.current.entries.filter((entry) => entry.id !== id),
      };

      await persistCalls(nextStorage);
      storageRef.current = nextStorage;
      setEntries(nextStorage.entries);
    } catch (error) {
      logger.error('Ошибка удаления звонка', error);
    }
  }, []);

  return {
    isLoading,
    entries,
    reload,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}

export type { CallEntryInput };
