import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';

import { formatCount } from '@/utils/inflection';
import {
  DEFAULT_PARCEL_SETTINGS,
  PARCEL_CONTENTS_MAX_LENGTH,
  PARCEL_NOTE_MAX_LENGTH,
  PARCEL_REMINDER_HOUR,
  PARCEL_TITLE_MAX_LENGTH,
  isParcelKind,
  isParcelReminderInterval,
  isParcelStatus,
  type ParcelEntry,
  type ParcelFormData,
  type ParcelKind,
  type ParcelKindFilter,
  type ParcelReminderInterval,
  type ParcelSettings,
  type ParcelStatus,
  type ParcelStatusFilter,
  type ParcelsStorage,
} from '@/types/parcels';

export interface ParcelStatItem {
  label: string;
  value: string;
  subValue?: string;
}

export interface ParcelTimelineItem {
  key: 'packing' | 'sent' | 'received';
  label: string;
  dateKey: string | undefined;
}

export interface ParcelReminderPlan {
  lastDispatchedDate: string | null;
  daysSinceDispatch: number | null;
  overdue: boolean;
  /** Одно утро на текущее молчание. Повторно не ставится, пока не сменятся отправка или срок. */
  fireAt: Date | null;
  /** `yyyy-MM-dd:interval` — от чего считается это молчание. */
  anchorId: string | null;
  /** Утро, когда как раз выходит выбранный срок. */
  dueAt: Date | null;
}

export interface ParcelServiceRange {
  start: Date | null;
  end: Date | null;
}

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toParcelDateKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

export function fromParcelDateKey(dateKey: string): Date {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) {
    return startOfDay(new Date(NaN));
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function isValidParcelDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) {
    return false;
  }
  const parsed = fromParcelDateKey(value);
  return !Number.isNaN(parsed.getTime()) && toParcelDateKey(parsed) === value;
}

export function formatParcelDate(dateKey: string): string {
  if (!isValidParcelDateKey(dateKey)) {
    return dateKey;
  }
  return format(fromParcelDateKey(dateKey), 'd MMMM yyyy', { locale: ru });
}

export function formatParcelDateShort(dateKey: string): string {
  if (!isValidParcelDateKey(dateKey)) {
    return dateKey;
  }
  return format(fromParcelDateKey(dateKey), 'd MMM yyyy', { locale: ru });
}

export function parcelKindLabel(kind: ParcelKind): string {
  return kind === 'handover' ? 'Передачка' : 'Посылка';
}

export function parcelKindHint(kind: ParcelKind): string {
  return kind === 'handover' ? 'Отнести в часть' : 'Отправить почтой';
}

export function parcelStatusLabel(kind: ParcelKind, status: ParcelStatus): string {
  if (status === 'packing') {
    return 'Собираю';
  }
  if (status === 'sent') {
    return kind === 'handover' ? 'Отнесла' : 'Отправила';
  }
  return kind === 'handover' ? 'Принял' : 'Дошла';
}

export function parcelStatusFilterLabel(status: ParcelStatus): string {
  if (status === 'packing') {
    return 'Собираю';
  }
  if (status === 'sent') {
    return 'В пути';
  }
  return 'Дошли';
}

export function parcelAdvanceActionLabel(kind: ParcelKind, status: ParcelStatus): string | null {
  if (status === 'packing') {
    return kind === 'handover' ? 'Отметить, что отнесла' : 'Отметить отправленной';
  }
  if (status === 'sent') {
    return kind === 'handover' ? 'Отметить, что принял' : 'Отметить, что дошла';
  }
  return null;
}

export function nextParcelStatus(status: ParcelStatus): ParcelStatus | null {
  if (status === 'packing') {
    return 'sent';
  }
  if (status === 'sent') {
    return 'received';
  }
  return null;
}

export function parcelCardTitle(entry: ParcelEntry): string {
  const title = entry.title?.trim();
  if (title) {
    return title;
  }
  return entry.contents.trim() || parcelKindLabel(entry.kind);
}

export function parcelCardSubtitle(entry: ParcelEntry): string | null {
  const title = entry.title?.trim();
  const contents = entry.contents.trim();
  if (title && contents && contents !== title) {
    return contents;
  }
  return null;
}

export function parcelCardDateLine(entry: ParcelEntry): string {
  if (entry.status === 'received' && entry.receivedDate) {
    const verb = entry.kind === 'handover' ? 'Принял' : 'Дошла';
    return `${verb} ${formatParcelDate(entry.receivedDate)}`;
  }
  if (entry.status === 'sent' && entry.sentDate) {
    const verb = entry.kind === 'handover' ? 'Отнесла' : 'Отправила';
    return `${verb} ${formatParcelDate(entry.sentDate)}`;
  }
  return `Собираю с ${formatParcelDate(entry.packingDate)}`;
}

export function parcelTimeline(entry: ParcelEntry): ParcelTimelineItem[] {
  return [
    { key: 'packing', label: 'Начала собирать', dateKey: entry.packingDate },
    {
      key: 'sent',
      label: entry.kind === 'handover' ? 'Отнесла' : 'Отправила',
      dateKey: entry.sentDate,
    },
    {
      key: 'received',
      label: entry.kind === 'handover' ? 'Принял' : 'Дошла',
      dateKey: entry.receivedDate,
    },
  ];
}

export function parcelEmptyMessage(
  kindFilter: ParcelKindFilter,
  statusFilter: ParcelStatusFilter,
): string {
  if (kindFilter === 'parcel' && statusFilter === 'packing') {
    return 'Нет посылок, которые сейчас собираете. Нажмите «+», чтобы начать.';
  }
  if (kindFilter === 'handover' && statusFilter === 'packing') {
    return 'Нет передачек в сборе. Нажмите «+», чтобы начать.';
  }
  if (kindFilter === 'parcel' && statusFilter === 'sent') {
    return 'Нет посылок в пути.';
  }
  if (kindFilter === 'handover' && statusFilter === 'sent') {
    return 'Нет передачек, которые уже отнесли, но ещё не приняли.';
  }
  if (kindFilter === 'parcel' && statusFilter === 'received') {
    return 'Пока ни одна посылка не отмечена как дошедшая.';
  }
  if (kindFilter === 'handover' && statusFilter === 'received') {
    return 'Пока ни одна передачка не отмечена как принятая.';
  }
  if (kindFilter === 'parcel') {
    return 'Нет посылок. Нажмите «+», чтобы записать первую.';
  }
  if (kindFilter === 'handover') {
    return 'Нет передачек. Нажмите «+», чтобы записать первую.';
  }
  if (statusFilter === 'packing') {
    return 'Сейчас ничего не собираете. Нажмите «+», чтобы начать.';
  }
  if (statusFilter === 'sent') {
    return 'Ничего не в пути.';
  }
  if (statusFilter === 'received') {
    return 'Пока ничего не отмечено как дошедшее.';
  }
  return 'Пока ничего не ушло. Нажмите «+», чтобы записать первую посылку или передачку.';
}

function optionalTrimmed(value: string | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, maxLength);
}

export function parseParcelsStorage(raw: string | null): ParcelsStorage {
  if (!raw) {
    return {
      entries: [],
      settings: { ...DEFAULT_PARCEL_SETTINGS },
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ParcelsStorage>;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries
          .map((entry) => migrateParcelEntry(entry))
          .filter((entry): entry is ParcelEntry => entry !== null)
      : [];
    return {
      entries,
      settings: migrateParcelSettings(parsed.settings),
    };
  } catch {
    return {
      entries: [],
      settings: { ...DEFAULT_PARCEL_SETTINGS },
    };
  }
}

function migrateParcelSettings(raw: ParcelSettings | undefined): ParcelSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PARCEL_SETTINGS };
  }
  return {
    reminderEnabled: raw.reminderEnabled !== false,
    reminderIntervalDays: isParcelReminderInterval(raw.reminderIntervalDays)
      ? raw.reminderIntervalDays
      : DEFAULT_PARCEL_SETTINGS.reminderIntervalDays,
  };
}

function migrateParcelEntry(raw: unknown): ParcelEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const entry = raw as Partial<ParcelEntry> & { date?: string };
  if (typeof entry.id !== 'string' || entry.id.length === 0) {
    return null;
  }
  if (!isParcelKind(entry.kind) || !isParcelStatus(entry.status)) {
    return null;
  }
  const contents = optionalTrimmed(entry.contents, PARCEL_CONTENTS_MAX_LENGTH);
  if (!contents) {
    return null;
  }
  const packingDate =
    (isValidParcelDateKey(entry.packingDate) ? entry.packingDate : undefined) ??
    (isValidParcelDateKey(entry.date) ? entry.date : undefined);
  if (!packingDate) {
    return null;
  }
  const sentDate = isValidParcelDateKey(entry.sentDate) ? entry.sentDate : undefined;
  const receivedDate = isValidParcelDateKey(entry.receivedDate) ? entry.receivedDate : undefined;
  const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : packingDate;
  const updatedAt = typeof entry.updatedAt === 'string' ? entry.updatedAt : createdAt;

  return {
    id: entry.id,
    kind: entry.kind,
    status: entry.status,
    title: optionalTrimmed(entry.title, PARCEL_TITLE_MAX_LENGTH),
    contents,
    packingDate,
    sentDate: entry.status === 'packing' ? undefined : sentDate,
    receivedDate: entry.status === 'received' ? receivedDate : undefined,
    note: optionalTrimmed(entry.note, PARCEL_NOTE_MAX_LENGTH),
    createdAt,
    updatedAt,
  };
}

function compareDateKeys(left?: string, right?: string): number {
  if (left && right) {
    return left.localeCompare(right);
  }
  if (left) {
    return -1;
  }
  if (right) {
    return 1;
  }
  return 0;
}

export function validateParcelForm(form: ParcelFormData, today: Date = new Date()): string | null {
  const contents = form.contents.trim();
  if (!contents) {
    return 'Напишите, что внутри — коротко, своими словами';
  }
  if (contents.length > PARCEL_CONTENTS_MAX_LENGTH) {
    return `Про «что внутри» не длиннее ${PARCEL_CONTENTS_MAX_LENGTH} знаков`;
  }
  if (form.title.trim().length > PARCEL_TITLE_MAX_LENGTH) {
    return `Название не длиннее ${PARCEL_TITLE_MAX_LENGTH} знаков`;
  }
  if (form.note.trim().length > PARCEL_NOTE_MAX_LENGTH) {
    return `Заметка не длиннее ${PARCEL_NOTE_MAX_LENGTH} знаков`;
  }
  if (!form.packingDate) {
    return 'Укажите, с какого дня собираете';
  }

  const todayStart = startOfDay(today);
  if (isAfter(startOfDay(form.packingDate), todayStart)) {
    return 'Дата сбора не может быть в будущем';
  }

  if (form.status === 'packing') {
    return null;
  }

  if (!form.sentDate) {
    return form.kind === 'handover' ? 'Укажите, когда отнесли' : 'Укажите дату отправки';
  }
  if (isAfter(startOfDay(form.sentDate), todayStart)) {
    return form.kind === 'handover'
      ? 'Дата, когда отнесли, не может быть в будущем'
      : 'Дата отправки не может быть в будущем';
  }
  if (isAfter(startOfDay(form.packingDate), startOfDay(form.sentDate))) {
    return form.kind === 'handover'
      ? 'Нельзя отнести раньше, чем начали собирать'
      : 'Нельзя отправить раньше, чем начали собирать';
  }

  if (form.status !== 'received') {
    return null;
  }

  if (!form.receivedDate) {
    return form.kind === 'handover' ? 'Укажите, когда принял' : 'Укажите, когда дошла';
  }
  if (isAfter(startOfDay(form.receivedDate), todayStart)) {
    return form.kind === 'handover'
      ? 'Дата, когда принял, не может быть в будущем'
      : 'Дата, когда дошла, не может быть в будущем';
  }
  if (isAfter(startOfDay(form.sentDate), startOfDay(form.receivedDate))) {
    return form.kind === 'handover'
      ? 'Нельзя принять раньше, чем отнесли'
      : 'Нельзя получить раньше отправки';
  }

  return null;
}

export function parcelEntryFromForm(
  form: ParcelFormData,
  existing: Pick<ParcelEntry, 'id' | 'createdAt'> | null,
  nowIso: string,
): ParcelEntry {
  const status = form.status;
  return {
    id: existing?.id ?? '',
    kind: form.kind,
    status,
    title: optionalTrimmed(form.title, PARCEL_TITLE_MAX_LENGTH),
    contents: form.contents.trim().slice(0, PARCEL_CONTENTS_MAX_LENGTH),
    packingDate: toParcelDateKey(form.packingDate ?? new Date()),
    sentDate:
      status === 'packing' || !form.sentDate ? undefined : toParcelDateKey(form.sentDate),
    receivedDate:
      status === 'received' && form.receivedDate
        ? toParcelDateKey(form.receivedDate)
        : undefined,
    note: optionalTrimmed(form.note, PARCEL_NOTE_MAX_LENGTH),
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
}

export function formFromParcelEntry(entry: ParcelEntry | null, kind: ParcelKind = 'parcel'): ParcelFormData {
  if (!entry) {
    const today = startOfDay(new Date());
    return {
      kind,
      status: 'packing',
      title: '',
      contents: '',
      packingDate: today,
      sentDate: null,
      receivedDate: null,
      note: '',
    };
  }

  return {
    kind: entry.kind,
    status: entry.status,
    title: entry.title ?? '',
    contents: entry.contents,
    packingDate: fromParcelDateKey(entry.packingDate),
    sentDate: entry.sentDate ? fromParcelDateKey(entry.sentDate) : null,
    receivedDate: entry.receivedDate ? fromParcelDateKey(entry.receivedDate) : null,
    note: entry.note ?? '',
  };
}

export function applyParcelStatusAdvance(
  entry: ParcelEntry,
  nextStatus: ParcelStatus,
  date: Date,
  today: Date = new Date(),
): { ok: true; entry: ParcelEntry } | { ok: false; error: string } {
  const expected = nextParcelStatus(entry.status);
  if (expected !== nextStatus) {
    return { ok: false, error: 'Этот шаг уже пройден или ещё рано' };
  }

  const form = formFromParcelEntry(entry);
  form.status = nextStatus;
  if (nextStatus === 'sent') {
    form.sentDate = date;
  }
  if (nextStatus === 'received') {
    form.receivedDate = date;
    if (!form.sentDate) {
      form.sentDate = fromParcelDateKey(entry.packingDate);
    }
  }

  const error = validateParcelForm(form, today);
  if (error) {
    return { ok: false, error };
  }

  return {
    ok: true,
    entry: parcelEntryFromForm(form, entry, entry.updatedAt),
  };
}

const STATUS_ORDER: Record<ParcelStatus, number> = {
  packing: 0,
  sent: 1,
  received: 2,
};

export function compareParcels(left: ParcelEntry, right: ParcelEntry): number {
  const byStatus = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
  if (byStatus !== 0) {
    return byStatus;
  }

  const leftDate = left.receivedDate ?? left.sentDate ?? left.packingDate;
  const rightDate = right.receivedDate ?? right.sentDate ?? right.packingDate;
  const byDate = compareDateKeys(rightDate, leftDate);
  if (byDate !== 0) {
    return byDate;
  }
  return right.updatedAt.localeCompare(left.updatedAt);
}

export function filterParcels(
  entries: ParcelEntry[],
  kindFilter: ParcelKindFilter,
  statusFilter: ParcelStatusFilter,
): ParcelEntry[] {
  return entries
    .filter((entry) => (kindFilter === 'all' ? true : entry.kind === kindFilter))
    .filter((entry) => (statusFilter === 'all' ? true : entry.status === statusFilter))
    .slice()
    .sort(compareParcels);
}

function isDispatched(entry: ParcelEntry): boolean {
  return (entry.status === 'sent' || entry.status === 'received') && Boolean(entry.sentDate);
}

function isWithinRange(dateKey: string, range: ParcelServiceRange): boolean {
  if (!range.start || !range.end) {
    return true;
  }
  const date = fromParcelDateKey(dateKey);
  const start = startOfDay(range.start);
  const end = startOfDay(range.end);
  return date >= start && date <= end;
}

export function lastDispatchedDate(entries: ParcelEntry[]): string | null {
  let latest: string | null = null;
  for (const entry of entries) {
    if (!isDispatched(entry) || !entry.sentDate) {
      continue;
    }
    if (!latest || entry.sentDate > latest) {
      latest = entry.sentDate;
    }
  }
  return latest;
}

function formatDaysAgo(days: number): string {
  if (days <= 0) {
    return 'сегодня';
  }
  return `${formatCount(days, 'day')} назад`;
}

export function getParcelStats(
  entries: ParcelEntry[],
  range: ParcelServiceRange = { start: null, end: null },
  now: Date = new Date(),
): ParcelStatItem[] {
  const dispatched = entries.filter(
    (entry) => isDispatched(entry) && entry.sentDate && isWithinRange(entry.sentDate, range),
  );
  const parcelsSent = dispatched.filter((entry) => entry.kind === 'parcel').length;
  const handoversSent = dispatched.filter((entry) => entry.kind === 'handover').length;
  const packing = entries.filter((entry) => entry.status === 'packing').length;
  const inTransit = entries.filter((entry) => entry.status === 'sent').length;
  const lastDate = lastDispatchedDate(dispatched);

  let lastValue = '—';
  let lastSub: string | undefined;
  if (lastDate) {
    lastValue = formatParcelDateShort(lastDate);
    lastSub = formatDaysAgo(differenceInCalendarDays(startOfDay(now), fromParcelDateKey(lastDate)));
  }

  const sentSub =
    dispatched.length === 0
      ? undefined
      : `${parcelsSent} ${pluralizeParcels(parcelsSent)} · ${handoversSent} ${pluralizeHandovers(handoversSent)}`;

  return [
    {
      label: 'Ушло за службу',
      value: String(dispatched.length),
      subValue: sentSub,
    },
    {
      label: 'Собираю',
      value: String(packing),
    },
    {
      label: 'В пути',
      value: String(inTransit),
    },
    {
      label: 'Последняя',
      value: lastValue,
      subValue: lastSub,
    },
  ];
}

function pluralizeParcels(count: number): string {
  const abs = Math.abs(Math.trunc(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return 'посылок';
  }
  if (mod10 === 1) {
    return 'посылка';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'посылки';
  }
  return 'посылок';
}

function pluralizeHandovers(count: number): string {
  const abs = Math.abs(Math.trunc(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return 'передачек';
  }
  if (mod10 === 1) {
    return 'передачка';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'передачки';
  }
  return 'передачек';
}

function atReminderHour(date: Date): Date {
  return setMilliseconds(
    setSeconds(setMinutes(setHours(startOfDay(date), PARCEL_REMINDER_HOUR), 0), 0),
    0,
  );
}

export function reminderIntervalLabel(interval: ParcelReminderInterval): string {
  return formatCount(interval, 'day');
}

function reminderAnchorKey(lastDate: string | null, serviceStart: Date | null): string | null {
  if (lastDate) {
    return lastDate;
  }
  if (!serviceStart) {
    return null;
  }
  return toParcelDateKey(serviceStart);
}

export function getParcelReminderPlan(
  entries: ParcelEntry[],
  settings: ParcelSettings,
  serviceStart: Date | null,
  now: Date = new Date(),
  serviceEnd: Date | null = null,
  remindedAnchor: string | null = null,
): ParcelReminderPlan {
  const lastDate = lastDispatchedDate(entries);
  const anchorKey = reminderAnchorKey(lastDate, serviceStart);
  const anchorId = anchorKey ? `${anchorKey}:${settings.reminderIntervalDays}` : null;
  const daysSinceDispatch =
    lastDate == null ? null : differenceInCalendarDays(startOfDay(now), fromParcelDateKey(lastDate));
  const dueAt = anchorKey
    ? atReminderHour(addDays(fromParcelDateKey(anchorKey), settings.reminderIntervalDays))
    : null;
  const base: ParcelReminderPlan = {
    lastDispatchedDate: lastDate,
    daysSinceDispatch,
    overdue: false,
    fireAt: null,
    anchorId,
    dueAt,
  };

  const serviceIsOver =
    serviceEnd != null && isAfter(startOfDay(now), startOfDay(serviceEnd));
  if (serviceIsOver || !settings.reminderEnabled || !anchorKey || !dueAt) {
    return base;
  }

  const overdue = startOfDay(now) >= startOfDay(dueAt);
  if (now < dueAt) {
    return { ...base, overdue, fireAt: dueAt };
  }

  const alreadyReminded = remindedAnchor === anchorId;
  if (alreadyReminded) {
    return { ...base, overdue, fireAt: null };
  }

  const todayFire = atReminderHour(now);
  const fireAt = now < todayFire ? todayFire : atReminderHour(addDays(now, 1));
  return { ...base, overdue, fireAt };
}

export function parcelReminderBannerText(plan: ParcelReminderPlan): string | null {
  if (!plan.overdue) {
    return null;
  }
  if (plan.lastDispatchedDate && plan.daysSinceDispatch != null) {
    return `Уже ${formatCount(plan.daysSinceDispatch, 'day')} без посылки или передачки`;
  }
  return 'Пора отправить первую посылку или отнести передачку';
}

export function parcelReminderNotificationCopy(plan: ParcelReminderPlan): {
  title: string;
  body: string;
} {
  if (!plan.lastDispatchedDate) {
    return {
      title: 'Посылка для него',
      body: 'Собери первую посылку или передачку. Ему будет легче ждать, если что-то уже в пути.',
    };
  }

  const days =
    plan.fireAt != null
      ? differenceInCalendarDays(startOfDay(plan.fireAt), fromParcelDateKey(plan.lastDispatchedDate))
      : plan.daysSinceDispatch;
  if (days == null) {
    return {
      title: 'Посылка для него',
      body: 'Собери первую посылку или передачку. Ему будет легче ждать, если что-то уже в пути.',
    };
  }

  return {
    title: 'Посылка для него',
    body: `Уже ${formatCount(days, 'day')} ничего не уходило. Собери коробочку — ему это важно.`,
  };
}

/** Кладёт удалённую запись обратно в текущий список, не откатывая остальные правки. */
export function restoreParcelEntry(storage: ParcelsStorage, entry: ParcelEntry): ParcelsStorage {
  if (storage.entries.some((item) => item.id === entry.id)) {
    return storage;
  }
  return {
    ...storage,
    entries: [...storage.entries, entry],
  };
}
