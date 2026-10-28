import { addDays, startOfDay } from 'date-fns';

import { PREDEFINED_EVENT_IDS } from '@/types/events';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import {
  formatTimerUpcomingCountdown,
  formatTimerVizUpcomingHeadline,
  isTimerUpcomingDemobilization,
  resolveTimerUpcomingItem,
  shouldOmitDemobilizationCountdown,
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

  it('formats demobilization with days until date', () => {
    const demobItem = {
      kind: 'event' as const,
      event: event(PREDEFINED_EVENT_IDS.DEMOBILIZATION, 'Дембель', demob),
    };
    expect(formatTimerVizUpcomingHeadline(demobItem, now)).toBe('Дембель · через 214 дней');
    expect(formatTimerUpcomingCountdown(demobItem, now)).toBe('До даты 214 дней');
  });

  it('hides future demobilization countdown when the timer already shows days', () => {
    const demobItem = {
      kind: 'event' as const,
      event: event(PREDEFINED_EVENT_IDS.DEMOBILIZATION, 'Дембель', demob),
    };
    expect(formatTimerVizUpcomingHeadline(demobItem, now, true)).toBe('Дембель');
    expect(formatTimerUpcomingCountdown(demobItem, now, true)).toBeNull();
    expect(formatTimerUpcomingCountdown(demobItem, demob, true)).toBe('Сегодня');
  });

  it('omits demobilization countdown when days show on timer or stat cards', () => {
    expect(shouldOmitDemobilizationCountdown('circular', 'days', 'weeks')).toBe(true);
    expect(shouldOmitDemobilizationCountdown('circular', 'percent', 'days')).toBe(true);
    expect(shouldOmitDemobilizationCountdown('circular', 'percent', 'weeks')).toBe(false);
    expect(shouldOmitDemobilizationCountdown('linear', 'weeks', 'months')).toBe(false);
    expect(shouldOmitDemobilizationCountdown('dotGrid', 'days', 'days')).toBe(true);
    expect(shouldOmitDemobilizationCountdown('frame', 'percent', 'weeks')).toBe(true);
    expect(shouldOmitDemobilizationCountdown('milestones', 'percent', 'weeks')).toBe(true);
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
