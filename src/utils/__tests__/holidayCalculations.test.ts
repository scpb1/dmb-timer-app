import { format } from 'date-fns';
import {
  PREDEFINED_HOLIDAYS,
  PREDEFINED_HOLIDAY_IDS,
} from '@/types/holidays';
import {
  buildDisplayHolidays,
  holidayDateInYear,
  holidayMatchesDate,
  holidayOccurrencesInRange,
  isValidMonthDay,
  resolveHolidayThemeTitle,
} from '@/utils/holidayCalculations';

describe('holidayCalculations', () => {
  it('не принимает несуществующие даты', () => {
    expect(isValidMonthDay(2, 30)).toBe(false);
    expect(isValidMonthDay(4, 31)).toBe(false);
    expect(isValidMonthDay(2, 29)).toBe(true);
    expect(isValidMonthDay(12, 31)).toBe(true);
  });

  it('в невисокосный год 29 февраля сдвигает на 28-е', () => {
    expect(holidayDateInYear(2, 29, 2023)).toEqual(new Date(2023, 1, 28));
    expect(holidayDateInYear(2, 29, 2024)).toEqual(new Date(2024, 1, 29));
  });

  it('совпадение праздника смотрит на календарный день', () => {
    expect(holidayMatchesDate(1, 1, new Date(2025, 0, 1, 23, 50))).toBe(true);
    expect(holidayMatchesDate(1, 1, new Date(2025, 0, 2))).toBe(false);
  });

  it('собирает вхождения праздника в диапазоне службы', () => {
    const dates = holidayOccurrencesInRange(
      1,
      1,
      new Date(2025, 0, 1),
      new Date(2026, 0, 1),
    );

    expect(dates.map((date) => format(date, 'yyyy-MM-dd'))).toEqual([
      '2025-01-01',
      '2026-01-01',
    ]);
  });

  it('в пресетах нет Рождества, старого НГ, Крещения и 1 сентября, есть сезоны', () => {
    const ids = PREDEFINED_HOLIDAYS.map((holiday) => holiday.id);
    expect(ids).toEqual([
      PREDEFINED_HOLIDAY_IDS.NEW_YEAR,
      PREDEFINED_HOLIDAY_IDS.VALENTINE,
      PREDEFINED_HOLIDAY_IDS.DEFENDER_DAY,
      PREDEFINED_HOLIDAY_IDS.SPRING,
      PREDEFINED_HOLIDAY_IDS.WOMENS_DAY,
      PREDEFINED_HOLIDAY_IDS.VICTORY_DAY,
      PREDEFINED_HOLIDAY_IDS.SUMMER,
      PREDEFINED_HOLIDAY_IDS.FAMILY_DAY,
      PREDEFINED_HOLIDAY_IDS.AUTUMN,
      PREDEFINED_HOLIDAY_IDS.WINTER,
    ]);
    expect(ids).not.toContain('predefined-holiday-christmas');
    expect(ids).not.toContain('predefined-holiday-knowledge-day');
  });

  it('для сезонов пишет тему письма «как я встречала»', () => {
    expect(
      resolveHolidayThemeTitle('holiday:predefined-holiday-winter:2026', []),
    ).toBe('Как я встречала зиму 2026');
  });

  it('восстанавливает тему письма удалённого пресета по старому id', () => {
    expect(
      resolveHolidayThemeTitle('holiday:predefined-holiday-christmas:2026', []),
    ).toBe('Как я отмечала Рождество 2026');
  });

  it('разворачивает праздник на годы службы и сохраняет иконку', () => {
    const holidays = buildDisplayHolidays(
      {
        deletedIds: [],
        overrides: {},
        customHolidays: [
          {
            id: 'custom-birthday',
            name: 'День рождения',
            month: 6,
            day: 10,
            icon: 'cake-variant',
          },
        ],
      },
      new Date(2025, 0, 1),
      { start: new Date(2025, 0, 1), end: new Date(2026, 11, 31) },
    );

    const birthday = holidays.filter((item) => item.id === 'custom-birthday');
    expect(birthday.map((item) => item.date.getFullYear())).toEqual([2025, 2026]);
    expect(birthday[0]?.icon).toBe('cake-variant');
  });
});
