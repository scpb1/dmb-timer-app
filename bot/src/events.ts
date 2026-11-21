import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { ru } from 'date-fns/locale';

import { escapeHtml } from './mention';
import { formatDays, fromIsoDay, parseFullDate, toIsoDay } from './progress';

export const EVENT_NAME_MAX_LENGTH = 80;
export const TELEGRAM_MESSAGE_LIMIT = 4096;

export type CatalogKind = 'dpp' | 'ddd' | 'month' | 'demobMonth' | 'equator' | 'ask';

export interface CatalogEvent {
  id: string;
  name: string;
  kind: CatalogKind;
  days?: number;
  months?: number;
}

export interface SavedEvent {
  id: string;
  name: string;
  kind: 'dpp' | 'ddd' | 'date';
  days?: number;
  date?: string;
}

export interface EventsStorage {
  addedCatalogIds: string[];
  customEvents: SavedEvent[];
}

export interface DisplayEvent {
  id: string;
  name: string;
  date: Date;
  isPast: boolean;
  removable: boolean;
  keep: boolean;
}

export const KNOWN_EVENTS: CatalogEvent[] = [
  { id: 'k01', name: 'Призыв', kind: 'dpp', days: 0 },
  { id: 'k02', name: 'Малая кочерга', kind: 'dpp', days: 7 },
  { id: 'k03', name: 'Малые барабанные палочки / Первые зеркала', kind: 'dpp', days: 11 },
  { id: 'k04', name: '350 дней до дембеля', kind: 'ddd', days: 350 },
  { id: 'k77', name: '5%', kind: 'dpp', days: 18 },
  { id: 'k05', name: 'Вторые зеркала', kind: 'dpp', days: 22 },
  { id: 'k06', name: '1 месяц службы', kind: 'month', months: 1 },
  { id: 'k07', name: 'Присяга', kind: 'ask' },
  { id: 'k08', name: 'Малые кудряшки / Третьи зеркала', kind: 'dpp', days: 33 },
  { id: 'k09', name: '10%', kind: 'dpp', days: 36 },
  { id: 'k10', name: 'Малые попугайчики', kind: 'dpp', days: 38 },
  { id: 'k11', name: 'Маленькие стульчики / Четвертые зеркала', kind: 'dpp', days: 44 },
  { id: 'k12', name: '50 дней службы', kind: 'dpp', days: 50 },
  { id: 'k78', name: '15%', kind: 'dpp', days: 54 },
  { id: 'k13', name: 'Пятые зеркала', kind: 'dpp', days: 55 },
  { id: 'k14', name: '2 месяца службы', kind: 'month', months: 2 },
  { id: 'k15', name: '300 дней до дембеля', kind: 'ddd', days: 300 },
  { id: 'k16', name: 'Шестые зеркала', kind: 'dpp', days: 66 },
  { id: 'k17', name: '20%', kind: 'dpp', days: 73 },
  { id: 'k18', name: 'Малые топорики / Седьмые зеркала', kind: 'dpp', days: 77 },
  { id: 'k19', name: 'Малые матрешки / Восьмые зеркала', kind: 'dpp', days: 88 },
  { id: 'k20', name: '3 месяца службы', kind: 'month', months: 3 },
  { id: 'k21', name: 'Прошла 1/4 службы', kind: 'dpp', days: 91 },
  { id: 'k79', name: '25%', kind: 'dpp', days: 91 },
  { id: 'k22', name: 'Девятые зеркала', kind: 'dpp', days: 99 },
  { id: 'k23', name: '100 дней после призыва', kind: 'dpp', days: 100 },
  { id: 'k24', name: '30%', kind: 'dpp', days: 109 },
  { id: 'k25', name: 'Малый заборчик', kind: 'dpp', days: 111 },
  { id: 'k26', name: '250 дней до дембеля', kind: 'ddd', days: 250 },
  { id: 'k27', name: '4 месяца службы', kind: 'month', months: 4 },
  { id: 'k28', name: 'Прошла 1/3 службы', kind: 'dpp', days: 122 },
  { id: 'k80', name: '35%', kind: 'dpp', days: 127 },
  { id: 'k29', name: 'Малые гуси-лебеди', kind: 'ddd', days: 222 },
  { id: 'k30', name: 'Маленькая розетка', kind: 'ddd', days: 220 },
  { id: 'k31', name: '40%', kind: 'dpp', days: 146 },
  { id: 'k81', name: '45%', kind: 'dpp', days: 164 },
  { id: 'k32', name: '200 дней до дембеля', kind: 'ddd', days: 200 },
  { id: 'k82', name: '50%', kind: 'dpp', days: 182 },
  { id: 'k33', name: 'Экватор', kind: 'equator' },
  { id: 'k34', name: '5 месяцев службы', kind: 'month', months: 5 },
  { id: 'k35', name: 'Экватор службы', kind: 'equator' },
  { id: 'k36', name: '6 месяцев службы', kind: 'month', months: 6 },
  { id: 'k37', name: '200 дней после призыва', kind: 'dpp', days: 200 },
  { id: 'k83', name: '55%', kind: 'dpp', days: 200 },
  { id: 'k38', name: '7 месяцев службы', kind: 'month', months: 7 },
  { id: 'k39', name: '150 дней до дембеля', kind: 'ddd', days: 150 },
  { id: 'k40', name: '60%', kind: 'dpp', days: 219 },
  { id: 'k41', name: 'Большая розетка', kind: 'dpp', days: 220 },
  { id: 'k42', name: 'Большие гуси-лебеди', kind: 'dpp', days: 222 },
  { id: 'k84', name: '65%', kind: 'ddd', days: 127 },
  { id: 'k43', name: '8 месяцев службы', kind: 'month', months: 8 },
  { id: 'k44', name: 'Осталась 1/3 службы', kind: 'ddd', days: 121 },
  { id: 'k45', name: '250 дней после призыва', kind: 'dpp', days: 250 },
  { id: 'k46', name: 'Большой заборчик', kind: 'ddd', days: 111 },
  { id: 'k47', name: '70%', kind: 'ddd', days: 110 },
  { id: 'k48', name: '100 дней до дембеля', kind: 'ddd', days: 100 },
  { id: 'k49', name: 'Десятые зеркала', kind: 'ddd', days: 99 },
  { id: 'k50', name: 'Осталась 1/4 службы', kind: 'ddd', days: 91 },
  { id: 'k85', name: '75%', kind: 'ddd', days: 91 },
  { id: 'k51', name: '9 месяцев службы', kind: 'month', months: 9 },
  { id: 'k52', name: 'Большие матрешки / Одиннадцатые зеркала', kind: 'ddd', days: 88 },
  { id: 'k53', name: 'Большие топорики / Двенадцатые зеркала', kind: 'ddd', days: 77 },
  { id: 'k54', name: '80%', kind: 'ddd', days: 73 },
  { id: 'k55', name: 'Тринадцатые зеркала', kind: 'ddd', days: 66 },
  { id: 'k56', name: '300 дней после призыва', kind: 'dpp', days: 300 },
  { id: 'k57', name: '10 месяцев службы', kind: 'month', months: 10 },
  { id: 'k86', name: '85%', kind: 'ddd', days: 54 },
  { id: 'k58', name: 'Ставьте водку в холодильник, вам до дембеля полтинник', kind: 'ddd', days: 50 },
  { id: 'k59', name: 'Большие стульчики / Четырнадцатые зеркала', kind: 'ddd', days: 44 },
  { id: 'k60', name: 'Ставим водку на паркет, нам до дома сорокет', kind: 'ddd', days: 40 },
  { id: 'k61', name: 'Большие попугайчики', kind: 'ddd', days: 38 },
  { id: 'k62', name: '90%', kind: 'ddd', days: 36 },
  { id: 'k63', name: 'Большие кудряшки / Пятнадцатые зеркала', kind: 'ddd', days: 33 },
  { id: 'k64', name: '11 месяцев службы', kind: 'month', months: 11 },
  { id: 'k65', name: 'Дембельский месяц', kind: 'demobMonth' },
  { id: 'k66', name: 'Ставим водку у дверей, нам до дома тридцать дней', kind: 'ddd', days: 30 },
  { id: 'k67', name: 'Начинаем наливать, нам до дома двадцать пять', kind: 'ddd', days: 25 },
  { id: 'k68', name: 'Шестнадцатые зеркала', kind: 'ddd', days: 22 },
  { id: 'k69', name: 'Армейская пачка', kind: 'ddd', days: 20 },
  { id: 'k87', name: '95%', kind: 'ddd', days: 18 },
  { id: 'k70', name: '350 дней службы', kind: 'dpp', days: 350 },
  { id: 'k71', name: 'Большие барабанные палочки / Семнадцатые зеркала', kind: 'ddd', days: 11 },
  { id: 'k72', name: 'Космос', kind: 'ddd', days: 10 },
  { id: 'k73', name: 'Светофор красный', kind: 'ddd', days: 3 },
  { id: 'k74', name: 'Светофор желтый', kind: 'ddd', days: 2 },
  { id: 'k75', name: 'Светофор зелёный', kind: 'ddd', days: 1 },
  { id: 'k76', name: 'ДЕМБЕЛЬ', kind: 'ddd', days: 0 },
];

const catalogByKey = new Map<string, CatalogEvent>();

for (const item of KNOWN_EVENTS) {
  for (const key of nameKeys(item.name)) {
    if (!catalogByKey.has(key)) {
      catalogByKey.set(key, item);
    }
  }
}

export function emptyEvents(): EventsStorage {
  return { addedCatalogIds: [], customEvents: [] };
}

export function normalizeEvents(value: unknown): EventsStorage {
  if (!value || typeof value !== 'object') {
    return emptyEvents();
  }
  const record = value as Partial<EventsStorage>;
  if (!Array.isArray(record.addedCatalogIds) || !Array.isArray(record.customEvents)) {
    return emptyEvents();
  }
  return {
    addedCatalogIds: record.addedCatalogIds.filter((id): id is string => typeof id === 'string'),
    customEvents: record.customEvents.filter(isSavedEvent),
  };
}

export function normalizeEventName(value: string): string {
  return value.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[–—]/g, '-').replace(/\s+/g, ' ');
}

export function findKnownEvent(input: string): CatalogEvent | undefined {
  const key = normalizeEventName(input);
  return key ? catalogByKey.get(key) : undefined;
}

const BUILTIN_EVENT_NAMES = new Set([
  'призыв',
  'дембель',
  'экватор',
  'прошла 1/4 службы',
  'прошло 3/4 службы',
  'прошла 1/3 службы',
  'прошло 2/3 службы',
  'светофор красный',
  'светофор желтый',
  'светофор зеленый',
]);

export function isBuiltinEventName(name: string): boolean {
  const key = normalizeEventName(name);
  return BUILTIN_EVENT_NAMES.has(key) || /^\d+ месяц(?:а|ев)? службы$/.test(key);
}

export function listableKnownEvents(): CatalogEvent[] {
  return KNOWN_EVENTS.filter((item) => !isBuiltinEventName(item.name));
}

export function isBetweenService(date: Date, enlistment: Date, demobilization: Date): boolean {
  const day = startOfDay(date);
  const enlist = startOfDay(enlistment);
  const demob = startOfDay(demobilization);
  return day > enlist && day < demob;
}

export function formatCatalogLine(item: CatalogEvent): string {
  const name = `<b>${escapeHtml(item.name)}</b>`;
  if (item.kind === 'dpp' && item.days !== undefined) {
    return `${name} (${escapeHtml(formatDays(item.days))} после призыва)`;
  }
  if (item.kind === 'ddd' && item.days !== undefined) {
    return `${name} (${escapeHtml(formatDays(item.days))} до дембеля)`;
  }
  if (item.kind === 'equator') {
    return `${name} (половина службы)`;
  }
  return name;
}

export function catalogMessages(): { parts: string[]; fitsOne: boolean; length: number } {
  const lines = listableKnownEvents().map(formatCatalogLine);
  const header = '<b>Я знаю эти события:</b>\n\n';
  const footer = '\n\nНапиши его название и я сама добавлю его.';
  const single = `${header}${lines.join('\n')}${footer}`;
  if (single.length <= TELEGRAM_MESSAGE_LIMIT) {
    return { parts: [single], fitsOne: true, length: single.length };
  }

  const parts: string[] = [];
  let chunk: string[] = [];
  let size = header.length;
  const pushChunk = (withFooter: boolean): void => {
    const body = chunk.join('\n');
    const tail = withFooter ? footer : '';
    const prefix = parts.length === 0 ? header : '';
    parts.push(`${prefix}${body}${tail}`);
    chunk = [];
    size = 0;
  };

  for (const line of lines) {
    const next = size + (chunk.length > 0 ? 1 : 0) + line.length;
    const reserve = TELEGRAM_MESSAGE_LIMIT - footer.length;
    if (chunk.length > 0 && next > reserve) {
      pushChunk(false);
    }
    chunk.push(line);
    size = (parts.length === 0 && chunk.length === 1 ? header.length : 0) + chunk.join('\n').length;
  }
  if (chunk.length > 0) {
    pushChunk(true);
  }
  return { parts, fitsOne: false, length: single.length };
}

export function parseEventWhen(
  input: string,
): { kind: 'date'; date: string } | { kind: 'dpp' | 'ddd'; days: number } | null {
  const trimmed = input.trim();
  const relative = /^(\d+)\s*(ддд|дпп)$/i.exec(normalizeEventName(trimmed));
  if (relative) {
    const days = Number(relative[1]);
    if (!Number.isInteger(days) || days < 0 || days > 2000) {
      return null;
    }
    return { kind: relative[2] as 'dpp' | 'ddd', days };
  }
  const date = parseFullDate(trimmed);
  if (!date) {
    return null;
  }
  return { kind: 'date', date: toIsoDay(date) };
}

export function buildDisplayEvents(
  storage: EventsStorage,
  enlistment: Date | null,
  demobilization: Date | null,
  now: Date = new Date(),
): DisplayEvent[] {
  const today = startOfDay(now);
  const events: DisplayEvent[] = [];

  if (enlistment && demobilization) {
    for (const item of defaultEvents(enlistment, demobilization)) {
      events.push({
        ...item,
        isPast: startOfDay(item.date) < today,
        removable: false,
        keep: item.id === 'def-enlistment' || item.id === 'def-demobilization',
      });
    }
    for (const id of storage.addedCatalogIds) {
      const known = KNOWN_EVENTS.find((item) => item.id === id);
      if (!known || known.kind === 'ask') {
        continue;
      }
      const date = catalogDate(known, enlistment, demobilization);
      if (!date) {
        continue;
      }
      events.push({
        id: known.id,
        name: known.name,
        date,
        isPast: startOfDay(date) < today,
        removable: true,
        keep: false,
      });
    }
  }

  for (const custom of storage.customEvents) {
    const date = savedEventDate(custom, enlistment, demobilization);
    if (!date) {
      continue;
    }
    events.push({
      id: custom.id,
      name: custom.name,
      date,
      isPast: startOfDay(date) < today,
      removable: true,
      keep: false,
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime() || a.name.localeCompare(b.name, 'ru'));
}

export function visibleEvents(events: DisplayEvent[]): DisplayEvent[] {
  return events.filter((event) => event.keep || !event.isPast);
}

export function findNextUpcomingEvent(
  storage: EventsStorage,
  enlistment: Date | null,
  demobilization: Date | null,
  today: Date,
): DisplayEvent | null {
  if (!enlistment || !demobilization) {
    return null;
  }
  const todayStart = startOfDay(today).getTime();
  for (const event of buildDisplayEvents(storage, enlistment, demobilization, today)) {
    if (startOfDay(event.date).getTime() >= todayStart) {
      return event;
    }
  }
  return null;
}

export function eventsInCalendarMonth(
  storage: EventsStorage,
  enlistment: Date | null,
  demobilization: Date | null,
  monthAnchor: Date,
  today: Date,
): DisplayEvent[] {
  if (!enlistment || !demobilization) {
    return [];
  }
  const monthStart = startOfMonth(monthAnchor).getTime();
  const monthEnd = endOfMonth(monthAnchor).getTime();
  return buildDisplayEvents(storage, enlistment, demobilization, today).filter((event) => {
    const day = startOfDay(event.date).getTime();
    return day >= monthStart && day <= monthEnd;
  });
}

export function eventsOnDate(
  storage: EventsStorage,
  enlistment: Date | null,
  demobilization: Date | null,
  day: Date,
): string[] {
  const today = startOfDay(day);
  const names: string[] = [];
  const seen = new Set<string>();
  for (const event of buildDisplayEvents(storage, enlistment, demobilization, today)) {
    if (startOfDay(event.date).getTime() !== today.getTime()) {
      continue;
    }
    const key = normalizeEventName(event.name);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    names.push(event.name);
  }
  return names;
}

export function formatEventLine(event: DisplayEvent, today: Date): string {
  const day = startOfDay(event.date).getTime();
  const now = startOfDay(today).getTime();
  let emoji = '⏳';
  if (day < now) {
    emoji = '✅';
  } else if (day === now) {
    emoji = '🏅';
  }
  const title = escapeHtml(event.name.trim() || event.name);
  const date = escapeHtml(format(event.date, 'd MMMM yyyy', { locale: ru }));
  return `${emoji} <b>${title}</b>\n${date}`;
}

export function catalogDate(
  item: CatalogEvent,
  enlistment: Date,
  demobilization: Date,
): Date | null {
  const enlist = startOfDay(enlistment);
  const demob = startOfDay(demobilization);
  if (demob < enlist) {
    return null;
  }

  let date: Date | null = null;
  if (item.kind === 'dpp' && item.days !== undefined) {
    date = addDays(enlist, item.days);
  } else if (item.kind === 'ddd' && item.days !== undefined) {
    date = addDays(demob, -item.days);
  } else if (item.kind === 'month' && item.months) {
    const monthDate = startOfDay(addMonths(enlist, item.months));
    date = monthDate < demob ? monthDate : null;
  } else if (item.kind === 'demobMonth') {
    date = startOfDay(addMonths(demob, -1));
  } else if (item.kind === 'equator') {
    date = addDays(enlist, Math.floor(differenceInCalendarDays(demob, enlist) / 2));
  }

  if (!date || date < enlist || date > demob) {
    return null;
  }
  return startOfDay(date);
}

export function savedEventDate(
  event: SavedEvent,
  enlistment: Date | null,
  demobilization: Date | null,
): Date | null {
  if (event.kind === 'date') {
    return event.date ? startOfDay(fromIsoDay(event.date)) : null;
  }
  if (!enlistment || !demobilization || event.days === undefined) {
    return null;
  }
  return catalogDate(
    {
      id: event.id,
      name: event.name,
      kind: event.kind,
      days: event.days,
    },
    enlistment,
    demobilization,
  );
}

export function defaultEventNames(enlistment: Date, demobilization: Date): string[] {
  return defaultEvents(enlistment, demobilization).map((event) => event.name);
}

function defaultEvents(enlistment: Date, demobilization: Date): Array<{ id: string; name: string; date: Date }> {
  const enlist = startOfDay(enlistment);
  const demob = startOfDay(demobilization);
  const totalDays = differenceInCalendarDays(demob, enlist);
  const events: Array<{ id: string; name: string; date: Date }> = [
    { id: 'def-enlistment', name: 'Призыв', date: enlist },
  ];

  let monthIndex = 1;
  let monthDate = startOfDay(addMonths(enlist, monthIndex));
  while (monthDate < demob) {
    events.push({ id: `def-month-${monthIndex}`, name: monthServiceName(monthIndex), date: monthDate });
    monthIndex += 1;
    monthDate = startOfDay(addMonths(enlist, monthIndex));
  }

  for (let daysPassed = 100; daysPassed < totalDays; daysPassed += 100) {
    events.push({ id: `def-dpp-${daysPassed}`, name: `${daysPassed} дпп`, date: addDays(enlist, daysPassed) });
  }
  for (let daysLeft = 100; daysLeft < totalDays; daysLeft += 100) {
    events.push({ id: `def-ddd-${daysLeft}`, name: `${daysLeft} ддд`, date: addDays(demob, -daysLeft) });
  }

  const equatorDay = Math.floor(totalDays / 2);
  events.push({ id: 'def-equator', name: 'Экватор', date: addDays(enlist, equatorDay) });

  const quarterDays = Math.round(totalDays / 4);
  if (quarterDays > 0 && quarterDays < totalDays) {
    events.push({
      id: 'def-quarter-passed',
      name: 'Прошла 1/4 службы',
      date: addDays(enlist, quarterDays),
    });
    events.push({
      id: 'def-quarter-left',
      name: 'Прошло 3/4 службы',
      date: addDays(demob, -quarterDays),
    });
  }

  const thirdDays = Math.round(totalDays / 3);
  if (thirdDays > 0 && thirdDays < totalDays) {
    events.push({
      id: 'def-third-passed',
      name: 'Прошла 1/3 службы',
      date: addDays(enlist, thirdDays),
    });
    events.push({
      id: 'def-third-left',
      name: 'Прошло 2/3 службы',
      date: addDays(demob, -thirdDays),
    });
  }

  events.push(
    { id: 'def-traffic-3', name: 'Светофор красный', date: addDays(demob, -3) },
    { id: 'def-traffic-2', name: 'Светофор жёлтый', date: addDays(demob, -2) },
    { id: 'def-traffic-1', name: 'Светофор зелёный', date: addDays(demob, -1) },
    { id: 'def-demobilization', name: 'Дембель', date: demob },
  );

  return events.filter((event) => event.date >= enlist && event.date <= demob);
}

function monthServiceName(count: number): string {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  let word = 'месяцев';
  if (!(mod100 >= 11 && mod100 <= 14)) {
    if (mod10 === 1) {
      word = 'месяц';
    } else if (mod10 >= 2 && mod10 <= 4) {
      word = 'месяца';
    }
  }
  return `${count} ${word} службы`;
}

function nameKeys(name: string): string[] {
  const keys = [normalizeEventName(name)];
  for (const part of name.split(' / ')) {
    const key = normalizeEventName(part);
    if (key) {
      keys.push(key);
    }
  }
  return keys;
}

function isSavedEvent(value: unknown): value is SavedEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const event = value as Partial<SavedEvent>;
  return (
    typeof event.id === 'string' &&
    typeof event.name === 'string' &&
    (event.kind === 'dpp' || event.kind === 'ddd' || event.kind === 'date')
  );
}
