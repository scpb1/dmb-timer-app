import { format, isBefore, isFuture, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { CallEntry, MeetingEntry } from '@/types/trackers';
import { formatDurationShort } from '@/utils/durationFormat';
import {
  compareFinishedMeetings,
  compareUpcomingMeetings,
  formatMeetingListMeta,
  getMeetingDurationSeconds,
  isMeetingFinished,
  parseDateKey,
} from '@/utils/meetingTime';

export interface TrackerStatItem {
  label: string;
  value: string;
  subValue?: string;
}

function formatTrackerDate(dateKey: string): string {
  return format(parseDateKey(dateKey), 'd MMM yyyy', { locale: ru });
}

function latestCall(entries: CallEntry[]): CallEntry | undefined {
  return [...entries].sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return left.createdAt.localeCompare(right.createdAt);
  }).at(-1);
}

export function getCallStats(entries: CallEntry[]): TrackerStatItem[] {
  const totalCalls = entries.length;
  const totalSeconds = entries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
  const averageSeconds = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;
  const lastCall = latestCall(entries);

  return [
    {
      label: 'Всего звонков',
      value: String(totalCalls),
    },
    {
      label: 'Общая длительность',
      value: formatDurationShort(totalSeconds),
    },
    {
      label: 'Средняя длительность',
      value: totalCalls > 0 ? formatDurationShort(averageSeconds) : '—',
    },
    {
      label: 'Последний звонок',
      value: lastCall ? formatTrackerDate(lastCall.date) : '—',
      subValue: lastCall ? formatDurationShort(lastCall.durationSeconds) : undefined,
    },
  ];
}

export function getMeetingStats(
  entries: MeetingEntry[],
  now: Date = new Date(),
): TrackerStatItem[] {
  const totalMeetings = entries.length;
  const totalSeconds = entries.reduce(
    (sum, entry) => sum + (getMeetingDurationSeconds(entry) ?? 0),
    0,
  );

  const finished = entries
    .filter((entry) => isMeetingFinished(entry, now))
    .sort(compareFinishedMeetings);
  const upcoming = entries
    .filter((entry) => !isMeetingFinished(entry, now))
    .sort(compareUpcomingMeetings);

  const lastMeeting = finished.at(-1);
  const nearestMeeting = upcoming[0];

  const formatMeetingValue = (entry: MeetingEntry | undefined): string => {
    if (!entry) {
      return '—';
    }
    return formatTrackerDate(entry.date);
  };

  return [
    {
      label: 'Всего встреч',
      value: String(totalMeetings),
    },
    {
      label: 'Общая длительность',
      value: totalSeconds > 0 ? formatDurationShort(totalSeconds) : '—',
    },
    {
      label: 'Последняя встреча',
      value: formatMeetingValue(lastMeeting),
      subValue: lastMeeting ? formatMeetingListMeta(lastMeeting) : undefined,
    },
    {
      label: 'Ближайшая встреча',
      value: formatMeetingValue(nearestMeeting),
      subValue: nearestMeeting ? formatMeetingListMeta(nearestMeeting) : undefined,
    },
  ];
}

export function getEntryCountsByDate(entries: Array<{ date: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    counts[entry.date] = (counts[entry.date] ?? 0) + 1;
  }
  return counts;
}

export function getDatesWithEntries(entries: Array<{ date: string }>): Set<string> {
  return new Set(entries.map((entry) => entry.date));
}

export function getEntriesForDate<T extends { date: string }>(
  entries: T[],
  dateKey: string,
): T[] {
  return entries.filter((entry) => entry.date === dateKey);
}

export function isDateSelectable(date: Date, allowFuture = false): boolean {
  if (allowFuture) {
    return true;
  }
  return !isFuture(startOfDay(date));
}

export function isPastDate(date: Date): boolean {
  return isBefore(startOfDay(date), startOfDay(new Date()));
}
