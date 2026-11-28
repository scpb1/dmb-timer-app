import { differenceInCalendarDays } from 'date-fns';
import { GrammyError, type Api } from 'grammy';

import { queuedGetChatMember, queuedSendMessage } from './apiQueue';

import { eventsOnDate, normalizeEventName } from './events';
import { coupleHtml, escapeHtml, usernameTagHtml } from './mention';
import { calculateServiceProgress, fromIsoDay, type ServiceProgress } from './progress';
import {
  digestEveryDays,
  getChat,
  getUser,
  listChats,
  markChatDigest,
  markChatHoliday,
  markChatMilestone,
  markChatTomorrow,
  migrateChatId,
  removeChatMembers,
  type ChatRecord,
  type UserRecord,
} from './store';
import { moscowCalendarToday, moscowDayKey, moscowParts, TOMORROW_EVENING_HOUR } from './time';
import {
  buildTomorrowPreviewLines,
  digestHolidayJoinHint,
  digestListJoinHint,
  groupDemobilizationCelebration,
  groupEnlistmentCelebration,
} from './texts';

export const TELEGRAM_MESSAGE_LIMIT = 4096;

const DIGEST_HEADER = '🪖 <b>Ближайшие дембеля:</b>\n\n';
const DIGEST_ELLIPSIS = '...';

const htmlOptions = {
  parse_mode: 'HTML' as const,
  link_preview_options: { is_disabled: true },
};

interface DigestRow {
  sort: number;
  line: string;
}

function hasDates(user: UserRecord): user is UserRecord & {
  enlistmentDate: string;
  demobilizationDate: string;
} {
  return Boolean(user.enlistmentDate && user.demobilizationDate);
}

function stillMember(status: string, isMember: boolean | undefined): boolean {
  if (status === 'creator' || status === 'administrator' || status === 'member') {
    return true;
  }
  return status === 'restricted' && Boolean(isMember);
}

function supergroupMigrateId(error: unknown): number | null {
  if (!(error instanceof GrammyError)) {
    return null;
  }
  if (!error.description.toLowerCase().includes('upgraded to a supergroup')) {
    return null;
  }
  const params = error.parameters as { migrate_to_chat_id?: number } | undefined;
  const id = params?.migrate_to_chat_id;
  return typeof id === 'number' ? id : null;
}

async function applyChatMigration(oldId: number, error: unknown): Promise<number | null> {
  const nextId = supergroupMigrateId(error);
  if (nextId === null) {
    return null;
  }
  await migrateChatId(oldId, nextId);
  console.log(`Чат ${oldId} мигрировал в супергруппу ${nextId}, id в хранилище обновлён.`);
  return nextId;
}

function isChatGone(error: unknown): boolean {
  if (!(error instanceof GrammyError)) {
    return false;
  }
  const text = error.description.toLowerCase();
  return (
    error.error_code === 403 ||
    text.includes('chat not found') ||
    text.includes('kicked') ||
    text.includes('not a member')
  );
}

function daysUntilDemob(progress: ServiceProgress): number | null {
  if (progress.phase === 'before') {
    return null;
  }
  if (progress.phase === 'after') {
    return progress.daysAfterEnd === 0 ? 0 : null;
  }
  return progress.daysLeft;
}

function rowLine(user: UserRecord, days: number, progress: ServiceProgress): string {
  const label = coupleHtml(user);
  if (days === 0) {
    return `${label}: 🎖️ <b>ДЕМБЕЛЬ</b>`;
  }
  if (progress.phase === 'active' && progress.daysPassed === 0) {
    return `${label}: 💔 <b>ПРИЗЫВ</b>`;
  }
  return `${label}: ${days} ддд`;
}

export function buildDigestRows(users: UserRecord[], today: Date): DigestRow[] {
  const rows: DigestRow[] = [];
  for (const user of users) {
    if (!hasDates(user)) {
      continue;
    }
    const progress = calculateServiceProgress(
      fromIsoDay(user.enlistmentDate),
      fromIsoDay(user.demobilizationDate),
      today,
    );
    const days = daysUntilDemob(progress);
    if (days === null) {
      continue;
    }
    rows.push({ sort: days, line: rowLine(user, days, progress) });
  }
  rows.sort((a, b) => a.sort - b.sort || a.line.localeCompare(b.line, 'ru'));
  return rows;
}

function digestListFooter(): string {
  return `\n\n${digestListJoinHint()}`;
}

export function packDigest(lines: string[]): string {
  if (lines.length === 0) {
    return DIGEST_HEADER.trimEnd();
  }

  const footer = digestListFooter();
  const whole = `${DIGEST_HEADER}${lines.join('\n')}${footer}`;
  if (whole.length <= TELEGRAM_MESSAGE_LIMIT) {
    return whole;
  }

  const tail = `\n${DIGEST_ELLIPSIS}`;
  let count = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const hiddenAfter = lines.length - (index + 1);
    const body = lines.slice(0, index + 1).join('\n');
    const text = `${DIGEST_HEADER}${body}${hiddenAfter > 0 ? tail : ''}${footer}`;
    if (text.length > TELEGRAM_MESSAGE_LIMIT) {
      break;
    }
    count = index + 1;
  }

  if (count === 0) {
    const room = TELEGRAM_MESSAGE_LIMIT - DIGEST_HEADER.length - tail.length - footer.length;
    return `${DIGEST_HEADER}${lines[0].slice(0, Math.max(1, room))}${tail}${footer}`;
  }

  const hiddenAfter = lines.length - count;
  return `${DIGEST_HEADER}${lines.slice(0, count).join('\n')}${hiddenAfter > 0 ? tail : ''}${footer}`;
}

export function buildDigestText(users: UserRecord[], today: Date): string | null {
  const lines = buildDigestRows(users, today).map((row) => row.line);
  if (lines.length === 0) {
    return null;
  }
  return packDigest(lines);
}

const HOLIDAY_INTRO = 'Поздравляю с пройденным событием! 🤍';

const MILESTONE_ENLISTMENT = normalizeEventName('Призыв');
const MILESTONE_DEMOBILIZATION = normalizeEventName('Дембель');

function isMilestoneEvent(name: string): boolean {
  const key = normalizeEventName(name);
  return key === MILESTONE_ENLISTMENT || key === MILESTONE_DEMOBILIZATION;
}

function holidayPersonLine(
  user: UserRecord,
  title: string,
  tagUsername: boolean,
): string {
  const couple = coupleHtml(user);
  const eventTitle = escapeHtml(title.toLocaleLowerCase('ru'));
  const tag = usernameTagHtml(user, tagUsername);
  return `${couple} празднуют <b>${eventTitle}</b>${tag}.`;
}

export function buildMilestoneMessages(users: UserRecord[], today: Date): string[] {
  const messages: string[] = [];
  for (const user of users) {
    const enlistment = user.enlistmentDate ? fromIsoDay(user.enlistmentDate) : null;
    const demobilization = user.demobilizationDate ? fromIsoDay(user.demobilizationDate) : null;
    const names = eventsOnDate(user.events, enlistment, demobilization, today);
    let hasDemob = false;
    let hasEnlistment = false;
    for (const name of names) {
      const key = normalizeEventName(name);
      if (key === MILESTONE_DEMOBILIZATION) {
        hasDemob = true;
      } else if (key === MILESTONE_ENLISTMENT) {
        hasEnlistment = true;
      }
    }
    if (hasEnlistment) {
      messages.push(groupEnlistmentCelebration(user));
    }
    if (hasDemob) {
      messages.push(groupDemobilizationCelebration(user));
    }
  }
  return messages;
}

function packHolidayMessage(text: string): string[] {
  if (text.length <= TELEGRAM_MESSAGE_LIMIT) {
    return [text];
  }
  return [text.slice(0, TELEGRAM_MESSAGE_LIMIT)];
}

export function buildHolidayLines(
  users: UserRecord[],
  today: Date,
  tagUsernames = false,
): string[] {
  const groups = new Map<string, { title: string; people: Map<number, UserRecord> }>();

  for (const user of users) {
    const enlistment = user.enlistmentDate ? fromIsoDay(user.enlistmentDate) : null;
    const demobilization = user.demobilizationDate ? fromIsoDay(user.demobilizationDate) : null;
    for (const name of eventsOnDate(user.events, enlistment, demobilization, today)) {
      if (isMilestoneEvent(name)) {
        continue;
      }
      const key = name.toLocaleLowerCase('ru');
      let group = groups.get(key);
      if (!group) {
        group = { title: name, people: new Map() };
        groups.set(key, group);
      }
      group.people.set(user.telegramId, user);
    }
  }

  if (groups.size === 0) {
    return [];
  }

  const lines: string[] = [];
  const sorted = [...groups.values()].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  for (const group of sorted) {
    const personLines = [...group.people.values()]
      .sort((a, b) => coupleHtml(a).localeCompare(coupleHtml(b), 'ru'))
      .map((user) => holidayPersonLine(user, group.title, tagUsernames));
    lines.push(...personLines);
  }

  const text = [HOLIDAY_INTRO, '', lines.join('\n'), '', digestHolidayJoinHint()].join('\n');
  return packHolidayMessage(text);
}

export function packMessages(lines: string[]): string[] {
  const messages: string[] = [];
  let current: string[] = [];
  let size = 0;

  for (const line of lines) {
    const next = size === 0 ? line.length : size + 1 + line.length;
    if (next > TELEGRAM_MESSAGE_LIMIT && current.length > 0) {
      messages.push(current.join('\n'));
      current = [line.slice(0, TELEGRAM_MESSAGE_LIMIT)];
      size = current[0].length;
      continue;
    }
    const fitted = line.length > TELEGRAM_MESSAGE_LIMIT ? line.slice(0, TELEGRAM_MESSAGE_LIMIT) : line;
    current.push(fitted);
    size = size === 0 ? fitted.length : size + 1 + fitted.length;
  }

  if (current.length > 0) {
    messages.push(current.join('\n'));
  }
  return messages;
}

export function emptyDigestText(): string {
  return [DIGEST_HEADER.trimEnd(), '', 'Пусто', '', digestListJoinHint()].join('\n');
}

export function emptyHolidayText(): string {
  return ['Сегодня ни у кого нет события', '', digestHolidayJoinHint()].join('\n');
}

export interface DigestFit {
  limit: number;
  typicalLine: number;
  typicalUsers: number;
  worstUsernameLine: number;
  worstUsernameUsers: number;
  worstNameLine: number;
  worstNameUsers: number;
}

export function digestFitEstimate(): DigestFit {
  const budget = TELEGRAM_MESSAGE_LIMIT - DIGEST_HEADER.length - `\n${DIGEST_ELLIPSIS}`.length;

  const typical = 'Аня: 128 ддд\n';
  const worstUsername = `${'u'.repeat(32)}: 1000 ддд\n`;
  const worstName = `${'Я'.repeat(64)}: 1000 ддд\n`;

  return {
    limit: TELEGRAM_MESSAGE_LIMIT,
    typicalLine: typical.length,
    typicalUsers: Math.floor(budget / typical.length),
    worstUsernameLine: worstUsername.length,
    worstUsernameUsers: Math.floor(budget / worstUsername.length),
    worstNameLine: worstName.length,
    worstNameUsers: Math.floor(budget / worstName.length),
  };
}

function isDue(lastOn: string | null, intervalDays: number, todayKey: string): boolean {
  if (!lastOn) {
    return true;
  }
  return differenceInCalendarDays(fromIsoDay(todayKey), fromIsoDay(lastOn)) >= intervalDays;
}

async function presentUsers(
  api: Api,
  chat: ChatRecord,
): Promise<{ users: UserRecord[]; chatId: number }> {
  const users: UserRecord[] = [];
  const gone: number[] = [];
  let chatId = chat.chatId;

  for (const telegramId of chat.memberIds) {
    const user = await getUser(telegramId);
    if (!user) {
      gone.push(telegramId);
      continue;
    }

    try {
      const member = await queuedGetChatMember(api, chatId, telegramId);
      const isMember = 'is_member' in member ? member.is_member : undefined;
      if (!stillMember(member.status, isMember)) {
        gone.push(telegramId);
        continue;
      }
    } catch (error) {
      if (isChatGone(error)) {
        throw error;
      }
      const migrated = await applyChatMigration(chatId, error);
      if (migrated !== null) {
        chatId = migrated;
        try {
          const member = await queuedGetChatMember(api, chatId, telegramId);
          const isMember = 'is_member' in member ? member.is_member : undefined;
          if (!stillMember(member.status, isMember)) {
            gone.push(telegramId);
            continue;
          }
        } catch (retryError) {
          if (isChatGone(retryError)) {
            throw retryError;
          }
          console.error(`Не проверила, в чате ли ${telegramId}`, retryError);
        }
      } else {
        console.error(`Не проверила, в чате ли ${telegramId}`, error);
      }
    }

    users.push(user);
  }

  await removeChatMembers(chatId, gone);
  return { users, chatId };
}

async function sendHtml(
  api: Api,
  chatId: number,
  text: string,
  replyToMessageId?: number,
): Promise<void> {
  const opts = {
    ...htmlOptions,
    ...(replyToMessageId
      ? {
          reply_parameters: {
            message_id: replyToMessageId,
            allow_sending_without_reply: true,
          },
        }
      : {}),
  };
  try {
    await queuedSendMessage(api, chatId, text, opts);
  } catch (error) {
    const migrated = await applyChatMigration(chatId, error);
    if (migrated === null) {
      throw error;
    }
    await queuedSendMessage(api, migrated, text, opts);
  }
}

async function chatUsersForDelivery(
  api: Api,
  chatId: number,
): Promise<{ users: UserRecord[]; chatId: number } | null> {
  const chat = await getChat(chatId);
  if (!chat) {
    return null;
  }
  return presentUsers(api, chat);
}

export async function deliverChatHolidays(
  api: Api,
  chatId: number,
  replyToMessageId?: number,
  alwaysReply = false,
): Promise<void> {
  const delivery = await chatUsersForDelivery(api, chatId);
  if (!delivery) {
    if (alwaysReply) {
      await sendHtml(api, chatId, emptyHolidayText(), replyToMessageId);
    }
    return;
  }

  const { users, chatId: effectiveId } = delivery;
  const today = moscowCalendarToday();
  const tagUsernames = replyToMessageId === undefined;
  const milestones = buildMilestoneMessages(users, today);
  for (const message of milestones) {
    await sendHtml(api, effectiveId, message, replyToMessageId);
  }
  const holidayMessages = packMessages(buildHolidayLines(users, today, tagUsernames));
  for (const message of holidayMessages) {
    await sendHtml(api, effectiveId, message, replyToMessageId);
  }
  if (alwaysReply && milestones.length === 0 && holidayMessages.length === 0) {
    await sendHtml(api, effectiveId, emptyHolidayText(), replyToMessageId);
  }
}

export async function presentChatUsers(
  api: Api,
  chatId: number,
): Promise<{ users: UserRecord[]; chatId: number } | null> {
  return chatUsersForDelivery(api, chatId);
}

export async function deliverChatDigest(
  api: Api,
  chatId: number,
  replyToMessageId?: number,
): Promise<void> {
  const delivery = await chatUsersForDelivery(api, chatId);
  if (!delivery) {
    return;
  }

  const { users, chatId: effectiveId } = delivery;
  const today = moscowCalendarToday();
  const digest = buildDigestText(users, today) ?? emptyDigestText();
  await sendHtml(api, effectiveId, digest, replyToMessageId);
}

let ticking = false;

async function runTick(api: Api): Promise<void> {
  const now = new Date();
  const todayKey = moscowDayKey(now);
  const today = moscowCalendarToday(now);

  for (const listed of await listChats()) {
    const chat = await getChat(listed.chatId) ?? listed;
    if (chat.mode === 'never') {
      continue;
    }

    if (chat.lastMilestoneOn !== todayKey) {
      try {
        const { users, chatId: effectiveId } = await presentUsers(api, chat);
        for (const message of buildMilestoneMessages(users, today)) {
          await sendHtml(api, effectiveId, message);
        }
        if (users.length > 0) {
          await markChatMilestone(effectiveId, todayKey);
        }
      } catch (error) {
        console.error(`Вехи в чате ${chat.chatId} не отправились`, error);
        if (isChatGone(error)) {
          await markChatMilestone(chat.chatId, todayKey);
        }
      }
    }

    const digestHour = chat.digestHour;
    const eventsHour = chat.eventsHour ?? digestHour;
    const hourNow = moscowParts(now).hour;

    if (hourNow >= TOMORROW_EVENING_HOUR && chat.lastTomorrowOn !== todayKey) {
      try {
        const { users, chatId: effectiveId } = await presentUsers(api, chat);
        const preview = buildTomorrowPreviewLines(users, today);
        for (const message of preview) {
          await sendHtml(api, effectiveId, message);
        }
        await markChatTomorrow(effectiveId, todayKey);
      } catch (error) {
        console.error(`Напоминание «завтра» в чате ${chat.chatId} не отправилось`, error);
        if (isChatGone(error)) {
          await markChatTomorrow(chat.chatId, todayKey);
        }
      }
    }

    if (hourNow >= eventsHour && chat.lastHolidayOn !== todayKey) {
      try {
        const { users, chatId: effectiveId } = await presentUsers(api, chat);
        const lines = buildHolidayLines(users, today, true);
        for (const message of packMessages(lines)) {
          await sendHtml(api, effectiveId, message);
        }
        if (users.length > 0) {
          await markChatHoliday(effectiveId, todayKey);
        }
      } catch (error) {
        console.error(`Праздники в чате ${chat.chatId} не отправились`, error);
        if (isChatGone(error)) {
          await markChatHoliday(chat.chatId, todayKey);
        }
      }
    }

    const fresh = await getChat(chat.chatId) ?? chat;
    if (hourNow < digestHour) {
      continue;
    }
    if (!isDue(fresh.lastDigestOn, digestEveryDays(fresh), todayKey)) {
      continue;
    }

    try {
      const { users, chatId: effectiveId } = await presentUsers(api, fresh);
      const digest = buildDigestText(users, today);
      if (!digest) {
        if (users.length > 0) {
          await markChatDigest(effectiveId, todayKey);
        }
        continue;
      }
      await sendHtml(api, effectiveId, digest);
      await markChatDigest(effectiveId, todayKey);
    } catch (error) {
      console.error(`Сводка в чате ${fresh.chatId} не отправилась`, error);
      if (isChatGone(error)) {
        await markChatDigest(fresh.chatId, todayKey);
      }
    }
  }
}

export function startGroupScheduler(api: Api): void {
  const tick = (): void => {
    if (ticking) {
      return;
    }
    ticking = true;
    void runTick(api)
      .catch((error: unknown) => {
        console.error('Сводка бесед:', error);
      })
      .finally(() => {
        ticking = false;
      });
  };

  setTimeout(tick, 5_000);
  setInterval(tick, 30_000);
}
