import type { SQLiteDatabase } from 'expo-sqlite';
import { formatISO } from 'date-fns';
import * as Crypto from 'expo-crypto';

import type { DiaryEntry, DiaryKind, LetterTheme } from '@/types/diary';
import { LETTER_THEMES_SEED_VERSION, SEED_LETTER_THEMES } from '@/data/letterThemes';
import { parseDiaryDocument, serializeDiaryDocument } from '@/utils/diaryContent';
import { logger } from '@/utils/logger';

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

export async function initDiarySchema(database: SQLiteDatabase): Promise<void> {
  diaryDatabase = database;
  await database.execAsync(CREATE_LETTER_THEMES_TABLE);
  await database.execAsync(CREATE_DIARY_ENTRIES_TABLE);
  await seedLetterThemes(database);
}

async function seedLetterThemes(database: SQLiteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM config WHERE key = ?',
    ['letter_themes_seed_version'],
  );
  const countRow = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM letter_themes',
  );
  const alreadySeeded =
    versionRow?.value === String(LETTER_THEMES_SEED_VERSION) &&
    (countRow?.count ?? 0) === SEED_LETTER_THEMES.length;
  if (alreadySeeded) {
    return;
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM letter_themes');
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

export async function resetDiaryEntries(): Promise<void> {
  const db = getDiaryDatabase();
  await db.runAsync('DELETE FROM diary_entries');
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

export async function getLetterThemes(): Promise<LetterTheme[]> {
  try {
    const db = getDiaryDatabase();
    const rows = await db.getAllAsync<{ id: string; title: string; sort_order: number }>(
      'SELECT id, title, sort_order FROM letter_themes ORDER BY sort_order ASC',
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      sortOrder: row.sort_order,
    }));
  } catch (error) {
    logger.error('Ошибка чтения тем писем', error);
    throw error;
  }
}

export async function getUsedLetterThemeIds(excludeEntryDate?: string): Promise<string[]> {
  try {
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
  } catch (error) {
    logger.error('Ошибка чтения использованных тем', error);
    throw error;
  }
}

export async function getDiaryEntry(kind: DiaryKind, entryDate: string): Promise<DiaryEntry | null> {
  try {
    const db = getDiaryDatabase();
    const row = await db.getFirstAsync<DiaryEntryRow>(
      `SELECT id, kind, entry_date, theme_id, content_json, updated_at
       FROM diary_entries
       WHERE kind = ? AND entry_date = ?`,
      [kind, entryDate],
    );

    return row ? mapEntry(row) : null;
  } catch (error) {
    logger.error('Ошибка чтения записи дневника', error);
    throw error;
  }
}

export async function upsertDiaryEntry(input: {
  kind: DiaryKind;
  entryDate: string;
  themeId?: string;
  document: DiaryEntry['document'];
}): Promise<DiaryEntry> {
  try {
    const db = getDiaryDatabase();
    const existing = await getDiaryEntry(input.kind, input.entryDate);
    const id = existing?.id ?? Crypto.randomUUID();
    const updatedAt = formatISO(new Date());
    const contentJson = serializeDiaryDocument(input.document);

    await db.runAsync(
      `INSERT OR REPLACE INTO diary_entries
        (id, kind, entry_date, theme_id, content_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.kind, input.entryDate, input.themeId ?? null, contentJson, updatedAt],
    );

    return {
      id,
      kind: input.kind,
      entryDate: input.entryDate,
      themeId: input.themeId,
      document: input.document,
      updatedAt,
    };
  } catch (error) {
    logger.error('Ошибка сохранения записи дневника', error);
    throw error;
  }
}
