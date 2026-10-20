import { startOfDay } from 'date-fns';

import { PREDEFINED_EVENT_IDS } from '@/types/events';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import {
  buildEventsTimelineItems,
  getEventsTimelineFillRatio,
} from '@/utils/eventsTimeline';

const enlist = startOfDay(new Date(2025, 0, 1));
const demob = startOfDay(new Date(2026, 0, 1));
const now = startOfDay(new Date(2025, 5, 15));

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

describe('buildEventsTimelineItems', () => {
  it('собирает события и праздники с подписью «N дней назад» / «через N дней»', () => {
    const items = buildEventsTimelineItems(
      [
        event(PREDEFINED_EVENT_IDS.ENLISTMENT, 'Призыв', enlist),
        event(PREDEFINED_EVENT_IDS.DEMOBILIZATION, 'Дембель', demob),
      ],
      [holiday('ny', 'Новый год', new Date(2026, 0, 1))],
      { start: enlist, end: demob },
      now,
    );

    expect(items.find((i) => i.title === 'Призыв')?.subtitle).toMatch(/назад/);
    expect(items.find((i) => i.title === 'Дембель')?.subtitle).toMatch(/^через /);
    expect(items.some((i) => i.title.startsWith('Новый год'))).toBe(true);
  });

  it('считает долю пройденного времени между первой и последней вехой', () => {
    const items = buildEventsTimelineItems(
      [
        event(PREDEFINED_EVENT_IDS.ENLISTMENT, 'Призыв', enlist),
        event(PREDEFINED_EVENT_IDS.DEMOBILIZATION, 'Дембель', demob),
      ],
      [],
      { start: enlist, end: demob },
      now,
    );
    const ratio = getEventsTimelineFillRatio(items, now);
    expect(ratio).toBeGreaterThan(0.4);
    expect(ratio).toBeLessThan(0.6);
  });

  it('в день праздника ставит «Сегодня» и состояние here', () => {
    const todayHoliday = holiday('test', 'Именины', now);
    const items = buildEventsTimelineItems([], [todayHoliday], { start: enlist, end: demob }, now);
    const row = items[0];
    expect(row.state).toBe('here');
    expect(row.subtitle).toBe('Сегодня');
    expect(row.title).toContain('Именины');
  });
});
