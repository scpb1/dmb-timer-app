import { differenceInCalendarDays, startOfDay } from 'date-fns';

import type { DisplayEvent } from '@/types/events';
import { PREDEFINED_EVENT_IDS } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import { compareEventsChronologically, filterEventsInDefaultList } from '@/utils/eventCalculations';
import { formatHolidayName } from '@/utils/holidayCalculations';
import { formatCount } from '@/utils/inflection';

export interface EventsTimelineItem {
  id: string;
  state: 'past' | 'here' | 'future';
  title: string;
  subtitle: string;
  date: Date;
}

const BOUNDARY_ENLIST_ID = 'timeline:boundary-enlistment';
const BOUNDARY_DEMOB_ID = 'timeline:boundary-demobilization';

function timelineSubtitle(daysFromToday: number): string {
  if (daysFromToday === 0) {
    return 'Сегодня';
  }
  if (daysFromToday > 0) {
    return `через ${formatCount(daysFromToday, 'day')}`;
  }
  return `${formatCount(Math.abs(daysFromToday), 'day')} назад`;
}

function itemStateForDate(date: Date, today: Date): EventsTimelineItem['state'] {
  const days = differenceInCalendarDays(date, today);
  if (days === 0) {
    return 'here';
  }
  return days < 0 ? 'past' : 'future';
}

function inTimerRange(date: Date, start: Date, end: Date): boolean {
  const value = startOfDay(date).getTime();
  return value >= startOfDay(start).getTime() && value <= startOfDay(end).getTime();
}

function isPredefinedBoundaryEvent(event: DisplayEvent): boolean {
  return (
    event.id === PREDEFINED_EVENT_IDS.ENLISTMENT ||
    event.id === PREDEFINED_EVENT_IDS.DEMOBILIZATION
  );
}

function buildBoundaryItem(
  id: string,
  date: Date,
  title: string,
  today: Date,
): EventsTimelineItem {
  const day = startOfDay(date);
  const days = differenceInCalendarDays(day, today);
  return {
    id,
    date: day,
    title,
    subtitle: timelineSubtitle(days),
    state: itemStateForDate(day, today),
  };
}

/** Лента событий и праздников: всегда «Призыв» → … → «Дембель» */
export function buildEventsTimelineItems(
  events: DisplayEvent[],
  holidays: DisplayHoliday[],
  range: { start: Date; end: Date },
  now: Date = new Date(),
): EventsTimelineItem[] {
  const today = startOfDay(now);
  const rangeStart = startOfDay(range.start);
  const rangeEnd = startOfDay(range.end);
  const middle: EventsTimelineItem[] = [];

  for (const event of events) {
    if (isPredefinedBoundaryEvent(event)) {
      continue;
    }
    if (!inTimerRange(event.date, rangeStart, rangeEnd)) {
      continue;
    }
    const date = startOfDay(event.date);
    if (date.getTime() === rangeStart.getTime() || date.getTime() === rangeEnd.getTime()) {
      continue;
    }
    const days = differenceInCalendarDays(date, today);
    middle.push({
      id: `event:${event.id}:${date.getTime()}`,
      date,
      title: event.name,
      subtitle: timelineSubtitle(days),
      state: itemStateForDate(date, today),
    });
  }

  for (const holiday of holidays) {
    if (!inTimerRange(holiday.date, rangeStart, rangeEnd)) {
      continue;
    }
    const date = startOfDay(holiday.date);
    if (date.getTime() === rangeStart.getTime() || date.getTime() === rangeEnd.getTime()) {
      continue;
    }
    const days = differenceInCalendarDays(date, today);
    middle.push({
      id: `holiday:${holiday.id}:${date.getTime()}`,
      date,
      title: formatHolidayName(holiday),
      subtitle: timelineSubtitle(days),
      state: itemStateForDate(date, today),
    });
  }

  middle.sort((a, b) => {
    const eventIdFromTimelineId = (id: string): string | undefined => {
      if (!id.startsWith('event:')) {
        return undefined;
      }
      const rest = id.slice('event:'.length);
      const colon = rest.lastIndexOf(':');
      return colon >= 0 ? rest.slice(0, colon) : rest;
    };
    return compareEventsChronologically(
      { date: a.date, id: eventIdFromTimelineId(a.id), name: a.title },
      { date: b.date, id: eventIdFromTimelineId(b.id), name: b.title },
    );
  });

  const enlistItem = buildBoundaryItem(BOUNDARY_ENLIST_ID, rangeStart, 'Призыв', today);
  const demobItem = buildBoundaryItem(BOUNDARY_DEMOB_ID, rangeEnd, 'Дембель', today);

  return [enlistItem, ...middle, demobItem];
}

/** Вехи из «списка событий по умолчанию» (без праздников) */
export function buildDefaultEventsChecklistItems(
  events: DisplayEvent[],
  defaultListIds: string[],
  range: { start: Date; end: Date },
  now: Date = new Date(),
): EventsTimelineItem[] {
  const filtered = filterEventsInDefaultList(events, defaultListIds);
  return buildEventsTimelineItems(filtered, [], range, now);
}

/**
 * Доля заливки ленты по положению вех (0–1): конец на «сегодня» или между прошлой и следующей.
 */
export function getEventsTimelineVisualFillRatio(items: EventsTimelineItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  if (items.length === 1) {
    return items[0].state === 'past' || items[0].state === 'here' ? 1 : 0;
  }

  const lastIndex = items.length - 1;
  const hereIndex = items.findIndex((item) => item.state === 'here');
  if (hereIndex >= 0) {
    return hereIndex / lastIndex;
  }

  let lastPast = -1;
  let firstFuture = items.length;
  for (let index = 0; index < items.length; index += 1) {
    if (items[index].state === 'past') {
      lastPast = index;
    }
    if (items[index].state === 'future' && firstFuture === items.length) {
      firstFuture = index;
    }
  }

  if (firstFuture === items.length) {
    return 1;
  }
  if (lastPast < 0) {
    return 0;
  }

  return (lastPast + firstFuture) / 2 / lastIndex;
}

/** @deprecated для ленты используй getEventsTimelineVisualFillRatio */
export function getEventsTimelineFillRatio(
  items: EventsTimelineItem[],
  now: Date = new Date(),
): number {
  void now;
  return getEventsTimelineVisualFillRatio(items);
}

/** Позиция вехи на отрезке первой → последней (0–1) по календарю */
export function getEventsTimelineEventPosition(
  items: EventsTimelineItem[],
  item: EventsTimelineItem,
): number {
  if (items.length < 2) {
    return 0;
  }
  const start = items[0].date.getTime();
  const end = items[items.length - 1].date.getTime();
  if (end <= start) {
    return 0;
  }
  return Math.min(1, Math.max(0, (item.date.getTime() - start) / (end - start)));
}
