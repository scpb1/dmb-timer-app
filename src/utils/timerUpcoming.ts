import { differenceInCalendarDays, startOfDay } from 'date-fns';

import type { DisplayEvent } from '@/types/events';
import { formatDaysUntilDate, formatEventDaysUntilCaption } from '@/utils/eventCalculations';
import { PREDEFINED_EVENT_IDS } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import { formatCount } from '@/utils/inflection';
import type {
  ProgressBarMode,
  StatCardMode,
  TimerType,
  TimerUpcomingPreviewMode,
} from '@/types/timer';

export type TimerUpcomingItem =
  | { kind: 'event'; event: DisplayEvent }
  | { kind: 'holiday'; holiday: DisplayHoliday };

export type TimerUpcomingRef = `event:${string}` | `holiday:${string}`;

function upcomingDate(item: TimerUpcomingItem): Date {
  return item.kind === 'event' ? item.event.date : item.holiday.date;
}

export function encodeTimerUpcomingRef(item: TimerUpcomingItem): TimerUpcomingRef {
  if (item.kind === 'event') {
    return `event:${item.event.id}`;
  }
  return `holiday:${item.holiday.id}`;
}

export function parseTimerUpcomingRef(raw: string | null): TimerUpcomingRef | null {
  if (!raw) {
    return null;
  }
  if (raw.startsWith('event:') || raw.startsWith('holiday:')) {
    return raw as TimerUpcomingRef;
  }
  return null;
}

export function mergeTimerUpcomingItems(
  events: DisplayEvent[],
  holidays: DisplayHoliday[],
): TimerUpcomingItem[] {
  const merged: TimerUpcomingItem[] = [
    ...events.map((event) => ({ kind: 'event' as const, event })),
    ...holidays.map((holiday) => ({ kind: 'holiday' as const, holiday })),
  ];

  return merged.sort((a, b) => upcomingDate(a).getTime() - upcomingDate(b).getTime());
}

export function isTimerUpcomingDemobilization(item: TimerUpcomingItem): boolean {
  return item.kind === 'event' && item.event.id === PREDEFINED_EVENT_IDS.DEMOBILIZATION;
}

/** Дни уже на таймере или на плашках «прошло / осталось» — строка «до даты» у дембеля дублировала бы счётчик */
export function shouldOmitDemobilizationCountdown(
  timerType: TimerType,
  progressBarMode: ProgressBarMode,
  statCardMode: StatCardMode = 'days',
): boolean {
  if (timerType === 'frame' || timerType === 'milestones') {
    return true;
  }
  if (progressBarMode === 'days' || statCardMode === 'days') {
    return true;
  }
  return false;
}

function findNearestUpcoming(items: TimerUpcomingItem[], now: Date): TimerUpcomingItem | null {
  const today = startOfDay(now);
  return items.find((item) => startOfDay(upcomingDate(item)) >= today) ?? null;
}

function findPinnedItem(
  items: TimerUpcomingItem[],
  pinnedRef: TimerUpcomingRef,
  now: Date,
): TimerUpcomingItem | null {
  const today = startOfDay(now);
  const [kind, id] = pinnedRef.split(':') as ['event' | 'holiday', string];

  const matches = items.filter((item) => {
    if (kind === 'event') {
      return item.kind === 'event' && item.event.id === id;
    }
    return item.kind === 'holiday' && item.holiday.id === id;
  });

  if (matches.length === 0) {
    return null;
  }

  const upcoming = matches.find((item) => startOfDay(upcomingDate(item)) >= today);
  return upcoming ?? matches[matches.length - 1] ?? null;
}

export function resolveTimerUpcomingItem(
  mode: TimerUpcomingPreviewMode,
  pinnedRef: string | null,
  events: DisplayEvent[],
  holidays: DisplayHoliday[],
  now: Date = new Date(),
): TimerUpcomingItem | null {
  if (mode === 'off') {
    return null;
  }

  const items = mergeTimerUpcomingItems(events, holidays);
  if (items.length === 0) {
    return null;
  }

  if (mode === 'nearest') {
    return findNearestUpcoming(items, now);
  }

  const parsedRef = parseTimerUpcomingRef(pinnedRef);
  if (!parsedRef) {
    return findNearestUpcoming(items, now);
  }

  return findPinnedItem(items, parsedRef, now);
}

export function timerUpcomingDisplayName(item: TimerUpcomingItem): string {
  if (item.kind === 'event') {
    return item.event.name;
  }
  return `${item.holiday.name} ${item.holiday.date.getFullYear()}`;
}

function omitFutureDemobilizationCountdown(
  item: TimerUpcomingItem,
  now: Date,
  omit: boolean,
): boolean {
  if (!omit || !isTimerUpcomingDemobilization(item)) {
    return false;
  }
  return differenceInCalendarDays(startOfDay(upcomingDate(item)), startOfDay(now)) > 0;
}

/** Подпись под событием на таймере / в рамке; у дембеля в режиме «дни» строка скрыта */
export function formatTimerUpcomingCountdown(
  item: TimerUpcomingItem,
  now: Date = new Date(),
  omitDemobilizationCountdown = false,
): string | null {
  if (omitFutureDemobilizationCountdown(item, now, omitDemobilizationCountdown)) {
    return null;
  }
  if (item.kind === 'event') {
    return formatEventDaysUntilCaption(item.event, now);
  }
  return formatDaysUntilDate(item.holiday.date, now);
}

/** Строка над визуальными таймерами: «Название · через N дней» */
export function formatTimerVizUpcomingHeadline(
  item: TimerUpcomingItem,
  now: Date = new Date(),
  omitDemobilizationCountdown = false,
): string {
  const date = upcomingDate(item);
  const days = differenceInCalendarDays(startOfDay(date), startOfDay(now));
  const name = timerUpcomingDisplayName(item);

  if (omitFutureDemobilizationCountdown(item, now, omitDemobilizationCountdown)) {
    return name;
  }

  if (days <= 0) {
    return `${name} · сегодня`;
  }

  return `${name} · через ${formatCount(days, 'day')}`;
}
