import { CONFIG_KEYS } from '@/types/config';

/** Фокус главной не читает SQLite, если снимок моложе этого окна и записей не было. */
export const TIMER_SNAPSHOT_TTL_MS = 5000;

export const TIMER_SETTINGS_KEYS = [
  CONFIG_KEYS.TIMER_TYPE,
  CONFIG_KEYS.PROGRESS_BAR_MODE,
  CONFIG_KEYS.PERCENT_DECIMAL_PLACES,
  CONFIG_KEYS.TIMER_CENTER_DISPLAY,
  CONFIG_KEYS.STAT_CARD_MODE,
  CONFIG_KEYS.TIMER_BACKGROUND_IMAGE,
  CONFIG_KEYS.TIMER_BACKGROUND_FOCUS_X,
  CONFIG_KEYS.TIMER_BACKGROUND_FOCUS_Y,
  CONFIG_KEYS.TIMER_BACKGROUND_DIM,
  CONFIG_KEYS.TIMER_UPCOMING_PREVIEW,
  CONFIG_KEYS.TIMER_UPCOMING_PINNED_REF,
  CONFIG_KEYS.TIMER_PHOTO_STAT_BORDER,
  CONFIG_KEYS.TIMER_PHOTO_UPCOMING_BORDER,
  CONFIG_KEYS.DOT_GRID_CELL_SHAPE,
  CONFIG_KEYS.MILESTONES_LAYOUT,
] as const;

export const TIMER_RECORD_KEYS = [
  CONFIG_KEYS.ENLISTMENT_DATE,
  CONFIG_KEYS.DEMOBILIZATION_DATE,
  CONFIG_KEYS.CUSTOM_TIMERS_DATA,
  CONFIG_KEYS.ACTIVE_TIMER_ID,
  CONFIG_KEYS.PARTNER_NAME,
] as const;

export const TIMER_SNAPSHOT_KEYS = [...TIMER_RECORD_KEYS, ...TIMER_SETTINGS_KEYS] as const;

const snapshotKeySet = new Set<string>(TIMER_SNAPSHOT_KEYS);

let dirty = true;
let freshAt = 0;
let epoch = 0;

export function markTimerSnapshotDirty(): void {
  dirty = true;
  epoch += 1;
}

export function markTimerSnapshotFresh(): void {
  dirty = false;
  freshAt = Date.now();
}

export function isTimerSnapshotFresh(now = Date.now()): boolean {
  return !dirty && now - freshAt < TIMER_SNAPSHOT_TTL_MS;
}

export function timerSnapshotEpoch(): number {
  return epoch;
}

/** Запись ключа таймера делает снимок устаревшим. Остальные ключи config не трогает. */
export function noteTimerConfigWrite(key: string): void {
  if (snapshotKeySet.has(key)) {
    markTimerSnapshotDirty();
  }
}
