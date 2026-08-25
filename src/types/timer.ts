/** Вид таймера на главном экране (в будущем появятся другие) */
export type TimerType = 'circular';

/** Режим сегментированного кругового прогресс-бара */
export type ProgressBarMode = 'percent' | 'weeks' | 'months';

/**
 * Что показывать в центре кольца (пока не используется в UI).
 * Заложено для будущей настройки «прошло / осталось».
 */
export type TimerCenterDisplay = 'remaining' | 'elapsed';

export interface TimerSettings {
  timerType: TimerType;
  progressBarMode: ProgressBarMode;
  /** Количество знаков после запятой для режима «проценты» (0–6) */
  percentDecimalPlaces: number;
  /** Будущая настройка отображения в центре кольца */
  centerDisplay: TimerCenterDisplay;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  timerType: 'circular',
  progressBarMode: 'percent',
  percentDecimalPlaces: 6,
  centerDisplay: 'remaining',
};

export const PROGRESS_BAR_SEGMENT_COUNT: Record<ProgressBarMode, number> = {
  percent: 100,
  weeks: 52,
  months: 12,
};

export const TIMER_TYPE_LABELS: Record<TimerType, string> = {
  circular: 'Круговой',
};

export const PROGRESS_BAR_MODE_LABELS: Record<ProgressBarMode, string> = {
  percent: 'Дни',
  weeks: 'Недели',
  months: 'Месяцы',
};
