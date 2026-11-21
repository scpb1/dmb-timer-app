import { differenceInCalendarDays, format, isValid, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

export type TimerPhase = 'before' | 'active' | 'after';

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
  progressPercent: number;
}

const ZERO_BREAKDOWN: TimeBreakdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function dayCountForm(count: number): 'one' | 'few' | 'many' {
  const abs = Math.abs(Math.trunc(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return 'many';
  }
  if (mod10 === 1) {
    return 'one';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'few';
  }
  return 'many';
}

export function inflectDays(count: number): string {
  switch (dayCountForm(count)) {
    case 'one':
      return 'день';
    case 'few':
      return 'дня';
    case 'many':
      return 'дней';
  }
}

export function formatDays(count: number): string {
  return `${count} ${inflectDays(count)}`;
}

export function inflectHours(count: number): string {
  switch (dayCountForm(count)) {
    case 'one':
      return 'час';
    case 'few':
      return 'часа';
    case 'many':
      return 'часов';
  }
}

export function inflectMinutes(count: number): string {
  switch (dayCountForm(count)) {
    case 'one':
      return 'минута';
    case 'few':
      return 'минуты';
    case 'many':
      return 'минут';
  }
}

export function inflectSeconds(count: number): string {
  switch (dayCountForm(count)) {
    case 'one':
      return 'секунда';
    case 'few':
      return 'секунды';
    case 'many':
      return 'секунд';
  }
}

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

export function serviceTimeBreakdowns(
  enlistmentDate: Date,
  demobilizationDate: Date,
  now: Date,
  phase: TimerPhase,
): { passed: TimeBreakdown; remaining: TimeBreakdown } {
  const enlistmentStart = startOfDay(enlistmentDate);
  const demobilizationStart = startOfDay(demobilizationDate);

  if (phase === 'before') {
    return { passed: ZERO_BREAKDOWN, remaining: getTimeBreakdown(now, enlistmentStart) };
  }
  if (phase === 'after') {
    return { passed: getTimeBreakdown(demobilizationStart, now), remaining: ZERO_BREAKDOWN };
  }

  return {
    passed: getTimeBreakdown(enlistmentStart, now),
    remaining: getTimeBreakdown(now, demobilizationStart),
  };
}

export function formatClockLines(breakdown: TimeBreakdown): string[] {
  return [
    `${breakdown.hours} ${inflectHours(breakdown.hours)}`,
    `${breakdown.minutes} ${inflectMinutes(breakdown.minutes)}`,
    `${breakdown.seconds} ${inflectSeconds(breakdown.seconds)}`,
  ];
}

export function passedHeading(count: number): string {
  return dayCountForm(count) === 'one' ? 'Прошёл' : 'Прошло';
}

export function remainingHeading(count: number): string {
  return dayCountForm(count) === 'one' ? 'Остался' : 'Осталось';
}

export function formatHumanDate(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: ru });
}

export function toIsoDay(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

export function fromIsoDay(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

export function parseFullDate(input: string): Date | null {
  const match = /^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})$/.exec(input.trim());
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) {
    year += 2000;
  }

  const date = startOfDay(new Date(year, month - 1, day));
  if (
    !isValid(date) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseMonthDay(input: string): { month: number; day: number } | null {
  const match = /^(\d{1,2})[./](\d{1,2})$/.exec(input.trim());
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  if (!isValidMonthDay(month, day)) {
    return null;
  }

  return { month, day };
}

export function isValidMonthDay(month: number, day: number): boolean {
  if (!Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const probe = new Date(2024, month - 1, day);
  return probe.getMonth() === month - 1 && probe.getDate() === day;
}

export function calculateServiceProgress(
  enlistmentDate: Date,
  demobilizationDate: Date,
  now: Date = new Date(),
): ServiceProgress {
  const enlistment = startOfDay(enlistmentDate);
  const demobilization = startOfDay(demobilizationDate);
  const today = startOfDay(now);
  const phase: TimerPhase =
    today < enlistment ? 'before' : today >= demobilization ? 'after' : 'active';

  const totalDays = Math.max(0, differenceInCalendarDays(demobilization, enlistment));
  const rawDaysPassed = Math.max(0, differenceInCalendarDays(today, enlistment));
  const daysUntilStart = Math.max(0, differenceInCalendarDays(enlistment, today));
  const daysAfterEnd = Math.max(0, differenceInCalendarDays(today, demobilization));
  const daysPassed = phase === 'after' ? totalDays : Math.min(rawDaysPassed, totalDays);
  const daysLeft =
    phase === 'after' ? 0 : Math.max(0, differenceInCalendarDays(demobilization, today));
  const totalMs = demobilization.getTime() - enlistment.getTime();
  const elapsedMs = Math.max(0, now.getTime() - enlistment.getTime());
  const progressRatio =
    phase === 'before'
      ? 0
      : phase === 'after'
        ? 1
        : totalMs > 0
          ? Math.min(1, Math.max(0, elapsedMs / totalMs))
          : 0;

  return {
    phase,
    totalDays,
    daysPassed,
    daysLeft,
    daysUntilStart,
    daysAfterEnd,
    progressPercent: progressRatio * 100,
  };
}
