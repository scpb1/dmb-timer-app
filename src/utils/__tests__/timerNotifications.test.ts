import { PREDEFINED_EVENT_IDS } from '@/types/events';
import { PREDEFINED_HOLIDAY_IDS } from '@/types/holidays';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import {
  formatEventNotificationBody,
  groupEventNotifications,
  groupHolidayNotifications,
} from '@/utils/timerNotifications';

const newYear: DisplayHoliday = {
  id: PREDEFINED_HOLIDAY_IDS.NEW_YEAR,
  name: 'Новый год',
  month: 1,
  day: 1,
  date: new Date(2026, 0, 1),
  isCustom: false,
  isPast: false,
};

function event(id: string, name: string, date: Date): DisplayEvent {
  return {
    id,
    name,
    date,
    dateFormat: 'date',
    isCustom: false,
    isPast: false,
  };
}

describe('timerNotifications', () => {
  it('склеивает один и тот же праздник во всех таймерах в одно уведомление', () => {
    const grouped = groupHolidayNotifications([
      { holidays: [newYear] },
      { holidays: [{ ...newYear }] },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.title).toBe('Новый год');
    expect(grouped[0]?.body).toBe('Сегодня Новый год');
  });

  it('для одного таймера оставляет текст события без списка имён', () => {
    expect(formatEventNotificationBody('Экватор', ['Петя'])).toBe('Сегодня Экватор');
  });

  it('для одного и того же события пишет имена таймеров', () => {
    const equatorDate = new Date(2025, 5, 1);
    const grouped = groupEventNotifications([
      {
        timer: { id: 'service', name: 'Петя' },
        events: [event(PREDEFINED_EVENT_IDS.EQUATOR, 'Экватор', equatorDate)],
      },
      {
        timer: { id: 'custom-1', name: 'Вася' },
        events: [event(PREDEFINED_EVENT_IDS.EQUATOR, 'Экватор', equatorDate)],
      },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.body).toBe(
      'Сегодня событие "Экватор" у таймеров "Петя", "Вася"',
    );
  });

  it('не склеивает события в разные дни', () => {
    const grouped = groupEventNotifications([
      {
        timer: { id: 'service', name: 'Петя' },
        events: [event(PREDEFINED_EVENT_IDS.EQUATOR, 'Экватор', new Date(2025, 5, 1))],
      },
      {
        timer: { id: 'custom-1', name: 'Вася' },
        events: [event(PREDEFINED_EVENT_IDS.EQUATOR, 'Экватор', new Date(2025, 6, 1))],
      },
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped.map((item) => item.body)).toEqual(['Сегодня Экватор', 'Сегодня Экватор']);
  });
});
