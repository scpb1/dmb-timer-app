import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';

import {
  type CustomEventRecord,
  type DisplayEvent,
  type EventDateFormat,
  type EventOverride,
  type EventsStorage,
  monthEventId,
  dddMilestoneEventId,
  dppMilestoneEventId,
  PREDEFINED_EVENT_IDS,
} from '@/types/events';
import { SPLIT_STAR_ICON_ID } from '@/utils/eventGlyphs';
import { formatCount } from '@/utils/inflection';

/** Ключ сортировки: призыв всегда первый, дембель — последний, остальное по календарю */
export function serviceChronologySortTime(date: Date, eventId?: string): number {
  if (eventId === PREDEFINED_EVENT_IDS.ENLISTMENT) {
    return Number.NEGATIVE_INFINITY;
  }
  if (eventId === PREDEFINED_EVENT_IDS.DEMOBILIZATION) {
    return Number.POSITIVE_INFINITY;
  }
  return startOfDay(date).getTime();
}

export function compareEventsChronologically(
  a: { date: Date; id?: string; name?: string },
  b: { date: Date; id?: string; name?: string },
): number {
  const byTime =
    serviceChronologySortTime(a.date, a.id) - serviceChronologySortTime(b.date, b.id);
  if (byTime !== 0) {
    return byTime;
  }
  const aName = a.name ?? '';
  const bName = b.name ?? '';
  return aName.localeCompare(bName, 'ru');
}

interface PredefinedTemplate {
  id: string;
  defaultName: string;
  date: Date;
  dateFormat: EventDateFormat;
  dddValue?: number;
  dppValue?: number;
}

function generatePredefinedTemplates(
  enlistment: Date,
  demobilization: Date,
): PredefinedTemplate[] {
  const enlist = startOfDay(enlistment);
  const demob = startOfDay(demobilization);
  const totalDays = differenceInCalendarDays(demob, enlist);
  const events: PredefinedTemplate[] = [];

  events.push({
    id: PREDEFINED_EVENT_IDS.ENLISTMENT,
    defaultName: 'Призыв',
    date: enlist,
    dateFormat: 'dpp',
    dppValue: 0,
  });

  let monthIndex = 1;
  let monthDate = addMonths(enlist, monthIndex);
  while (monthDate < demob) {
    events.push({
      id: monthEventId(monthIndex),
      defaultName: `${formatCount(monthIndex, 'month')} службы`,
      date: startOfDay(monthDate),
      dateFormat: 'date',
    });
    monthIndex += 1;
    monthDate = addMonths(enlist, monthIndex);
  }

  // Каждые 100 дней после призыва (дпп)
  for (let daysPassed = 100; daysPassed < totalDays; daysPassed += 100) {
    events.push({
      id: dppMilestoneEventId(daysPassed),
      defaultName: `${daysPassed} дпп`,
      date: addDays(enlist, daysPassed),
      dateFormat: 'dpp',
      dppValue: daysPassed,
    });
  }

  // Каждые 100 дней до дембеля (ддд)
  for (let daysLeft = 100; daysLeft < totalDays; daysLeft += 100) {
    events.push({
      id: dddMilestoneEventId(daysLeft),
      defaultName: `${daysLeft} ддд`,
      date: addDays(demob, -daysLeft),
      dateFormat: 'ddd',
      dddValue: daysLeft,
    });
  }

  const equatorDay = Math.floor(totalDays / 2);
  events.push({
    id: PREDEFINED_EVENT_IDS.EQUATOR,
    defaultName: 'Экватор',
    date: addDays(enlist, equatorDay),
    dateFormat: 'dpp',
    dppValue: equatorDay,
  });

  const quarterDays = Math.round(totalDays / 4);
  if (quarterDays > 0 && quarterDays < totalDays) {
    events.push({
      id: PREDEFINED_EVENT_IDS.QUARTER_PASSED,
      defaultName: 'Прошла 1/4 службы',
      date: addDays(enlist, quarterDays),
      dateFormat: 'dpp',
      dppValue: quarterDays,
    });
    events.push({
      id: PREDEFINED_EVENT_IDS.QUARTER_REMAINING,
      defaultName: 'Прошло 3/4 службы',
      date: addDays(demob, -quarterDays),
      dateFormat: 'ddd',
      dddValue: quarterDays,
    });
  }

  const thirdDays = Math.round(totalDays / 3);
  if (thirdDays > 0 && thirdDays < totalDays) {
    events.push({
      id: PREDEFINED_EVENT_IDS.THIRD_PASSED,
      defaultName: 'Прошла 1/3 службы',
      date: addDays(enlist, thirdDays),
      dateFormat: 'dpp',
      dppValue: thirdDays,
    });
    events.push({
      id: PREDEFINED_EVENT_IDS.THIRD_REMAINING,
      defaultName: 'Прошло 2/3 службы',
      date: addDays(demob, -thirdDays),
      dateFormat: 'ddd',
      dddValue: thirdDays,
    });
  }

  const trafficLight: Array<{ id: string; name: string; daysLeft: number }> = [
    { id: PREDEFINED_EVENT_IDS.TRAFFIC_RED, name: 'Светофор — красный', daysLeft: 3 },
    { id: PREDEFINED_EVENT_IDS.TRAFFIC_YELLOW, name: 'Светофор — жёлтый', daysLeft: 2 },
    { id: PREDEFINED_EVENT_IDS.TRAFFIC_GREEN, name: 'Светофор — зелёный', daysLeft: 1 },
  ];

  for (const item of trafficLight) {
    events.push({
      id: item.id,
      defaultName: item.name,
      date: addDays(demob, -item.daysLeft),
      dateFormat: 'ddd',
      dddValue: item.daysLeft,
    });
  }

  events.push({
    id: PREDEFINED_EVENT_IDS.DEMOBILIZATION,
    defaultName: 'Дембель',
    date: demob,
    dateFormat: 'ddd',
    dddValue: 0,
  });

  return events;
}

/** Id всех пресетов службы (как при первой установке) */
export function buildDefaultEventListIds(enlistment: Date, demobilization: Date): string[] {
  return generatePredefinedTemplates(enlistment, demobilization).map((template) => template.id);
}

export function getDefaultEventListIds(
  storage: EventsStorage,
  enlistment: Date,
  demobilization: Date,
): string[] {
  if (Array.isArray(storage.defaultListEventIds) && storage.defaultListEventIds.length > 0) {
    return storage.defaultListEventIds;
  }
  return buildDefaultEventListIds(enlistment, demobilization);
}

function migrateStoredStarIcon(icon: string | undefined): string | undefined {
  return icon === 'star' ? SPLIT_STAR_ICON_ID : icon;
}

/** Заменяет сохранённую material-звезду на «Звезда штамп» (3-я в каталоге). */
export function migrateEventsStorageStarIcons(
  storage: EventsStorage,
): { storage: EventsStorage; changed: boolean } {
  let changed = false;

  const customEvents = storage.customEvents.map((record) => {
    const icon = migrateStoredStarIcon(record.icon);
    if (icon === record.icon) {
      return record;
    }
    changed = true;
    return { ...record, icon };
  });

  const overrides: Record<string, EventOverride> = {};
  for (const [id, override] of Object.entries(storage.overrides)) {
    const icon = migrateStoredStarIcon(override.icon);
    if (icon === override.icon) {
      overrides[id] = override;
    } else {
      changed = true;
      overrides[id] = { ...override, icon };
    }
  }

  if (!changed) {
    return { storage, changed: false };
  }

  return {
    storage: {
      ...storage,
      customEvents,
      overrides,
    },
    changed: true,
  };
}

export function migrateEventsStorageDefaultList(
  storage: EventsStorage,
  enlistment: Date,
  demobilization: Date,
): { storage: EventsStorage; changed: boolean } {
  if (Array.isArray(storage.defaultListEventIds) && storage.defaultListEventIds.length > 0) {
    return { storage, changed: false };
  }
  return {
    storage: {
      ...storage,
      defaultListEventIds: buildDefaultEventListIds(enlistment, demobilization),
    },
    changed: true,
  };
}

export function migrateEventsStorage(
  storage: EventsStorage,
  enlistment: Date,
  demobilization: Date,
): { storage: EventsStorage; changed: boolean } {
  let current = storage;
  let changed = false;

  const starMigration = migrateEventsStorageStarIcons(current);
  current = starMigration.storage;
  changed = changed || starMigration.changed;

  const listMigration = migrateEventsStorageDefaultList(current, enlistment, demobilization);
  current = listMigration.storage;
  changed = changed || listMigration.changed;

  return { storage: current, changed };
}

export function filterEventsInDefaultList(
  events: DisplayEvent[],
  defaultListIds: string[],
): DisplayEvent[] {
  const allowed = new Set(defaultListIds);
  return events.filter((event) => allowed.has(event.id));
}

export function resolveEventDate(
  enlistment: Date,
  demobilization: Date,
  dateFormat: EventDateFormat,
  dddValue?: number,
  dppValue?: number,
  dateValue?: string,
): Date | null {
  const enlist = startOfDay(enlistment);
  const demob = startOfDay(demobilization);

  if (dateFormat === 'date' && dateValue) {
    return startOfDay(parseISO(dateValue));
  }

  if (dateFormat === 'ddd' && dddValue !== undefined && Number.isFinite(dddValue)) {
    return addDays(demob, -dddValue);
  }

  if (dateFormat === 'dpp' && dppValue !== undefined && Number.isFinite(dppValue)) {
    return addDays(enlist, dppValue);
  }

  return null;
}

function applyOverride(
  template: PredefinedTemplate,
  override: EventOverride | undefined,
  enlistment: Date,
  demobilization: Date,
): DisplayEvent {
  const dateFormat = override?.dateFormat ?? template.dateFormat;
  const dddValue = override?.dddValue ?? template.dddValue;
  const dppValue = override?.dppValue ?? template.dppValue;
  const dateValue = override?.dateValue;

  let date = template.date;
  if (
    override?.dateFormat !== undefined ||
    override?.dddValue !== undefined ||
    override?.dppValue !== undefined ||
    override?.dateValue
  ) {
    const resolved = resolveEventDate(
      enlistment,
      demobilization,
      dateFormat,
      dddValue,
      dppValue,
      dateValue,
    );
    if (resolved) {
      date = resolved;
    }
  }

  return {
    id: template.id,
    name: override?.name ?? template.defaultName,
    date,
    dateFormat,
    dddValue,
    dppValue,
    dateValue,
    icon: override?.icon,
    iconColor: override?.iconColor,
    boundaryDisplay: override?.boundaryDisplay,
    boundaryIconThemeDefault: override?.boundaryIconThemeDefault,
    isCustom: false,
    isPast: false,
  };
}

function customRecordToDisplay(
  record: CustomEventRecord,
  enlistment: Date,
  demobilization: Date,
): DisplayEvent | null {
  const date = resolveEventDate(
    enlistment,
    demobilization,
    record.dateFormat,
    record.dddValue,
    record.dppValue,
    record.dateValue,
  );

  if (!date) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    date,
    dateFormat: record.dateFormat,
    dddValue: record.dddValue,
    dppValue: record.dppValue,
    dateValue: record.dateValue,
    icon: record.icon,
    iconColor: record.iconColor,
    isCustom: true,
    isPast: false,
  };
}

/** Собирает полный список событий из шаблонов, переопределений и пользовательских записей */
export function buildDisplayEvents(
  enlistment: Date,
  demobilization: Date,
  storage: EventsStorage,
  now: Date = new Date(),
): DisplayEvent[] {
  const today = startOfDay(now);
  const deletedSet = new Set(storage.deletedIds);
  const templates = generatePredefinedTemplates(enlistment, demobilization);

  const predefined = templates
    .filter((template) => !deletedSet.has(template.id))
    .map((template) =>
      applyOverride(template, storage.overrides[template.id], enlistment, demobilization),
    );

  const custom = storage.customEvents
    .filter((record) => !deletedSet.has(record.id))
    .map((record) => customRecordToDisplay(record, enlistment, demobilization))
    .filter((event): event is DisplayEvent => event !== null);

  return [...predefined, ...custom]
    .map((event) => ({
      ...event,
      isPast: startOfDay(event.date) < today,
    }))
    .sort((a, b) => compareEventsChronologically(a, b));
}

export function formatEventDate(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: ru });
}

export function formatDaysUntilDate(date: Date, now: Date = new Date()): string | null {
  const days = differenceInCalendarDays(startOfDay(date), startOfDay(now));
  if (days < 0) {
    return `Прошло ${formatCount(Math.abs(days), 'day')}`;
  }
  if (days === 0) {
    return 'Сегодня';
  }

  return `До даты ${formatCount(days, 'day')}`;
}

/** Подпись «до даты» / «прошло» в списке событий (в том числе у дембеля) */
export function formatEventDaysUntilCaption(event: DisplayEvent, now: Date = new Date()): string | null {
  return formatDaysUntilDate(event.date, now);
}

export function isCalendarToday(date: Date, now: Date = new Date()): boolean {
  return differenceInCalendarDays(startOfDay(date), startOfDay(now)) === 0;
}

export function parseEventsStorage(raw: string | null): EventsStorage {
  if (!raw) {
    return { deletedIds: [], overrides: {}, customEvents: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EventsStorage>;
    return {
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
      overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
      customEvents: Array.isArray(parsed.customEvents) ? parsed.customEvents : [],
      defaultListEventIds: Array.isArray(parsed.defaultListEventIds)
        ? parsed.defaultListEventIds
        : undefined,
    };
  } catch {
    return { deletedIds: [], overrides: {}, customEvents: [] };
  }
}
