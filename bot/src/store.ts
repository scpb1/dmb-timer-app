import { config } from './config';
import { query, withTransaction, type DbClient } from './db';
import { emptyEvents, KNOWN_EVENTS, normalizeEvents, type EventsStorage } from './events';
import { DIGEST_HOUR } from './time';

export interface UserRecord {
  telegramId: number;
  username: string | null;
  firstName: string;
  userName: string;
  partnerName: string;
  enlistmentDate: string | null;
  demobilizationDate: string | null;
  events: EventsStorage;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackKind = 'liked' | 'annoys' | 'bug' | 'idea';

export interface PendingFeedback {
  fromId: number;
  fromName: string;
  fromUsername: string | null;
  kind: FeedbackKind | string;
  text: string;
  createdAt: string;
}

export type DigestMode = 'daily' | 'weekly' | 'monthly' | 'custom' | 'never';

export interface ChatRecord {
  chatId: number;
  title: string;
  mode: DigestMode;
  customDays: number;
  digestHour: number;
  eventsHour: number;
  memberIds: number[];
  lastDigestOn: string | null;
  lastHolidayOn: string | null;
  lastMilestoneOn: string | null;
  lastTomorrowOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export const JSON_IMPORT_FLAG = 'json_store_imported_at';

const DIGEST_MODES = new Set<DigestMode>(['daily', 'weekly', 'monthly', 'custom', 'never']);

interface UserRow {
  telegram_id: number;
  username: string | null;
  first_name: string;
  user_name: string;
  partner_name: string;
  enlistment_date: string | null;
  demobilization_date: string | null;
  events: unknown;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ChatRow {
  chat_id: number;
  title: string;
  mode: string;
  custom_days: number;
  digest_hour: number;
  events_hour: number;
  last_digest_on: string | null;
  last_holiday_on: string | null;
  last_milestone_on: string | null;
  last_tomorrow_on: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  member_ids: Array<number | string> | null;
}

interface FeedbackRow {
  from_id: number;
  from_name: string;
  from_username: string | null;
  kind: string;
  body: string;
  created_at: Date | string;
}

export type ImportResult =
  | { status: 'already'; at: string }
  | { status: 'imported'; users: number; chats: number; feedback: number };

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asFiniteNumber(value: unknown): number | null {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
}

function asText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeDigestHour(value: unknown): number {
  const hour = typeof value === 'number' ? Math.trunc(value) : DIGEST_HOUR;
  if (!Number.isFinite(hour)) {
    return DIGEST_HOUR;
  }
  return Math.min(23, Math.max(0, hour));
}

function normalizeMode(value: unknown): DigestMode {
  return typeof value === 'string' && DIGEST_MODES.has(value as DigestMode) ? (value as DigestMode) : 'daily';
}

function normalizeCustomDays(value: unknown): number {
  const days = typeof value === 'number' ? Math.trunc(value) : 14;
  if (!Number.isFinite(days)) {
    return 14;
  }
  return Math.min(365, Math.max(1, days));
}

function memberIdsOf(value: Array<number | string> | null): number[] {
  if (!value) {
    return [];
  }
  return value.map((id) => Number(id)).filter((id) => Number.isFinite(id));
}

function mapUser(row: UserRow): UserRecord {
  return {
    telegramId: Number(row.telegram_id),
    username: row.username ?? null,
    firstName: typeof row.first_name === 'string' ? row.first_name : '',
    userName: typeof row.user_name === 'string' ? row.user_name : '',
    partnerName: typeof row.partner_name === 'string' ? row.partner_name : '',
    enlistmentDate: row.enlistment_date ?? null,
    demobilizationDate: row.demobilization_date ?? null,
    events: normalizeEvents(row.events),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function normalizeChat(chat: ChatRecord): ChatRecord {
  const digestHour = normalizeDigestHour(chat.digestHour);
  const customDays = Math.trunc(chat.customDays);
  return {
    ...chat,
    mode: normalizeMode(chat.mode),
    customDays: Number.isFinite(customDays) ? customDays : 14,
    digestHour,
    eventsHour: normalizeDigestHour(chat.eventsHour ?? digestHour),
    lastMilestoneOn: chat.lastMilestoneOn ?? null,
    lastTomorrowOn: chat.lastTomorrowOn ?? null,
  };
}

function mapChat(row: ChatRow): ChatRecord {
  const digestHour = normalizeDigestHour(row.digest_hour);
  return normalizeChat({
    chatId: Number(row.chat_id),
    title: row.title ?? '',
    mode: normalizeMode(row.mode),
    customDays: row.custom_days,
    digestHour,
    eventsHour: normalizeDigestHour(row.events_hour ?? digestHour),
    memberIds: memberIdsOf(row.member_ids),
    lastDigestOn: row.last_digest_on ?? null,
    lastHolidayOn: row.last_holiday_on ?? null,
    lastMilestoneOn: row.last_milestone_on ?? null,
    lastTomorrowOn: row.last_tomorrow_on ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  });
}

function mapFeedback(row: FeedbackRow): PendingFeedback {
  return {
    fromId: Number(row.from_id),
    fromName: row.from_name,
    fromUsername: row.from_username ?? null,
    kind: row.kind,
    text: row.body,
    createdAt: toIso(row.created_at),
  };
}

const CHAT_SELECT = `
  SELECT
    c.chat_id,
    c.title,
    c.mode,
    c.custom_days,
    c.digest_hour,
    c.events_hour,
    c.last_digest_on,
    c.last_holiday_on,
    c.last_milestone_on,
    c.last_tomorrow_on,
    c.created_at,
    c.updated_at,
    COALESCE(
      (
        SELECT array_agg(m.telegram_id ORDER BY m.position)
        FROM chat_members m
        WHERE m.chat_id = c.chat_id
      ),
      ARRAY[]::bigint[]
    ) AS member_ids
  FROM chats c
`;

async function loadUser(client: DbClient, telegramId: number): Promise<UserRecord | undefined> {
  const result = await client.query<UserRow>('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  const row = result.rows[0];
  return row ? mapUser(row) : undefined;
}

async function writeUser(client: DbClient, user: UserRecord): Promise<void> {
  await client.query(
    `
    INSERT INTO users (
      telegram_id, username, first_name, user_name, partner_name,
      enlistment_date, demobilization_date, events, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
    ON CONFLICT (telegram_id) DO UPDATE SET
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      user_name = EXCLUDED.user_name,
      partner_name = EXCLUDED.partner_name,
      enlistment_date = EXCLUDED.enlistment_date,
      demobilization_date = EXCLUDED.demobilization_date,
      events = EXCLUDED.events,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at
    `,
    [
      user.telegramId,
      user.username,
      user.firstName,
      user.userName,
      user.partnerName,
      user.enlistmentDate,
      user.demobilizationDate,
      JSON.stringify(user.events),
      user.createdAt,
      user.updatedAt,
    ],
  );
}

async function loadChat(client: DbClient, chatId: number): Promise<ChatRecord | undefined> {
  const result = await client.query<ChatRow>(`${CHAT_SELECT} WHERE c.chat_id = $1`, [chatId]);
  const row = result.rows[0];
  return row ? mapChat(row) : undefined;
}

async function insertChat(client: DbClient, chat: ChatRecord): Promise<void> {
  await client.query(
    `
    INSERT INTO chats (
      chat_id, title, mode, custom_days, digest_hour, events_hour,
      last_digest_on, last_holiday_on, last_milestone_on, last_tomorrow_on,
      created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (chat_id) DO UPDATE SET
      title = EXCLUDED.title,
      mode = EXCLUDED.mode,
      custom_days = EXCLUDED.custom_days,
      digest_hour = EXCLUDED.digest_hour,
      events_hour = EXCLUDED.events_hour,
      last_digest_on = EXCLUDED.last_digest_on,
      last_holiday_on = EXCLUDED.last_holiday_on,
      last_milestone_on = EXCLUDED.last_milestone_on,
      last_tomorrow_on = EXCLUDED.last_tomorrow_on,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at
    `,
    [
      chat.chatId,
      chat.title,
      chat.mode,
      chat.customDays,
      chat.digestHour,
      chat.eventsHour,
      chat.lastDigestOn,
      chat.lastHolidayOn,
      chat.lastMilestoneOn,
      chat.lastTomorrowOn,
      chat.createdAt,
      chat.updatedAt,
    ],
  );
  await client.query('DELETE FROM chat_members WHERE chat_id = $1', [chat.chatId]);
  for (let index = 0; index < chat.memberIds.length; index += 1) {
    await client.query(
      'INSERT INTO chat_members (chat_id, telegram_id, position) VALUES ($1, $2, $3)',
      [chat.chatId, chat.memberIds[index], index],
    );
  }
}

function blankChat(chatId: number, title: string, timestamp: string): ChatRecord {
  return {
    chatId,
    title,
    mode: 'daily',
    customDays: 14,
    digestHour: DIGEST_HOUR,
    eventsHour: DIGEST_HOUR,
    memberIds: [],
    lastDigestOn: null,
    lastHolidayOn: null,
    lastMilestoneOn: null,
    lastTomorrowOn: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function patchChat(chatId: number, patch: (chat: ChatRecord) => void): Promise<ChatRecord | undefined> {
  return withTransaction(async (client) => {
    const chat = await loadChat(client, chatId);
    if (!chat) {
      return undefined;
    }
    patch(chat);
    chat.updatedAt = nowIso();
    await insertChat(client, chat);
    return chat;
  });
}

export async function jsonImportStamp(): Promise<string | null> {
  const result = await query<{ value: string }>('SELECT value FROM app_meta WHERE key = $1', [JSON_IMPORT_FLAG]);
  return result.rows[0]?.value ?? null;
}

export async function getAdminChatId(): Promise<number | null> {
  const result = await query<{ value: string }>('SELECT value FROM app_meta WHERE key = $1', ['admin_chat_id']);
  const stored = result.rows[0] ? Number(result.rows[0].value) : NaN;
  if (Number.isFinite(stored)) {
    return stored;
  }
  return config.adminChatId ?? null;
}

export async function setAdminChatId(chatId: number): Promise<PendingFeedback[]> {
  return withTransaction(async (client) => {
    await client.query(
      `
      INSERT INTO app_meta (key, value) VALUES ('admin_chat_id', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `,
      [String(chatId)],
    );
    const pending = await client.query<FeedbackRow>('SELECT * FROM pending_feedback ORDER BY id');
    await client.query('DELETE FROM pending_feedback');
    return pending.rows.map(mapFeedback);
  });
}

export async function findUserByUsername(username: string): Promise<UserRecord | undefined> {
  const needle = username.replace(/^@/, '').trim().toLowerCase();
  if (!needle) {
    return undefined;
  }
  const result = await query<UserRow>(
    `
    SELECT * FROM users
    WHERE lower(regexp_replace(coalesce(username, ''), '^@', '')) = $1
    ORDER BY updated_at DESC
    LIMIT 1
    `,
    [needle],
  );
  const row = result.rows[0];
  return row ? mapUser(row) : undefined;
}

export async function getUser(telegramId: number): Promise<UserRecord | undefined> {
  const result = await query<UserRow>('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  const row = result.rows[0];
  return row ? mapUser(row) : undefined;
}

export function digestEveryDays(chat: ChatRecord): number {
  switch (chat.mode) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'custom':
      return normalizeCustomDays(chat.customDays);
    case 'never':
      return Number.POSITIVE_INFINITY;
  }
}

export async function listChats(): Promise<ChatRecord[]> {
  const result = await query<ChatRow>(`${CHAT_SELECT} ORDER BY c.chat_id`);
  return result.rows.map(mapChat);
}

export async function getChat(chatId: number): Promise<ChatRecord | undefined> {
  const result = await query<ChatRow>(`${CHAT_SELECT} WHERE c.chat_id = $1`, [chatId]);
  const row = result.rows[0];
  return row ? mapChat(row) : undefined;
}

/** Telegram upgrades group → supergroup; old id must be replaced in storage. */
export async function migrateChatId(fromId: number, toId: number): Promise<void> {
  if (fromId === toId) {
    return;
  }
  await withTransaction(async (client) => {
    const from = await loadChat(client, fromId);
    if (!from) {
      return;
    }
    const to = await loadChat(client, toId);
    const timestamp = nowIso();
    if (to) {
      to.memberIds = [...new Set([...to.memberIds, ...from.memberIds])];
      if (!to.lastDigestOn && from.lastDigestOn) {
        to.lastDigestOn = from.lastDigestOn;
      }
      if (!to.lastHolidayOn && from.lastHolidayOn) {
        to.lastHolidayOn = from.lastHolidayOn;
      }
      if (!to.lastMilestoneOn && from.lastMilestoneOn) {
        to.lastMilestoneOn = from.lastMilestoneOn;
      }
      if (!to.lastTomorrowOn && from.lastTomorrowOn) {
        to.lastTomorrowOn = from.lastTomorrowOn;
      }
      to.digestHour = normalizeDigestHour(to.digestHour ?? from.digestHour);
      to.eventsHour = normalizeDigestHour(to.eventsHour ?? from.eventsHour);
      to.updatedAt = timestamp;
      await insertChat(client, to);
      await client.query('DELETE FROM chats WHERE chat_id = $1', [fromId]);
    } else {
      from.chatId = toId;
      from.updatedAt = timestamp;
      await client.query('UPDATE chats SET chat_id = $2, updated_at = $3 WHERE chat_id = $1', [
        fromId,
        toId,
        timestamp,
      ]);
    }

    await client.query(
      `UPDATE app_meta SET value = $2 WHERE key = 'admin_chat_id' AND value = $1`,
      [String(fromId), String(toId)],
    );
  });
}

export async function ensureChat(chatId: number, title: string): Promise<ChatRecord> {
  return withTransaction(async (client) => {
    const existing = await loadChat(client, chatId);
    const timestamp = nowIso();
    if (existing) {
      if (title && existing.title !== title) {
        existing.title = title;
        existing.updatedAt = timestamp;
        await insertChat(client, existing);
      }
      return existing;
    }

    const chat = blankChat(chatId, title, timestamp);
    await insertChat(client, chat);
    return chat;
  });
}

export async function addChatMember(chatId: number, title: string, telegramId: number): Promise<void> {
  await ensureChat(chatId, title);
  await patchChat(chatId, (chat) => {
    if (title) {
      chat.title = title;
    }
    if (!chat.memberIds.includes(telegramId)) {
      chat.memberIds.push(telegramId);
    }
  });
}

export async function removeChatMembers(chatId: number, telegramIds: number[]): Promise<void> {
  if (telegramIds.length === 0) {
    return;
  }
  const drop = new Set(telegramIds);
  await patchChat(chatId, (chat) => {
    chat.memberIds = chat.memberIds.filter((id) => !drop.has(id));
  });
}

export async function setChatDigest(
  chatId: number,
  title: string,
  mode: DigestMode,
  customDays?: number,
): Promise<ChatRecord> {
  await ensureChat(chatId, title);
  return (
    (await patchChat(chatId, (chat) => {
      chat.mode = mode;
      if (title) {
        chat.title = title;
      }
      if (mode === 'custom' && customDays !== undefined) {
        chat.customDays = customDays;
      }
    })) ?? (await ensureChat(chatId, title))
  );
}

export async function setChatDigestHour(chatId: number, title: string, hour: number): Promise<ChatRecord> {
  await ensureChat(chatId, title);
  const normalized = normalizeDigestHour(hour);
  return (
    (await patchChat(chatId, (chat) => {
      chat.digestHour = normalized;
      if (title) {
        chat.title = title;
      }
    })) ?? (await ensureChat(chatId, title))
  );
}

export async function setChatEventsHour(chatId: number, title: string, hour: number): Promise<ChatRecord> {
  await ensureChat(chatId, title);
  const normalized = normalizeDigestHour(hour);
  return (
    (await patchChat(chatId, (chat) => {
      chat.eventsHour = normalized;
      if (title) {
        chat.title = title;
      }
    })) ?? (await ensureChat(chatId, title))
  );
}

export async function markChatDigest(chatId: number, day: string): Promise<void> {
  await patchChat(chatId, (chat) => {
    chat.lastDigestOn = day;
  });
}

export async function markChatHoliday(chatId: number, day: string): Promise<void> {
  await patchChat(chatId, (chat) => {
    chat.lastHolidayOn = day;
  });
}

export async function markChatMilestone(chatId: number, day: string): Promise<void> {
  await patchChat(chatId, (chat) => {
    chat.lastMilestoneOn = day;
  });
}

export async function markChatTomorrow(chatId: number, day: string): Promise<void> {
  await patchChat(chatId, (chat) => {
    chat.lastTomorrowOn = day;
  });
}

export async function upsertUser(input: {
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
}): Promise<UserRecord> {
  return withTransaction(async (client) => {
    const existing = await loadUser(client, input.telegramId);
    const timestamp = nowIso();
    const user: UserRecord = existing
      ? {
          ...existing,
          username: input.username === undefined ? existing.username : input.username,
          firstName: input.firstName?.trim() || existing.firstName,
          userName: typeof existing.userName === 'string' ? existing.userName : '',
          partnerName: typeof existing.partnerName === 'string' ? existing.partnerName : '',
          events: normalizeEvents(existing.events),
          updatedAt: timestamp,
        }
      : {
          telegramId: input.telegramId,
          username: input.username ?? null,
          firstName: input.firstName?.trim() || 'друг',
          userName: '',
          partnerName: '',
          enlistmentDate: null,
          demobilizationDate: null,
          events: emptyEvents(),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
    await writeUser(client, user);
    return user;
  });
}

export async function saveUser(user: UserRecord): Promise<UserRecord> {
  const next = { ...user, updatedAt: nowIso(), events: normalizeEvents(user.events) };
  await withTransaction(async (client) => {
    await writeUser(client, next);
  });
  return next;
}

export async function clearUserData(telegramId: number): Promise<UserRecord | undefined> {
  return withTransaction(async (client) => {
    const existing = await loadUser(client, telegramId);
    if (!existing) {
      return undefined;
    }
    const timestamp = nowIso();
    const user: UserRecord = {
      telegramId: existing.telegramId,
      username: existing.username,
      firstName: existing.firstName,
      userName: '',
      partnerName: '',
      enlistmentDate: null,
      demobilizationDate: null,
      events: emptyEvents(),
      createdAt: existing.createdAt,
      updatedAt: timestamp,
    };
    await writeUser(client, user);
    await client.query('DELETE FROM chat_members WHERE telegram_id = $1', [telegramId]);
    return user;
  });
}

export async function seedKnownEvents(): Promise<void> {
  await query(
    `
    INSERT INTO app_meta (key, value) VALUES ('known_events', $1)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `,
    [JSON.stringify(KNOWN_EVENTS)],
  );
}

export async function addPendingFeedback(feedback: PendingFeedback): Promise<void> {
  await query(
    `
    INSERT INTO pending_feedback (from_id, from_name, from_username, kind, body, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [feedback.fromId, feedback.fromName, feedback.fromUsername, feedback.kind, feedback.text, feedback.createdAt],
  );
}

function userFromJson(key: string, value: unknown): UserRecord {
  const record = asRecord(value);
  if (!record) {
    throw new Error(`В store.json пользователь ${key} записан не объектом`);
  }
  const telegramId = asFiniteNumber(record.telegramId) ?? asFiniteNumber(key);
  if (telegramId === null) {
    throw new Error(`В store.json у пользователя ${key} нет telegramId`);
  }
  const timestamp = nowIso();
  return {
    telegramId,
    username: asText(record.username),
    firstName: asText(record.firstName)?.trim() || 'друг',
    userName: asText(record.userName) ?? '',
    partnerName: asText(record.partnerName) ?? '',
    enlistmentDate: asText(record.enlistmentDate),
    demobilizationDate: asText(record.demobilizationDate),
    events: normalizeEvents(record.events),
    createdAt: asText(record.createdAt) ?? timestamp,
    updatedAt: asText(record.updatedAt) ?? timestamp,
  };
}

function chatFromJson(key: string, value: unknown): ChatRecord {
  const record = asRecord(value);
  if (!record) {
    throw new Error(`В store.json чат ${key} записан не объектом`);
  }
  const chatId = asFiniteNumber(record.chatId) ?? asFiniteNumber(key);
  if (chatId === null) {
    throw new Error(`В store.json у чата ${key} нет chatId`);
  }
  const timestamp = nowIso();
  const memberIds = Array.isArray(record.memberIds)
    ? record.memberIds.map(asFiniteNumber).filter((id): id is number => id !== null)
    : [];
  const digestHour = normalizeDigestHour(record.digestHour);
  return normalizeChat({
    chatId,
    title: asText(record.title) ?? '',
    mode: normalizeMode(record.mode),
    customDays: typeof record.customDays === 'number' && Number.isFinite(record.customDays) ? Math.trunc(record.customDays) : 14,
    digestHour,
    eventsHour: normalizeDigestHour(record.eventsHour ?? digestHour),
    memberIds: [...new Set(memberIds)],
    lastDigestOn: asText(record.lastDigestOn),
    lastHolidayOn: asText(record.lastHolidayOn),
    lastMilestoneOn: asText(record.lastMilestoneOn),
    lastTomorrowOn: asText(record.lastTomorrowOn),
    createdAt: asText(record.createdAt) ?? timestamp,
    updatedAt: asText(record.updatedAt) ?? timestamp,
  });
}

function feedbackFromJson(value: unknown, index: number): PendingFeedback {
  const record = asRecord(value);
  if (!record) {
    throw new Error(`В store.json отзыв ${index} записан не объектом`);
  }
  const fromId = asFiniteNumber(record.fromId);
  if (fromId === null) {
    throw new Error(`В store.json у отзыва ${index} нет fromId`);
  }
  return {
    fromId,
    fromName: asText(record.fromName) ?? '',
    fromUsername: asText(record.fromUsername),
    kind: asText(record.kind) ?? 'idea',
    text: asText(record.text) ?? '',
    createdAt: asText(record.createdAt) ?? nowIso(),
  };
}

export async function importJsonStore(raw: unknown): Promise<ImportResult> {
  const data = asRecord(raw);
  if (!data) {
    throw new Error('store.json должен быть объектом');
  }
  const usersRaw = asRecord(data.users) ?? {};
  const chatsRaw = asRecord(data.chats) ?? {};
  const feedbackRaw = Array.isArray(data.pendingFeedback) ? data.pendingFeedback : [];
  const users = Object.entries(usersRaw).map(([key, value]) => userFromJson(key, value));
  const chats = Object.entries(chatsRaw).map(([key, value]) => chatFromJson(key, value));
  const feedback = feedbackRaw.map((item, index) => feedbackFromJson(item, index));
  const adminChatId = asFiniteNumber(data.adminChatId);

  return withTransaction(async (client) => {
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, [JSON_IMPORT_FLAG]);
    const existing = await client.query<{ value: string }>('SELECT value FROM app_meta WHERE key = $1', [
      JSON_IMPORT_FLAG,
    ]);
    const stamp = existing.rows[0]?.value;
    if (stamp) {
      return { status: 'already', at: stamp };
    }

    for (const user of users) {
      await writeUser(client, user);
    }
    for (const chat of chats) {
      await insertChat(client, chat);
    }
    for (const item of feedback) {
      await client.query(
        `
        INSERT INTO pending_feedback (from_id, from_name, from_username, kind, body, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [item.fromId, item.fromName, item.fromUsername, item.kind, item.text, item.createdAt],
      );
    }
    if (adminChatId !== null) {
      await client.query(
        `
        INSERT INTO app_meta (key, value) VALUES ('admin_chat_id', $1)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `,
        [String(adminChatId)],
      );
    }
    if (data.knownEvents !== undefined && data.knownEvents !== null) {
      await client.query(
        `
        INSERT INTO app_meta (key, value) VALUES ('known_events', $1)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `,
        [JSON.stringify(data.knownEvents)],
      );
    }

    const importedAt = nowIso();
    await client.query('INSERT INTO app_meta (key, value) VALUES ($1, $2)', [JSON_IMPORT_FLAG, importedAt]);
    return { status: 'imported', users: users.length, chats: chats.length, feedback: feedback.length };
  });
}
