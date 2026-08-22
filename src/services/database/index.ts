import * as SQLite from 'expo-sqlite';

import { logger } from '@/utils/logger';

const DATABASE_NAME = 'zhdi.db';

let database: SQLite.SQLiteDatabase | null = null;

const CREATE_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`;

/** Открывает БД и создаёт таблицу config при первом запуске */
export async function initDatabase(): Promise<void> {
  try {
    database = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await database.execAsync(CREATE_CONFIG_TABLE);
    logger.info('База данных инициализирована');
  } catch (error) {
    logger.error('Ошибка инициализации базы данных', error);
    throw error;
  }
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
    await db.runAsync('DELETE FROM config');
    logger.info('Все данные сброшены');
  } catch (error) {
    logger.error('Ошибка сброса данных', error);
    throw error;
  }
}
