import * as SQLite from 'expo-sqlite';

import { logger } from '@/utils/logger';
import { removeTimerBackground } from '@/utils/timerBackground';
import { CONFIG_KEYS } from '@/types/config';
import { initDiarySchema, resetDiaryEntries } from './diary';
import {
  DATABASE_FILES,
  getActiveDatabaseProfile,
  setActiveDatabaseProfile,
  type DatabaseProfileId,
} from './profile';
import { ensureSandboxSeeded, reseedSandbox } from './sandboxSeed';

export {
  countDiaryEntriesByKind,
  getDiaryCalendarMarks,
  getDiaryEntriesByKind,
  getDiaryEntry,
  getLetterThemes,
  getUsedLetterThemeIds,
  insertCustomLetterTheme,
  upsertDiaryEntry,
} from './diary';

export {
  getActiveDatabaseProfile,
  setActiveDatabaseProfile,
  type DatabaseProfileId,
} from './profile';

let database: SQLite.SQLiteDatabase | null = null;
let openedFileName: string | null = null;

const CREATE_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`;

async function openProfileDatabase(profile: DatabaseProfileId): Promise<void> {
  const fileName = DATABASE_FILES[profile];
  if (database && openedFileName === fileName) {
    return;
  }

  if (database) {
    await database.closeAsync();
    database = null;
    openedFileName = null;
  }

  database = await SQLite.openDatabaseAsync(fileName);
  openedFileName = fileName;
  await database.execAsync(CREATE_CONFIG_TABLE);
  await initDiarySchema(database);

  if (profile === 'sandbox') {
    await ensureSandboxSeeded(database);
  }
}

/** Открывает активный профиль БД: основную или тестовую */
export async function initDatabase(): Promise<void> {
  try {
    const profile = await getActiveDatabaseProfile();
    await openProfileDatabase(profile);
    logger.info(`База данных инициализирована (${profile})`);
  } catch (error) {
    logger.error('Ошибка инициализации базы данных', error);
    throw error;
  }
}

export async function switchDatabaseProfile(next: DatabaseProfileId): Promise<void> {
  const current = await getActiveDatabaseProfile();
  if (current === next && database && openedFileName === DATABASE_FILES[next]) {
    if (next === 'sandbox') {
      await ensureSandboxSeeded(database);
    }
    return;
  }

  await setActiveDatabaseProfile(next);
  await openProfileDatabase(next);
  logger.info(`Переключились на базу ${next}`);
}

export async function reseedSandboxDatabase(): Promise<void> {
  const profile = await getActiveDatabaseProfile();
  if (profile !== 'sandbox' || !database) {
    await switchDatabaseProfile('sandbox');
  }
  if (!database) {
    throw new Error('Тестовая база не открыта');
  }
  await reseedSandbox(database);
}

function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    throw new Error('База данных не инициализирована. Вызовите initDatabase() сначала.');
  }

  return database;
}

/** Читает значение конфигурации по ключу */
export async function getConfig(key: string): Promise<string | null> {
  try {
    const db = getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM config WHERE key = ?',
      [key],
    );

    return row?.value ?? null;
  } catch (error) {
    logger.error(`Ошибка чтения config: ${key}`, error);
    throw error;
  }
}

/** Записывает или обновляет значение конфигурации */
export async function setConfig(key: string, value: string): Promise<void> {
  try {
    const db = getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
      [key, value],
    );
  } catch (error) {
    logger.error(`Ошибка записи config: ${key}`, error);
    throw error;
  }
}

/** Удаляет все сохранённые данные (для тестирования) */
export async function resetAllData(): Promise<void> {
  try {
    const db = getDatabase();
    const backgroundImageUri = await getConfig(CONFIG_KEYS.TIMER_BACKGROUND_IMAGE);
    await db.runAsync('DELETE FROM config');
    await resetDiaryEntries();

    try {
      await removeTimerBackground(backgroundImageUri);
    } catch (error) {
      logger.error('Не удалось удалить файл фона таймера при сбросе', error);
    }

    logger.info('Все данные сброшены');
  } catch (error) {
    logger.error('Ошибка сброса данных', error);
    throw error;
  }
}
