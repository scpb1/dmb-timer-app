import * as SQLite from 'expo-sqlite';

import { logger } from '@/utils/logger';
import { eraseDiaryLock } from '@/services/diaryLock';
import { clearMemoryCaches } from '@/services/memoryCaches';
import { noteTimerConfigWrite } from '@/services/timerSnapshot';
import { deleteUserMediaDirectories } from '@/services/userFiles';
import { deleteAllDiaryEntries, initDiarySchema } from './diary';
import {
  DATABASE_FILES,
  getActiveDatabaseProfile,
  setActiveDatabaseProfile,
  type DatabaseProfileId,
} from './profile';
import { enqueueDatabaseOp, withSqliteBusyRetry } from './queue';
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

async function configureConnection(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA busy_timeout = 4000;');
  } catch (error) {
    logger.error('Не удалось настроить SQLite WAL', error);
  }
}

async function openProfileDatabase(profile: DatabaseProfileId): Promise<void> {
  await enqueueDatabaseOp(async () => {
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
    await configureConnection(database);
    await database.execAsync(CREATE_CONFIG_TABLE);
    await initDiarySchema(database);

    if (profile === 'sandbox') {
      await ensureSandboxSeeded(database);
    }
  });
}

/**
 * Соединение виджета без сида и миграций. Уже открытого писателя не подменяет.
 */
export async function openReadOnlyDatabase(): Promise<void> {
  if (database) {
    return;
  }

  const profile = await getActiveDatabaseProfile();
  const fileName = DATABASE_FILES[profile];
  const db = await SQLite.openDatabaseAsync(fileName, { useNewConnection: true });
  try {
    await db.execAsync('PRAGMA busy_timeout = 4000;');
    await db.execAsync('PRAGMA query_only = ON;');
  } catch (error) {
    logger.error('Не удалось открыть базу виджета только для чтения', error);
    await db.closeAsync().catch(() => undefined);
    throw error;
  }

  if (database) {
    await db.closeAsync().catch(() => undefined);
    return;
  }

  database = db;
  openedFileName = fileName;
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
  clearMemoryCaches();
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
  clearMemoryCaches();
}

function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    throw new Error('База данных не инициализирована. Вызовите initDatabase() сначала.');
  }

  return database;
}

async function readConfigValue(key: string): Promise<string | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM config WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

async function writeConfigValue(key: string, value: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, value]);
}

/** Читает значение конфигурации по ключу */
export async function getConfig(key: string): Promise<string | null> {
  try {
    return await enqueueDatabaseOp(() => withSqliteBusyRetry(() => readConfigValue(key)));
  } catch (error) {
    logger.error(`Ошибка чтения config: ${key}`, error);
    throw error;
  }
}

/** Несколько ключей одним SELECT внутри одной операции очереди. */
export async function getConfigs(keys: readonly string[]): Promise<Record<string, string | null>> {
  const unique = [...new Set(keys)];
  const result: Record<string, string | null> = {};
  for (const key of unique) {
    result[key] = null;
  }
  if (unique.length === 0) {
    return result;
  }

  try {
    return await enqueueDatabaseOp(() =>
      withSqliteBusyRetry(async () => {
        const db = getDatabase();
        const placeholders = unique.map(() => '?').join(', ');
        const rows = await db.getAllAsync<{ key: string; value: string }>(
          `SELECT key, value FROM config WHERE key IN (${placeholders})`,
          unique,
        );
        for (const row of rows) {
          if (Object.prototype.hasOwnProperty.call(result, row.key)) {
            result[row.key] = row.value;
          }
        }
        return result;
      }),
    );
  } catch (error) {
    logger.error('Ошибка пакетного чтения config', error);
    throw error;
  }
}

/** Записывает или обновляет значение конфигурации */
export async function setConfig(key: string, value: string): Promise<void> {
  try {
    await enqueueDatabaseOp(() => withSqliteBusyRetry(() => writeConfigValue(key, value)));
    noteTimerConfigWrite(key);
  } catch (error) {
    logger.error(`Ошибка записи config: ${key}`, error);
    throw error;
  }
}

/** Удаляет таблицы, файлы дневника и трекеров, замок и снимки в памяти. */
export async function resetAllData(): Promise<void> {
  const steps = [
    async () => {
      await enqueueDatabaseOp(async () => {
        const db = getDatabase();
        await db.runAsync('DELETE FROM config');
        await deleteAllDiaryEntries();
      });
    },
    () => deleteUserMediaDirectories(),
    () => eraseDiaryLock(),
    () => {
      clearMemoryCaches();
      return Promise.resolve();
    },
  ];

  const results = await Promise.allSettled(steps.map((step) => step()));
  const failed = results.find((result) => result.status === 'rejected');
  if (failed && failed.status === 'rejected') {
    logger.error('Ошибка сброса данных', failed.reason);
    throw failed.reason;
  }

  logger.info('Все данные сброшены');
}
