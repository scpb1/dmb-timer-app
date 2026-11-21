import type {
  DotGridCellShape,
  ProgressBarMode,
  StatCardMode,
  TimerCenterDisplay,
} from '@/types/timer';

/** Виджеты на рабочий стол: те же типы таймера, без ленты событий */
export type WidgetTimerKind = 'circular' | 'linear' | 'frame' | 'dotGrid';

export type WidgetFamily = 'timer' | 'holiday' | 'stats';

export type WidgetPreviewSize = 'small' | 'wide' | 'tall';

export type WidgetHolidayMode = 'nearest' | 'pinned';

export interface WidgetSurfaceAppearance {
  backgroundImageUri: string | null;
  backgroundDim: number;
}

export interface WidgetTimerAppearance extends WidgetSurfaceAppearance {
  kind: WidgetTimerKind;
  progressBarMode: ProgressBarMode;
  percentDecimalPlaces: number;
  centerDisplay: TimerCenterDisplay;
  cellShape: DotGridCellShape;
}

export interface WidgetHolidayAppearance extends WidgetSurfaceAppearance {
  mode: WidgetHolidayMode;
  pinnedHolidayId: string | null;
}

export interface WidgetStatsAppearance extends WidgetSurfaceAppearance {
  mode: StatCardMode;
}

export interface WidgetStudioSettings {
  family: WidgetFamily;
  previewSize: WidgetPreviewSize;
  timer: WidgetTimerAppearance;
  holiday: WidgetHolidayAppearance;
  stats: WidgetStatsAppearance;
}

export const WIDGET_TIMER_KINDS: WidgetTimerKind[] = [
  'circular',
  'linear',
  'frame',
  'dotGrid',
];

export const WIDGET_FAMILY_LABELS: Record<WidgetFamily, string> = {
  timer: 'Таймер',
  holiday: 'Праздник',
  stats: 'Плашки',
};

export const WIDGET_PREVIEW_SIZE_LABELS: Record<WidgetPreviewSize, string> = {
  small: '2×2',
  wide: '4×2',
  tall: '2×4',
};

export const WIDGET_HOLIDAY_MODE_LABELS: Record<WidgetHolidayMode, string> = {
  nearest: 'Ближайший',
  pinned: 'Закреплённый',
};

export const DEFAULT_WIDGET_TIMER: WidgetTimerAppearance = {
  kind: 'circular',
  progressBarMode: 'days',
  percentDecimalPlaces: 2,
  centerDisplay: 'remaining',
  cellShape: 'heart',
  backgroundImageUri: null,
  backgroundDim: 32,
};

export const DEFAULT_WIDGET_HOLIDAY: WidgetHolidayAppearance = {
  mode: 'nearest',
  pinnedHolidayId: null,
  backgroundImageUri: null,
  backgroundDim: 32,
};

export const DEFAULT_WIDGET_STATS: WidgetStatsAppearance = {
  mode: 'days',
  backgroundImageUri: null,
  backgroundDim: 32,
};

export const DEFAULT_WIDGET_STUDIO: WidgetStudioSettings = {
  family: 'timer',
  previewSize: 'small',
  timer: DEFAULT_WIDGET_TIMER,
  holiday: DEFAULT_WIDGET_HOLIDAY,
  stats: DEFAULT_WIDGET_STATS,
};
