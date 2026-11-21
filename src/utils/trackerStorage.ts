import {
  type CallEntry,
  type CallsStorage,
  DEFAULT_CALLS_STORAGE,
  DEFAULT_MEETINGS_STORAGE,
  type MeetingEntry,
  type MeetingsStorage,
  normalizeMoods,
  TRACKER_STORAGE_VERSION,
  type TrackerMood,
} from '@/types/trackers';

export function serializeCallsStorage(storage: CallsStorage): string {
  return JSON.stringify({ version: TRACKER_STORAGE_VERSION, entries: storage.entries });
}

export function serializeMeetingsStorage(storage: MeetingsStorage): string {
  return JSON.stringify({ version: TRACKER_STORAGE_VERSION, entries: storage.entries });
}

type LegacyCallEntry = CallEntry & {
  mood?: TrackerMood;
  note?: string;
};

type LegacyMeetingEntry = MeetingEntry & {
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

export function parseCallsStorage(raw: string | null): CallsStorage {
  if (!raw) {
    return DEFAULT_CALLS_STORAGE;
  }

  try {
    const parsed = JSON.parse(raw) as CallsStorage;
    if (!Array.isArray(parsed.entries)) {
      return DEFAULT_CALLS_STORAGE;
    }
    return {
      version: TRACKER_STORAGE_VERSION,
      entries: parsed.entries.map((entry) => migrateCallEntry(entry as LegacyCallEntry)),
    };
  } catch {
    return DEFAULT_CALLS_STORAGE;
  }
}

export function parseMeetingsStorage(raw: string | null): MeetingsStorage {
  if (!raw) {
    return DEFAULT_MEETINGS_STORAGE;
  }

  try {
    const parsed = JSON.parse(raw) as MeetingsStorage;
    if (!Array.isArray(parsed.entries)) {
      return DEFAULT_MEETINGS_STORAGE;
    }
    return {
      version: TRACKER_STORAGE_VERSION,
      entries: parsed.entries.map((entry) => migrateMeetingEntry(entry as LegacyMeetingEntry)),
    };
  } catch {
    return DEFAULT_MEETINGS_STORAGE;
  }
}
