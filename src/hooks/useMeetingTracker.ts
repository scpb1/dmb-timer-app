import { useCallback, useEffect, useRef, useState } from 'react';
import { formatISO } from 'date-fns';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';

import { CONFIG_KEYS } from '@/types/config';
import {
  type MeetingEntry,
  type MeetingMediaItem,
  type MeetingsStorage,
  DEFAULT_MEETINGS_STORAGE,
  normalizeMoods,
  type TrackerMood,
} from '@/types/trackers';
import { getConfig, setConfig } from '@/services/database';
import { logger } from '@/utils/logger';

interface MeetingEntryInput {
  durationSeconds: number;
  moods?: TrackerMood[];
  mediaItems?: MeetingMediaItem[];
  impressions?: string;
}

interface UseMeetingTrackerResult {
  isLoading: boolean;
  entries: MeetingEntry[];
  reload: () => Promise<void>;
  addEntry: (date: string, input: MeetingEntryInput) => Promise<boolean>;
  updateEntry: (id: string, input: MeetingEntryInput) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<void>;
}

type LegacyMeetingEntry = MeetingEntry & {
  mood?: TrackerMood;
  note?: string;
};

function migrateMeetingEntry(entry: LegacyMeetingEntry): MeetingEntry {
  const { mood, note, mediaUri, mediaType, ...rest } = entry;

  let mediaItems = rest.mediaItems;
  if (!mediaItems?.length && mediaUri && mediaType) {
    mediaItems = [{ uri: mediaUri, type: mediaType }];
  }

  return {
    ...rest,
    mediaItems,
    moods: normalizeMoods(rest.moods, mood),
    impressions: rest.impressions ?? note,
  };
}

function parseMeetingsStorage(raw: string | null): MeetingsStorage {
  if (!raw) {
    return DEFAULT_MEETINGS_STORAGE;
  }

  try {
    const parsed = JSON.parse(raw) as MeetingsStorage;
    if (!Array.isArray(parsed.entries)) {
      return DEFAULT_MEETINGS_STORAGE;
    }
    return {
      entries: parsed.entries.map((entry) => migrateMeetingEntry(entry as LegacyMeetingEntry)),
    };
  } catch {
    return DEFAULT_MEETINGS_STORAGE;
  }
}

async function persistMeetings(storage: MeetingsStorage): Promise<void> {
  await setConfig(CONFIG_KEYS.TRACKERS_MEETINGS_DATA, JSON.stringify(storage));
}

async function ensureMeetingsDirectory(): Promise<string> {
  const dir = `${FileSystem.documentDirectory}tracker-meetings/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

function getMediaExtension(uri: string, mediaType: 'photo' | 'video'): string {
  const fromUri = uri.split('.').pop()?.split('?')[0];
  if (fromUri && fromUri.length <= 5) {
    return fromUri;
  }
  return mediaType === 'video' ? 'mp4' : 'jpg';
}

async function saveMediaItems(
  entryId: string,
  items: MeetingMediaItem[],
): Promise<MeetingMediaItem[]> {
  const dir = await ensureMeetingsDirectory();
  const saved: MeetingMediaItem[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item.uri.startsWith(dir)) {
      saved.push(item);
      continue;
    }

    const extension = getMediaExtension(item.uri, item.type);
    const dest = `${dir}${entryId}-${index}.${extension}`;

    try {
      await FileSystem.copyAsync({ from: item.uri, to: dest });
      saved.push({ uri: dest, type: item.type });
    } catch (error) {
      logger.error('Ошибка сохранения медиа', error);
    }
  }

  return saved;
}

async function deleteMediaItems(items?: MeetingMediaItem[]) {
  if (!items?.length) {
    return;
  }

  for (const item of items) {
    try {
      const info = await FileSystem.getInfoAsync(item.uri);
      if (info.exists) {
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
      }
    } catch (error) {
      logger.error('Ошибка удаления медиа', error);
    }
  }
}

/** Загружает и управляет записями встреч */
export function useMeetingTracker(): UseMeetingTrackerResult {
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<MeetingEntry[]>([]);
  const storageRef = useRef<MeetingsStorage>(DEFAULT_MEETINGS_STORAGE);

  const reload = useCallback(async () => {
    try {
      const raw = await getConfig(CONFIG_KEYS.TRACKERS_MEETINGS_DATA);
      const storage = parseMeetingsStorage(raw);
      storageRef.current = storage;
      setEntries(storage.entries);
    } catch (error) {
      logger.error('Ошибка загрузки встреч', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addEntry = useCallback(async (date: string, input: MeetingEntryInput): Promise<boolean> => {
    try {
      const id = Crypto.randomUUID();
      const mediaItems = input.mediaItems?.length
        ? await saveMediaItems(id, input.mediaItems)
        : undefined;

      const record: MeetingEntry = {
        id,
        date,
        durationSeconds: input.durationSeconds,
        moods: input.moods?.length ? input.moods : undefined,
        mediaItems,
        impressions: input.impressions?.trim() || undefined,
        createdAt: formatISO(new Date()),
      };

      const nextStorage: MeetingsStorage = {
        entries: [...storageRef.current.entries, record],
      };

      await persistMeetings(nextStorage);
      storageRef.current = nextStorage;
      setEntries(nextStorage.entries);
      return true;
    } catch (error) {
      logger.error('Ошибка добавления встречи', error);
      return false;
    }
  }, []);

  const updateEntry = useCallback(async (id: string, input: MeetingEntryInput): Promise<boolean> => {
    try {
      const existing = storageRef.current.entries.find((entry) => entry.id === id);
      if (!existing) {
        return false;
      }

      let mediaItems = existing.mediaItems;
      if (input.mediaItems) {
        await deleteMediaItems(existing.mediaItems);
        mediaItems = await saveMediaItems(id, input.mediaItems);
      }

      const nextStorage: MeetingsStorage = {
        entries: storageRef.current.entries.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                durationSeconds: input.durationSeconds,
                moods: input.moods?.length ? input.moods : undefined,
                mediaItems,
                impressions: input.impressions?.trim() || undefined,
              }
            : entry,
        ),
      };

      await persistMeetings(nextStorage);
      storageRef.current = nextStorage;
      setEntries(nextStorage.entries);
      return true;
    } catch (error) {
      logger.error('Ошибка обновления встречи', error);
      return false;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const target = storageRef.current.entries.find((entry) => entry.id === id);
      await deleteMediaItems(target?.mediaItems);

      const nextStorage: MeetingsStorage = {
        entries: storageRef.current.entries.filter((entry) => entry.id !== id),
      };

      await persistMeetings(nextStorage);
      storageRef.current = nextStorage;
      setEntries(nextStorage.entries);
    } catch (error) {
      logger.error('Ошибка удаления встречи', error);
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

export type { MeetingEntryInput };
