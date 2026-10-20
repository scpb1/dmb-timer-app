import { differenceInCalendarDays, startOfDay } from 'date-fns';

import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import { formatHolidayName } from '@/utils/holidayCalculations';
import { formatCount } from '@/utils/inflection';

export interface EventsTimelineItem {
  id: string;
  state: 'past' | 'here' | 'future';
  title: string;
  subtitle: string;
  date: Date;
}

function timelineSubtitle(daysFromToday: number): string {
  if (daysFromToday === 0) {
    return 'Сегодня';
  }
  if (daysFromToday > 0) {
    return `через ${formatCount(daysFromToday, 'day')}`;
  }
  return `${formatCount(Math.abs(daysFromToday), 'day')} назад`;
}

function inTimerRange(date: Date, start: Date, end: Date): boolean {
  const value = startOfDay(date).getTime();
  return value >= startOfDay(start).getTime() && value <= startOfDay(end).getTime();
}

/** Лента событий и праздников из вкладки «События», в хронологическом порядке */
export function buildEventsTimelineItems(
  events: DisplayEvent[],
  holidays: DisplayHoliday[],
  range: { start: Date; end: Date },
  now: Date = new Date(),
): EventsTimelineItem[] {
  const today = startOfDay(now);
  const items: EventsTimelineItem[] = [];

  for (const event of events) {
    if (!inTimerRange(event.date, range.start, range.end)) {
      continue;
    }
    const date = startOfDay(event.date);
    const days = differenceInCalendarDays(date, today);
    items.push({
      id: `event:${event.id}:${date.getTime()}`,
      date,
      title: event.name,
      subtitle: timelineSubtitle(days),
      state: days === 0 ? 'here' : days < 0 ? 'past' : 'future',
    });
  }

  for (const holiday of holidays) {
    if (!inTimerRange(holiday.date, range.start, range.end)) {
      continue;
    }
    const date = startOfDay(holiday.date);
    const days = differenceInCalendarDays(date, today);
    items.push({
      id: `holiday:${holiday.id}:${date.getTime()}`,
      date,
      title: formatHolidayName(holiday),
      subtitle: timelineSubtitle(days),
      state: days === 0 ? 'here' : days < 0 ? 'past' : 'future',
    });
  }

  return items.sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.title.localeCompare(b.title, 'ru'),
  );
}

/** Доля пройденного времени от первой до последней вехи (0–1) */
export function getEventsTimelineFillRatio(
  items: EventsTimelineItem[],
  now: Date = new Date(),
): number {
  if (items.length < 2) {
    return items.length === 1 && items[0].state === 'past' ? 1 : 0;
  }
  const today = startOfDay(now).getTime();
  const start = items[0].date.getTime();
  const end = items[items.length - 1].date.getTime();
  if (end <= start) {
    return 0;
  }
  return Math.min(1, Math.max(0, (today - start) / (end - start)));
}

/** Позиция вехи на отрезке первой → последней (0–1) */
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
