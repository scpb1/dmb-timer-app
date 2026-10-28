import { startOfDay } from 'date-fns';

import { PREDEFINED_EVENT_IDS } from '@/types/events';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import {
  buildEventsTimelineItems,
  getEventsTimelineFillRatio,
  getEventsTimelineVisualFillRatio,
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
  it('всегда начинается с Призыва и заканчивается Дембелём', () => {
    const items = buildEventsTimelineItems(
      [
        event(PREDEFINED_EVENT_IDS.ENLISTMENT, 'Призыв', enlist),
        event(PREDEFINED_EVENT_IDS.DEMOBILIZATION, 'Дембель', demob),
      ],
      [holiday('ny', 'Новый год', new Date(2026, 0, 1))],
      { start: enlist, end: demob },
      now,
    );

    expect(items[0].title).toBe('Призыв');
    expect(items[items.length - 1].title).toBe('Дембель');
    expect(items.find((i) => i.title.startsWith('Новый год'))).toBeUndefined();
    expect(items.find((i) => i.title === 'Призыв')?.subtitle).toMatch(/назад/);
    expect(items.find((i) => i.title === 'Дембель')?.subtitle).toMatch(/^через /);
  });

  it('заливка по вехам: между прошлой и следующей, не по календарю', () => {
    const mid = startOfDay(new Date(2025, 3, 1));
    const items = buildEventsTimelineItems(
      [event('mid', '100 дней', mid)],
      [],
      { start: enlist, end: demob },
      now,
    );
    const visual = getEventsTimelineVisualFillRatio(items);
    expect(visual).toBeGreaterThan(0);
    expect(visual).toBeLessThan(1);
    expect(getEventsTimelineFillRatio(items, now)).toBe(visual);
  });

  it('в день праздника ставит «Сегодня» и состояние here', () => {
    const todayHoliday = holiday('test', 'Именины', now);
    const items = buildEventsTimelineItems([], [todayHoliday], { start: enlist, end: demob }, now);
    const row = items.find((i) => i.title.includes('Именины'));
    expect(row?.state).toBe('here');
    expect(row?.subtitle).toBe('Сегодня');
    expect(items[0].title).toBe('Призыв');
    expect(items[items.length - 1].title).toBe('Дембель');
    expect(getEventsTimelineVisualFillRatio(items)).toBe(
      items.findIndex((i) => i.title.includes('Именины')) / (items.length - 1),
    );
  });
});
