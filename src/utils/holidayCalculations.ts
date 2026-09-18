import { format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { LetterTheme } from '@/types/diary';
import {
  DEFAULT_HOLIDAYS_STORAGE,
  HOLIDAY_THEME_ID_PREFIX,
  PREDEFINED_HOLIDAYS,
  type CustomHolidayRecord,
  type DisplayHoliday,
  type HolidayOverride,
  type HolidaysStorage,
  type PredefinedHolidayTemplate,
} from '@/types/holidays';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function holidayDateInYear(month: number, day: number, year: number): Date {
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return startOfDay(new Date(year, 1, 28));
  }

  return startOfDay(new Date(year, month - 1, day));
}

export function isValidMonthDay(month: number, day: number): boolean {
  if (!Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const probe = new Date(2024, month - 1, day);
  return probe.getMonth() === month - 1 && probe.getDate() === day;
}

export function holidayMatchesDate(month: number, day: number, date: Date): boolean {
  const occurrence = holidayDateInYear(month, day, date.getFullYear());
  const target = startOfDay(date);
  return occurrence.getTime() === target.getTime();
}

interface HolidaySeed {
  id: string;
  name: string;
  month: number;
  day: number;
  isCustom: boolean;
}

export interface HolidayServiceRange {
  start: Date;
  end: Date;
}

export function holidayOccurrencesInRange(
  month: number,
  day: number,
  start: Date,
  end: Date,
): Date[] {
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);
  if (rangeEnd < rangeStart) {
    return [];
  }

  const dates: Date[] = [];
  const startYear = rangeStart.getFullYear();
  const endYear = rangeEnd.getFullYear();

  for (let year = startYear; year <= endYear; year += 1) {
    const occurrence = holidayDateInYear(month, day, year);
    if (occurrence >= rangeStart && occurrence <= rangeEnd) {
      dates.push(occurrence);
    }
  }

  return dates;
}

function applyOverride(
  template: PredefinedHolidayTemplate,
  override: HolidayOverride | undefined,
): HolidaySeed {
  return {
    id: template.id,
    name: override?.name ?? template.defaultName,
    month: override?.month ?? template.month,
    day: override?.day ?? template.day,
    isCustom: false,
  };
}

function customToSeed(record: CustomHolidayRecord): HolidaySeed | null {
  if (!isValidMonthDay(record.month, record.day)) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    month: record.month,
    day: record.day,
    isCustom: true,
  };
}

function expandHolidaySeed(
  seed: HolidaySeed,
  today: Date,
  serviceRange?: HolidayServiceRange | null,
): DisplayHoliday[] {
  const dates = serviceRange
    ? holidayOccurrencesInRange(seed.month, seed.day, serviceRange.start, serviceRange.end)
    : [holidayDateInYear(seed.month, seed.day, today.getFullYear())];

  return dates.map((date) => ({
    ...seed,
    date,
    isPast: startOfDay(date) < today,
  }));
}

export function buildDisplayHolidays(
  storage: HolidaysStorage,
  now: Date = new Date(),
  serviceRange?: HolidayServiceRange | null,
): DisplayHoliday[] {
  const today = startOfDay(now);
  const deletedSet = new Set(storage.deletedIds);

  const predefined = PREDEFINED_HOLIDAYS.filter((template) => !deletedSet.has(template.id)).map(
    (template) => applyOverride(template, storage.overrides[template.id]),
  );

  const custom = storage.customHolidays
    .filter((record) => !deletedSet.has(record.id))
    .map((record) => customToSeed(record))
    .filter((seed): seed is HolidaySeed => seed !== null);

  return [...predefined, ...custom]
    .flatMap((seed) => expandHolidaySeed(seed, today, serviceRange))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function holidaysOnDate(holidays: DisplayHoliday[], date: Date): DisplayHoliday[] {
  const seen = new Set<string>();

  return holidays
    .filter((holiday) => {
      if (!holidayMatchesDate(holiday.month, holiday.day, date)) {
        return false;
      }
      if (seen.has(holiday.id)) {
        return false;
      }
      seen.add(holiday.id);
      return true;
    })
    .sort((a, b) => Number(b.isCustom) - Number(a.isCustom) || a.name.localeCompare(b.name, 'ru'));
}

export function formatHolidayName(holiday: DisplayHoliday): string {
  return `${holiday.name} ${holiday.date.getFullYear()}`;
}

export function formatHolidayDate(holiday: DisplayHoliday): string {
  return format(holiday.date, 'd MMMM yyyy', { locale: ru });
}

export function parseHolidaysStorage(raw: string | null): HolidaysStorage {
  if (!raw) {
    return { ...DEFAULT_HOLIDAYS_STORAGE };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HolidaysStorage>;
    return {
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
      overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
      customHolidays: Array.isArray(parsed.customHolidays) ? parsed.customHolidays : [],
    };
  } catch {
    return { ...DEFAULT_HOLIDAYS_STORAGE };
  }
}

export function holidayThemeId(holidayId: string, year: number): string {
  return `${HOLIDAY_THEME_ID_PREFIX}${holidayId}:${year}`;
}

export function isHolidayThemeId(themeId: string): boolean {
  return themeId.startsWith(HOLIDAY_THEME_ID_PREFIX);
}

export function buildHolidayLetterTheme(holiday: DisplayHoliday, date: Date): LetterTheme {
  const year = startOfDay(date).getFullYear();
  return {
    id: holidayThemeId(holiday.id, year),
    title: `Как я отмечала ${holiday.name} ${year}`,
    sortOrder: 0,
  };
}

export function buildHolidayLetterThemesForDate(
  holidays: DisplayHoliday[],
  date: Date,
): LetterTheme[] {
  return holidaysOnDate(holidays, date).map((holiday) => buildHolidayLetterTheme(holiday, date));
}

export function resolveHolidayThemeTitle(
  themeId: string,
  holidays: DisplayHoliday[],
): string | undefined {
  if (!isHolidayThemeId(themeId)) {
    return undefined;
  }

  const rest = themeId.slice(HOLIDAY_THEME_ID_PREFIX.length);
  const separator = rest.lastIndexOf(':');
  if (separator <= 0) {
    return undefined;
  }

  const holidayId = rest.slice(0, separator);
  const year = Number(rest.slice(separator + 1));
  const holiday = holidays.find((item) => item.id === holidayId);
  if (!holiday || !Number.isFinite(year)) {
    return Number.isFinite(year) ? `Как я отмечала этот день ${year}` : undefined;
  }

  return `Как я отмечала ${holiday.name} ${year}`;
}
