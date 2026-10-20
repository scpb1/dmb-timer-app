import { formatCount, inflect } from '@/utils/inflection';

import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { ProgressBarMode, StatCardMode, TimerCenterDisplay, TimerPhase } from '@/types/timer';
import { PROGRESS_BAR_SEGMENT_COUNT } from '@/types/timer';

export interface TimeBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface ServiceProgress {
  phase: TimerPhase;
  totalDays: number;
  daysPassed: number;
  daysLeft: number;
  daysUntilStart: number;
  daysAfterEnd: number;
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

export function resolveTimerPhase(
  startDate: Date,
  endDate: Date,
  now: Date = new Date(),
): TimerPhase {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const today = startOfDay(now);

  if (today < start) {
    return 'before';
  }
  if (today >= end) {
    return 'after';
  }
  return 'active';
}

const ZERO_BREAKDOWN: TimeBreakdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };

/** Считает прошедшее и оставшееся время от полуночи дня призыва / до полуночи дня дембеля */
export function getServiceTimeBreakdowns(
  enlistmentDate: Date,
  demobilizationDate: Date,
  now: Date = new Date(),
): { passed: TimeBreakdown; remaining: TimeBreakdown; phase: TimerPhase } {
  const enlistmentStart = startOfDay(enlistmentDate);
  const demobilizationStart = startOfDay(demobilizationDate);
  const phase = resolveTimerPhase(enlistmentDate, demobilizationDate, now);

  if (phase === 'before') {
    return {
      phase,
      passed: ZERO_BREAKDOWN,
      remaining: getTimeBreakdown(now, enlistmentStart),
    };
  }

  if (phase === 'after') {
    return {
      phase,
      passed: getTimeBreakdown(demobilizationStart, now),
      remaining: ZERO_BREAKDOWN,
    };
  }

  return {
    phase,
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
  const phase = resolveTimerPhase(enlistmentDate, demobilizationDate, now);

  const totalDays = Math.max(0, differenceInCalendarDays(demobilization, enlistment));
  const rawDaysPassed = Math.max(0, differenceInCalendarDays(today, enlistment));
  const daysUntilStart = Math.max(0, differenceInCalendarDays(enlistment, today));
  const daysAfterEnd = Math.max(0, differenceInCalendarDays(today, demobilization));
  const daysPassed = phase === 'after' ? totalDays : Math.min(rawDaysPassed, totalDays);
  const daysLeft = phase === 'after' ? 0 : Math.max(0, differenceInCalendarDays(demobilization, today));
  const progressRatio =
    phase === 'before' ? 0 : phase === 'after' ? 1 : totalDays > 0 ? clampRatio(daysPassed / totalDays) : 0;
  const progressPercent = progressRatio * 100;

  const filledSegments = (Object.keys(PROGRESS_BAR_SEGMENT_COUNT) as ProgressBarMode[]).reduce(
    (acc, mode) => {
      if (phase === 'before') {
        acc[mode] = 0;
      } else if (phase === 'after') {
        acc[mode] = PROGRESS_BAR_SEGMENT_COUNT[mode];
      } else {
        acc[mode] = getCompletedUnits(mode, daysPassed, progressPercent);
      }
      return acc;
    },
    {} as Record<ProgressBarMode, number>,
  );

  return {
    phase,
    totalDays,
    daysPassed,
    daysLeft,
    daysUntilStart,
    daysAfterEnd,
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

export interface CenterDisplayLabels {
  before: string;
  after: string;
}

const DEFAULT_CENTER_LABELS: CenterDisplayLabels = {
  before: 'до старта',
  after: 'после',
};

export function getFrameDisplayValues(
  progress: ServiceProgress,
  centerDisplay: TimerCenterDisplay,
  labels: CenterDisplayLabels = DEFAULT_CENTER_LABELS,
): { primaryValue: string; unitLabel: string; allowCenterToggle: boolean } {
  const center = getCenterDisplayValues('days', progress, 0, centerDisplay, labels);
  return {
    primaryValue: center.primaryValue,
    unitLabel: center.unitLabel,
    allowCenterToggle: progress.phase === 'active',
  };
}

export function getCenterDisplayLabels(kind: 'service' | 'custom'): CenterDisplayLabels {
  if (kind === 'service') {
    return { before: 'до призыва', after: 'после дембеля' };
  }
  return { before: 'до начала', after: 'после' };
}

export function getPhaseCardTitle(
  phase: TimerPhase,
  kind: 'service' | 'custom',
): 'прошло' | 'осталось' | 'ДО ПРИЗЫВА' | 'ПОСЛЕ ДЕМБЕЛЯ' | 'ДО НАЧАЛА' | 'ПОСЛЕ' {
  if (phase === 'before') {
    return kind === 'service' ? 'ДО ПРИЗЫВА' : 'ДО НАЧАЛА';
  }
  if (phase === 'after') {
    return kind === 'service' ? 'ПОСЛЕ ДЕМБЕЛЯ' : 'ПОСЛЕ';
  }
  return 'осталось';
}

/** Значения для центра кольца и подписи линейного таймера */
export function getCenterDisplayValues(
  mode: ProgressBarMode,
  progress: ServiceProgress,
  decimalPlaces: number,
  centerDisplay: TimerCenterDisplay = 'remaining',
  labels: CenterDisplayLabels = DEFAULT_CENTER_LABELS,
): CenterDisplayValues {
  if (progress.phase === 'before') {
    const days = progress.daysUntilStart;
    const weeks = days > 0 ? Math.ceil(days / 7) : 0;
    const months = days > 0 ? Math.ceil(days / 30) : 0;

    if (mode === 'weeks') {
      return { primaryValue: String(weeks), secondaryValue: null, unitLabel: inflect(weeks, 'week') };
    }
    if (mode === 'months') {
      return { primaryValue: String(months), secondaryValue: null, unitLabel: inflect(months, 'month') };
    }

    return {
      primaryValue: String(days),
      secondaryValue: formatProgressPercent(0, decimalPlaces),
      unitLabel: labels.before,
    };
  }

  if (progress.phase === 'after') {
    const days = progress.daysAfterEnd;
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (mode === 'weeks') {
      return { primaryValue: String(weeks), secondaryValue: null, unitLabel: inflect(weeks, 'week') };
    }
    if (mode === 'months') {
      return { primaryValue: String(months), secondaryValue: null, unitLabel: inflect(months, 'month') };
    }

    return {
      primaryValue: String(days),
      secondaryValue: formatProgressPercent(100, decimalPlaces),
      unitLabel: labels.after,
    };
  }

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
export interface DotGridMetrics {
  total: number;
  passed: number;
  remaining: number;
  columns: number;
  title: string;
}

const DOT_GRID_COLUMNS = 20;
/** База для «года службы» при пересчёте недель и месяцев сетки */
const DOT_GRID_YEAR_DAYS = 365;

/** Всего ячеек недель/месяцев на сетке (365 дн. → 52 нед. / 12 мес.) */
export function getDotGridUnitTotal(mode: 'weeks' | 'months', totalDays: number): number {
  const days = Math.max(1, totalDays);
  if (mode === 'weeks') {
    return Math.max(1, Math.round((days * 52) / DOT_GRID_YEAR_DAYS));
  }
  return Math.max(1, Math.round((days * 12) / DOT_GRID_YEAR_DAYS));
}

/** Сколько единиц сетки уже «прошло» (последняя ячейка — дембель). */
export function getDotGridPassedUnits(
  totalUnits: number,
  totalDays: number,
  daysPassed: number,
  phase: TimerPhase,
): number {
  if (phase === 'before') {
    return 0;
  }
  if (phase === 'after') {
    return totalUnits;
  }
  const days = Math.max(1, totalDays);
  const passedDays = Math.max(0, Math.min(days, daysPassed));
  if (passedDays <= 0) {
    return 0;
  }
  if (passedDays >= days) {
    return totalUnits;
  }
  return Math.min(totalUnits - 1, Math.floor((passedDays * totalUnits) / days));
}

/** Оставшиеся единицы на сетке до дембеля (включая дембельскую ячейку в «осталось»). */
export function getDotGridUnitsLeft(
  mode: 'weeks' | 'months',
  progress: Pick<ServiceProgress, 'phase' | 'totalDays' | 'daysPassed' | 'daysUntilStart'>,
): number {
  const total = getDotGridUnitTotal(mode, progress.totalDays);
  if (progress.phase === 'before') {
    const days = Math.max(1, progress.totalDays);
    return Math.max(
      0,
      Math.min(total, Math.ceil((progress.daysUntilStart * total) / days)),
    );
  }
  if (progress.phase === 'after') {
    return 0;
  }
  const passed = getDotGridPassedUnits(total, progress.totalDays, progress.daysPassed, progress.phase);
  return Math.max(0, total - passed);
}

/** Число колонок сетки по режиму */
export function getDotGridColumnCount(mode: ProgressBarMode, total: number): number {
  switch (mode) {
    case 'months':
      return 6;
    case 'weeks':
      return 10;
    case 'percent':
      return 10;
    case 'days':
    default:
      return total >= DOT_GRID_COLUMNS ? DOT_GRID_COLUMNS : Math.max(1, total);
  }
}

export function getDotGridMetrics(
  mode: ProgressBarMode,
  progress: ServiceProgress,
): DotGridMetrics {
  const totalDays = Math.max(1, progress.totalDays);
  let total: number;
  let passed: number;

  switch (mode) {
    case 'percent':
      total = 100;
      passed =
        progress.phase === 'before'
          ? 0
          : progress.phase === 'after'
            ? 100
            : Math.min(100, Math.floor(progress.progressPercent));
      break;
    case 'weeks':
      total = getDotGridUnitTotal('weeks', totalDays);
      passed = getDotGridPassedUnits(
        total,
        totalDays,
        progress.daysPassed,
        progress.phase,
      );
      break;
    case 'months':
      total = getDotGridUnitTotal('months', totalDays);
      passed = getDotGridPassedUnits(
        total,
        totalDays,
        progress.daysPassed,
        progress.phase,
      );
      break;
    case 'days':
    default:
      total = totalDays;
      passed =
        progress.phase === 'before'
          ? 0
          : progress.phase === 'after'
            ? total
            : Math.min(total, progress.daysPassed);
      break;
  }

  const remaining = Math.max(0, total - passed);
  const columns = getDotGridColumnCount(mode, total);

  const title =
    mode === 'days'
      ? `Каждая точка — день службы (${total})`
      : mode === 'weeks'
        ? `Каждая точка — неделя (${total})`
        : mode === 'months'
          ? `Каждая точка — месяц (${total})`
          : 'Каждая точка — 1%';

  return { total, passed, remaining, columns, title };
}

/** Дробь «1/5 службы» по прогрессу (знаменатель 5) */
export function getServiceProgressFraction(progress: ServiceProgress): string {
  if (progress.phase === 'before') {
    return '0/5';
  }
  if (progress.phase === 'after') {
    return '5/5';
  }
  const numerator = Math.min(5, Math.max(0, Math.floor(progress.progressRatio * 5)));
  return `${numerator}/5`;
}

/** Метки месяцев слева/справа от сетки дней (только режим «дни») */
export function getDotGridMonthSideLabels(
  startDate: Date,
  totalDays: number,
): { left: string[]; right: string[] } {
  if (totalDays <= 0) {
    return { left: [], right: [] };
  }
  const start = startOfDay(startDate);
  const picks = [0, Math.floor(totalDays / 3), Math.floor((2 * totalDays) / 3)];
  const left = picks.map((offset) =>
    format(addDays(start, offset), 'LLL', { locale: ru }).replace('.', ''),
  );
  const right = picks.map((offset) =>
    format(addDays(start, offset + Math.max(1, Math.floor(totalDays / 6))), 'LLL', {
      locale: ru,
    }).replace('.', ''),
  );
  return { left, right };
}

export function getLinearDisplayValues(
  mode: ProgressBarMode,
  progress: ServiceProgress,
  decimalPlaces: number,
  centerDisplay: TimerCenterDisplay = 'remaining',
  labels?: CenterDisplayLabels,
): LinearDisplayValues {
  const useRemaining = centerDisplay === 'remaining';

  if (mode === 'percent') {
    const percentValue =
      progress.phase === 'before'
        ? 0
        : progress.phase === 'after'
          ? 100
          : useRemaining
            ? (1 - progress.progressRatio) * 100
            : progress.progressPercent;

    return {
      mode: 'percent',
      percentText: `${formatProgressPercent(percentValue, decimalPlaces)}%`,
    };
  }

  const center = getCenterDisplayValues(mode, progress, decimalPlaces, centerDisplay, labels);

  return {
    mode: 'value',
    primaryValue: center.primaryValue,
    unitLabel: center.unitLabel,
  };
}
