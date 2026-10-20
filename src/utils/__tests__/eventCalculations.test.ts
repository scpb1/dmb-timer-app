import {
  PREDEFINED_EVENT_IDS,
  type EventsStorage,
} from '@/types/events';
import { buildDisplayEvents, formatDaysUntilDate, isCalendarToday } from '@/utils/eventCalculations';

function at(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

const EMPTY_STORAGE: EventsStorage = {
  deletedIds: [],
  overrides: {},
  customEvents: [],
};

describe('buildDisplayEvents', () => {
  it('называет доли службы 1/4, 3/4, 1/3 и 2/3', () => {
    const events = buildDisplayEvents(at('2025-01-01'), at('2026-01-01'), EMPTY_STORAGE, at('2025-01-01'));
    const names = Object.fromEntries(events.map((event) => [event.id, event.name]));

    expect(names[PREDEFINED_EVENT_IDS.QUARTER_PASSED]).toBe('Прошла 1/4 службы');
    expect(names[PREDEFINED_EVENT_IDS.EQUATOR]).toBe('Экватор');
    expect(names[PREDEFINED_EVENT_IDS.QUARTER_REMAINING]).toBe('Прошло 3/4 службы');
    expect(names[PREDEFINED_EVENT_IDS.THIRD_PASSED]).toBe('Прошла 1/3 службы');
    expect(names[PREDEFINED_EVENT_IDS.THIRD_REMAINING]).toBe('Прошло 2/3 службы');
  });

  it('протягивает выбранную иконку пользовательского события', () => {
    const events = buildDisplayEvents(
      at('2025-01-01'),
      at('2026-01-01'),
      {
        ...EMPTY_STORAGE,
        customEvents: [
          {
            id: 'custom-birthday',
            name: 'День рождения',
            dateFormat: 'date',
            dateValue: '2025-06-10',
            icon: 'cake-variant',
          },
        ],
      },
      at('2025-01-01'),
    );

    expect(events.find((event) => event.id === 'custom-birthday')?.icon).toBe('cake-variant');
  });
});

describe('formatDaysUntilDate', () => {
  it('пишет «До даты n дней»', () => {
    expect(formatDaysUntilDate(at('2025-03-10'), at('2025-03-08'))).toBe('До даты 2 дня');
    expect(formatDaysUntilDate(at('2025-03-08'), at('2025-03-08'))).toBe('Сегодня');
  });
});

describe('isCalendarToday', () => {
  it('считает сегодня по календарному дню', () => {
    expect(isCalendarToday(at('2025-03-08'), at('2025-03-08'))).toBe(true);
    expect(isCalendarToday(at('2025-03-08'), at('2025-03-09'))).toBe(false);
  });
});
