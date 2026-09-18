export type TrackerTab = 'calls' | 'meetings';

/** Порядок: от позитивных к негативным (по valence / arousal) */
export const TRACKER_MOODS = [
  {
    id: 'blissful',
    label: 'Счастлива',
    icon: 'sun',
    iconSet: 'feather',
    color: '#D4A017',
    bgColor: 'rgba(255, 236, 179, 0.55)',
  },
  {
    id: 'happy',
    label: 'Рада',
    icon: 'smile',
    iconSet: 'feather',
    color: '#E6A23C',
    bgColor: 'rgba(255, 224, 178, 0.55)',
  },
  {
    id: 'excitement',
    label: 'Волнение',
    icon: 'activity',
    iconSet: 'feather',
    color: '#E67E5A',
    bgColor: 'rgba(255, 204, 188, 0.55)',
  },
  {
    id: 'neutral',
    label: 'Нейтрально',
    icon: 'minus',
    iconSet: 'feather',
    color: '#9E9E9E',
    bgColor: 'rgba(224, 224, 224, 0.55)',
  },
  {
    id: 'embarrassment',
    label: 'Смущение',
    icon: 'emoticon-confused-outline',
    iconSet: 'material',
    color: '#E891A9',
    bgColor: 'rgba(248, 187, 208, 0.5)',
  },
  {
    id: 'shame',
    label: 'Стыд',
    icon: 'eye-off',
    iconSet: 'feather',
    color: '#B085C4',
    bgColor: 'rgba(225, 190, 231, 0.5)',
  },
  {
    id: 'fear',
    label: 'Страх',
    icon: 'alert-triangle',
    iconSet: 'feather',
    color: '#9FA8DA',
    bgColor: 'rgba(197, 202, 233, 0.55)',
  },
  {
    id: 'angry',
    label: 'Злюсь',
    icon: 'zap',
    iconSet: 'feather',
    color: '#E57373',
    bgColor: 'rgba(255, 205, 210, 0.55)',
  },
  {
    id: 'sad',
    label: 'Грущу',
    icon: 'cloud',
    iconSet: 'feather',
    color: '#81B4D9',
    bgColor: 'rgba(187, 222, 251, 0.55)',
  },
  {
    id: 'empty',
    label: 'Пустота',
    icon: 'circle',
    iconSet: 'feather',
    color: '#90A4AE',
    bgColor: 'rgba(207, 216, 220, 0.55)',
  },
  {
    id: 'crying',
    label: 'Плачу',
    icon: 'droplet',
    iconSet: 'feather',
    color: '#7EB8DA',
    bgColor: 'rgba(179, 229, 252, 0.55)',
  },
] as const;

export type TrackerMood = (typeof TRACKER_MOODS)[number]['id'];

/** @deprecated используй TRACKER_MOODS */
export const CALL_MOODS = TRACKER_MOODS;

/** @deprecated используй TrackerMood */
export type CallMood = TrackerMood;

export interface MeetingMediaItem {
  uri: string;
  type: 'photo' | 'video';
}

export interface CallEntry {
  id: string;
  date: string;
  durationSeconds: number;
  moods?: TrackerMood[];
  audioUri?: string;
  audioName?: string;
  impressions?: string;
  createdAt: string;
}

export interface MeetingEntry {
  id: string;
  date: string;
  durationSeconds: number;
  moods?: TrackerMood[];
  mediaItems?: MeetingMediaItem[];
  /** @deprecated мигрируется в mediaItems */
  mediaUri?: string;
  /** @deprecated мигрируется в mediaItems */
  mediaType?: 'photo' | 'video';
  impressions?: string;
  createdAt: string;
}

export interface CallsStorage {
  entries: CallEntry[];
}

export interface MeetingsStorage {
  entries: MeetingEntry[];
}

export const DEFAULT_CALLS_STORAGE: CallsStorage = { entries: [] };
export const DEFAULT_MEETINGS_STORAGE: MeetingsStorage = { entries: [] };

export function getMoodMeta(moodId: TrackerMood) {
  return TRACKER_MOODS.find((item) => item.id === moodId);
}

export function normalizeMoods(
  moods?: TrackerMood[],
  legacyMood?: TrackerMood,
): TrackerMood[] | undefined {
  if (moods && moods.length > 0) {
    return moods;
  }
  if (legacyMood) {
    return [legacyMood];
  }
  return undefined;
}

export function getMeetingPhotos(entry: MeetingEntry): string[] {
  if (entry.mediaItems?.length) {
    return entry.mediaItems.filter((item) => item.type === 'photo').map((item) => item.uri);
  }
  if (entry.mediaUri && entry.mediaType === 'photo') {
    return [entry.mediaUri];
  }
  return [];
}

export function getMeetingVideos(entry: MeetingEntry): MeetingMediaItem[] {
  if (entry.mediaItems?.length) {
    return entry.mediaItems.filter((item) => item.type === 'video');
  }
  if (entry.mediaUri && entry.mediaType === 'video') {
    return [{ uri: entry.mediaUri, type: 'video' }];
  }
  return [];
}

export function getMeetingMediaCount(entry: MeetingEntry): { photos: number; videos: number } {
  return {
    photos: getMeetingPhotos(entry).length,
    videos: getMeetingVideos(entry).length,
  };
}
