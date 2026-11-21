import type { SQLiteDatabase } from 'expo-sqlite';
import { formatISO } from 'date-fns';
import * as Crypto from 'expo-crypto';

import type { DiaryEntry, DiaryKind, LetterTheme } from '@/types/diary';
import {
  CUSTOM_LETTER_THEME_ID_PREFIX,
  LETTER_THEME_TITLE_MAX_LENGTH,
} from '@/types/diary';
import { LETTER_THEMES_SEED_VERSION, SEED_LETTER_THEMES } from '@/data/letterThemes';
import { isDocumentBlank, parseDiaryDocument, serializeDiaryDocument } from '@/utils/diaryContent';
import { logger } from '@/utils/logger';
import { enqueueDatabaseOp, withSqliteBusyRetry } from './queue';

let diaryDatabase: SQLiteDatabase | null = null;

const CREATE_LETTER_THEMES_TABLE = `
  CREATE TABLE IF NOT EXISTS letter_themes (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );
`;

const CREATE_DIARY_ENTRIES_TABLE = `
  CREATE TABLE IF NOT EXISTS diary_entries (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL,
    entry_date TEXT NOT NULL,
    theme_id TEXT,
    content_json TEXT NOT NULL,
    has_content INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    UNIQUE(kind, entry_date)
  );
`;

function getDiaryDatabase(): SQLiteDatabase {
  if (!diaryDatabase) {
    throw new Error('База данных дневника не инициализирована.');
  }

  return diaryDatabase;
}

function runDiaryOp<T>(work: () => Promise<T>, failureMessage: string): Promise<T> {
  return enqueueDatabaseOp(() => withSqliteBusyRetry(work)).catch((error: unknown) => {
    logger.error(failureMessage, error);
    throw error;
  });
}

const DIARY_HAS_CONTENT_BACKFILL = 'diary_has_content_backfill';

async function ensureDiaryHasContent(database: SQLiteDatabase): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(diary_entries)');
  if (!columns.some((column) => column.name === 'has_content')) {
    await database.execAsync(
      'ALTER TABLE diary_entries ADD COLUMN has_content INTEGER NOT NULL DEFAULT 0',
    );
  }

  const marker = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM config WHERE key = ?',
    [DIARY_HAS_CONTENT_BACKFILL],
  );
  if (marker?.value === '1') {
    return;
  }

  const rows = await database.getAllAsync<{ id: string; content_json: string }>(
    'SELECT id, content_json FROM diary_entries',
  );
  for (const row of rows) {
    const hasContent = isDocumentBlank(parseDiaryDocument(row.content_json)) ? 0 : 1;
    await database.runAsync('UPDATE diary_entries SET has_content = ? WHERE id = ?', [
      hasContent,
      row.id,
    ]);
  }
  await database.runAsync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [
    DIARY_HAS_CONTENT_BACKFILL,
    '1',
  ]);
}

export async function initDiarySchema(database: SQLiteDatabase): Promise<void> {
  diaryDatabase = database;
  await database.execAsync(CREATE_LETTER_THEMES_TABLE);
  await database.execAsync(CREATE_DIARY_ENTRIES_TABLE);
  await ensureDiaryHasContent(database);
  await seedLetterThemes(database);
}

async function seedLetterThemes(database: SQLiteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM config WHERE key = ?',
    ['letter_themes_seed_version'],
  );
  const countRow = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM letter_themes WHERE id NOT LIKE ?`,
    [`${CUSTOM_LETTER_THEME_ID_PREFIX}%`],
  );
  const alreadySeeded =
    versionRow?.value === String(LETTER_THEMES_SEED_VERSION) &&
    (countRow?.count ?? 0) === SEED_LETTER_THEMES.length;
  if (alreadySeeded) {
    return;
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM letter_themes WHERE id NOT LIKE ?', [
      `${CUSTOM_LETTER_THEME_ID_PREFIX}%`,
    ]);
    for (const theme of SEED_LETTER_THEMES) {
      await database.runAsync(
        'INSERT INTO letter_themes (id, title, sort_order) VALUES (?, ?, ?)',
        [theme.id, theme.title, theme.sortOrder],
      );
    }
    await database.runAsync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [
      'letter_themes_seed_version',
      String(LETTER_THEMES_SEED_VERSION),
    ]);
  });
}

export async function deleteAllDiaryEntries(): Promise<void> {
  const db = getDiaryDatabase();
  await db.runAsync('DELETE FROM diary_entries');
}

export function resetDiaryEntries(): Promise<void> {
  return runDiaryOp(deleteAllDiaryEntries, 'Ошибка очистки записей дневника');
}

interface DiaryEntryRow {
  id: string;
  kind: DiaryKind;
  entry_date: string;
  theme_id: string | null;
  content_json: string;
  updated_at: string;
}

function mapEntry(row: DiaryEntryRow): DiaryEntry {
  return {
    id: row.id,
    kind: row.kind,
    entryDate: row.entry_date,
    themeId: row.theme_id ?? undefined,
    document: parseDiaryDocument(row.content_json),
    updatedAt: row.updated_at,
  };
}

const DIARY_ENTRY_COLUMNS = `id, kind, entry_date, theme_id, content_json, updated_at`;

async function readLetterThemes(): Promise<LetterTheme[]> {
  const db = getDiaryDatabase();
  const rows = await db.getAllAsync<{ id: string; title: string; sort_order: number }>(
    'SELECT id, title, sort_order FROM letter_themes ORDER BY sort_order ASC',
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    sortOrder: row.sort_order,
  }));
}

export function getLetterThemes(): Promise<LetterTheme[]> {
  return runDiaryOp(readLetterThemes, 'Ошибка чтения тем писем');
}

async function insertCustomLetterThemeRow(normalized: string): Promise<LetterTheme> {
  const db = getDiaryDatabase();
  const existing = await db.getAllAsync<{ title: string }>('SELECT title FROM letter_themes');
  const key = normalized.toLocaleLowerCase('ru');
  if (existing.some((row) => row.title.toLocaleLowerCase('ru') === key)) {
    throw new Error('Такая тема уже есть');
  }

  const maxRow = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM letter_themes',
  );
  const theme: LetterTheme = {
    id: `${CUSTOM_LETTER_THEME_ID_PREFIX}${Crypto.randomUUID()}`,
    title: normalized,
    sortOrder: (maxRow?.max_order ?? 0) + 1,
  };

  await db.runAsync('INSERT INTO letter_themes (id, title, sort_order) VALUES (?, ?, ?)', [
    theme.id,
    theme.title,
    theme.sortOrder,
  ]);
  return theme;
}

export async function insertCustomLetterTheme(title: string): Promise<LetterTheme> {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    throw new Error('Напиши название темы');
  }
  if (normalized.length > LETTER_THEME_TITLE_MAX_LENGTH) {
    throw new Error(`Не длиннее ${LETTER_THEME_TITLE_MAX_LENGTH} символов`);
  }

  try {
    return await enqueueDatabaseOp(() =>
      withSqliteBusyRetry(() => insertCustomLetterThemeRow(normalized)),
    );
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'Такая тема уже есть') {
      logger.error('Ошибка добавления своей темы', error);
    }
    throw error;
  }
}

async function readUsedLetterThemeIds(excludeEntryDate?: string): Promise<string[]> {
  const db = getDiaryDatabase();
  const rows = excludeEntryDate
    ? await db.getAllAsync<{ theme_id: string }>(
        `SELECT DISTINCT theme_id FROM diary_entries
         WHERE kind = 'letter' AND theme_id IS NOT NULL AND entry_date != ?`,
        [excludeEntryDate],
      )
    : await db.getAllAsync<{ theme_id: string }>(
        `SELECT DISTINCT theme_id FROM diary_entries
         WHERE kind = 'letter' AND theme_id IS NOT NULL`,
      );

  return rows.map((row) => row.theme_id).filter(Boolean);
}

export function getUsedLetterThemeIds(excludeEntryDate?: string): Promise<string[]> {
  return runDiaryOp(
    () => readUsedLetterThemeIds(excludeEntryDate),
    'Ошибка чтения использованных тем',
  );
}

async function readDiaryEntryCounts(): Promise<{ personal: number; letter: number }> {
  const db = getDiaryDatabase();
  const rows = await db.getAllAsync<{ kind: DiaryKind; count: number }>(
    'SELECT kind, COUNT(*) as count FROM diary_entries GROUP BY kind',
  );

  const result = { personal: 0, letter: 0 };
  for (const row of rows) {
    if (row.kind === 'personal' || row.kind === 'letter') {
      result[row.kind] = Number(row.count) || 0;
    }
  }
  return result;
}

export function countDiaryEntriesByKind(): Promise<{ personal: number; letter: number }> {
  return runDiaryOp(readDiaryEntryCounts, 'Ошибка подсчёта записей дневника');
}

async function readDiaryEntriesByKind(kind: DiaryKind): Promise<DiaryEntry[]> {
  const db = getDiaryDatabase();
  const rows = await db.getAllAsync<DiaryEntryRow>(
    `SELECT ${DIARY_ENTRY_COLUMNS}
     FROM diary_entries
     WHERE kind = ?
     ORDER BY entry_date ASC`,
    [kind],
  );

  return rows.map(mapEntry);
}

export function getDiaryEntriesByKind(kind: DiaryKind): Promise<DiaryEntry[]> {
  return runDiaryOp(() => readDiaryEntriesByKind(kind), 'Ошибка чтения записей дневника');
}

async function readDiaryCalendarMarks(): Promise<{ personal: string[]; letter: string[] }> {
  const db = getDiaryDatabase();
  const rows = await db.getAllAsync<{ entry_date: string; kind: DiaryKind }>(
    `SELECT entry_date, kind
     FROM diary_entries
     WHERE has_content = 1 AND kind IN ('personal', 'letter')
     ORDER BY entry_date ASC`,
  );

  const personal: string[] = [];
  const letter: string[] = [];
  for (const row of rows) {
    if (row.kind === 'personal') {
      personal.push(row.entry_date);
    } else if (row.kind === 'letter') {
      letter.push(row.entry_date);
    }
  }

  return { personal, letter };
}

/** Даты непустых записей для календаря дневника */
export function getDiaryCalendarMarks(): Promise<{
  personal: string[];
  letter: string[];
}> {
  return runDiaryOp(readDiaryCalendarMarks, 'Ошибка чтения отметок календаря дневника');
}

async function readDiaryEntry(kind: DiaryKind, entryDate: string): Promise<DiaryEntry | null> {
  const db = getDiaryDatabase();
  const row = await db.getFirstAsync<DiaryEntryRow>(
    `SELECT ${DIARY_ENTRY_COLUMNS}
     FROM diary_entries
     WHERE kind = ? AND entry_date = ?`,
    [kind, entryDate],
  );

  return row ? mapEntry(row) : null;
}

export function getDiaryEntry(kind: DiaryKind, entryDate: string): Promise<DiaryEntry | null> {
  return runDiaryOp(() => readDiaryEntry(kind, entryDate), 'Ошибка чтения записи дневника');
}

async function writeDiaryEntry(input: {
  kind: DiaryKind;
  entryDate: string;
  themeId?: string;
  document: DiaryEntry['document'];
}): Promise<DiaryEntry> {
  const db = getDiaryDatabase();
  const existing = await readDiaryEntry(input.kind, input.entryDate);
  const id = existing?.id ?? Crypto.randomUUID();
  const updatedAt = formatISO(new Date());
  const contentJson = serializeDiaryDocument(input.document);
  const hasContent = isDocumentBlank(input.document) ? 0 : 1;

  await db.runAsync(
    `INSERT OR REPLACE INTO diary_entries
      (id, kind, entry_date, theme_id, content_json, has_content, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.kind, input.entryDate, input.themeId ?? null, contentJson, hasContent, updatedAt],
  );

  return {
    id,
    kind: input.kind,
    entryDate: input.entryDate,
    themeId: input.themeId,
    document: input.document,
    updatedAt,
  };
}

export function upsertDiaryEntry(input: {
  kind: DiaryKind;
  entryDate: string;
  themeId?: string;
  document: DiaryEntry['document'];
}): Promise<DiaryEntry> {
  return runDiaryOp(() => writeDiaryEntry(input), 'Ошибка сохранения записи дневника');
}
