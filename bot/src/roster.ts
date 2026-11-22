import { format, startOfDay } from 'date-fns';

import { coupleHtml, escapeHtml } from './mention';
import { calculateServiceProgress, fromIsoDay } from './progress';
import type { UserRecord } from './store';
import { TELEGRAM_MESSAGE_LIMIT } from './digest';
import { moscowCalendarToday } from './time';

function packRoster(parts: string[]): string[] {
  const messages: string[] = [];
  let current = '';
  for (const line of parts) {
    const next = current ? `${current}\n${line}` : line;
    if (current && next.length > TELEGRAM_MESSAGE_LIMIT) {
      messages.push(current);
      current = line;
      continue;
    }
    if (line.length > TELEGRAM_MESSAGE_LIMIT) {
      if (current) {
        messages.push(current);
        current = '';
      }
      messages.push(line.slice(0, TELEGRAM_MESSAGE_LIMIT));
      continue;
    }
    current = next;
  }
  if (current) {
    messages.push(current);
  }
  return messages;
}

type WaveKind = 'spring' | 'autumn';
type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

const SEASON_ORDER: SeasonKey[] = ['spring', 'summer', 'autumn', 'winter'];

const SEASON_HEADERS: Record<SeasonKey, string> = {
  spring: '🌷 Весна',
  summer: '☀️ Лето',
  autumn: '🍁 Осень',
  winter: '❄️ Зима',
};

function formatDotDate(date: Date): string {
  return format(date, 'dd.MM.yyyy');
}

function boldText(text: string): string {
  return `<b>${escapeHtml(text)}</b>`;
}

function boldUnderlineCaps(text: string): string {
  return `<b><u>${escapeHtml(text)}</u></b>`;
}

function hasDates(user: UserRecord): user is UserRecord & {
  enlistmentDate: string;
  demobilizationDate: string;
} {
  return Boolean(user.enlistmentDate && user.demobilizationDate);
}

function enlistmentWave(enlistment: Date): { kind: WaveKind; year: number } {
  const month = enlistment.getMonth() + 1;
  const year = enlistment.getFullYear();
  if (month >= 4 && month <= 8) {
    return { kind: 'spring', year };
  }
  if (month >= 9) {
    return { kind: 'autumn', year };
  }
  return { kind: 'autumn', year: year - 1 };
}

function enlistmentSeason(enlistment: Date): SeasonKey {
  const month = enlistment.getMonth() + 1;
  if (month === 4 || month === 5) {
    return 'spring';
  }
  if (month >= 6 && month <= 8) {
    return 'summer';
  }
  if (month >= 9 && month <= 11) {
    return 'autumn';
  }
  return 'winter';
}

function waveSortKey(kind: WaveKind, year: number): number {
  return year * 2 + (kind === 'autumn' ? 0 : 1);
}

function waveHeader(kind: WaveKind, year: number): string {
  if (kind === 'spring') {
    return `🪖 ${boldUnderlineCaps(`ВЕСЕННИЙ ПРИЗЫВ ${year}`)}`;
  }
  return `🪖 ${boldUnderlineCaps(`ОСЕННИЙ ПРИЗЫВ ${year}`)}`;
}

interface RosterEntry {
  user: UserRecord;
  enlistment: Date;
  demobilization: Date;
  wave: { kind: WaveKind; year: number };
  season: SeasonKey;
}

function collectEntries(users: UserRecord[]): RosterEntry[] {
  const entries: RosterEntry[] = [];
  for (const user of users) {
    if (!hasDates(user)) {
      continue;
    }
    const enlistment = fromIsoDay(user.enlistmentDate);
    const demobilization = fromIsoDay(user.demobilizationDate);
    entries.push({
      user,
      enlistment,
      demobilization,
      wave: enlistmentWave(enlistment),
      season: enlistmentSeason(enlistment),
    });
  }
  return entries;
}

function dateRangeLine(user: UserRecord, enlistment: Date, demobilization: Date): string {
  return `${coupleHtml(user)}: ${formatDotDate(enlistment)} – ${formatDotDate(demobilization)}`;
}

function demobilTodayLine(user: UserRecord, enlistment: Date, demobilization: Date): string {
  const inner = dateRangeLine(user, enlistment, demobilization);
  return `–<s>${inner}</s>– 🎖 ${boldText('ДЕМБЕЛЬ')}`;
}

function demobilPastLine(user: UserRecord, enlistment: Date, demobilization: Date): string {
  const inner = dateRangeLine(user, enlistment, demobilization);
  return `<s>${inner}</s> 🎖️`;
}

function isDemobilToday(
  enlistment: Date,
  demobilization: Date,
  today: Date,
): boolean {
  const progress = calculateServiceProgress(enlistment, demobilization, today);
  return progress.phase === 'after' && progress.daysAfterEnd === 0;
}

function includeInActiveRoster(
  enlistment: Date,
  demobilization: Date,
  today: Date,
): boolean {
  const progress = calculateServiceProgress(enlistment, demobilization, today);
  if (progress.phase === 'after') {
    return progress.daysAfterEnd === 0;
  }
  return true;
}

function compareEntries(a: RosterEntry, b: RosterEntry): number {
  const byEnlist =
    startOfDay(a.enlistment).getTime() - startOfDay(b.enlistment).getTime();
  if (byEnlist !== 0) {
    return byEnlist;
  }
  return coupleHtml(a.user).localeCompare(coupleHtml(b.user), 'ru');
}

function buildRosterLines(
  entries: RosterEntry[],
  today: Date,
  mode: 'active' | 'all',
): string[] {
  const filtered =
    mode === 'all'
      ? entries
      : entries.filter((entry) =>
          includeInActiveRoster(entry.enlistment, entry.demobilization, today),
        );

  if (filtered.length === 0) {
    return [];
  }

  const byWave = new Map<string, RosterEntry[]>();
  for (const entry of filtered) {
    const key = `${entry.wave.kind}:${entry.wave.year}`;
    const list = byWave.get(key);
    if (list) {
      list.push(entry);
    } else {
      byWave.set(key, [entry]);
    }
  }

  const waveKeys = [...byWave.keys()].sort((a, b) => {
    const [kindA, yearA] = a.split(':') as [WaveKind, string];
    const [kindB, yearB] = b.split(':') as [WaveKind, string];
    return (
      waveSortKey(kindA, Number(yearA)) - waveSortKey(kindB, Number(yearB))
    );
  });

  const lines: string[] = [];
  for (let waveIndex = 0; waveIndex < waveKeys.length; waveIndex += 1) {
    const key = waveKeys[waveIndex]!;
    const [kind, yearRaw] = key.split(':') as [WaveKind, string];
    const year = Number(yearRaw);
    const waveEntries = byWave.get(key)!;
    if (waveIndex > 0) {
      lines.push('');
    }
    lines.push(waveHeader(kind, year));

    for (let seasonIndex = 0; seasonIndex < SEASON_ORDER.length; seasonIndex += 1) {
      const season = SEASON_ORDER[seasonIndex]!;
      const seasonEntries = waveEntries
        .filter((entry) => entry.season === season)
        .sort(compareEntries);
      if (seasonEntries.length === 0) {
        continue;
      }
      lines.push('');
      lines.push(boldText(SEASON_HEADERS[season]));
      for (const entry of seasonEntries) {
        const progress = calculateServiceProgress(
          entry.enlistment,
          entry.demobilization,
          today,
        );
        const demobToday = isDemobilToday(entry.enlistment, entry.demobilization, today);
        const demobPast = progress.phase === 'after' && progress.daysAfterEnd > 0;

        if (demobToday) {
          lines.push(
            demobilTodayLine(entry.user, entry.enlistment, entry.demobilization),
          );
        } else if (mode === 'all' && demobPast) {
          lines.push(
            demobilPastLine(entry.user, entry.enlistment, entry.demobilization),
          );
        } else {
          lines.push(
            dateRangeLine(entry.user, entry.enlistment, entry.demobilization),
          );
        }
      }
    }
  }

  return lines;
}

function rosterMessages(
  users: UserRecord[],
  today: Date,
  mode: 'active' | 'all',
): string[] {
  const lines = buildRosterLines(collectEntries(users), today, mode);
  if (lines.length === 0) {
    return ['Пусто'];
  }
  return packRoster(lines);
}

export function buildActiveRosterMessages(
  users: UserRecord[],
  today = moscowCalendarToday(),
): string[] {
  return rosterMessages(users, today, 'active');
}

export function buildAllRosterMessages(
  users: UserRecord[],
  today = moscowCalendarToday(),
): string[] {
  return rosterMessages(users, today, 'all');
}