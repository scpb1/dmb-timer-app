import { formatCount, inflect } from '@/utils/inflection';

import { differenceInCalendarDays, startOfDay } from 'date-fns';

import type { ProgressBarMode, StatCardMode, TimerCenterDisplay } from '@/types/timer';
import { PROGRESS_BAR_SEGMENT_COUNT } from '@/types/timer';

export interface TimeBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface ServiceProgress {
  totalDays: number;
  daysPassed: number;
  daysLeft: number;
  progressRatio: number;
  progressPercent: number;
  filledSegments: Record<ProgressBarMode, number>;
  weeksLeft: number;
  monthsLeft: number;
  weeksPassed: number;
  monthsPassed: number;
}

function clampRatio(ratio: number): number {
  return Math.min(1, Math.max(0, ratio));
}

/** Разбивает интервал времени на дни, часы, минуты и секунды */
export function getTimeBreakdown(from: Date, to: Date): TimeBreakdown {
  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/** Считает прошедшее и оставшееся время от полуночи дня призыва / до полуночи дня дембеля */
export function getServiceTimeBreakdowns(
  enlistmentDate: Date,
  demobilizationDate: Date,
  now: Date = new Date(),
): { passed: TimeBreakdown; remaining: TimeBreakdown } {
  const enlistmentStart = startOfDay(enlistmentDate);
  const demobilizationStart = startOfDay(demobilizationDate);

  return {
    passed: getTimeBreakdown(enlistmentStart, now),
    remaining: getTimeBreakdown(now, demobilizationStart),
  };
}

/** Считает прогресс службы и количество закрашенных сегментов для каждого режима */
export function calculateServiceProgress(
  enlistmentDate: Date,
  demobilizationDate: Date,
  now: Date = new Date(),
): ServiceProgress {
  const enlistment = startOfDay(enlistmentDate);
  const demobilization = startOfDay(demobilizationDate);
  const today = startOfDay(now);

  const totalDays = Math.max(0, differenceInCalendarDays(demobilization, enlistment));
  const daysPassed = Math.max(0, differenceInCalendarDays(today, enlistment));
  const daysLeft = Math.max(0, differenceInCalendarDays(demobilization, today));
  const progressRatio = totalDays > 0 ? clampRatio(daysPassed / totalDays) : 0;
  const progressPercent = progressRatio * 100;

  const filledSegments = (Object.keys(PROGRESS_BAR_SEGMENT_COUNT) as ProgressBarMode[]).reduce(
    (acc, mode) => {
      acc[mode] = getCompletedUnits(mode, daysPassed, progressPercent);
      return acc;
    },
    {} as Record<ProgressBarMode, number>,
  );

  return {
    totalDays,
    daysPassed,
    daysLeft,
    progressRatio,
    progressPercent,
    filledSegments,
    weeksLeft: daysLeft > 0 ? Math.ceil(daysLeft / 7) : 0,
    monthsLeft: daysLeft > 0 ? Math.ceil(daysLeft / 30) : 0,
    weeksPassed: Math.floor(daysPassed / 7),
    monthsPassed: Math.floor(daysPassed / 30),
  };
}

/** Закрашен только полностью пройденный сегмент (целая единица) */
function getCompletedUnits(
  mode: ProgressBarMode,
  daysPassed: number,
  progressPercent: number,
): number {
  const max = PROGRESS_BAR_SEGMENT_COUNT[mode];

  switch (mode) {
    case 'percent':
      return Math.min(max, Math.floor(progressPercent));
    case 'days':
      return Math.min(max, daysPassed);
    case 'weeks':
      return Math.min(max, Math.floor(daysPassed / 7));
    case 'months':
      return Math.min(max, Math.floor(daysPassed / 30));
  }
}

export function formatProgressPercent(value: number, decimalPlaces: number): string {
  const clampedDecimals = Math.min(6, Math.max(0, decimalPlaces));
  return value.toFixed(clampedDecimals);
}

export interface CenterDisplayValues {
  primaryValue: string;
  secondaryValue: string | null;
  unitLabel: string;
}

/** Значения для центра кольца и подписи линейного таймера */
export function getCenterDisplayValues(
  mode: ProgressBarMode,
  progress: ServiceProgress,
  decimalPlaces: number,
  centerDisplay: TimerCenterDisplay = 'remaining',
): CenterDisplayValues {
  const useRemaining = centerDisplay === 'remaining';
  const days = useRemaining ? progress.daysLeft : progress.daysPassed;
  const weeks = useRemaining ? progress.weeksLeft : progress.weeksPassed;
  const months = useRemaining ? progress.monthsLeft : progress.monthsPassed;
  const percentValue = useRemaining
    ? (1 - progress.progressRatio) * 100
    : progress.progressPercent;

  switch (mode) {
    case 'percent':
      return {
        primaryValue: String(days),
        secondaryValue: formatProgressPercent(percentValue, decimalPlaces),
        unitLabel: useRemaining ? 'ддд' : 'дпп',
      };
    case 'days':
      return {
        primaryValue: String(days),
        secondaryValue: null,
        unitLabel: useRemaining ? 'ддд' : 'дпп',
      };
    case 'weeks':
      return {
        primaryValue: String(weeks),
        secondaryValue: null,
        unitLabel: inflect(weeks, 'week'),
      };
    case 'months':
      return {
        primaryValue: String(months),
        secondaryValue: null,
        unitLabel: inflect(months, 'month'),
      };
  }
}

export function formatTimeBreakdownLines(breakdown: TimeBreakdown): string[] {
  return [
    formatCount(breakdown.hours, 'hour'),
    formatCount(breakdown.minutes, 'minute'),
    formatCount(breakdown.seconds, 'second'),
  ];
}

export interface StatCardDisplay {
  primaryValue: number;
  unitLabel: string;
  detailLines: string[];
}

/** Формирует содержимое плашки в зависимости от выбранного режима */
export function getStatCardDisplay(
  breakdown: TimeBreakdown,
  mode: StatCardMode | undefined,
): StatCardDisplay {
  const safeMode = mode ?? 'days';

  switch (safeMode) {
    case 'days':
      return {
        primaryValue: breakdown.days,
        unitLabel: inflect(breakdown.days, 'day'),
        detailLines: formatTimeBreakdownLines(breakdown),
      };
    case 'weeks': {
      const weeks = Math.floor(breakdown.days / 7);
      const remainderDays = breakdown.days % 7;
      return {
        primaryValue: weeks,
        unitLabel: inflect(weeks, 'week'),
        detailLines: [formatCount(remainderDays, 'day')],
      };
    }
    case 'months': {
      const months = Math.floor(breakdown.days / 30);
      const remainderDays = breakdown.days % 30;
      return {
        primaryValue: months,
        unitLabel: inflect(months, 'month'),
        detailLines: [formatCount(remainderDays, 'day')],
      };
    }
    default:
      return {
        primaryValue: breakdown.days,
        unitLabel: inflect(breakdown.days, 'day'),
        detailLines: formatTimeBreakdownLines(breakdown),
      };
  }
}

export interface LinearDisplayValues {
  mode: 'percent' | 'value';
  percentText?: string;
  primaryValue?: string;
  unitLabel?: string;
}

/** Подпись под линейным прогресс-баром */
export function getLinearDisplayValues(
  mode: ProgressBarMode,
  progress: ServiceProgress,
  decimalPlaces: number,
  centerDisplay: TimerCenterDisplay = 'remaining',
): LinearDisplayValues {
  const useRemaining = centerDisplay === 'remaining';

  if (mode === 'percent') {
    const percentValue = useRemaining
      ? (1 - progress.progressRatio) * 100
      : progress.progressPercent;

    return {
      mode: 'percent',
      percentText: `${formatProgressPercent(percentValue, decimalPlaces)}%`,
    };
  }

  const center = getCenterDisplayValues(mode, progress, decimalPlaces, centerDisplay);

  return {
    mode: 'value',
    primaryValue: center.primaryValue,
    unitLabel: center.unitLabel,
  };
}
