import { addDays } from 'date-fns';
import { Bot, GrammyError, HttpError, session } from 'grammy';
import type { Context, SessionFlavor } from 'grammy';
import { randomUUID } from 'node:crypto';

import { channelChatId, config } from './config';
import { addCustomHoliday, HOLIDAY_NAME_MAX_LENGTH, removeHoliday } from './holidays';
import {
  cancelKeyboard,
  demobilizationKeyboard,
  feedbackKindKeyboard,
  holidaysKeyboard,
  mainKeyboard,
  subscribeKeyboard,
} from './keyboards';
import { fromIsoDay, parseFullDate, parseMonthDay, toIsoDay } from './progress';
import {
  addPendingFeedback,
  getAdminChatId,
  getUser,
  saveUser,
  setAdminChatId,
  upsertUser,
  type FeedbackKind,
  type PendingFeedback,
  type UserRecord,
} from './store';
import * as copy from './texts';
import { BTN } from './texts';

type Step =
  | 'none'
  | 'enlistment'
  | 'demobilization'
  | 'feedback_text'
  | 'holiday_name'
  | 'holiday_date';

interface SessionData {
  step: Step;
  feedbackKind?: FeedbackKind;
  pendingHolidayName?: string;
  pendingEnlistment?: string;
}

type BotContext = Context & SessionFlavor<SessionData>;

const MENU_BUTTONS = new Set<string>([BTN.term, BTN.holidays, BTN.author, BTN.dates]);
const FEEDBACK_KINDS: FeedbackKind[] = ['question', 'idea', 'bug'];

function emptySession(): SessionData {
  return { step: 'none' };
}

function displayName(ctx: BotContext): string {
  return ctx.from?.first_name?.trim() || 'друг';
}

function currentUser(ctx: BotContext): UserRecord | undefined {
  return ctx.from ? getUser(ctx.from.id) : undefined;
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
  ctx.session.pendingHolidayName = undefined;
  ctx.session.pendingEnlistment = undefined;
}

async function isSubscribed(ctx: BotContext, userId: number): Promise<'yes' | 'no' | 'error'> {
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
      await ctx.api.sendMessage(from.id, copy.formatFeedbackForAdmin(item));
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
    await ctx.api.sendMessage(adminId, copy.formatFeedbackForAdmin(feedback));
    return 'sent';
  } catch (error) {
    console.error('Не удалось отправить отзыв админу', error);
    addPendingFeedback(feedback);
    return 'queued';
  }
}

async function sendGreeting(ctx: BotContext): Promise<void> {
  await ctx.reply(copy.greeting(displayName(ctx)), {
    reply_markup: subscribeKeyboard(),
  });
}

async function replyTerm(ctx: BotContext, user: UserRecord | undefined): Promise<void> {
  if (!hasDates(user)) {
    ctx.session.step = 'enlistment';
    ctx.session.pendingEnlistment = undefined;
    await ctx.reply(copy.askEnlistment(), { reply_markup: mainKeyboard() });
    return;
  }
  await ctx.reply(copy.termMessage(user), {
    reply_markup: mainKeyboard(),
    parse_mode: 'HTML',
  });
}

async function replyHolidays(ctx: BotContext, user: UserRecord | undefined): Promise<void> {
  if (!user) {
    return;
  }
  await ctx.reply(copy.holidaysMessage(user), {
    reply_markup: holidaysKeyboard(user.holidays.customHolidays),
  });
}

async function startDateOnboarding(ctx: BotContext): Promise<void> {
  ctx.session.step = 'enlistment';
  ctx.session.pendingEnlistment = undefined;
  const user = currentUser(ctx);
  if (hasDates(user)) {
    await ctx.reply(copy.currentDates(user), { reply_markup: mainKeyboard() });
    return;
  }
  await ctx.reply(copy.askEnlistment(), { reply_markup: mainKeyboard() });
}

function saveDates(user: UserRecord, enlistment: Date, demobilization: Date): UserRecord {
  return saveUser({
    ...user,
    enlistmentDate: toIsoDay(enlistment),
    demobilizationDate: toIsoDay(demobilization),
  });
}

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(config.botToken);

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
      await ctx.reply(copy.groupHello());
      return;
    }

    touchUser(ctx);
    resetStep(ctx);
    await sendGreeting(ctx);
  });

  bot.callbackQuery('check_sub', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from || ctx.chat?.type !== 'private') {
      return;
    }

    touchUser(ctx);
    const subscribed = await isSubscribed(ctx, ctx.from.id);
    if (subscribed === 'error') {
      await ctx.reply(
        'Не могу проверить подписку. Если ты уже подписана — напиши /start чуть позже, я ещё учусь 🤍',
      );
      return;
    }
    if (subscribed === 'no') {
      await ctx.reply(copy.needSubscription(), { reply_markup: subscribeKeyboard() });
      return;
    }

    await ctx.reply(copy.subscriptionOk(), { reply_markup: mainKeyboard() });
  });

  bot.on('my_chat_member', async (ctx) => {
    const status = ctx.myChatMember.new_chat_member.status;
    const chatType = ctx.chat.type;
    if (chatType !== 'group' && chatType !== 'supergroup') {
      return;
    }
    if (status === 'member' || status === 'administrator') {
      await ctx.reply(copy.groupHello());
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
      await ctx.reply(
        'Не могу проверить подписку. Бот должен быть админом канала «Девичья служба».',
      );
      return;
    }
    if (subscribed === 'no') {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({ text: 'Сначала подписка на канал', show_alert: true });
      }
      await ctx.reply(copy.needSubscription(), { reply_markup: subscribeKeyboard() });
      return;
    }

    await next();
  });

  bot.command('srok', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      await replyGroupTerm(ctx);
      return;
    }
    resetStep(ctx);
    await replyTerm(ctx, currentUser(ctx));
  });

  bot.command('ddd', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      await replyGroupTerm(ctx);
      return;
    }
    resetStep(ctx);
    await replyTerm(ctx, currentUser(ctx));
  });

  bot.command('prazdniki', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      return;
    }
    resetStep(ctx);
    await replyHolidays(ctx, currentUser(ctx));
  });

  bot.command('author', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      return;
    }
    resetStep(ctx);
    await ctx.reply(copy.askFeedbackKind(), { reply_markup: feedbackKindKeyboard() });
  });

  bot.command('cancel', async (ctx) => {
    if (ctx.chat?.type !== 'private') {
      return;
    }
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
    await ctx.reply(copy.askFeedbackText(), { reply_markup: mainKeyboard() });
  });

  bot.callbackQuery('holiday:add', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'holiday_name';
    ctx.session.pendingHolidayName = undefined;
    await ctx.reply(copy.askHolidayName(), { reply_markup: cancelKeyboard() });
  });

  bot.callbackQuery(/^holiday:del:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = currentUser(ctx);
    if (!user) {
      return;
    }
    const holidayId = ctx.callbackQuery.data.slice('holiday:del:'.length);
    const removed = user.holidays.customHolidays.find((item) => item.id === holidayId);
    const next = saveUser({
      ...user,
      holidays: removeHoliday(user.holidays, holidayId),
    });
    await ctx.reply(copy.holidayRemoved(removed?.name ?? 'праздник'), {
      reply_markup: mainKeyboard(),
    });
    await replyHolidays(ctx, next);
  });

  bot.on('message:text', async (ctx) => {
    if (ctx.chat.type !== 'private') {
      return;
    }

    const text = ctx.message.text.trim();
    const user = touchUser(ctx);
    if (!user) {
      return;
    }

    if (text === BTN.cancel) {
      resetStep(ctx);
      await ctx.reply(copy.cancelled(), { reply_markup: mainKeyboard() });
      return;
    }

    if (MENU_BUTTONS.has(text) && ctx.session.step !== 'none') {
      resetStep(ctx);
    }

    if (ctx.session.step === 'enlistment') {
      const date = parseFullDate(text);
      if (!date) {
        await ctx.reply(copy.badDate());
        return;
      }
      ctx.session.pendingEnlistment = toIsoDay(date);
      ctx.session.step = 'demobilization';
      await ctx.reply(copy.askDemobilization(), { reply_markup: demobilizationKeyboard() });
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

    if (ctx.session.step === 'holiday_name') {
      const name = text.trim();
      if (!name || name.length > HOLIDAY_NAME_MAX_LENGTH) {
        await ctx.reply(copy.badHolidayName());
        return;
      }
      ctx.session.pendingHolidayName = name;
      ctx.session.step = 'holiday_date';
      await ctx.reply(copy.askHolidayDate(), { reply_markup: cancelKeyboard() });
      return;
    }

    if (ctx.session.step === 'holiday_date') {
      const parsed = parseMonthDay(text);
      const name = ctx.session.pendingHolidayName?.trim();
      if (!parsed || !name) {
        await ctx.reply(copy.badHolidayDate());
        return;
      }
      const next = saveUser({
        ...user,
        holidays: addCustomHoliday(user.holidays, {
          id: randomUUID(),
          name,
          month: parsed.month,
          day: parsed.day,
        }),
      });
      resetStep(ctx);
      await ctx.reply(copy.holidayAdded(name, parsed.month, parsed.day), {
        reply_markup: mainKeyboard(),
      });
      await replyHolidays(ctx, next);
      return;
    }

    if (text === BTN.term) {
      await replyTerm(ctx, user);
      return;
    }
    if (text === BTN.holidays) {
      await replyHolidays(ctx, user);
      return;
    }
    if (text === BTN.author) {
      await ctx.reply(copy.askFeedbackKind(), { reply_markup: feedbackKindKeyboard() });
      return;
    }
    if (text === BTN.dates) {
      await startDateOnboarding(ctx);
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

async function handleDemobilizationInput(
  ctx: BotContext,
  user: UserRecord,
  text: string,
): Promise<void> {
  const enlistmentIso = ctx.session.pendingEnlistment;
  if (!enlistmentIso) {
    ctx.session.step = 'enlistment';
    await ctx.reply(copy.askEnlistment(), { reply_markup: mainKeyboard() });
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
    await ctx.reply(copy.badDate());
    return;
  }
  if (demobilization <= enlistment) {
    await ctx.reply(copy.demobilizationBeforeEnlistment());
    return;
  }

  saveDates(user, enlistment, demobilization);
  resetStep(ctx);
  await ctx.reply(copy.datesSaved(), { reply_markup: mainKeyboard() });
}

async function handleFeedbackText(ctx: BotContext, user: UserRecord, text: string): Promise<void> {
  const kind = ctx.session.feedbackKind ?? 'question';
  await deliverFeedback(ctx, {
    fromId: user.telegramId,
    fromName: user.firstName,
    fromUsername: user.username,
    kind,
    text,
    createdAt: new Date().toISOString(),
  });
  resetStep(ctx);
  await ctx.reply(copy.feedbackReply(kind), {
    reply_markup: mainKeyboard(),
  });
}

async function replyGroupTerm(ctx: BotContext): Promise<void> {
  if (!ctx.from) {
    return;
  }

  const subscribed = await isSubscribed(ctx, ctx.from.id);
  if (subscribed === 'error') {
    await ctx.reply('Не могу проверить подписку. Напиши мне в личку /start.');
    return;
  }
  if (subscribed !== 'yes') {
    await ctx.reply(copy.groupNeedSubscription());
    return;
  }

  const user = getUser(ctx.from.id);
  if (!hasDates(user)) {
    await ctx.reply(copy.groupNeedDates(displayName(ctx)));
    return;
  }

  await ctx.reply(copy.termMessage(user), { parse_mode: 'HTML' });
}
