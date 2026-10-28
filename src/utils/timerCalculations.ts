import { formatCount, inflect, type InflectableNoun } from '@/utils/inflection';

import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { ProgressBarMode, StatCardMode, TimerCenterDisplay, TimerPhase } from '@/types/timer';

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
  /** Сколько сегментов рисовать в каждом режиме для этого срока */
  segmentCounts: Record<ProgressBarMode, number>;
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

const PROGRESS_BAR_MODES: ProgressBarMode[] = ['percent', 'days', 'weeks', 'months'];

/** Сегменты прогресс-бара: проценты и «дни» — 100 долей, недели и месяцы — только целые единицы срока. */
export function getProgressBarSegmentCount(mode: ProgressBarMode, totalDays: number): number {
  const days = Math.max(0, totalDays);

  switch (mode) {
    case 'percent':
    case 'days':
      return 100;
    case 'weeks':
      return Math.max(1, Math.floor(days / 7));
    case 'months':
      return Math.max(1, Math.floor(days / 30));
  }
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

  const segmentCounts = {} as Record<ProgressBarMode, number>;
  const filledSegments = {} as Record<ProgressBarMode, number>;

  for (const mode of PROGRESS_BAR_MODES) {
    const count = getProgressBarSegmentCount(mode, totalDays);
    segmentCounts[mode] = count;
    if (phase === 'before') {
      filledSegments[mode] = 0;
    } else if (phase === 'after') {
      filledSegments[mode] = count;
    } else {
      filledSegments[mode] = getCompletedUnits(mode, daysPassed, progressPercent, count);
    }
  }

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
    segmentCounts,
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
  max: number,
): number {
  switch (mode) {
    case 'percent':
    case 'days':
      return Math.min(max, Math.floor(progressPercent));
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
  kind: 'service' | 'custom';
  before: string;
  after: string;
}

const DEFAULT_CENTER_LABELS: CenterDisplayLabels = {
  kind: 'custom',
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
    return { kind, before: 'до призыва', after: 'после дембеля' };
  }
  return { kind, before: 'до начала', after: 'после' };
}

/** Подпись единицы времени до призыва / после дембеля (или для своего таймера). */
export function getPhaseUnitLabel(
  count: number,
  unit: InflectableNoun,
  phase: 'before' | 'after',
  kind: 'service' | 'custom',
): string {
  const word = inflect(count, unit);
  if (phase === 'before') {
    return kind === 'service' ? `${word} до призыва` : `${word} до начала`;
  }
  return kind === 'service' ? `${word} после дембеля` : `${word} после`;
}

export function getPhaseCardTitle(
  phase: TimerPhase,
  _kind: 'service' | 'custom',
): 'прошло' | 'осталось' {
  if (phase === 'before') {
    return 'осталось';
  }
  if (phase === 'after') {
    return 'прошло';
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
    const { kind } = labels;

    if (mode === 'weeks') {
      return {
        primaryValue: String(weeks),
        secondaryValue: null,
        unitLabel: getPhaseUnitLabel(weeks, 'week', 'before', kind),
      };
    }
    if (mode === 'months') {
      return {
        primaryValue: String(months),
        secondaryValue: null,
        unitLabel: getPhaseUnitLabel(months, 'month', 'before', kind),
      };
    }
    if (mode === 'percent') {
      return {
        primaryValue: formatProgressPercent(0, decimalPlaces),
        secondaryValue: null,
        unitLabel: labels.before,
      };
    }

    return {
      primaryValue: String(days),
      secondaryValue: formatProgressPercent(0, decimalPlaces),
      unitLabel: getPhaseUnitLabel(days, 'day', 'before', kind),
    };
  }

  if (progress.phase === 'after') {
    const days = progress.daysAfterEnd;
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const { kind } = labels;

    if (mode === 'weeks') {
      return {
        primaryValue: String(weeks),
        secondaryValue: null,
        unitLabel: getPhaseUnitLabel(weeks, 'week', 'after', kind),
      };
    }
    if (mode === 'months') {
      return {
        primaryValue: String(months),
        secondaryValue: null,
        unitLabel: getPhaseUnitLabel(months, 'month', 'after', kind),
      };
    }
    if (mode === 'percent') {
      return {
        primaryValue: formatProgressPercent(100, decimalPlaces),
        secondaryValue: null,
        unitLabel: labels.after,
      };
    }

    return {
      primaryValue: String(days),
      secondaryValue: formatProgressPercent(100, decimalPlaces),
      unitLabel: getPhaseUnitLabel(days, 'day', 'after', kind),
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
        primaryValue: formatProgressPercent(percentValue, decimalPlaces),
        secondaryValue: null,
        unitLabel: '',
      };
    case 'days':
      return {
        primaryValue: String(days),
        secondaryValue: formatProgressPercent(percentValue, decimalPlaces),
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
export interface StatCardDisplayOptions {
  phase?: TimerPhase;
  kind?: 'service' | 'custom';
}

export function getStatCardDisplay(
  breakdown: TimeBreakdown,
  mode: StatCardMode | undefined,
  options?: StatCardDisplayOptions,
): StatCardDisplay {
  const safeMode = mode ?? 'days';
  const phase = options?.phase;
  const kind = options?.kind ?? 'service';
  const usePhaseLabel = phase === 'before' || phase === 'after';

  switch (safeMode) {
    case 'days': {
      const display = {
        primaryValue: breakdown.days,
        unitLabel: inflect(breakdown.days, 'day'),
        detailLines: formatTimeBreakdownLines(breakdown),
      };
      if (usePhaseLabel) {
        display.unitLabel = getPhaseUnitLabel(breakdown.days, 'day', phase, kind);
      }
      return display;
    }
    case 'weeks': {
      const weeks = Math.floor(breakdown.days / 7);
      const remainderDays = breakdown.days % 7;
      const display = {
        primaryValue: weeks,
        unitLabel: inflect(weeks, 'week'),
        detailLines: [formatCount(remainderDays, 'day')],
      };
      if (usePhaseLabel) {
        display.unitLabel = getPhaseUnitLabel(weeks, 'week', phase, kind);
      }
      return display;
    }
    case 'months': {
      const months = Math.floor(breakdown.days / 30);
      const remainderDays = breakdown.days % 30;
      const display = {
        primaryValue: months,
        unitLabel: inflect(months, 'month'),
        detailLines: [formatCount(remainderDays, 'day')],
      };
      if (usePhaseLabel) {
        display.unitLabel = getPhaseUnitLabel(months, 'month', phase, kind);
      }
      return display;
    }
    default: {
      const display = {
        primaryValue: breakdown.days,
        unitLabel: inflect(breakdown.days, 'day'),
        detailLines: formatTimeBreakdownLines(breakdown),
      };
      if (usePhaseLabel) {
        display.unitLabel = getPhaseUnitLabel(breakdown.days, 'day', phase, kind);
      }
      return display;
    }
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

/** Всего ячеек недель/месяцев на сетке — те же целые единицы, что у сегментов прогресс-бара */
export function getDotGridUnitTotal(mode: 'weeks' | 'months', totalDays: number): number {
  return getProgressBarSegmentCount(mode, totalDays);
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
