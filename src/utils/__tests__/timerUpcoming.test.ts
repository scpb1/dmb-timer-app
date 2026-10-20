import { addDays, startOfDay } from 'date-fns';

import { PREDEFINED_EVENT_IDS } from '@/types/events';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import {
  formatTimerVizUpcomingHeadline,
  isTimerUpcomingDemobilization,
  resolveTimerUpcomingItem,
} from '@/utils/timerUpcoming';

const enlist = startOfDay(new Date(2025, 0, 1));
const demob = startOfDay(new Date(2026, 0, 1));
const now = startOfDay(new Date(2025, 5, 1));

function event(id: string, name: string, date: Date): DisplayEvent {
  return {
    id,
    name,
    date,
    dateFormat: 'date',
    isCustom: false,
    isPast: date < now,
  };
}

function holiday(id: string, name: string, date: Date): DisplayHoliday {
  return {
    id,
    name,
    month: date.getMonth() + 1,
    day: date.getDate(),
    date,
    isCustom: false,
    isPast: date < now,
  };
}

describe('resolveTimerUpcomingItem', () => {
  const events = [
    event(PREDEFINED_EVENT_IDS.ENLISTMENT, 'Призыв', enlist),
    event(PREDEFINED_EVENT_IDS.DEMOBILIZATION, 'Дембель', demob),
  ];
  const holidays = [holiday('predefined-holiday-new-year', 'Новый год', new Date(2026, 0, 1))];

  it('returns null when preview is off', () => {
    expect(resolveTimerUpcomingItem('off', null, events, holidays, now)).toBeNull();
  });

  it('picks nearest upcoming item', () => {
    const nextHoliday = holiday(
      'predefined-holiday-summer',
      'Лето',
      addDays(now, 10),
    );
    const item = resolveTimerUpcomingItem(
      'nearest',
      null,
      events,
      [...holidays, nextHoliday],
      now,
    );
    expect(item?.kind).toBe('holiday');
    expect(item && item.kind === 'holiday' ? item.holiday.name : '').toBe('Лето');
  });

  it('formats viz headline with days until event', () => {
    const next = { kind: 'event' as const, event: event('custom-1', 'Отпуск', addDays(now, 12)) };
    expect(formatTimerVizUpcomingHeadline(next, now)).toBe('Отпуск · через 12 дней');
  });

  it('formats viz headline for today', () => {
    const today = { kind: 'event' as const, event: event('custom-2', 'Свидание', now) };
    expect(formatTimerVizUpcomingHeadline(today, now)).toBe('Свидание · сегодня');
  });

  it('formats demobilization without day count', () => {
    const demobItem = {
      kind: 'event' as const,
      event: event(PREDEFINED_EVENT_IDS.DEMOBILIZATION, 'Дембель', demob),
    };
    expect(formatTimerVizUpcomingHeadline(demobItem, now)).toBe('Дембель · Финишная прямая');
  });

  it('respects pinned demobilization', () => {
    const item = resolveTimerUpcomingItem(
      'pinned',
      `event:${PREDEFINED_EVENT_IDS.DEMOBILIZATION}`,
      events,
      holidays,
      now,
    );
    expect(isTimerUpcomingDemobilization(item!)).toBe(true);
  });
});
