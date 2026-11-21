import { addDays } from 'date-fns';
import { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard, session } from 'grammy';
import type { Context, SessionFlavor } from 'grammy';
import { randomUUID } from 'node:crypto';

import { channelChatId, config } from './config';
import { deliverChatDigest, deliverChatHolidays, presentChatUsers } from './digest';
import {
  EVENT_NAME_MAX_LENGTH,
  buildDisplayEvents,
  catalogDate,
  defaultEventNames,
  findKnownEvent,
  isBetweenService,
  isBuiltinEventName,
  listableKnownEvents,
  normalizeEventName,
  parseEventWhen,
  savedEventDate,
  type DisplayEvent,
  type SavedEvent,
} from './events';
import {
  demobilizationKeyboard,
  listHourKeyboard,
  listsSettingsKeyboard,
  eventBackKeyboard,
  eventCatalogKeyboard,
  eventsKeyboard,
  feedbackKindKeyboard,
  mainKeyboard,
  settingsBackKeyboard,
  settingsDeleteConfirmKeyboard,
  settingsKeyboard,
  subscribeKeyboard,
  unknownEventKeyboard,
} from './keyboards';
import {
  askFromReply,
  CALENDAR_WORD,
  isExactWord,
  isGroupEventsWord,
  isLeaveDigestPhrase,
  isNewTimerWord,
  isSummaryWord,
  NEAREST_EVENT_WORD,
  NEAREST_EVENTS_WORD,
  parseCalendarAsk,
  parseDigestHourAsk,
  parseFrequencyAsk,
  parseNearestEventAsk,
  parseTimerAsk,
  TIMER_WORD,
  type TimerAsk,
} from './mention';
import { stripParagraphEndPeriods } from './paragraphs';
import { fromIsoDay, parseFullDate, toIsoDay } from './progress';
import {
  addChatMember,
  addPendingFeedback,
  clearUserData,
  ensureChat,
  findUserByUsername,
  getAdminChatId,
  getChat,
  getUser,
  removeChatMembers,
  saveUser,
  setAdminChatId,
  setChatDigest,
  setChatDigestHour,
  setChatEventsHour,
  upsertUser,
  type DigestMode,
  type FeedbackKind,
  type PendingFeedback,
  type UserRecord,
} from './store';
import * as copy from './texts';
import { BTN } from './texts';
import { moscowCalendarToday } from './time';

type Step =
  | 'none'
  | 'enlistment'
  | 'demobilization'
  | 'feedback_text'
  | 'event_pick'
  | 'event_custom'
  | 'event_date'
  | 'event_delete'
  | 'names'
  | 'service_dates';

interface SessionData {
  step: Step;
  feedbackKind?: FeedbackKind;
  pendingEventName?: string;
  pendingEnlistment?: string;
  deleteMessageIds?: number[];
  /** После «Проверить подписку»: даты, затем имена */
  subOnboarding?: boolean;
}

type BotContext = Context & SessionFlavor<SessionData>;

const MENU_BUTTONS = new Set<string>([BTN.term, BTN.holidays, BTN.author, BTN.dates]);
const FEEDBACK_KINDS: FeedbackKind[] = ['liked', 'annoys', 'bug', 'idea'];
const DIGEST_MODES: DigestMode[] = ['daily', 'weekly', 'monthly', 'custom', 'never'];

function emptySession(): SessionData {
  return { step: 'none' };
}

function displayName(ctx: BotContext): string {
  return ctx.from?.first_name?.trim() || 'друг';
}

function currentUser(ctx: BotContext): UserRecord | undefined {
  return ctx.from ? getUser(ctx.from.id) : undefined;
}

function girlName(ctx: BotContext): string {
  return currentUser(ctx)?.userName?.trim() ?? '';
}

function touchUser(ctx: BotContext): UserRecord | undefined {
  if (!ctx.from) {
    return undefined;
  }
  return upsertUser({
    telegramId: ctx.from.id,
    username: ctx.from.username ?? null,
    firstName: ctx.from.first_name,
  });
}

function hasDates(user: UserRecord | undefined): user is UserRecord & {
  enlistmentDate: string;
  demobilizationDate: string;
} {
  return Boolean(user?.enlistmentDate && user.demobilizationDate);
}

function resetStep(ctx: BotContext): void {
  ctx.session.step = 'none';
  ctx.session.feedbackKind = undefined;
  ctx.session.pendingEventName = undefined;
  ctx.session.pendingEnlistment = undefined;
  ctx.session.deleteMessageIds = undefined;
  ctx.session.subOnboarding = undefined;
}

function needsNames(user: UserRecord): boolean {
  return !user.userName?.trim() || !user.partnerName?.trim();
}

async function promptServiceDates(ctx: BotContext): Promise<void> {
  ctx.session.step = 'service_dates';
  await ctx.reply(copy.askServiceDates(girlName(ctx)), {
    parse_mode: 'HTML',
    reply_markup: settingsBackKeyboard(),
  });
}

async function promptNames(ctx: BotContext): Promise<void> {
  ctx.session.step = 'names';
  await ctx.reply(copy.askNames(girlName(ctx)), {
    parse_mode: 'HTML',
    reply_markup: settingsBackKeyboard(),
  });
}

async function continueSubOnboarding(ctx: BotContext): Promise<void> {
  const user = currentUser(ctx);
  if (!user) {
    return;
  }
  if (!hasDates(user)) {
    ctx.session.subOnboarding = true;
    await promptServiceDates(ctx);
    return;
  }
  if (needsNames(user)) {
    ctx.session.subOnboarding = true;
    await promptNames(ctx);
  }
}

async function isSubscribed(ctx: BotContext, userId: number): Promise<'yes' | 'no' | 'error'> {
  if (!config.subscriptionRequired) {
    return 'yes';
  }
  try {
    const member = await ctx.api.getChatMember(channelChatId, userId);
    if (
      member.status === 'creator' ||
      member.status === 'administrator' ||
      member.status === 'member'
    ) {
      return 'yes';
    }
    if (member.status === 'restricted' && member.is_member) {
      return 'yes';
    }
    return 'no';
  } catch (error) {
    const description = error instanceof GrammyError ? error.description : String(error);
    console.error('Не удалось проверить подписку. Бот должен быть администратором канала.', description);
    return 'error';
  }
}

async function rememberAdmin(ctx: BotContext): Promise<void> {
  const from = ctx.from;
  if (!from || from.username?.toLowerCase() !== config.adminUsername) {
    return;
  }

  const pending = setAdminChatId(from.id);
  if (pending.length === 0 || ctx.chat?.type !== 'private') {
    return;
  }

  for (const item of pending) {
    try {
      await ctx.api.sendMessage(from.id, copy.formatFeedbackForAdmin(item), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });
    } catch (error) {
      console.error('Не удалось дослать отзыв админу', error);
      addPendingFeedback(item);
    }
  }
}

async function deliverFeedback(ctx: BotContext, feedback: PendingFeedback): Promise<'sent' | 'queued'> {
  const adminId = getAdminChatId();
  if (!adminId) {
    addPendingFeedback(feedback);
    console.warn(`Нет чата админа @${config.adminUsername}. Пусть напишет боту /start.`);
    return 'queued';
  }

  try {
    await ctx.api.sendMessage(adminId, copy.formatFeedbackForAdmin(feedback), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
    return 'sent';
  } catch (error) {
    console.error('Не удалось отправить отзыв админу', error);
    addPendingFeedback(feedback);
    return 'queued';
  }
}

async function sendGreeting(ctx: BotContext): Promise<void> {
  await ctx.reply(copy.greeting(displayName(ctx)), {
    parse_mode: 'HTML',
    reply_markup: subscribeKeyboard(),
  });
}

async function replyTerm(
  ctx: BotContext,
  user: UserRecord | undefined,
  replyMarkup: Keyboard | InlineKeyboard = mainKeyboard(),
): Promise<void> {
  if (!hasDates(user)) {
    ctx.session.step = 'enlistment';
    ctx.session.pendingEnlistment = undefined;
    await ctx.reply(copy.askEnlistment(girlName(ctx)), { reply_markup: mainKeyboard() });
    return;
  }
  await ctx.reply(copy.termMessage(user), {
    reply_markup: replyMarkup,
    parse_mode: 'HTML',
  });
}

function removableEvents(user: UserRecord): DisplayEvent[] {
  const enlistment = user.enlistmentDate ? fromIsoDay(user.enlistmentDate) : null;
  const demobilization = user.demobilizationDate ? fromIsoDay(user.demobilizationDate) : null;
  return buildDisplayEvents(user.events, enlistment, demobilization, moscowCalendarToday()).filter(
    (event) => event.removable,
  );
}

async function deleteMessages(ctx: BotContext, ids: number[]): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId || ids.length === 0) {
    return;
  }
  for (const messageId of ids) {
    try {
      await ctx.api.deleteMessage(chatId, messageId);
    } catch (error) {
      console.error('Не удалось удалить сообщение со списком событий', error);
    }
  }
}

async function forgetDeleteList(ctx: BotContext): Promise<void> {
  const ids = ctx.session.deleteMessageIds ?? [];
  ctx.session.deleteMessageIds = undefined;
  await deleteMessages(ctx, ids);
}

async function replyEvents(ctx: BotContext, user: UserRecord | undefined): Promise<void> {
  if (!user) {
    return;
  }
  const parts = copy.eventsMessages(user);
  for (let index = 0; index < parts.length; index += 1) {
    const last = index === parts.length - 1;
    await ctx.reply(parts[index], {
      parse_mode: 'HTML',
      reply_markup: last ? eventsKeyboard() : undefined,
    });
  }
}

async function showDeleteList(ctx: BotContext, user: UserRecord): Promise<void> {
  const events = removableEvents(user);
  if (events.length === 0) {
    await forgetDeleteList(ctx);
    if (ctx.session.step === 'event_delete') {
      resetStep(ctx);
    }
    await ctx.reply(copy.nothingToDelete(girlName(ctx)));
    return;
  }
  await forgetDeleteList(ctx);
  ctx.session.step = 'event_delete';
  ctx.session.pendingEventName = undefined;
  const ids: number[] = [];
  const parts = copy.deleteEventsMessages(events);
  for (let index = 0; index < parts.length; index += 1) {
    const last = index === parts.length - 1;
    const sent = await ctx.reply(parts[index], {
      parse_mode: 'HTML',
      reply_markup: last ? eventBackKeyboard() : undefined,
    });
    ids.push(sent.message_id);
  }
  ctx.session.deleteMessageIds = ids;
}

async function showKnownCatalog(ctx: BotContext): Promise<void> {
  ctx.session.step = 'event_pick';
  ctx.session.pendingEventName = undefined;
  const parts = copy.knownEventsMessages();
  for (let index = 0; index < parts.length; index += 1) {
    const last = index === parts.length - 1;
    await ctx.reply(parts[index], {
      parse_mode: 'HTML',
      reply_markup: last ? eventCatalogKeyboard() : undefined,
    });
  }
}

function sameEventName(left: string, right: string): boolean {
  return normalizeEventName(left) === normalizeEventName(right);
}

async function addKnownEvent(ctx: BotContext, user: UserRecord, rawName: string): Promise<void> {
  const known = findKnownEvent(rawName);
  if (!known) {
    await ctx.reply(copy.unknownEvent(girlName(ctx)), { reply_markup: unknownEventKeyboard() });
    return;
  }
  if (!hasDates(user)) {
    resetStep(ctx);
    await ctx.reply(copy.needServiceDates(girlName(ctx)), { reply_markup: mainKeyboard() });
    return;
  }

  const enlistment = fromIsoDay(user.enlistmentDate);
  const demobilization = fromIsoDay(user.demobilizationDate);
  const alreadyDefault = defaultEventNames(enlistment, demobilization).some((name) =>
    sameEventName(name, known.name),
  );
  const alreadyAdded =
    user.events.addedCatalogIds.includes(known.id) ||
    user.events.customEvents.some((event) => sameEventName(event.name, known.name));
  if (alreadyDefault || alreadyAdded) {
    await ctx.reply(copy.eventAlreadyThere(known.name));
    return;
  }
  if (known.kind === 'ask') {
    ctx.session.step = 'event_date';
    ctx.session.pendingEventName = known.name;
    await ctx.reply(copy.askKnownEventDate(known.name), { reply_markup: eventBackKeyboard() });
    return;
  }

  const date = catalogDate(known, enlistment, demobilization);
  if (!date || !isBetweenService(date, enlistment, demobilization)) {
    await ctx.reply(copy.eventOutsideService(girlName(ctx)));
    return;
  }

  const next = saveUser({
    ...user,
    events: {
      ...user.events,
      addedCatalogIds: [...user.events.addedCatalogIds, known.id],
    },
  });
  resetStep(ctx);
  await ctx.reply(copy.eventAdded(known.name), { reply_markup: mainKeyboard() });
  await replyEvents(ctx, next);
}

async function storeSavedEvent(
  ctx: BotContext,
  user: UserRecord,
  name: string,
  when: NonNullable<ReturnType<typeof parseEventWhen>>,
): Promise<void> {
  if (!hasDates(user)) {
    resetStep(ctx);
    await ctx.reply(copy.needServiceDates(girlName(ctx)), { reply_markup: mainKeyboard() });
    return;
  }

  const enlistment = fromIsoDay(user.enlistmentDate);
  const demobilization = fromIsoDay(user.demobilizationDate);
  const saved: SavedEvent = {
    id: randomUUID(),
    name,
    kind: when.kind,
    days: when.kind === 'date' ? undefined : when.days,
    date: when.kind === 'date' ? when.date : undefined,
  };
  const date = savedEventDate(saved, enlistment, demobilization);
  if (!date || !isBetweenService(date, enlistment, demobilization)) {
    await ctx.reply(copy.eventOutsideService(girlName(ctx)), { reply_markup: eventBackKeyboard() });
    return;
  }

  const next = saveUser({
    ...user,
    events: {
      ...user.events,
      customEvents: [...user.events.customEvents, saved],
    },
  });
  resetStep(ctx);
  await ctx.reply(copy.eventAdded(name), { reply_markup: mainKeyboard() });
  await replyEvents(ctx, next);
}

async function saveCustomEvent(ctx: BotContext, user: UserRecord, text: string): Promise<void> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    await ctx.reply(copy.askCustomEvent(), {
      parse_mode: 'HTML',
      reply_markup: eventBackKeyboard(),
    });
    return;
  }
  const name = lines[0];
  const when = parseEventWhen(lines.slice(1).join(' '));
  if (!name || name.length > EVENT_NAME_MAX_LENGTH || !when) {
    await ctx.reply(copy.badEventInput(girlName(ctx)), { reply_markup: eventBackKeyboard() });
    return;
  }
  await storeSavedEvent(ctx, user, name, when);
}

async function saveKnownDate(ctx: BotContext, user: UserRecord, text: string): Promise<void> {
  const name = ctx.session.pendingEventName?.trim();
  const when = parseEventWhen(text);
  if (!name || name.length > EVENT_NAME_MAX_LENGTH || !when) {
    await ctx.reply(copy.badEventInput(girlName(ctx)), { reply_markup: eventBackKeyboard() });
    return;
  }
  await storeSavedEvent(ctx, user, name, when);
}

async function replySettings(ctx: BotContext): Promise<void> {
  resetStep(ctx);
  await ctx.reply(copy.settingsMessage(currentUser(ctx)), {
    parse_mode: 'HTML',
    reply_markup: settingsKeyboard(),
  });
}

function saveDates(user: UserRecord, enlistment: Date, demobilization: Date): UserRecord {
  return saveUser({
    ...user,
    enlistmentDate: toIsoDay(enlistment),
    demobilizationDate: toIsoDay(demobilization),
  });
}

async function handleNamesInput(ctx: BotContext, user: UserRecord, text: string): Promise<void> {
  const pair = copy.splitSlashPair(text);
  if (!pair) {
    await ctx.reply(copy.badNames(girlName(ctx)), { reply_markup: settingsBackKeyboard() });
    return;
  }
  if (!pair.left || !pair.right) {
    await ctx.reply(copy.namesIncomplete(girlName(ctx)), { reply_markup: settingsBackKeyboard() });
    return;
  }
  if (pair.left.length > copy.NAME_MAX_LENGTH || pair.right.length > copy.NAME_MAX_LENGTH) {
    await ctx.reply(copy.namesTooLong(girlName(ctx)), { reply_markup: settingsBackKeyboard() });
    return;
  }

  saveUser({
    ...user,
    userName: pair.left,
    partnerName: pair.right,
  });
  const fromSubOnboarding = ctx.session.subOnboarding;
  resetStep(ctx);
  await ctx.reply(copy.namesSaved(pair.left, pair.right), {
    parse_mode: 'HTML',
    reply_markup: fromSubOnboarding ? mainKeyboard() : settingsKeyboard(),
  });
}

async function handleServiceDatesInput(ctx: BotContext, user: UserRecord, text: string): Promise<void> {
  const pair = copy.splitSlashPair(text);
  if (!pair) {
    await ctx.reply(copy.badServiceDates(girlName(ctx)), { reply_markup: settingsBackKeyboard() });
    return;
  }

  const enlistment = parseFullDate(pair.left);
  const demobilization = parseFullDate(pair.right);
  if (!enlistment || !demobilization) {
    await ctx.reply(copy.badServiceDates(girlName(ctx)), { reply_markup: settingsBackKeyboard() });
    return;
  }
  if (demobilization <= enlistment) {
    await ctx.reply(copy.demobilizationBeforeEnlistment(girlName(ctx)), { reply_markup: settingsBackKeyboard() });
    return;
  }

  const next = saveDates(user, enlistment, demobilization);
  const fromSubOnboarding = ctx.session.subOnboarding;
  const keyboard = fromSubOnboarding ? mainKeyboard() : settingsKeyboard();
  if (fromSubOnboarding && needsNames(next)) {
    await replyTerm(ctx, next, mainKeyboard());
    await promptNames(ctx);
    return;
  }
  resetStep(ctx);
  await replyTerm(ctx, next, keyboard);
}

const OUTGOING_TEXT = new Set(['sendMessage', 'editMessageText', 'answerCallbackQuery']);
const OUTGOING_CAPTION = new Set([
  'sendPhoto',
  'sendAudio',
  'sendDocument',
  'sendVideo',
  'sendAnimation',
  'sendVoice',
  'editMessageCaption',
]);

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(config.botToken);

  bot.api.config.use(async (prev, method, payload, signal) => {
    if (OUTGOING_TEXT.has(method) && 'text' in payload && typeof payload.text === 'string') {
      payload.text = stripParagraphEndPeriods(payload.text);
    }
    if (OUTGOING_CAPTION.has(method) && 'caption' in payload && typeof payload.caption === 'string') {
      payload.caption = stripParagraphEndPeriods(payload.caption);
    }
    return prev(method, payload, signal);
  });

  bot.use(
    session({
      initial: emptySession,
    }),
  );

  bot.use(async (ctx, next) => {
    await rememberAdmin(ctx);
    await next();
  });

  bot.command('start', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      await ctx.reply(copy.groupHello(), { parse_mode: 'HTML' });
      return;
    }

    touchUser(ctx);
    await forgetDeleteList(ctx);
    resetStep(ctx);
    await sendGreeting(ctx);
    if (!ctx.from) {
      return;
    }
    const subscribed = await isSubscribed(ctx, ctx.from.id);
    if (subscribed === 'error') {
      await ctx.reply(copy.subscriptionCheckLater(girlName(ctx)));
      return;
    }
    if (subscribed === 'no') {
      return;
    }
    await continueSubOnboarding(ctx);
  });

  bot.callbackQuery('check_sub', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from || ctx.chat?.type !== 'private') {
      return;
    }

    touchUser(ctx);
    const subscribed = await isSubscribed(ctx, ctx.from.id);
    if (subscribed === 'error') {
      await ctx.reply(copy.subscriptionCheckLater(girlName(ctx)));
      return;
    }
    if (subscribed === 'no') {
      await ctx.reply(copy.needSubscription(girlName(ctx)), { reply_markup: subscribeKeyboard() });
      return;
    }

    await ctx.reply(copy.subscriptionOk(girlName(ctx)), { reply_markup: mainKeyboard() });
    await continueSubOnboarding(ctx);
  });

  bot.on('my_chat_member', async (ctx) => {
    const status = ctx.myChatMember.new_chat_member.status;
    const previous = ctx.myChatMember.old_chat_member.status;
    const chatType = ctx.chat.type;
    if (chatType !== 'group' && chatType !== 'supergroup') {
      return;
    }
    if (status !== 'member' && status !== 'administrator') {
      return;
    }
    ensureChat(ctx.chat.id, chatTitle(ctx));
    const joined = previous === 'left' || previous === 'kicked';
    if (joined) {
      await ctx.reply(copy.groupHello(), { parse_mode: 'HTML' });
    }
  });

  bot.use(async (ctx, next) => {
    if (ctx.chat?.type !== 'private') {
      await next();
      return;
    }
    if (ctx.hasCommand('start') || ctx.callbackQuery?.data === 'check_sub') {
      await next();
      return;
    }
    if (!ctx.from) {
      return;
    }

    const subscribed = await isSubscribed(ctx, ctx.from.id);
    if (subscribed === 'error') {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery();
      }
      await ctx.reply(copy.subscriptionCheckNeedsAdmin(girlName(ctx)));
      return;
    }
    if (subscribed === 'no') {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({ text: 'Сначала подписка на канал', show_alert: true });
      }
      await ctx.reply(copy.needSubscription(girlName(ctx)), { reply_markup: subscribeKeyboard() });
      return;
    }

    await next();
  });

  bot.command(['mydmb', 'srok'], async (ctx) => {
    await showTerm(ctx);
  });

  bot.command('newdmb', async (ctx) => {
    await registerGroupMember(ctx);
  });

  bot.command('list_dmb', async (ctx) => {
    await showGroupSummary(ctx);
  });

  bot.command('list_events', async (ctx) => {
    await showGroupHolidays(ctx);
  });

  bot.command('lists_settings', async (ctx) => {
    await showListsSettings(ctx, String(ctx.match ?? ''));
  });

  bot.command('next_event', async (ctx) => {
    if (ctx.chat?.type === 'private') {
      await showPrivateNearest(ctx);
      return;
    }
    await replyGroupNearest(ctx, { kind: 'self' });
  });

  bot.command('list_next_events', async (ctx) => {
    await showGroupNearestAll(ctx);
  });

  bot.command('calendar', async (ctx) => {
    await showGroupCalendarAll(ctx);
  });

  bot.command('out_dmb', async (ctx) => {
    await leaveGroupDigest(ctx);
  });

  bot.callbackQuery(/^digest:/, async (ctx) => {
    const mode = ctx.callbackQuery.data.slice('digest:'.length);
    if (!ctx.chat || (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup')) {
      await ctx.answerCallbackQuery();
      return;
    }
    if (!(await isGroupAdmin(ctx))) {
      await ctx.answerCallbackQuery({ text: copy.digestAdminsOnlyAlert(), show_alert: true });
      return;
    }
    if (!DIGEST_MODES.includes(mode as DigestMode)) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    if (mode === 'custom') {
      await ctx.reply(copy.digestCustomHint());
      return;
    }
    const title = 'title' in ctx.chat ? ctx.chat.title ?? '' : '';
    const chat = setChatDigest(ctx.chat.id, title, mode as DigestMode);
    await ctx.reply(
      copy.digestSaved(chat.mode, copy.digestIntervalPhrase(chat.mode, chat.customDays), chat.digestHour),
    );
  });

  bot.callbackQuery(/^digest_hour:/, async (ctx) => {
    const raw = ctx.callbackQuery.data.slice('digest_hour:'.length);
    if (!ctx.chat || (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup')) {
      await ctx.answerCallbackQuery();
      return;
    }
    if (!(await isGroupAdmin(ctx))) {
      await ctx.answerCallbackQuery({ text: copy.digestAdminsOnlyAlert(), show_alert: true });
      return;
    }
    const hour = Number(raw);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    const title = 'title' in ctx.chat ? ctx.chat.title ?? '' : '';
    const chat = setChatDigestHour(ctx.chat.id, title, hour);
    await ctx.reply(copy.listDmbHourSaved(chat.digestHour));
  });

  bot.callbackQuery(/^lists_settings:/, async (ctx) => {
    const action = ctx.callbackQuery.data.slice('lists_settings:'.length);
    if (!ctx.chat || (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup')) {
      await ctx.answerCallbackQuery();
      return;
    }
    if (!(await isGroupAdmin(ctx))) {
      await ctx.answerCallbackQuery({ text: copy.digestAdminsOnlyAlert(), show_alert: true });
      return;
    }
    await ctx.answerCallbackQuery();
    const title = 'title' in ctx.chat ? ctx.chat.title ?? '' : '';
    const chat = ensureChat(ctx.chat.id, title);
    if (action === 'dmb_hour') {
      await ctx.reply(copy.listDmbHourSettingsText(chat.digestHour), {
        parse_mode: 'HTML',
        reply_markup: listHourKeyboard('digest_hour'),
      });
      return;
    }
    if (action === 'events_hour') {
      await ctx.reply(copy.listEventsHourSettingsText(chat.eventsHour), {
        parse_mode: 'HTML',
        reply_markup: listHourKeyboard('events_hour'),
      });
    }
  });

  bot.callbackQuery(/^events_hour:/, async (ctx) => {
    const raw = ctx.callbackQuery.data.slice('events_hour:'.length);
    if (!ctx.chat || (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup')) {
      await ctx.answerCallbackQuery();
      return;
    }
    if (!(await isGroupAdmin(ctx))) {
      await ctx.answerCallbackQuery({ text: copy.digestAdminsOnlyAlert(), show_alert: true });
      return;
    }
    const hour = Number(raw);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    const title = 'title' in ctx.chat ? ctx.chat.title ?? '' : '';
    const chat = setChatEventsHour(ctx.chat.id, title, hour);
    await ctx.reply(copy.listEventsHourSaved(chat.eventsHour));
  });

  bot.command('prazdniki', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await forgetDeleteList(ctx);
    resetStep(ctx);
    await replyEvents(ctx, currentUser(ctx));
  });

  bot.command('author', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await forgetDeleteList(ctx);
    resetStep(ctx);
    await ctx.reply(copy.askFeedbackKind(girlName(ctx)), {
      parse_mode: 'HTML',
      reply_markup: feedbackKindKeyboard(),
    });
  });

  bot.command('cancel', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await forgetDeleteList(ctx);
    resetStep(ctx);
    await ctx.reply(copy.cancelled(), { reply_markup: mainKeyboard() });
  });

  bot.callbackQuery(/^fb:/, async (ctx) => {
    const kind = ctx.callbackQuery.data.slice(3);
    await ctx.answerCallbackQuery();
    if (!FEEDBACK_KINDS.includes(kind as FeedbackKind)) {
      return;
    }
    ctx.session.step = 'feedback_text';
    ctx.session.feedbackKind = kind as FeedbackKind;
    await ctx.reply(copy.askFeedbackText(girlName(ctx)), { reply_markup: mainKeyboard() });
  });

  bot.callbackQuery('event:add', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await forgetDeleteList(ctx);
    ctx.session.step = 'event_custom';
    ctx.session.pendingEventName = undefined;
    await ctx.reply(copy.askCustomEvent(), {
      parse_mode: 'HTML',
      reply_markup: eventBackKeyboard(),
    });
  });

  bot.callbackQuery('event:catalog', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await forgetDeleteList(ctx);
    await showKnownCatalog(ctx);
  });

  bot.callbackQuery('settings:names', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await promptNames(ctx);
  });

  bot.callbackQuery('settings:dates', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await promptServiceDates(ctx);
  });

  bot.callbackQuery('settings:delete_data', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await forgetDeleteList(ctx);
    resetStep(ctx);
    await ctx.reply(copy.deleteAllDataConfirm(girlName(ctx)), {
      reply_markup: settingsDeleteConfirmKeyboard(),
    });
  });

  bot.callbackQuery('settings:delete_confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private' || !ctx.from) {
      return;
    }
    await forgetDeleteList(ctx);
    resetStep(ctx);
    clearUserData(ctx.from.id);
    await ctx.reply(copy.deleteAllDataDone(), { reply_markup: mainKeyboard() });
  });

  bot.callbackQuery('settings:back', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await replySettings(ctx);
  });

  bot.callbackQuery('event:add_all', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    const user = currentUser(ctx);
    if (!user) {
      return;
    }
    if (!hasDates(user)) {
      resetStep(ctx);
      await ctx.reply(copy.needServiceDates(girlName(ctx)), { reply_markup: mainKeyboard() });
      return;
    }

    const enlistment = fromIsoDay(user.enlistmentDate);
    const demobilization = fromIsoDay(user.demobilizationDate);
    const defaultNames = defaultEventNames(enlistment, demobilization);
    const addedIds = new Set(user.events.addedCatalogIds);
    const customNames = user.events.customEvents.map((event) => event.name);
    const toAdd: string[] = [];

    for (const known of listableKnownEvents()) {
      if (known.kind === 'ask' || addedIds.has(known.id) || isBuiltinEventName(known.name)) {
        continue;
      }
      if (defaultNames.some((name) => sameEventName(name, known.name))) {
        continue;
      }
      if (customNames.some((name) => sameEventName(name, known.name))) {
        continue;
      }
      const date = catalogDate(known, enlistment, demobilization);
      if (!date || !isBetweenService(date, enlistment, demobilization)) {
        continue;
      }
      toAdd.push(known.id);
      addedIds.add(known.id);
    }

    await forgetDeleteList(ctx);
    if (toAdd.length === 0) {
      await ctx.reply(copy.eventsAllNone());
      await replyEvents(ctx, user);
      return;
    }

    const next = saveUser({
      ...user,
      events: {
        ...user.events,
        addedCatalogIds: [...user.events.addedCatalogIds, ...toAdd],
      },
    });
    resetStep(ctx);
    await ctx.reply(copy.eventsAllAdded(toAdd.length), { reply_markup: mainKeyboard() });
    await replyEvents(ctx, next);
  });

  bot.callbackQuery('event:delete', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    const user = currentUser(ctx);
    if (!user) {
      return;
    }
    await showDeleteList(ctx, user);
  });

  bot.callbackQuery('event:back', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await forgetDeleteList(ctx);
    resetStep(ctx);
    await replyEvents(ctx, currentUser(ctx));
  });

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    const replyFrom = ctx.message.reply_to_message?.from;
    const replyUserId = replyFrom && !replyFrom.is_bot ? replyFrom.id : undefined;

    const timerAsk =
      (replyUserId ? askFromReply(text, [TIMER_WORD], replyUserId) : null) ??
      parseTimerAsk(ctx.message.text, ctx.message.entities);
    if (timerAsk) {
      if (ctx.chat.type === 'private') {
        if (timerAsk.kind === 'self') {
          await showTerm(ctx);
          return;
        }
        await ctx.reply(copy.groupTimerOnlyInChat());
        return;
      }
      await replyGroupTerm(ctx, timerAsk);
      return;
    }

    const nearestAsk =
      (replyUserId ? askFromReply(text, [NEAREST_EVENT_WORD], replyUserId) : null) ??
      parseNearestEventAsk(ctx.message.text, ctx.message.entities);
    if (nearestAsk) {
      if (ctx.chat.type === 'private') {
        if (nearestAsk.kind === 'self') {
          await showPrivateNearest(ctx);
          return;
        }
        await ctx.reply(copy.groupTimerOnlyInChat());
        return;
      }
      await replyGroupNearest(ctx, nearestAsk);
      return;
    }

    if (isExactWord(text, NEAREST_EVENTS_WORD)) {
      await showGroupNearestAll(ctx);
      return;
    }

    const calendarAsk =
      (replyUserId ? askFromReply(text, [CALENDAR_WORD], replyUserId) : null) ??
      parseCalendarAsk(ctx.message.text, ctx.message.entities);
    if (calendarAsk) {
      if (ctx.chat.type === 'private') {
        await ctx.reply(copy.groupFeatureOnly());
        return;
      }
      if (calendarAsk.kind === 'self' && isExactWord(text, CALENDAR_WORD)) {
        await showGroupCalendarAll(ctx);
        return;
      }
      await replyGroupCalendar(ctx, calendarAsk);
      return;
    }

    if (isLeaveDigestPhrase(text)) {
      await leaveGroupDigest(ctx);
      return;
    }

    const hourAsk = parseDigestHourAsk(ctx.message.text);
    if (hourAsk) {
      const raw = hourAsk.hour != null ? `dmb ${hourAsk.hour}` : 'dmb';
      await showListsSettings(ctx, raw);
      return;
    }

    if (isNewTimerWord(text)) {
      await registerGroupMember(ctx);
      return;
    }

    if (isSummaryWord(text)) {
      await showGroupSummary(ctx);
      return;
    }

    if (isGroupEventsWord(text)) {
      await showGroupHolidays(ctx);
      return;
    }

    const frequencyAsk = parseFrequencyAsk(ctx.message.text);
    if (frequencyAsk) {
      const raw = frequencyAsk.never
        ? 'никогда'
        : frequencyAsk.days != null
          ? String(frequencyAsk.days)
          : '';
      await showListsSettings(ctx, raw);
      return;
    }


    if (ctx.chat.type !== 'private') {
      return;
    }
    const user = touchUser(ctx);
    if (!user) {
      return;
    }

    if (text === BTN.cancel) {
      await forgetDeleteList(ctx);
      resetStep(ctx);
      await ctx.reply(copy.cancelled(), { reply_markup: mainKeyboard() });
      return;
    }

    if (MENU_BUTTONS.has(text) && ctx.session.step !== 'none') {
      await forgetDeleteList(ctx);
      resetStep(ctx);
    }

    if (ctx.session.step === 'enlistment') {
      const date = parseFullDate(text);
      if (!date) {
        await ctx.reply(copy.badDate(girlName(ctx)));
        return;
      }
      ctx.session.pendingEnlistment = toIsoDay(date);
      ctx.session.step = 'demobilization';
      await ctx.reply(copy.askDemobilization(girlName(ctx)), { reply_markup: demobilizationKeyboard() });
      return;
    }

    if (ctx.session.step === 'demobilization') {
      await handleDemobilizationInput(ctx, user, text);
      return;
    }

    if (ctx.session.step === 'feedback_text') {
      await handleFeedbackText(ctx, user, text);
      return;
    }

    if (ctx.session.step === 'event_pick') {
      await addKnownEvent(ctx, user, text);
      return;
    }

    if (ctx.session.step === 'event_custom') {
      await saveCustomEvent(ctx, user, text);
      return;
    }

    if (ctx.session.step === 'event_date') {
      await saveKnownDate(ctx, user, text);
      return;
    }

    if (ctx.session.step === 'event_delete') {
      await handleDeleteChoice(ctx, user, text);
      return;
    }

    if (ctx.session.step === 'names') {
      await handleNamesInput(ctx, user, text);
      return;
    }

    if (ctx.session.step === 'service_dates') {
      await handleServiceDatesInput(ctx, user, text);
      return;
    }

    if (text === BTN.term) {
      await replyTerm(ctx, user);
      return;
    }
    if (text === BTN.holidays) {
      await replyEvents(ctx, user);
      return;
    }
    if (text === BTN.author) {
      await ctx.reply(copy.askFeedbackKind(girlName(ctx)), {
        parse_mode: 'HTML',
        reply_markup: feedbackKindKeyboard(),
      });
      return;
    }
    if (text === BTN.dates) {
      await replySettings(ctx);
      return;
    }
  });

  bot.catch((error) => {
    const ctx = error.ctx;
    console.error(`Ошибка в обновлении ${ctx.update.update_id}`);
    if (error.error instanceof GrammyError) {
      console.error('Grammy:', error.error.description);
    } else if (error.error instanceof HttpError) {
      console.error('Сеть:', error.error);
    } else {
      console.error(error.error);
    }
  });

  return bot;
}

async function handleDeleteChoice(ctx: BotContext, user: UserRecord, text: string): Promise<void> {
  const events = removableEvents(user);
  const numbers = copy.parseEventNumbers(text);
  if (!numbers || events.length === 0 || numbers.some((number) => number > events.length)) {
    await ctx.reply(copy.badEventNumbers(girlName(ctx)));
    return;
  }

  const chosen = numbers.map((number) => events[number - 1]);
  const ids = new Set(chosen.map((event) => event.id));
  const next = saveUser({
    ...user,
    events: {
      addedCatalogIds: user.events.addedCatalogIds.filter((id) => !ids.has(id)),
      customEvents: user.events.customEvents.filter((item) => !ids.has(item.id)),
    },
  });
  const listIds = ctx.session.deleteMessageIds ?? [];
  resetStep(ctx);
  await ctx.reply(copy.eventsRemoved(chosen.map((event) => event.name)), {
    reply_markup: mainKeyboard(),
  });
  await deleteMessages(ctx, listIds);
  await replyEvents(ctx, next);
}

async function handleDemobilizationInput(
  ctx: BotContext,
  user: UserRecord,
  text: string,
): Promise<void> {
  const enlistmentIso = ctx.session.pendingEnlistment;
  if (!enlistmentIso) {
    ctx.session.step = 'enlistment';
    await ctx.reply(copy.askEnlistment(girlName(ctx)), { reply_markup: mainKeyboard() });
    return;
  }

  const enlistment = fromIsoDay(enlistmentIso);

  let demobilization: Date | null = null;
  if (text === BTN.days365) {
    demobilization = addDays(enlistment, 365);
  } else if (text === BTN.days547) {
    demobilization = addDays(enlistment, 547);
  } else {
    demobilization = parseFullDate(text);
  }

  if (!demobilization) {
    await ctx.reply(copy.badDate(girlName(ctx)));
    return;
  }
  if (demobilization <= enlistment) {
    await ctx.reply(copy.demobilizationBeforeEnlistment(girlName(ctx)));
    return;
  }

  const next = saveDates(user, enlistment, demobilization);
  resetStep(ctx);
  await replyTerm(ctx, next);
}

async function handleFeedbackText(ctx: BotContext, user: UserRecord, text: string): Promise<void> {
  const kind = ctx.session.feedbackKind;
  if (!kind || !FEEDBACK_KINDS.includes(kind)) {
    await ctx.reply(copy.askFeedbackKind(girlName(ctx)), {
      parse_mode: 'HTML',
      reply_markup: feedbackKindKeyboard(),
    });
    return;
  }
  if (!text) {
    await ctx.reply(copy.askFeedbackText(girlName(ctx)));
    return;
  }
  if (text.length > copy.FEEDBACK_TEXT_LIMIT) {
    await ctx.reply(copy.feedbackTooLong(girlName(ctx)));
    return;
  }
  await deliverFeedback(ctx, {
    fromId: user.telegramId,
    fromName: user.firstName,
    fromUsername: user.username,
    kind,
    text,
    createdAt: new Date().toISOString(),
  });
  resetStep(ctx);
  await ctx.reply(copy.feedbackReply(kind, girlName(ctx)), {
    reply_markup: mainKeyboard(),
  });
}

function chatTitle(ctx: BotContext): string {
  if (ctx.chat && 'title' in ctx.chat) {
    return ctx.chat.title ?? '';
  }
  return '';
}

async function isGroupAdmin(ctx: BotContext): Promise<boolean> {
  if (!ctx.from || !ctx.chat) {
    return false;
  }
  if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
    return false;
  }
  try {
    const member = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    return member.status === 'creator' || member.status === 'administrator';
  } catch (error) {
    console.error('Не проверила права в беседе', error);
    return false;
  }
}

async function connectGroupUser(ctx: BotContext): Promise<UserRecord | undefined> {
  if (!ctx.from || !ctx.chat) {
    return undefined;
  }
  if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
    return undefined;
  }

  const subscribed = await isSubscribed(ctx, ctx.from.id);
  if (subscribed === 'error') {
    await replyHere(ctx, copy.groupSubscriptionCheckFailed());
    return undefined;
  }
  if (subscribed !== 'yes') {
    await replyHere(ctx, copy.groupNeedSubscription());
    return undefined;
  }

  const existing = getUser(ctx.from.id);
  if (!existing) {
    await replyHere(ctx, copy.groupNeedPrivate());
    return undefined;
  }

  return upsertUser({
    telegramId: ctx.from.id,
    username: ctx.from.username ?? null,
    firstName: ctx.from.first_name,
  });
}

async function registerGroupMember(ctx: BotContext): Promise<void> {
  if (ctx.chat?.type === 'private') {
    await ctx.reply(copy.groupFeatureOnly());
    return;
  }
  const user = await connectGroupUser(ctx);
  if (!user || !ctx.chat) {
    return;
  }
  const wasRegistered = getChat(ctx.chat.id)?.memberIds.includes(user.telegramId) ?? false;
  addChatMember(ctx.chat.id, chatTitle(ctx), user.telegramId);
  if (wasRegistered) {
    await replyHere(ctx, copy.groupAlreadyInDigest());
    return;
  }
  await replyHere(ctx, copy.groupJoinedDigest(user));
}

function quoteReply(ctx: BotContext): {
  reply_parameters?: { message_id: number; allow_sending_without_reply: boolean };
} {
  if (!ctx.chat || ctx.chat.type === 'private') {
    return {};
  }
  const messageId = ctx.msg?.message_id;
  if (!messageId) {
    return {};
  }
  return {
    reply_parameters: {
      message_id: messageId,
      allow_sending_without_reply: true,
    },
  };
}

async function replyHere(
  ctx: BotContext,
  text: string,
  extra?: NonNullable<Parameters<BotContext['reply']>[1]>,
): Promise<void> {
  await ctx.reply(text, { ...quoteReply(ctx), ...extra });
}

async function showListsSettings(ctx: BotContext, raw = ''): Promise<void> {
  if (ctx.chat?.type === 'private') {
    await ctx.reply(copy.groupFeatureOnly());
    return;
  }
  if (!ctx.chat || (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup')) {
    return;
  }
  if (!(await isGroupAdmin(ctx))) {
    await ctx.reply(copy.digestAdminsOnly(), { parse_mode: 'HTML' });
    return;
  }

  const title = 'title' in ctx.chat ? ctx.chat.title ?? '' : '';
  const trimmed = raw.trim();
  const lower = trimmed.toLocaleLowerCase('ru');

  const dmbHourOnly = /^(?:dmb|list_dmb)\s+(\d{1,2})$/i.exec(trimmed);
  if (dmbHourOnly) {
    const hour = Number(dmbHourOnly[1]);
    if (hour > 23) {
      await ctx.reply(copy.listHourCustomHint());
      return;
    }
    const chat = setChatDigestHour(ctx.chat.id, title, hour);
    await ctx.reply(copy.listDmbHourSaved(chat.digestHour));
    return;
  }
  if (/^(?:dmb|list_dmb)$/i.test(trimmed)) {
    const chat = ensureChat(ctx.chat.id, title);
    await ctx.reply(copy.listDmbHourSettingsText(chat.digestHour), {
      parse_mode: 'HTML',
      reply_markup: listHourKeyboard('digest_hour'),
    });
    return;
  }

  const eventsHourOnly = /^(?:events|list_events)\s+(\d{1,2})$/i.exec(trimmed);
  if (eventsHourOnly) {
    const hour = Number(eventsHourOnly[1]);
    if (hour > 23) {
      await ctx.reply(copy.listHourCustomHint());
      return;
    }
    const chat = setChatEventsHour(ctx.chat.id, title, hour);
    await ctx.reply(copy.listEventsHourSaved(chat.eventsHour));
    return;
  }
  if (/^(?:events|list_events)$/i.test(trimmed)) {
    const chat = ensureChat(ctx.chat.id, title);
    await ctx.reply(copy.listEventsHourSettingsText(chat.eventsHour), {
      parse_mode: 'HTML',
      reply_markup: listHourKeyboard('events_hour'),
    });
    return;
  }

  if (lower === 'никогда') {
    const chat = setChatDigest(ctx.chat.id, title, 'never');
    await ctx.reply(
      copy.digestSaved(chat.mode, copy.digestIntervalPhrase(chat.mode, chat.customDays), chat.digestHour),
    );
    return;
  }
  if (/^\d+$/.test(trimmed)) {
    const days = Number(trimmed);
    if (days > 365) {
      await ctx.reply(copy.digestCustomHint());
      return;
    }
    if (days === 0) {
      const chat = setChatDigest(ctx.chat.id, title, 'never');
      await ctx.reply(
        copy.digestSaved(chat.mode, copy.digestIntervalPhrase(chat.mode, chat.customDays), chat.digestHour),
      );
      return;
    }
    const chat = setChatDigest(ctx.chat.id, title, 'custom', days);
    await ctx.reply(
      copy.digestSaved(chat.mode, copy.digestIntervalPhrase(chat.mode, chat.customDays), chat.digestHour),
    );
    return;
  }

  const chat = ensureChat(ctx.chat.id, title);
  await ctx.reply(
    copy.listsSettingsText(
      chat.mode,
      copy.digestIntervalPhrase(chat.mode, chat.customDays),
      chat.digestHour,
      chat.eventsHour,
    ),
    {
      parse_mode: 'HTML',
      reply_markup: listsSettingsKeyboard(),
    },
  );
}

async function showPrivateNearest(ctx: BotContext): Promise<void> {
  const user = currentUser(ctx);
  if (!user || !hasDates(user)) {
    await ctx.reply(copy.needDates(girlName(ctx)), { reply_markup: mainKeyboard() });
    return;
  }
  const line = copy.nearestEventMessage(user);
  if (!line) {
    await ctx.reply(copy.groupNoNearestEvent(), { parse_mode: 'HTML', reply_markup: mainKeyboard() });
    return;
  }
  await ctx.reply(line, { parse_mode: 'HTML', reply_markup: mainKeyboard() });
}

async function showGroupNearestAll(ctx: BotContext): Promise<void> {
  if (ctx.chat?.type === 'private') {
    await ctx.reply(copy.groupFeatureOnly());
    return;
  }
  const connected = await connectGroupUser(ctx);
  if (!connected || !ctx.chat) {
    return;
  }
  const present = await presentChatUsers(ctx.api, ctx.chat.id);
  if (!present) {
    await replyHere(ctx, copy.groupNoNearestEvent(), { parse_mode: 'HTML' });
    return;
  }
  const parts = copy.groupNearestEventsMessage(present.users);
  for (const part of parts) {
    await replyHere(ctx, part, { parse_mode: 'HTML' });
  }
}

async function replyGroupNearest(ctx: BotContext, ask: TimerAsk = { kind: 'self' }): Promise<void> {
  const user = await connectGroupUser(ctx);
  if (!user || !ctx.chat) {
    return;
  }

  const target = await resolveTimerTarget(ctx, user, ask);
  if (!target) {
    return;
  }
  if (!hasDates(target)) {
    await replyHere(
      ctx,
      target.telegramId === user.telegramId ? copy.groupNeedDates() : copy.groupTimerNoDates(),
    );
    return;
  }

  await replyHere(ctx, copy.nearestEventForPersonMessage(target), { parse_mode: 'HTML' });
}

async function showGroupCalendarAll(ctx: BotContext): Promise<void> {
  if (ctx.chat?.type === 'private') {
    await ctx.reply(copy.groupFeatureOnly());
    return;
  }
  const connected = await connectGroupUser(ctx);
  if (!connected || !ctx.chat) {
    return;
  }
  const present = await presentChatUsers(ctx.api, ctx.chat.id);
  const users = present?.users ?? [];
  const parts = copy.groupCalendarMonthMessage(users);
  for (const part of parts) {
    await replyHere(ctx, part, { parse_mode: 'HTML' });
  }
}

async function replyGroupCalendar(ctx: BotContext, ask: TimerAsk = { kind: 'self' }): Promise<void> {
  const user = await connectGroupUser(ctx);
  if (!user || !ctx.chat) {
    return;
  }

  const target = await resolveTimerTarget(ctx, user, ask);
  if (!target) {
    return;
  }
  await replyHere(ctx, copy.calendarMonthForPersonMessage(target), { parse_mode: 'HTML' });
}

async function leaveGroupDigest(ctx: BotContext): Promise<void> {
  if (ctx.chat?.type === 'private') {
    await ctx.reply(copy.groupFeatureOnly());
    return;
  }
  const user = await connectGroupUser(ctx);
  if (!user || !ctx.chat) {
    return;
  }
  const chat = getChat(ctx.chat.id);
  if (!chat?.memberIds.includes(user.telegramId)) {
    await replyHere(ctx, copy.groupNotInDigest());
    return;
  }
  removeChatMembers(ctx.chat.id, [user.telegramId]);
  await replyHere(ctx, copy.groupLeftDigest(user));
}

async function showGroupSummary(ctx: BotContext): Promise<void> {
  if (ctx.chat?.type === 'private') {
    await ctx.reply(copy.groupFeatureOnly());
    return;
  }
  const connected = await connectGroupUser(ctx);
  if (!connected || !ctx.chat) {
    return;
  }
  await deliverChatDigest(ctx.api, ctx.chat.id, ctx.msg?.message_id);
}

async function showGroupHolidays(ctx: BotContext): Promise<void> {
  if (ctx.chat?.type === 'private') {
    await ctx.reply(copy.groupFeatureOnly());
    return;
  }
  const connected = await connectGroupUser(ctx);
  if (!connected || !ctx.chat) {
    return;
  }
  await deliverChatHolidays(ctx.api, ctx.chat.id, ctx.msg?.message_id, true);
}

async function showTerm(ctx: BotContext): Promise<void> {
  if (ctx.chat?.type !== 'private') {
    await replyGroupTerm(ctx);
    return;
  }
  await forgetDeleteList(ctx);
  resetStep(ctx);
  await replyTerm(ctx, currentUser(ctx));
}

async function replyGroupTerm(ctx: BotContext, ask: TimerAsk = { kind: 'self' }): Promise<void> {
  const user = await connectGroupUser(ctx);
  if (!user || !ctx.chat) {
    return;
  }

  const target = await resolveTimerTarget(ctx, user, ask);
  if (!target) {
    return;
  }
  if (!hasDates(target)) {
    await replyHere(
      ctx,
      target.telegramId === user.telegramId ? copy.groupNeedDates() : copy.groupTimerNoDates(),
    );
    return;
  }

  const text =
    target.telegramId === user.telegramId ? copy.termMessage(user) : copy.groupTermForPerson(target);
  await replyHere(ctx, text, { parse_mode: 'HTML' });
}

async function resolveTimerTarget(
  ctx: BotContext,
  sender: UserRecord,
  ask: TimerAsk,
): Promise<UserRecord | undefined> {
  if (ask.kind === 'self') {
    return sender;
  }

  const found = ask.kind === 'id' ? getUser(ask.telegramId) : findUserByUsername(ask.username);
  if (!found) {
    await replyHere(ctx, copy.groupTimerUnknown());
    return undefined;
  }
  if (found.telegramId === sender.telegramId) {
    return sender;
  }
  const presence = await memberOfThisChat(ctx, found.telegramId);
  if (presence === 'error') {
    await replyHere(ctx, copy.groupTimerMembershipUnknown());
    return undefined;
  }
  if (presence === 'no') {
    await replyHere(ctx, copy.groupTimerNotInChat());
    return undefined;
  }
  return found;
}

async function memberOfThisChat(
  ctx: BotContext,
  telegramId: number,
): Promise<'yes' | 'no' | 'error'> {
  if (!ctx.chat) {
    return 'error';
  }
  try {
    const member = await ctx.api.getChatMember(ctx.chat.id, telegramId);
    const isMember = 'is_member' in member ? member.is_member : undefined;
    if (member.status === 'creator' || member.status === 'administrator' || member.status === 'member') {
      return 'yes';
    }
    if (member.status === 'restricted' && isMember) {
      return 'yes';
    }
    return 'no';
  } catch (error) {
    const description = error instanceof GrammyError ? error.description.toLowerCase() : String(error).toLowerCase();
    if (
      description.includes('user not found') ||
      description.includes('participant_id_invalid') ||
      description.includes('member not found')
    ) {
      return 'no';
    }
    console.error(`Не проверила, в чате ли ${telegramId}`, error);
    return 'error';
  }
}
