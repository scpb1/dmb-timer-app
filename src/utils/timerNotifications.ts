import { format } from 'date-fns';

import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import { formatHolidayTodayBody } from '@/utils/holidayCalculations';

export const HOLIDAY_NOTIFICATION_ID_PREFIX = 'holiday:';
export const EVENT_NOTIFICATION_ID_PREFIX = 'event:';

export interface TimerNotificationSource {
  id: string;
  name: string;
}

export interface ScheduledOccurrenceNotification {
  identifier: string;
  title: string;
  body: string;
  date: Date;
}

function occurrenceKey(id: string, date: Date): string {
  return `${id}:${format(date, 'yyyy-MM-dd')}`;
}

export function formatQuotedTimerNames(names: string[]): string {
  return names.map((name) => `"${name}"`).join(', ');
}

export function formatEventNotificationBody(name: string, timerNames: string[]): string {
  if (timerNames.length <= 1) {
    return `Сегодня ${name}`;
  }

  return `Сегодня событие "${name}" у таймеров ${formatQuotedTimerNames(timerNames)}`;
}

export function groupHolidayNotifications(
  perTimer: { holidays: DisplayHoliday[] }[],
): ScheduledOccurrenceNotification[] {
  const unique = new Map<string, DisplayHoliday>();

  for (const { holidays } of perTimer) {
    for (const holiday of holidays) {
      const key = occurrenceKey(holiday.id, holiday.date);
      if (!unique.has(key)) {
        unique.set(key, holiday);
      }
    }
  }

  return [...unique.entries()].map(([key, holiday]) => ({
    identifier: `${HOLIDAY_NOTIFICATION_ID_PREFIX}${key}`,
    title: holiday.name,
    body: formatHolidayTodayBody(holiday.name, holiday.id),
    date: holiday.date,
  }));
}

export function groupEventNotifications(
  perTimer: { timer: TimerNotificationSource; events: DisplayEvent[] }[],
): ScheduledOccurrenceNotification[] {
  const groups = new Map<
    string,
    { event: DisplayEvent; timerNames: string[] }
  >();

  for (const { timer, events } of perTimer) {
    for (const event of events) {
      const key = occurrenceKey(event.id, event.date);
      const existing = groups.get(key);
      if (existing) {
        if (!existing.timerNames.includes(timer.name)) {
          existing.timerNames.push(timer.name);
        }
        continue;
      }

      groups.set(key, { event, timerNames: [timer.name] });
    }
  }

  return [...groups.entries()].map(([key, group]) => ({
    identifier: `${EVENT_NOTIFICATION_ID_PREFIX}${key}`,
    title: group.event.name,
    body: formatEventNotificationBody(group.event.name, group.timerNames),
    date: group.event.date,
  }));
}
