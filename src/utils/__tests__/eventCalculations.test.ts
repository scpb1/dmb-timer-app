import { format, startOfDay } from 'date-fns';

import {
  PREDEFINED_EVENT_IDS,
  type EventsStorage,
} from '@/types/events';
import {
  buildDisplayEvents,
  compareEventsChronologically,
  formatDaysUntilDate,
  formatEventDaysUntilCaption,
  formatEventPercentInput,
  isCalendarToday,
  parseEventPercentInput,
  resolveEventDate,
  sanitizeEventPercentInput,
} from '@/utils/eventCalculations';

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
    expect(events.find((event) => event.id === 'custom-birthday')?.highlightMode).toBeUndefined();
  });

  it('протягивает оформление строки пользовательского события', () => {
    const events = buildDisplayEvents(
      at('2025-01-01'),
      at('2026-01-01'),
      {
        ...EMPTY_STORAGE,
        customEvents: [
          {
            id: 'custom-row',
            name: 'Веха',
            dateFormat: 'date',
            dateValue: '2025-06-10',
            highlightMode: 'row',
            iconColor: '#BB322E',
          },
        ],
      },
      at('2025-01-01'),
    );

    const rowEvent = events.find((event) => event.id === 'custom-row');
    expect(rowEvent?.highlightMode).toBe('row');
    expect(rowEvent?.iconColor).toBe('#BB322E');
  });

  it('считает пользовательское событие по проценту прошедшего срока', () => {
    const events = buildDisplayEvents(
      at('2025-01-01'),
      at('2026-01-01'),
      {
        ...EMPTY_STORAGE,
        customEvents: [
          {
            id: 'custom-half',
            name: 'Половина',
            dateFormat: 'percent',
            percentValue: 50,
          },
        ],
      },
      at('2025-01-01'),
    );

    const half = events.find((event) => event.id === 'custom-half');
    expect(half?.percentValue).toBe(50);
    expect(format(half!.date, 'yyyy-MM-dd')).toBe('2025-07-03');
  });
});

describe('event percent input', () => {
  it('принимает целое, один и два знака, точку и запятую', () => {
    expect(parseEventPercentInput('50')).toBe(50);
    expect(parseEventPercentInput('50.5')).toBe(50.5);
    expect(parseEventPercentInput('50,55')).toBe(50.55);
    expect(parseEventPercentInput('.5')).toBe(0.5);
    expect(parseEventPercentInput(',5')).toBe(0.5);
    expect(parseEventPercentInput('100')).toBe(100);
    expect(parseEventPercentInput('0')).toBe(0);
  });

  it('отклоняет пустое, больше 100 и лишние знаки', () => {
    expect(parseEventPercentInput('')).toBeNull();
    expect(parseEventPercentInput('.')).toBeNull();
    expect(parseEventPercentInput('101')).toBeNull();
    expect(parseEventPercentInput('100.01')).toBeNull();
    expect(parseEventPercentInput('50.555')).toBeNull();
  });

  it('обрезает ввод до двух знаков и трёх цифр целой части', () => {
    expect(sanitizeEventPercentInput('50.555')).toBe('50.55');
    expect(sanitizeEventPercentInput('50,555')).toBe('50,55');
    expect(sanitizeEventPercentInput('1000')).toBe('100');
    expect(sanitizeEventPercentInput('abc12,3x4')).toBe('12,34');
  });

  it('форматирует сохранённое значение без лишнего нуля', () => {
    expect(formatEventPercentInput(50)).toBe('50');
    expect(formatEventPercentInput(50.5)).toBe('50.5');
    expect(formatEventPercentInput(33.33)).toBe('33.33');
  });
});

describe('resolveEventDate', () => {
  it('для процента берёт долю срока от призыва', () => {
    const enlist = startOfDay(at('2025-01-01'));
    const demob = startOfDay(at('2026-01-01'));

    expect(format(resolveEventDate(enlist, demob, 'percent', undefined, undefined, undefined, 0)!, 'yyyy-MM-dd')).toBe(
      '2025-01-01',
    );
    expect(format(resolveEventDate(enlist, demob, 'percent', undefined, undefined, undefined, 100)!, 'yyyy-MM-dd')).toBe(
      '2026-01-01',
    );
    expect(format(resolveEventDate(enlist, demob, 'percent', undefined, undefined, undefined, 25)!, 'yyyy-MM-dd')).toBe(
      '2025-04-02',
    );
  });
});

describe('compareEventsChronologically', () => {
  it('ставит призыв первым, дембель последним даже при «поздних» пользовательских датах', () => {
    const sorted = [
      {
        date: at('2026-06-01'),
        id: 'custom-late',
        name: 'Поздняя веха',
      },
      {
        date: at('2026-01-01'),
        id: PREDEFINED_EVENT_IDS.DEMOBILIZATION,
        name: 'Дембель',
      },
      {
        date: at('2025-01-01'),
        id: PREDEFINED_EVENT_IDS.ENLISTMENT,
        name: 'Призыв',
      },
    ].sort(compareEventsChronologically);

    expect(sorted.map((item) => item.name)).toEqual(['Призыв', 'Поздняя веха', 'Дембель']);
  });
});

describe('formatDaysUntilDate', () => {
  it('пишет «До даты n дней» и «Прошло n дней»', () => {
    expect(formatDaysUntilDate(at('2025-03-10'), at('2025-03-08'))).toBe('До даты 2 дня');
    expect(formatDaysUntilDate(at('2025-03-08'), at('2025-03-08'))).toBe('Сегодня');
    expect(formatDaysUntilDate(at('2025-03-05'), at('2025-03-08'))).toBe('Прошло 3 дня');
    expect(formatDaysUntilDate(at('2025-03-07'), at('2025-03-08'))).toBe('Прошло 1 день');
  });
});

describe('formatEventDaysUntilCaption', () => {
  it('для дембеля пишет «До даты n дней», а после даты — «Прошло n дней»', () => {
    const demob = {
      id: PREDEFINED_EVENT_IDS.DEMOBILIZATION,
      name: 'Дембель',
      date: at('2026-01-01'),
      dateFormat: 'date' as const,
      isCustom: false,
      isPast: false,
    };

    expect(formatEventDaysUntilCaption(demob, at('2025-12-01'))).toBe('До даты 31 день');
    expect(formatEventDaysUntilCaption({ ...demob, isPast: false }, at('2026-01-01'))).toBe(
      'Сегодня',
    );
    expect(formatEventDaysUntilCaption({ ...demob, isPast: true }, at('2026-01-04'))).toBe(
      'Прошло 3 дня',
    );
  });
});

describe('isCalendarToday', () => {
  it('считает сегодня по календарному дню', () => {
    expect(isCalendarToday(at('2025-03-08'), at('2025-03-08'))).toBe(true);
    expect(isCalendarToday(at('2025-03-08'), at('2025-03-09'))).toBe(false);
  });
});
