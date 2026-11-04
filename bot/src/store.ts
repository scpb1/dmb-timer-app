import fs from 'node:fs';
import path from 'node:path';

import { config } from './config';
import { emptyHolidays, type HolidaysStorage } from './holidays';

export interface UserRecord {
  telegramId: number;
  username: string | null;
  firstName: string;
  enlistmentDate: string | null;
  demobilizationDate: string | null;
  holidays: HolidaysStorage;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackKind = 'question' | 'idea' | 'bug';

export interface PendingFeedback {
  fromId: number;
  fromName: string;
  fromUsername: string | null;
  kind: FeedbackKind;
  text: string;
  createdAt: string;
}

interface StoreFile {
  adminChatId: number | null;
  users: Record<string, UserRecord>;
  pendingFeedback: PendingFeedback[];
}

function readFile(): StoreFile {
  try {
    const raw = fs.readFileSync(config.dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreFile>;
    return {
      adminChatId: typeof parsed.adminChatId === 'number' ? parsed.adminChatId : null,
      users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
      pendingFeedback: Array.isArray(parsed.pendingFeedback) ? parsed.pendingFeedback : [],
    };
  } catch {
    return {
      adminChatId: null,
      users: {},
      pendingFeedback: [],
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

export function getUser(telegramId: number): UserRecord | undefined {
  return readFile().users[String(telegramId)];
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
        username: input.username ?? existing.username,
        firstName: input.firstName?.trim() || existing.firstName,
        holidays: existing.holidays ?? emptyHolidays(),
        updatedAt: timestamp,
      }
    : {
        telegramId: input.telegramId,
        username: input.username ?? null,
        firstName: input.firstName?.trim() || 'друг',
        enlistmentDate: null,
        demobilizationDate: null,
        holidays: emptyHolidays(),
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

export function addPendingFeedback(feedback: PendingFeedback): void {
  const data = readFile();
  data.pendingFeedback.push(feedback);
  writeFile(data);
}
