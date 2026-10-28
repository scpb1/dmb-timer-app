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
export type DotGridCellShape = 'circle' | 'heart';

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
  /** Окантовка плашки ближайшего события на фото-фоне */
  photoUpcomingCardBorder: boolean;
  /** Окантовка плашки «прошло / осталось» на фото-фоне */
  photoStatCardBorder: boolean;
  /** Форма ячеек сетки (только dotGrid) */
  dotGridCellShape: DotGridCellShape;
  /** Вид ленты (только milestones) */
  milestonesLayout: MilestonesLayout;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  timerType: 'circular',
  progressBarMode: 'days',
  percentDecimalPlaces: 2,
  centerDisplay: 'remaining',
  statCardMode: 'days',
  backgroundImageUri: null,
  backgroundDim: 32,
  timerUpcomingPreview: 'nearest',
  timerUpcomingPinnedRef: null,
  photoUpcomingCardBorder: true,
  photoStatCardBorder: false,
  dotGridCellShape: 'circle',
  milestonesLayout: 'spine',
};

/** Окантовка, когда переключатели в настройках скрыты (FEATURES.showPhotoElementBorderSwitches) */
export const PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN = {
  photoUpcomingCardBorder: true,
  photoStatCardBorder: false,
} as const satisfies Pick<TimerSettings, 'photoUpcomingCardBorder' | 'photoStatCardBorder'>;

export const MILESTONES_LAYOUT_LABELS: Record<MilestonesLayout, string> = {
  spine: 'Ось',
  chips: 'Плитки',
  checklist: 'Чеклист',
};

export const DOT_GRID_CELL_SHAPE_LABELS: Record<DotGridCellShape, string> = {
  circle: 'Кружки',
  heart: 'Сердечки',
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

export const CIRCULAR_PROGRESS_BAR_MODES = ['percent', 'days', 'weeks', 'months'] as const;
export const LINEAR_PROGRESS_BAR_MODES = ['percent', 'days', 'weeks', 'months'] as const;

export const CIRCULAR_PROGRESS_BAR_MODE_LABELS: Record<
  (typeof CIRCULAR_PROGRESS_BAR_MODES)[number],
  string
> = {
  days: 'Дни',
  percent: 'Проценты',
  weeks: 'Недели',
  months: 'Месяцы',
};

export const LINEAR_PROGRESS_BAR_MODE_LABELS: Record<
  (typeof LINEAR_PROGRESS_BAR_MODES)[number],
  string
> = {
  percent: 'Проценты',
  days: 'Дни',
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

/** Режим прогресс-бара при выборе типа таймера (круговой — дни, линейный — проценты). */
export function defaultProgressBarModeForTimerType(timerType: TimerType): ProgressBarMode {
  if (timerType === 'linear') {
    return 'percent';
  }
  if (timerType === 'dotGrid' || timerType === 'circular') {
    return 'days';
  }
  return 'percent';
}

export function getProgressBarModeOptions(
  timerType: TimerType,
): { value: ProgressBarMode; label: string }[] {
  if (timerType === 'dotGrid') {
    return DOT_GRID_PROGRESS_BAR_MODES.map((value) => ({
      value,
      label: DOT_GRID_PROGRESS_BAR_MODE_LABELS[value],
    }));
  }

  if (timerType === 'linear') {
    return LINEAR_PROGRESS_BAR_MODES.map((value) => ({
      value,
      label: LINEAR_PROGRESS_BAR_MODE_LABELS[value],
    }));
  }

  return CIRCULAR_PROGRESS_BAR_MODES.map((value) => ({
    value,
    label: CIRCULAR_PROGRESS_BAR_MODE_LABELS[value],
  }));
}

export function normalizeProgressBarMode(
  timerType: TimerType,
  mode: ProgressBarMode,
): ProgressBarMode {
  if (timerType === 'dotGrid') {
    return mode === 'days' || mode === 'percent' || mode === 'weeks' || mode === 'months'
      ? mode
      : 'days';
  }

  if (timerType === 'linear') {
    return mode === 'days' || mode === 'weeks' || mode === 'months' ? mode : 'percent';
  }

  if (timerType === 'circular') {
    return mode === 'percent' || mode === 'weeks' || mode === 'months' ? mode : 'days';
  }

  return mode === 'days' ? 'percent' : mode;
}

export function timerTypeUsesProgressBarModes(timerType: TimerType): boolean {
  return timerType !== 'frame' && timerType !== 'milestones';
}
