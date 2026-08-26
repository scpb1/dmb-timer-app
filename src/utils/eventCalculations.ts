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
import { pluralize } from '@/utils/pluralize';

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
    defaultName: 'День призыва',
    date: enlist,
    dateFormat: 'dpp',
    dppValue: 0,
  });

  let monthIndex = 1;
  let monthDate = addMonths(enlist, monthIndex);
  while (monthDate < demob) {
    const monthWord = pluralize(monthIndex, 'месяц', 'месяца', 'месяцев');
    events.push({
      id: monthEventId(monthIndex),
      defaultName: `${monthIndex} ${monthWord} службы`,
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
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function formatEventDate(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: ru });
}

export function formatEventSubtitle(event: DisplayEvent): string | null {
  if (event.dateFormat === 'ddd' && event.dddValue !== undefined) {
    return `${event.dddValue} ддд`;
  }
  if (event.dateFormat === 'dpp' && event.dppValue !== undefined) {
    return `${event.dppValue} дпп`;
  }
  return null;
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
    };
  } catch {
    return { deletedIds: [], overrides: {}, customEvents: [] };
  }
}
