import { Client, Pool, types, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

import { config } from './config';

types.setTypeParser(20, (value) => Number(value));

export type DbClient = PoolClient;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS app_meta (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  telegram_id bigint PRIMARY KEY,
  username text,
  first_name text NOT NULL,
  user_name text NOT NULL DEFAULT '',
  partner_name text NOT NULL DEFAULT '',
  enlistment_date text,
  demobilization_date text,
  events jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS users_username_idx
  ON users (lower(regexp_replace(coalesce(username, ''), '^@', '')));

CREATE TABLE IF NOT EXISTS chats (
  chat_id bigint PRIMARY KEY,
  title text NOT NULL,
  mode text NOT NULL,
  custom_days integer NOT NULL,
  digest_hour integer NOT NULL,
  events_hour integer NOT NULL,
  last_digest_on text,
  last_holiday_on text,
  last_milestone_on text,
  last_tomorrow_on text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_members (
  chat_id bigint NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE ON UPDATE CASCADE,
  telegram_id bigint NOT NULL,
  position integer NOT NULL,
  PRIMARY KEY (chat_id, telegram_id)
);

CREATE TABLE IF NOT EXISTS pending_feedback (
  id bigserial PRIMARY KEY,
  from_id bigint NOT NULL,
  from_name text NOT NULL,
  from_username text,
  kind text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL
);
`;

let pool: Pool | null = null;
let ensuring: Promise<void> | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl, max: 10 });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function databaseName(connectionString: string): { database: string; maintenance: string } {
  const url = new URL(connectionString);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(database)) {
    throw new Error('Имя базы в DATABASE_URL может содержать только буквы, цифры и _');
  }
  url.pathname = '/postgres';
  return { database, maintenance: url.toString() };
}

function isMissingDatabase(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '3D000';
}

async function createDatabase(connectionString: string): Promise<void> {
  const { database, maintenance } = databaseName(connectionString);
  const client = new Client({ connectionString: maintenance });
  await client.connect();
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE ${database}`);
      console.log(`Создана база ${database}`);
    }
  } finally {
    await client.end();
  }
}

async function connectable(connectionString: string): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  await client.end();
}

async function ensureDatabaseOnce(): Promise<void> {
  try {
    await connectable(config.databaseUrl);
  } catch (error) {
    if (!isMissingDatabase(error)) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Не подключилась к Postgres. ${message}`);
    }
    await createDatabase(config.databaseUrl);
  }

  const client = await getPool().connect();
  try {
    await client.query(SCHEMA_SQL);
  } finally {
    client.release();
  }
}

export function ensureDatabase(): Promise<void> {
  if (!ensuring) {
    ensuring = ensureDatabaseOnce().catch((error: unknown) => {
      ensuring = null;
      throw error;
    });
  }
  return ensuring;
}
