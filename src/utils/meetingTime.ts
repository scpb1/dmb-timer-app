import { startOfDay } from 'date-fns';

import type { MeetingEntry } from '@/types/trackers';
import { formatMeetingDuration } from '@/utils/durationFormat';

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

/** Локальная дата из ключа `yyyy-MM-dd`, без сдвига UTC */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function parseTimeToMinutes(time?: string): number | null {
  if (!time) {
    return null;
  }

  const match = TIME_PATTERN.exec(time.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

export function formatTimeLabel(time: string): string {
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) {
    return time;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function dateToTimeLabel(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function timeLabelToDate(time?: string, fallback: Date = new Date()): Date {
  const next = new Date(fallback);
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) {
    return next;
  }

  next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return next;
}

export function isPastMeetingDate(dateKey: string, now: Date = new Date()): boolean {
  return startOfDay(parseDateKey(dateKey)).getTime() < startOfDay(now).getTime();
}

export function validateMeetingTimes(
  dateKey: string,
  startTime?: string,
  endTime?: string,
  now: Date = new Date(),
): string | null {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  const past = isPastMeetingDate(dateKey, now);

  if (past) {
    if (start == null || end == null) {
      return 'Для прошедшей встречи укажите начало и конец';
    }
  } else if (end != null && start == null) {
    return 'Сначала укажите начало встречи';
  }

  if (start != null && end != null && end <= start) {
    return 'Конец должен быть позже начала';
  }

  return null;
}

export function getMeetingDurationSeconds(entry: Pick<MeetingEntry, 'startTime' | 'endTime' | 'durationSeconds'>): number | null {
  const start = parseTimeToMinutes(entry.startTime);
  const end = parseTimeToMinutes(entry.endTime);
  if (start != null && end != null && end > start) {
    return (end - start) * 60;
  }

  if (entry.durationSeconds > 0) {
    return entry.durationSeconds;
  }

  return null;
}

export function formatMeetingTimeRange(entry: Pick<MeetingEntry, 'startTime' | 'endTime'>): string | undefined {
  if (entry.startTime && entry.endTime) {
    return `${formatTimeLabel(entry.startTime)}–${formatTimeLabel(entry.endTime)}`;
  }

  if (entry.startTime) {
    return `с ${formatTimeLabel(entry.startTime)}`;
  }

  return undefined;
}

export function formatMeetingListMeta(entry: MeetingEntry): string | undefined {
  const range = formatMeetingTimeRange(entry);
  if (range) {
    return range;
  }

  const duration = getMeetingDurationSeconds(entry);
  return duration != null ? formatMeetingDuration(duration) : undefined;
}

/** Встреча уже закончилась: прошедший день или сегодня, если конец уже прошёл */
export function isMeetingFinished(entry: MeetingEntry, now: Date = new Date()): boolean {
  const day = startOfDay(parseDateKey(entry.date));
  const today = startOfDay(now);
  if (day.getTime() < today.getTime()) {
    return true;
  }
  if (day.getTime() > today.getTime()) {
    return false;
  }

  const end = parseTimeToMinutes(entry.endTime);
  if (end == null) {
    return false;
  }

  return end <= now.getHours() * 60 + now.getMinutes();
}

function meetingSortMinutes(entry: MeetingEntry, preferEnd: boolean): number {
  const end = parseTimeToMinutes(entry.endTime);
  const start = parseTimeToMinutes(entry.startTime);
  if (preferEnd && end != null) {
    return end;
  }
  if (start != null) {
    return start;
  }
  if (end != null) {
    return end;
  }
  return preferEnd ? 24 * 60 : 0;
}

export function compareFinishedMeetings(left: MeetingEntry, right: MeetingEntry): number {
  const dateCompare = left.date.localeCompare(right.date);
  if (dateCompare !== 0) {
    return dateCompare;
  }
  return meetingSortMinutes(left, true) - meetingSortMinutes(right, true);
}

export function compareUpcomingMeetings(left: MeetingEntry, right: MeetingEntry): number {
  const dateCompare = left.date.localeCompare(right.date);
  if (dateCompare !== 0) {
    return dateCompare;
  }
  return meetingSortMinutes(left, false) - meetingSortMinutes(right, false);
}
