import {
  format,
  isAfter,
  isBefore,
  isFuture,
  parseISO,
  startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';

import type { CallEntry, MeetingEntry } from '@/types/trackers';
import { formatDurationShort } from '@/utils/durationFormat';
import { inflect } from '@/utils/inflection';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export interface TrackerStatItem {
  label: string;
  value: string;
  subValue?: string;
}

function sumDuration(entries: Array<{ durationSeconds: number }>): number {
  return entries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
}

export function getCallStats(entries: CallEntry[]): TrackerStatItem[] {
  const totalCalls = entries.length;
  const totalSeconds = sumDuration(entries);
  const averageSeconds = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;

  const weekdayTotals = new Array(7).fill(0) as number[];
  const weekdayCounts = new Array(7).fill(0) as number[];

  for (const entry of entries) {
    const dayIndex = (parseISO(entry.date).getDay() + 6) % 7;
    weekdayTotals[dayIndex] += entry.durationSeconds;
    weekdayCounts[dayIndex] += 1;
  }

  let bestWeekdayIndex = -1;
  let bestScore = -1;

  for (let index = 0; index < 7; index += 1) {
    const score = weekdayTotals[index] * 1000 + weekdayCounts[index];
    if (score > bestScore) {
      bestScore = score;
      bestWeekdayIndex = index;
    }
  }

  const mostActiveDay =
    bestWeekdayIndex >= 0 && weekdayCounts[bestWeekdayIndex] > 0
      ? WEEKDAY_LABELS[bestWeekdayIndex]
      : '—';

  return [
    {
      label: 'Всего звонков',
      value: String(totalCalls),
      subValue: inflect(totalCalls, 'call'),
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
      label: 'Самый активный день',
      value: mostActiveDay,
      subValue: bestWeekdayIndex >= 0 && weekdayCounts[bestWeekdayIndex] > 0
        ? `${weekdayCounts[bestWeekdayIndex]} ${inflect(weekdayCounts[bestWeekdayIndex], 'call')}`
        : undefined,
    },
  ];
}

export function getMeetingStats(entries: MeetingEntry[]): TrackerStatItem[] {
  const totalMeetings = entries.length;
  const totalSeconds = sumDuration(entries);
  const today = startOfDay(new Date());

  const sortedByDate = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const pastMeetings = sortedByDate.filter(
    (entry) => !isAfter(startOfDay(parseISO(entry.date)), today),
  );
  const futureMeetings = sortedByDate.filter((entry) =>
    isAfter(startOfDay(parseISO(entry.date)), today),
  );

  const lastMeeting = pastMeetings.at(-1);
  const nearestMeeting = futureMeetings[0];

  const formatMeetingDate = (entry: MeetingEntry | undefined): string => {
    if (!entry) {
      return '—';
    }

    return format(parseISO(entry.date), 'd MMM yyyy', { locale: ru });
  };

  return [
    {
      label: 'Всего встреч',
      value: String(totalMeetings),
      subValue: inflect(totalMeetings, 'meeting'),
    },
    {
      label: 'Общая длительность',
      value: formatDurationShort(totalSeconds),
    },
    {
      label: 'Последняя встреча',
      value: formatMeetingDate(lastMeeting),
      subValue: lastMeeting ? formatDurationShort(lastMeeting.durationSeconds) : undefined,
    },
    {
      label: 'Ближайшая встреча',
      value: formatMeetingDate(nearestMeeting),
      subValue: nearestMeeting ? formatDurationShort(nearestMeeting.durationSeconds) : undefined,
    },
  ];
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
