import { format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { isValidMonthDay } from './progress';

export const HOLIDAY_NAME_MAX_LENGTH = 50;

export interface HolidayOverride {
  name?: string;
  month?: number;
  day?: number;
}

export interface CustomHolidayRecord {
  id: string;
  name: string;
  month: number;
  day: number;
}

export interface HolidaysStorage {
  deletedIds: string[];
  overrides: Record<string, HolidayOverride>;
  customHolidays: CustomHolidayRecord[];
}

export const DEFAULT_HOLIDAYS_STORAGE: HolidaysStorage = {
  deletedIds: [],
  overrides: {},
  customHolidays: [],
};

/** Как в приложении: src/types/holidays.ts */
export const PREDEFINED_HOLIDAYS = [
  { id: 'predefined-holiday-new-year', name: 'Новый год', month: 1, day: 1 },
  { id: 'predefined-holiday-valentine', name: 'День святого Валентина', month: 2, day: 14 },
  { id: 'predefined-holiday-defender-day', name: '23 февраля', month: 2, day: 23 },
  { id: 'predefined-holiday-spring', name: 'Весна', month: 3, day: 1 },
  { id: 'predefined-holiday-womens-day', name: '8 марта', month: 3, day: 8 },
  { id: 'predefined-holiday-victory-day', name: 'День Победы', month: 5, day: 9 },
  { id: 'predefined-holiday-summer', name: 'Лето', month: 6, day: 1 },
  { id: 'predefined-holiday-family-day', name: 'День семьи, любви и верности', month: 7, day: 8 },
  { id: 'predefined-holiday-autumn', name: 'Осень', month: 9, day: 1 },
  { id: 'predefined-holiday-winter', name: 'Зима', month: 12, day: 1 },
] as const;

export interface DisplayHoliday {
  id: string;
  name: string;
  month: number;
  day: number;
  date: Date;
  isCustom: boolean;
  isPast: boolean;
}

function cloneHolidays(storage?: HolidaysStorage | null): HolidaysStorage {
  if (!storage) {
    return {
      deletedIds: [],
      overrides: {},
      customHolidays: [],
    };
  }

  return {
    deletedIds: [...storage.deletedIds],
    overrides: { ...storage.overrides },
    customHolidays: storage.customHolidays.map((item) => ({ ...item })),
  };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function holidayDateInYear(month: number, day: number, year: number): Date {
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return startOfDay(new Date(year, 1, 28));
  }
  return startOfDay(new Date(year, month - 1, day));
}

function occurrencesInRange(month: number, day: number, start: Date, end: Date): Date[] {
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);
  if (rangeEnd < rangeStart) {
    return [];
  }

  const dates: Date[] = [];
  for (let year = rangeStart.getFullYear(); year <= rangeEnd.getFullYear(); year += 1) {
    const occurrence = holidayDateInYear(month, day, year);
    if (occurrence >= rangeStart && occurrence <= rangeEnd) {
      dates.push(occurrence);
    }
  }
  return dates;
}

export function emptyHolidays(): HolidaysStorage {
  return cloneHolidays();
}

export function buildDisplayHolidays(
  storage: HolidaysStorage,
  enlistmentDate: Date | null,
  demobilizationDate: Date | null,
  now: Date = new Date(),
): DisplayHoliday[] {
  const today = startOfDay(now);
  const deleted = new Set(storage.deletedIds);
  const range =
    enlistmentDate && demobilizationDate
      ? { start: enlistmentDate, end: demobilizationDate }
      : null;

  const seeds = [
    ...PREDEFINED_HOLIDAYS.filter((item) => !deleted.has(item.id)).map((item) => {
      const override = storage.overrides[item.id];
      return {
        id: item.id,
        name: override?.name ?? item.name,
        month: override?.month ?? item.month,
        day: override?.day ?? item.day,
        isCustom: false,
      };
    }),
    ...storage.customHolidays
      .filter((item) => !deleted.has(item.id) && isValidMonthDay(item.month, item.day))
      .map((item) => ({
        id: item.id,
        name: item.name,
        month: item.month,
        day: item.day,
        isCustom: true,
      })),
  ];

  return seeds
    .flatMap((seed) => {
      const dates = range
        ? occurrencesInRange(seed.month, seed.day, range.start, range.end)
        : [holidayDateInYear(seed.month, seed.day, today.getFullYear())];

      return dates.map((date) => ({
        ...seed,
        date,
        isPast: date < today,
      }));
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function formatHolidayLine(holiday: DisplayHoliday): string {
  return `${format(holiday.date, 'd MMMM yyyy', { locale: ru })} — ${holiday.name}`;
}

export function addCustomHoliday(
  storage: HolidaysStorage,
  holiday: CustomHolidayRecord,
): HolidaysStorage {
  const next = cloneHolidays(storage);
  next.customHolidays.push(holiday);
  return next;
}

export function removeHoliday(storage: HolidaysStorage, holidayId: string): HolidaysStorage {
  const next = cloneHolidays(storage);
  const customIndex = next.customHolidays.findIndex((item) => item.id === holidayId);
  if (customIndex >= 0) {
    next.customHolidays.splice(customIndex, 1);
    return next;
  }
  if (!next.deletedIds.includes(holidayId)) {
    next.deletedIds.push(holidayId);
  }
  return next;
}
