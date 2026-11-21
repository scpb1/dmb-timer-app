import fs from 'node:fs';
import path from 'node:path';

import { config } from './config';
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

interface StoreFile {
  adminChatId: number | null;
  users: Record<string, UserRecord>;
  pendingFeedback: PendingFeedback[];
  chats: Record<string, ChatRecord>;
  knownEvents: unknown;
}

function readFile(): StoreFile {
  try {
    const raw = fs.readFileSync(config.dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreFile>;
    return {
      adminChatId: typeof parsed.adminChatId === 'number' ? parsed.adminChatId : null,
      users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
      pendingFeedback: Array.isArray(parsed.pendingFeedback) ? parsed.pendingFeedback : [],
      chats: parsed.chats && typeof parsed.chats === 'object' ? parsed.chats : {},
      knownEvents: parsed.knownEvents ?? null,
    };
  } catch {
    return {
      adminChatId: null,
      users: {},
      pendingFeedback: [],
      chats: {},
      knownEvents: null,
    };
  }
}

function writeFile(data: StoreFile): void {
  fs.mkdirSync(path.dirname(config.dataFile), { recursive: true });
  const tempPath = `${config.dataFile}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, config.dataFile);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function getAdminChatId(): number | null {
  return readFile().adminChatId ?? config.adminChatId ?? null;
}

export function setAdminChatId(chatId: number): PendingFeedback[] {
  const data = readFile();
  data.adminChatId = chatId;
  const pending = data.pendingFeedback;
  data.pendingFeedback = [];
  writeFile(data);
  return pending;
}

export function findUserByUsername(username: string): UserRecord | undefined {
  const needle = username.replace(/^@/, '').trim().toLowerCase();
  if (!needle) {
    return undefined;
  }

  let match: UserRecord | undefined;
  for (const raw of Object.values(readFile().users)) {
    const stored = raw.username?.replace(/^@/, '').trim().toLowerCase();
    if (stored !== needle) {
      continue;
    }
    const user = getUser(raw.telegramId);
    if (!user) {
      continue;
    }
    if (!match || user.updatedAt > match.updatedAt) {
      match = user;
    }
  }
  return match;
}

export function getUser(telegramId: number): UserRecord | undefined {
  const user = readFile().users[String(telegramId)];
  if (!user) {
    return undefined;
  }
  return {
    ...user,
    username: user.username ?? null,
    userName: typeof user.userName === 'string' ? user.userName : '',
    partnerName: typeof user.partnerName === 'string' ? user.partnerName : '',
    events: normalizeEvents(user.events),
  };
}

function normalizeDigestHour(value: unknown): number {
  const hour = typeof value === 'number' ? Math.trunc(value) : DIGEST_HOUR;
  if (!Number.isFinite(hour)) {
    return DIGEST_HOUR;
  }
  return Math.min(23, Math.max(0, hour));
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

export function digestEveryDays(chat: ChatRecord): number {
  switch (chat.mode) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'custom': {
      const days = Math.trunc(chat.customDays);
      if (!Number.isFinite(days)) {
        return 14;
      }
      return Math.min(365, Math.max(1, days));
    }
    case 'never':
      return Number.POSITIVE_INFINITY;
  }
}

export function listChats(): ChatRecord[] {
  return Object.values(readFile().chats).map(normalizeChat);
}

function normalizeChat(chat: ChatRecord): ChatRecord {
  const digestHour = normalizeDigestHour(chat.digestHour);
  return {
    ...chat,
    digestHour,
    eventsHour: normalizeDigestHour(chat.eventsHour ?? digestHour),
    lastMilestoneOn: chat.lastMilestoneOn ?? null,
    lastTomorrowOn: chat.lastTomorrowOn ?? null,
  };
}

export function getChat(chatId: number): ChatRecord | undefined {
  const chat = readFile().chats[String(chatId)];
  if (!chat) {
    return undefined;
  }
  return normalizeChat(chat);
}

/** Telegram upgrades group → supergroup; old id must be replaced in storage. */
export function migrateChatId(fromId: number, toId: number): void {
  if (fromId === toId) {
    return;
  }
  const data = readFile();
  const fromKey = String(fromId);
  const toKey = String(toId);
  const chat = data.chats[fromKey];
  if (!chat) {
    return;
  }
  chat.chatId = toId;
  chat.updatedAt = nowIso();
  delete data.chats[fromKey];
  const existing = data.chats[toKey];
  if (existing) {
    existing.memberIds = [...new Set([...existing.memberIds, ...chat.memberIds])];
    if (!existing.lastDigestOn && chat.lastDigestOn) {
      existing.lastDigestOn = chat.lastDigestOn;
    }
    if (!existing.lastHolidayOn && chat.lastHolidayOn) {
      existing.lastHolidayOn = chat.lastHolidayOn;
    }
    if (!existing.lastMilestoneOn && chat.lastMilestoneOn) {
      existing.lastMilestoneOn = chat.lastMilestoneOn;
    }
    if (!existing.lastTomorrowOn && chat.lastTomorrowOn) {
      existing.lastTomorrowOn = chat.lastTomorrowOn;
    }
    if (typeof existing.digestHour !== 'number' && chat.digestHour !== undefined) {
      existing.digestHour = normalizeDigestHour(chat.digestHour);
    }
    if (typeof existing.eventsHour !== 'number' && chat.eventsHour !== undefined) {
      existing.eventsHour = normalizeDigestHour(chat.eventsHour);
    }
    existing.updatedAt = nowIso();
  } else {
    data.chats[toKey] = chat;
  }
  if (data.adminChatId === fromId) {
    data.adminChatId = toId;
  }
  writeFile(data);
}

export function ensureChat(chatId: number, title: string): ChatRecord {
  const data = readFile();
  const key = String(chatId);
  const existing = data.chats[key];
  const timestamp = nowIso();
  if (existing) {
    if (title && existing.title !== title) {
      existing.title = title;
      existing.updatedAt = timestamp;
      writeFile(data);
    }
    return normalizeChat(existing);
  }

  const chat = blankChat(chatId, title, timestamp);
  data.chats[key] = chat;
  writeFile(data);
  return chat;
}

function patchChat(chatId: number, patch: (chat: ChatRecord) => void): ChatRecord | undefined {
  const data = readFile();
  const chat = data.chats[String(chatId)];
  if (!chat) {
    return undefined;
  }
  patch(chat);
  chat.updatedAt = nowIso();
  writeFile(data);
  return chat;
}

export function addChatMember(chatId: number, title: string, telegramId: number): void {
  ensureChat(chatId, title);
  patchChat(chatId, (chat) => {
    if (title) {
      chat.title = title;
    }
    if (!chat.memberIds.includes(telegramId)) {
      chat.memberIds.push(telegramId);
    }
  });
}

export function removeChatMembers(chatId: number, telegramIds: number[]): void {
  if (telegramIds.length === 0) {
    return;
  }
  const drop = new Set(telegramIds);
  patchChat(chatId, (chat) => {
    chat.memberIds = chat.memberIds.filter((id) => !drop.has(id));
  });
}

export function setChatDigest(
  chatId: number,
  title: string,
  mode: DigestMode,
  customDays?: number,
): ChatRecord {
  ensureChat(chatId, title);
  return (
    patchChat(chatId, (chat) => {
      chat.mode = mode;
      if (title) {
        chat.title = title;
      }
      if (mode === 'custom' && customDays !== undefined) {
        chat.customDays = customDays;
      }
    }) ?? ensureChat(chatId, title)
  );
}

export function setChatDigestHour(chatId: number, title: string, hour: number): ChatRecord {
  ensureChat(chatId, title);
  const normalized = normalizeDigestHour(hour);
  return (
    patchChat(chatId, (chat) => {
      chat.digestHour = normalized;
      if (title) {
        chat.title = title;
      }
    }) ?? ensureChat(chatId, title)
  );
}

export function setChatEventsHour(chatId: number, title: string, hour: number): ChatRecord {
  ensureChat(chatId, title);
  const normalized = normalizeDigestHour(hour);
  return (
    patchChat(chatId, (chat) => {
      chat.eventsHour = normalized;
      if (title) {
        chat.title = title;
      }
    }) ?? ensureChat(chatId, title)
  );
}

export function markChatDigest(chatId: number, day: string): void {
  patchChat(chatId, (chat) => {
    chat.lastDigestOn = day;
  });
}

export function markChatHoliday(chatId: number, day: string): void {
  patchChat(chatId, (chat) => {
    chat.lastHolidayOn = day;
  });
}

export function markChatMilestone(chatId: number, day: string): void {
  patchChat(chatId, (chat) => {
    chat.lastMilestoneOn = day;
  });
}

export function markChatTomorrow(chatId: number, day: string): void {
  patchChat(chatId, (chat) => {
    chat.lastTomorrowOn = day;
  });
}

export function upsertUser(input: {
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
}): UserRecord {
  const data = readFile();
  const key = String(input.telegramId);
  const existing = data.users[key];
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

  data.users[key] = user;
  writeFile(data);
  return user;
}

export function saveUser(user: UserRecord): UserRecord {
  const data = readFile();
  const next = { ...user, updatedAt: nowIso() };
  data.users[String(user.telegramId)] = next;
  writeFile(data);
  return next;
}

export function clearUserData(telegramId: number): UserRecord | undefined {
  const data = readFile();
  const key = String(telegramId);
  const existing = data.users[key];
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
  data.users[key] = user;

  for (const chat of Object.values(data.chats)) {
    const before = chat.memberIds.length;
    chat.memberIds = chat.memberIds.filter((id) => id !== telegramId);
    if (chat.memberIds.length !== before) {
      chat.updatedAt = timestamp;
    }
  }

  writeFile(data);
  return {
    ...user,
    events: normalizeEvents(user.events),
  };
}

export function seedKnownEvents(): void {
  const data = readFile();
  data.knownEvents = KNOWN_EVENTS;
  writeFile(data);
}

export function addPendingFeedback(feedback: PendingFeedback): void {
  const data = readFile();
  data.pendingFeedback.push(feedback);
  writeFile(data);
}
