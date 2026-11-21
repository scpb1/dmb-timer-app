import { CONFIG_KEYS } from '@/types/config';
import {
  DEFAULT_TIMER_SETTINGS,
  normalizeProgressBarMode,
  type ProgressBarMode,
  type StatCardMode,
  type TimerCenterDisplay,
  type TimerSettings,
  type TimerType,
  type TimerUpcomingPreviewMode,
} from '@/types/timer';
import { getConfigs, setConfig } from '@/services/database';
import { registerMemoryCacheReset } from '@/services/memoryCaches';
import { markTimerSnapshotDirty, TIMER_SETTINGS_KEYS } from '@/services/timerSnapshot';
import { clampBackgroundFocus, formatBackgroundFocus } from '@/utils/coverImageFrame';
import { clampBackgroundDim, DEFAULT_BACKGROUND_DIM } from '@/utils/timerBackground';

/** Чтобы вложенные экраны не мигали дефолтами, пока грузится SQLite */
let cachedTimerSettings: TimerSettings | null = null;

export function getCachedTimerSettings(): TimerSettings | null {
  return cachedTimerSettings;
}

export function clearTimerSettingsCache(): void {
  cachedTimerSettings = null;
  markTimerSnapshotDirty();
}

export function rememberTimerSettings(settings: TimerSettings): void {
  cachedTimerSettings = settings;
}

registerMemoryCacheReset(clearTimerSettingsCache);

function parseBoolConfig(value: string | null, defaultValue: boolean): boolean {
  if (value == null || value === '') {
    return defaultValue;
  }
  if (value === '0' || value === 'false') {
    return false;
  }
  if (value === '1' || value === 'true') {
    return true;
  }
  return defaultValue;
}

export function parseTimerSettings(
  timerType: string | null,
  progressBarMode: string | null,
  decimalPlaces: string | null,
  centerDisplay: string | null,
  statCardMode: string | null,
  backgroundImageUri: string | null,
  backgroundFocusX: string | null,
  backgroundFocusY: string | null,
  backgroundDim: string | null,
  timerUpcomingPreview: string | null,
  timerUpcomingPinnedRef: string | null,
  photoStatCardBorder: string | null,
  photoUpcomingCardBorder: string | null,
  dotGridCellShape: string | null,
  milestonesLayout: string | null,
): TimerSettings {
  const validModes: ProgressBarMode[] = ['percent', 'days', 'weeks', 'months'];
  const validStatCardModes: StatCardMode[] = ['days', 'weeks', 'months'];
  const validTypes: TimerType[] = ['circular', 'linear', 'frame', 'dotGrid', 'milestones'];
  const validDotGridShapes = ['circle', 'heart'] as const;
  const validMilestonesLayouts = ['spine', 'chips', 'checklist'] as const;
  const validCenterDisplays: TimerCenterDisplay[] = ['remaining', 'elapsed'];
  const validUpcomingModes: TimerUpcomingPreviewMode[] = ['off', 'nearest', 'pinned'];
  const mode =
    progressBarMode && validModes.includes(progressBarMode as ProgressBarMode)
      ? (progressBarMode as ProgressBarMode)
      : DEFAULT_TIMER_SETTINGS.progressBarMode;

  const cardMode =
    statCardMode && validStatCardModes.includes(statCardMode as StatCardMode)
      ? (statCardMode as StatCardMode)
      : DEFAULT_TIMER_SETTINGS.statCardMode;

  const type =
    timerType && validTypes.includes(timerType as TimerType)
      ? (timerType as TimerType)
      : DEFAULT_TIMER_SETTINGS.timerType;

  const normalizedMode = normalizeProgressBarMode(type, mode);

  const parsedDecimals =
    decimalPlaces == null || decimalPlaces === '' ? NaN : Number(decimalPlaces);
  const percentDecimalPlaces =
    Number.isFinite(parsedDecimals) && parsedDecimals >= 0 && parsedDecimals <= 6
      ? parsedDecimals
      : DEFAULT_TIMER_SETTINGS.percentDecimalPlaces;

  const display =
    centerDisplay && validCenterDisplays.includes(centerDisplay as TimerCenterDisplay)
      ? (centerDisplay as TimerCenterDisplay)
      : DEFAULT_TIMER_SETTINGS.centerDisplay;

  const upcomingPreview =
    timerUpcomingPreview &&
    validUpcomingModes.includes(timerUpcomingPreview as TimerUpcomingPreviewMode)
      ? (timerUpcomingPreview as TimerUpcomingPreviewMode)
      : DEFAULT_TIMER_SETTINGS.timerUpcomingPreview;

  const pinnedRef = timerUpcomingPinnedRef?.trim() || null;

  return {
    timerType: type,
    progressBarMode: normalizedMode,
    percentDecimalPlaces,
    centerDisplay: display,
    statCardMode: cardMode,
    backgroundImageUri: backgroundImageUri || null,
    backgroundFocusX:
      backgroundFocusX == null || backgroundFocusX === ''
        ? DEFAULT_TIMER_SETTINGS.backgroundFocusX
        : clampBackgroundFocus(Number(backgroundFocusX)),
    backgroundFocusY:
      backgroundFocusY == null || backgroundFocusY === ''
        ? DEFAULT_TIMER_SETTINGS.backgroundFocusY
        : clampBackgroundFocus(Number(backgroundFocusY)),
    backgroundDim:
      backgroundDim == null || backgroundDim === ''
        ? DEFAULT_BACKGROUND_DIM
        : clampBackgroundDim(Number(backgroundDim)),
    timerUpcomingPreview: upcomingPreview,
    timerUpcomingPinnedRef: pinnedRef,
    photoStatCardBorder: parseBoolConfig(
      photoStatCardBorder,
      DEFAULT_TIMER_SETTINGS.photoStatCardBorder,
    ),
    photoUpcomingCardBorder: parseBoolConfig(
      photoUpcomingCardBorder,
      DEFAULT_TIMER_SETTINGS.photoUpcomingCardBorder,
    ),
    dotGridCellShape:
      dotGridCellShape &&
      validDotGridShapes.includes(dotGridCellShape as (typeof validDotGridShapes)[number])
        ? (dotGridCellShape as TimerSettings['dotGridCellShape'])
        : DEFAULT_TIMER_SETTINGS.dotGridCellShape,
    milestonesLayout:
      milestonesLayout &&
      validMilestonesLayouts.includes(milestonesLayout as (typeof validMilestonesLayouts)[number])
        ? (milestonesLayout as TimerSettings['milestonesLayout'])
        : DEFAULT_TIMER_SETTINGS.milestonesLayout,
  };
}

export function timerSettingsFromConfig(
  values: Record<string, string | null>,
): TimerSettings {
  const read = (key: (typeof TIMER_SETTINGS_KEYS)[number]) => values[key] ?? null;
  return parseTimerSettings(
    read(CONFIG_KEYS.TIMER_TYPE),
    read(CONFIG_KEYS.PROGRESS_BAR_MODE),
    read(CONFIG_KEYS.PERCENT_DECIMAL_PLACES),
    read(CONFIG_KEYS.TIMER_CENTER_DISPLAY),
    read(CONFIG_KEYS.STAT_CARD_MODE),
    read(CONFIG_KEYS.TIMER_BACKGROUND_IMAGE),
    read(CONFIG_KEYS.TIMER_BACKGROUND_FOCUS_X),
    read(CONFIG_KEYS.TIMER_BACKGROUND_FOCUS_Y),
    read(CONFIG_KEYS.TIMER_BACKGROUND_DIM),
    read(CONFIG_KEYS.TIMER_UPCOMING_PREVIEW),
    read(CONFIG_KEYS.TIMER_UPCOMING_PINNED_REF),
    read(CONFIG_KEYS.TIMER_PHOTO_STAT_BORDER),
    read(CONFIG_KEYS.TIMER_PHOTO_UPCOMING_BORDER),
    read(CONFIG_KEYS.DOT_GRID_CELL_SHAPE),
    read(CONFIG_KEYS.MILESTONES_LAYOUT),
  );
}

export async function loadTimerSettings(): Promise<TimerSettings> {
  return timerSettingsFromConfig(await getConfigs(TIMER_SETTINGS_KEYS));
}

export function persistTimerSettingsDiff(prev: TimerSettings, next: TimerSettings): Promise<unknown[]> {
  const writes: Promise<unknown>[] = [];
  const add = (key: (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS], previous: string, value: string) => {
    if (previous !== value) {
      writes.push(setConfig(key, value));
    }
  };

  add(CONFIG_KEYS.TIMER_TYPE, prev.timerType, next.timerType);
  add(CONFIG_KEYS.PROGRESS_BAR_MODE, prev.progressBarMode, next.progressBarMode);
  add(
    CONFIG_KEYS.PERCENT_DECIMAL_PLACES,
    String(prev.percentDecimalPlaces),
    String(next.percentDecimalPlaces),
  );
  add(CONFIG_KEYS.TIMER_CENTER_DISPLAY, prev.centerDisplay, next.centerDisplay);
  add(CONFIG_KEYS.STAT_CARD_MODE, prev.statCardMode, next.statCardMode);
  add(CONFIG_KEYS.TIMER_BACKGROUND_DIM, String(prev.backgroundDim), String(next.backgroundDim));
  add(
    CONFIG_KEYS.TIMER_BACKGROUND_FOCUS_X,
    formatBackgroundFocus(prev.backgroundFocusX),
    formatBackgroundFocus(next.backgroundFocusX),
  );
  add(
    CONFIG_KEYS.TIMER_BACKGROUND_FOCUS_Y,
    formatBackgroundFocus(prev.backgroundFocusY),
    formatBackgroundFocus(next.backgroundFocusY),
  );
  add(CONFIG_KEYS.TIMER_UPCOMING_PREVIEW, prev.timerUpcomingPreview, next.timerUpcomingPreview);
  add(
    CONFIG_KEYS.TIMER_UPCOMING_PINNED_REF,
    prev.timerUpcomingPinnedRef ?? '',
    next.timerUpcomingPinnedRef ?? '',
  );
  add(
    CONFIG_KEYS.TIMER_PHOTO_STAT_BORDER,
    prev.photoStatCardBorder ? '1' : '0',
    next.photoStatCardBorder ? '1' : '0',
  );
  add(
    CONFIG_KEYS.TIMER_PHOTO_UPCOMING_BORDER,
    prev.photoUpcomingCardBorder ? '1' : '0',
    next.photoUpcomingCardBorder ? '1' : '0',
  );
  add(CONFIG_KEYS.DOT_GRID_CELL_SHAPE, prev.dotGridCellShape, next.dotGridCellShape);
  add(CONFIG_KEYS.MILESTONES_LAYOUT, prev.milestonesLayout, next.milestonesLayout);
  add(
    CONFIG_KEYS.TIMER_BACKGROUND_IMAGE,
    prev.backgroundImageUri ?? '',
    next.backgroundImageUri ?? '',
  );

  return Promise.all(writes);
}
