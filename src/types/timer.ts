/** Вид таймера на главном экране */
export type TimerType = 'circular' | 'linear' | 'frame' | 'dotGrid' | 'milestones';

/** Карточка ближайшего события / праздника на главном экране */
export type TimerUpcomingPreviewMode = 'off' | 'nearest' | 'pinned';

/** Режим сегментированного прогресс-бара */
export type ProgressBarMode = 'percent' | 'days' | 'weeks' | 'months';

/** Что показывать в центре таймера: прошедшее или оставшееся */
export type TimerCenterDisplay = 'remaining' | 'elapsed';

/** Этап относительно дат таймера */
export type TimerPhase = 'before' | 'active' | 'after';

export const SERVICE_TIMER_ID = 'service';

export interface CustomTimerRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CustomTimersStorage {
  timers: CustomTimerRecord[];
}

export const DEFAULT_CUSTOM_TIMERS_STORAGE: CustomTimersStorage = { timers: [] };

export interface ActiveTimer {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  kind: 'service' | 'custom';
}

/** Режим отображения плашек «Прошло / Осталось» */
export type StatCardMode = 'days' | 'weeks' | 'months';

/** Форма ячейки в режиме «Сетка дней» */
export type DotGridCellShape = 'circle' | 'square' | 'heart';

/** Вид ленты событий (тип таймера «Лента событий») */
export type MilestonesLayout = 'spine' | 'chips' | 'checklist';

export interface TimerSettings {
  timerType: TimerType;
  progressBarMode: ProgressBarMode;
  /** Количество знаков после запятой для режима «проценты» (0–6) */
  percentDecimalPlaces: number;
  /** Будущая настройка отображения в центре кольца */
  centerDisplay: TimerCenterDisplay;
  statCardMode: StatCardMode;
  /** Локальный URI фотографии на фоне таймера */
  backgroundImageUri: string | null;
  /** Затемнение фото на фоне, 0–100 */
  backgroundDim: number;
  /** Показ ближайшего или закреплённого события / праздника под таймером */
  timerUpcomingPreview: TimerUpcomingPreviewMode;
  /** Ключ закрепления: event:id или holiday:id */
  timerUpcomingPinnedRef: string | null;
  /** Окантовка плашек «прошло / осталось» при фото на фоне */
  photoStatCardBorder: boolean;
  /** Окантовка карточки события / праздника при фото на фоне */
  photoUpcomingCardBorder: boolean;
  /** Форма ячеек сетки (только dotGrid) */
  dotGridCellShape: DotGridCellShape;
  /** Вид ленты (только milestones) */
  milestonesLayout: MilestonesLayout;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  timerType: 'circular',
  progressBarMode: 'percent',
  percentDecimalPlaces: 2,
  centerDisplay: 'remaining',
  statCardMode: 'days',
  backgroundImageUri: null,
  backgroundDim: 32,
  timerUpcomingPreview: 'nearest',
  timerUpcomingPinnedRef: null,
  photoStatCardBorder: true,
  photoUpcomingCardBorder: true,
  dotGridCellShape: 'circle',
  milestonesLayout: 'spine',
};

export const MILESTONES_LAYOUT_LABELS: Record<MilestonesLayout, string> = {
  spine: 'Прямой шток',
  chips: 'Плитки',
  checklist: 'Чеклист',
};

export const DOT_GRID_CELL_SHAPE_LABELS: Record<DotGridCellShape, string> = {
  circle: 'Кружки',
  square: 'Квадраты',
  heart: 'Сердечки',
};

export const PROGRESS_BAR_SEGMENT_COUNT: Record<ProgressBarMode, number> = {
  percent: 100,
  days: 365,
  weeks: 52,
  months: 12,
};

export const TIMER_TYPE_LABELS: Record<TimerType, string> = {
  circular: 'Круговой',
  linear: 'Линейный',
  frame: 'Рамка',
  dotGrid: 'Сетка дней',
  milestones: 'Лента событий',
};

export const DOT_GRID_PROGRESS_BAR_MODE_LABELS: Record<ProgressBarMode, string> = {
  percent: 'Проценты',
  days: 'Дни',
  weeks: 'Недели',
  months: 'Месяцы',
};

export const DOT_GRID_PROGRESS_BAR_MODES = ['days', 'percent', 'weeks', 'months'] as const;

export const TIMER_UPCOMING_PREVIEW_LABELS: Record<TimerUpcomingPreviewMode, string> = {
  off: 'Не показывать',
  nearest: 'Ближайшее',
  pinned: 'Закреплённое',
};

export const CIRCULAR_PROGRESS_BAR_MODE_LABELS: Record<
  Exclude<ProgressBarMode, 'days'>,
  string
> = {
  percent: 'Дни',
  weeks: 'Недели',
  months: 'Месяцы',
};

export const LINEAR_PROGRESS_BAR_MODE_LABELS: Record<
  Exclude<ProgressBarMode, 'days'>,
  string
> = {
  percent: 'Проценты',
  weeks: 'Недели',
  months: 'Месяцы',
};

/** @deprecated используй CIRCULAR_PROGRESS_BAR_MODE_LABELS или LINEAR_PROGRESS_BAR_MODE_LABELS */
export const PROGRESS_BAR_MODE_LABELS = CIRCULAR_PROGRESS_BAR_MODE_LABELS;

export const STAT_CARD_MODE_LABELS: Record<StatCardMode, string> = {
  days: 'Дни',
  weeks: 'Недели',
  months: 'Месяцы',
};

export const CIRCULAR_PROGRESS_BAR_MODES = ['percent', 'weeks', 'months'] as const;
export const LINEAR_PROGRESS_BAR_MODES = ['percent', 'weeks', 'months'] as const;

export function getProgressBarModeOptions(timerType: TimerType) {
  if (timerType === 'dotGrid') {
    return DOT_GRID_PROGRESS_BAR_MODES.map((value) => ({
      value,
      label: DOT_GRID_PROGRESS_BAR_MODE_LABELS[value],
    }));
  }

  const labels =
    timerType === 'linear'
      ? LINEAR_PROGRESS_BAR_MODE_LABELS
      : CIRCULAR_PROGRESS_BAR_MODE_LABELS;

  const modes =
    timerType === 'linear' ? LINEAR_PROGRESS_BAR_MODES : CIRCULAR_PROGRESS_BAR_MODES;

  return modes.map((value) => ({
    value,
    label: labels[value as Exclude<ProgressBarMode, 'days'>],
  }));
}

export function normalizeProgressBarMode(
  timerType: TimerType,
  mode: ProgressBarMode,
): ProgressBarMode {
  if (timerType === 'dotGrid') {
    return mode === 'days' ||
      mode === 'percent' ||
      mode === 'weeks' ||
      mode === 'months'
      ? mode
      : 'days';
  }
  if (mode === 'days') {
    return 'percent';
  }
  return mode;
}

export function timerTypeUsesProgressBarModes(timerType: TimerType): boolean {
  return timerType !== 'frame' && timerType !== 'milestones';
}
