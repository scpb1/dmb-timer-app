import { startOfDay } from 'date-fns';

const DEFAULT_TIME_ZONE = 'Europe/Moscow';

export const DIGEST_HOUR = 13;

/** Вечерняя сводка «завтра» по Москве */
export const TOMORROW_EVENING_HOUR = 20;

interface MoscowParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = Number(parts.find((part) => part.type === type)?.value);
  return Number.isFinite(value) ? value : 0;
}

export function moscowParts(now: Date = new Date(), timeZone = DEFAULT_TIME_ZONE): MoscowParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  let hour = readPart(parts, 'hour');
  if (hour === 24) {
    hour = 0;
  }

  return {
    year: readPart(parts, 'year'),
    month: readPart(parts, 'month'),
    day: readPart(parts, 'day'),
    hour,
    minute: readPart(parts, 'minute'),
    second: readPart(parts, 'second'),
  };
}

export function moscowDayKey(now: Date = new Date(), timeZone = DEFAULT_TIME_ZONE): string {
  const parts = moscowParts(now, timeZone);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

/** Календарный «сегодня» по Москве, в той же шкале, что и даты призыва. */
export function moscowCalendarToday(now: Date = new Date(), timeZone = DEFAULT_TIME_ZONE): Date {
  const parts = moscowParts(now, timeZone);
  return startOfDay(new Date(parts.year, parts.month - 1, parts.day));
}

/** Московские дата и время как локальный Date, чтобы дни и часы совпадали с датами призыва. */
export function moscowNow(now: Date = new Date(), timeZone = DEFAULT_TIME_ZONE): Date {
  const parts = moscowParts(now, timeZone);
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}
