/** Вид таймера на главном экране */
export type TimerType = 'circular' | 'linear';

/** Режим сегментированного прогресс-бара */
export type ProgressBarMode = 'percent' | 'days' | 'weeks' | 'months';

/**
 * Что показывать в центре кольца (пока не используется в UI).
 * Заложено для будущей настройки «прошло / осталось».
 */
export type TimerCenterDisplay = 'remaining' | 'elapsed';

/** Режим отображения плашек «Прошло / Осталось» */
export type StatCardMode = 'days' | 'weeks' | 'months';

export interface TimerSettings {
  timerType: TimerType;
  progressBarMode: ProgressBarMode;
  /** Количество знаков после запятой для режима «проценты» (0–6) */
  percentDecimalPlaces: number;
  /** Будущая настройка отображения в центре кольца */
  centerDisplay: TimerCenterDisplay;
  statCardMode: StatCardMode;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  timerType: 'circular',
  progressBarMode: 'percent',
  percentDecimalPlaces: 6,
  centerDisplay: 'remaining',
  statCardMode: 'days',
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
};

export const CIRCULAR_PROGRESS_BAR_MODE_LABELS: Record<
  Exclude<ProgressBarMode, 'days'>,
  string
> = {
  percent: 'Дни',
  weeks: 'Недели',
  months: 'Месяцы',
};

export const LINEAR_PROGRESS_BAR_MODE_LABELS: Record<ProgressBarMode, string> = {
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

export const CIRCULAR_PROGRESS_BAR_MODES = ['percent', 'weeks', 'months'] as const;
export const LINEAR_PROGRESS_BAR_MODES = ['percent', 'days', 'weeks', 'months'] as const;

export function getProgressBarModeOptions(timerType: TimerType) {
  const labels =
    timerType === 'linear'
      ? LINEAR_PROGRESS_BAR_MODE_LABELS
      : CIRCULAR_PROGRESS_BAR_MODE_LABELS;

  const modes =
    timerType === 'linear' ? LINEAR_PROGRESS_BAR_MODES : CIRCULAR_PROGRESS_BAR_MODES;

  return modes.map((value) => ({
    value,
    label: labels[value as keyof typeof labels],
  }));
}

export function normalizeProgressBarMode(
  timerType: TimerType,
  mode: ProgressBarMode,
): ProgressBarMode {
  if (timerType === 'circular' && mode === 'days') {
    return 'percent';
  }
  return mode;
}
