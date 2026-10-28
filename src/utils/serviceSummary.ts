import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { CONFIG_KEYS } from '@/types/config';
import type { CallEntry, MeetingEntry } from '@/types/trackers';
import { countDiaryEntriesByKind, getConfig, setConfig } from '@/services/database';
import { inflect, pluralize } from '@/utils/inflection';
import { logger } from '@/utils/logger';
import { resolveTimerPhase } from '@/utils/timerCalculations';
import {
  getCallStats,
  getMeetingStats,
  type TrackerStatItem,
} from '@/utils/trackerCalculations';
import { getTimerVisitCount } from '@/utils/timerVisitCount';

export const SERVICE_SUMMARY_DATE_KEY_FORMAT = 'yyyy-MM-dd';

export interface ServiceSummary {
  userName: string;
  partnerName: string;
  totalDays: number;
  dateRangeLabel: string;
  enlistmentLabel: string;
  demobilizationLabel: string;
  callStats: TrackerStatItem[];
  meetingStats: TrackerStatItem[];
  diaryStats: TrackerStatItem[];
  timerVisitCount: number;
}

export function toDateKey(date: Date): string {
  return format(startOfDay(date), SERVICE_SUMMARY_DATE_KEY_FORMAT);
}

export function isDemobilizationDay(demobilizationDate: Date, now: Date = new Date()): boolean {
  return startOfDay(demobilizationDate).getTime() === startOfDay(now).getTime();
}

export function isServiceAfterEnd(
  enlistmentDate: Date,
  demobilizationDate: Date,
  now: Date = new Date(),
): boolean {
  return resolveTimerPhase(enlistmentDate, demobilizationDate, now) === 'after';
}

/** Автопоказ только в календарный день дембеля и только один раз за этот день */
export function shouldAutoOpenServiceSummary(
  demobilizationDate: Date,
  lastShownDateKey: string | null,
  now: Date = new Date(),
): boolean {
  if (!isDemobilizationDay(demobilizationDate, now)) {
    return false;
  }

  return lastShownDateKey !== toDateKey(now);
}

export async function getServiceSummaryAutoShownDate(): Promise<string | null> {
  return getConfig(CONFIG_KEYS.SERVICE_SUMMARY_AUTO_SHOWN_DATE);
}

export async function markServiceSummaryAutoShown(now: Date = new Date()): Promise<void> {
  await setConfig(CONFIG_KEYS.SERVICE_SUMMARY_AUTO_SHOWN_DATE, toDateKey(now));
}

function parseTrackerEntries<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as { entries?: T[] };
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function formatServiceDate(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: ru });
}

export async function loadServiceSummary(input: {
  partnerName: string;
  userName?: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
}): Promise<ServiceSummary> {
  const [callsRaw, meetingsRaw, diaryCounts, userNameRaw, timerVisitCount] = await Promise.all([
    getConfig(CONFIG_KEYS.TRACKERS_CALLS_DATA),
    getConfig(CONFIG_KEYS.TRACKERS_MEETINGS_DATA),
    countDiaryEntriesByKind(),
    input.userName == null ? getConfig(CONFIG_KEYS.USER_NAME) : Promise.resolve(input.userName),
    getTimerVisitCount(),
  ]);

  const callEntries = parseTrackerEntries<CallEntry>(callsRaw);
  const meetingEntries = parseTrackerEntries<MeetingEntry>(meetingsRaw);
  const hasDates = Boolean(input.enlistmentDate && input.demobilizationDate);
  const totalDays = hasDates
    ? Math.max(
        0,
        differenceInCalendarDays(
          startOfDay(input.demobilizationDate as Date),
          startOfDay(input.enlistmentDate as Date),
        ),
      )
    : 0;
  const enlistmentLabel = input.enlistmentDate ? formatServiceDate(input.enlistmentDate) : '';
  const demobilizationLabel = input.demobilizationDate
    ? formatServiceDate(input.demobilizationDate)
    : '';

  return {
    userName: (input.userName ?? userNameRaw ?? '').trim(),
    partnerName: input.partnerName.trim(),
    totalDays,
    enlistmentLabel,
    demobilizationLabel,
    dateRangeLabel:
      enlistmentLabel && demobilizationLabel ? `${enlistmentLabel} — ${demobilizationLabel}` : '',
    callStats: getCallStats(callEntries),
    meetingStats: getMeetingStats(meetingEntries),
    diaryStats: [
      {
        label: 'Личный дневник',
        value: String(diaryCounts.personal),
        subValue: pluralize(diaryCounts.personal, 'запись', 'записи', 'записей'),
      },
      {
        label: 'Письма',
        value: String(diaryCounts.letter),
        subValue: pluralize(diaryCounts.letter, 'письмо', 'письма', 'писем'),
      },
    ],
    timerVisitCount,
  };
}

export async function loadServiceSummarySafe(input: {
  partnerName: string;
  userName?: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
}): Promise<ServiceSummary | null> {
  try {
    return await loadServiceSummary(input);
  } catch (error) {
    logger.error('Ошибка загрузки итогов службы', error);
    return null;
  }
}

export function serviceSummaryHeroCaption(totalDays: number): string {
  return `${inflect(totalDays, 'day')} службы`;
}
