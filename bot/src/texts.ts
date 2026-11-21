import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { withLead, withOneSlot, withThanks, withTrail } from './address';
import { starsLine } from './bars';
import { channelUrl, subscriptionRequired } from './config';
import {
  EVENT_NAME_MAX_LENGTH,
  buildDisplayEvents,
  catalogMessages,
  eventsInCalendarMonth,
  eventsOnDate,
  findNextUpcomingEvent,
  formatEventLine,
  type DisplayEvent,
} from './events';
import { coupleHtml, escapeHtml } from './mention';
import {
  calculateServiceProgress,
  formatClockLines,
  formatDays,
  formatHumanDate,
  fromIsoDay,
  passedHeading,
  remainingHeading,
  serviceTimeBreakdowns,
  type TimeBreakdown,
} from './progress';
import type { DigestMode, FeedbackKind, UserRecord } from './store';
import { DIGEST_HOUR, TOMORROW_EVENING_HOUR, moscowCalendarToday, moscowNow } from './time';
import { personHtml } from './mention';

export const BTN = {
  subscribe: 'Подписаться на канал',
  checkSub: 'Проверить подписку',
  term: '🪖 Срок службы',
  holidays: '📍 События',
  author: '✍🏻 Написать автору',
  dates: '⚙️ Настройки',
  cancel: 'Отмена',
  days365: '365 дней',
  days547: '547 дней',
  addEvent: 'Добавить событие',
  addAllEvents: 'Добавить все праздники',
  otherEvents: 'Посмотреть другие события',
  deleteEvent: 'Удалить праздник',
  addNames: 'Новые имена',
  changeDates: 'Новые даты',
  deleteAllData: 'Удалить все данные',
  deleteAllDataConfirm: 'Да, удалить всё',
  back: 'Назад',
} as const;

export const NAME_MAX_LENGTH = 80;

export const FEEDBACK_TEXT_LIMIT = 3500;

export function greeting(firstName: string): string {
  const name = escapeHtml(firstName.trim() || 'друг');
  const channel = channelQuotedLink();
  return [
    `Привет, ${name}! 🤍`,
    '',
    'Я твоя подружка до заветного дембеля. С моей помощью ты можешь:',
    '– узнать сколько дней прошло с призыва и сколько дней осталось до дембеля,',
    '– отметить армейские события,',
    '– и ещё кое-что находится в разработке.',
    '',
    `Моя создательница – автор канала ${channel}. Там она рассказывает, как разрабатывает мобильное приложение для подсчёта дней армии.`,
    '',
    '✍🏻 Если у тебя есть идеи, пожелания, критика – пиши мне, я ей обязательно передам!',
    '',
    `❗Подпишись на канал ${channel}, чтобы мы могли общаться.`,
    ...(subscriptionRequired
      ? []
      : [
          '',
          boldUnderlineText(
            [
              'БОТ В РЕЖИМЕ ТЕСТИРОВАНИЯ, ПОДПИСКА НЕ ТРЕБУЕТСЯ',
              'Если бот молчит, нажми на кнопку «Проверить подписку»',
            ].join('\n'),
          ),
        ]),
  ].join('\n');
}

export function needSubscription(userName?: string): string {
  return withLead(
    'Похоже, подписки ещё нет. Подпишись на канал «Девичья служба» и нажми «Проверить подписку» ещё раз 🤍',
    userName,
  );
}

export function subscriptionOk(userName?: string): string {
  return withThanks('Супер! Есть подписка, спасибо!', userName);
}

export function subscriptionStillOk(userName?: string): string {
  return withLead('Всё в порядке, подписка на месте 🤍', userName);
}

export function subscriptionCheckLater(userName?: string): string {
  return withLead(
    'Не могу проверить подписку. Если ты уже подписана, напиши /start чуть позже. Я ещё учусь 🤍',
    userName,
  );
}

export function subscriptionCheckNeedsAdmin(userName?: string): string {
  return withLead('Не могу проверить подписку. Бот должен быть админом канала «Девичья служба».', userName);
}

export function groupSubscriptionCheckFailed(): string {
  return 'Не могу проверить подписку. Напиши мне в личку /start.';
}

export function askEnlistment(userName?: string): string {
  return withLead('Чтобы считать дни, напиши дату призыва в формате ДД.ММ.ГГГГ:', userName);
}

export function askDemobilization(userName?: string): string {
  return withLead(
    'Теперь напиши дату дембеля – тоже в формате ДД.ММ.ГГГГ, либо выбери количество дней ниже:',
    userName,
  );
}

export function badDate(userName?: string): string {
  return withLead('Не получилось прочитать дату. Напиши так: ДД.ММ.ГГГГ', userName);
}

export function demobilizationBeforeEnlistment(userName?: string): string {
  return withLead(
    'Дата дембеля должна быть позже даты призыва. Напиши другую дату или выбери срок кнопкой.',
    userName,
  );
}

export function datesSaved(): string {
  return 'Отлично, я записала!';
}

export function needDates(userName?: string): string {
  return withLead('Сначала укажи даты службы. Без них я не могу считать дни.', userName);
}

export function cancelled(): string {
  return 'Ок, отменила.';
}

function formatDotDate(date: Date): string {
  return format(date, 'dd.MM.yyyy');
}

function boldText(text: string): string {
  return `<b>${escapeHtml(text)}</b>`;
}

function boldUnderlineText(text: string): string {
  return `<b><u>${escapeHtml(text)}</u></b>`;
}

function channelQuotedLink(): string {
  return `«<a href="${channelUrl}">Девичья служба</a>»`;
}

function codeText(text: string): string {
  return `<code>${escapeHtml(text)}</code>`;
}

function timeBlock(label: string, breakdown: TimeBreakdown): string[] {
  return [`${boldText(label)}: ${formatDays(breakdown.days)}`, '', ...formatClockLines(breakdown)];
}

export function formatNextEventTeaser(event: DisplayEvent, today: Date): string {
  const name = escapeHtml(event.name.trim() || event.name);
  const date = escapeHtml(format(event.date, 'd MMMM yyyy', { locale: ru }));
  const delta = differenceInCalendarDays(startOfDay(event.date), startOfDay(today));
  if (delta === 0) {
    return `📍 Сегодня: <b>${name}</b> (${date})`;
  }
  if (delta === 1) {
    return `📍 Завтра: <b>${name}</b> (${date})`;
  }
  if (delta > 1) {
    return `📍 Ближайшее: <b>${name}</b> — через ${formatDays(delta)} (${date})`;
  }
  return `📍 Ближайшее: <b>${name}</b> (${date})`;
}

function appendNextEventLine(lines: string[], user: UserRecord, today: Date): void {
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return;
  }
  const enlistment = fromIsoDay(user.enlistmentDate);
  const demobilization = fromIsoDay(user.demobilizationDate);
  const next = findNextUpcomingEvent(user.events, enlistment, demobilization, today);
  if (!next) {
    return;
  }
  lines.push('', formatNextEventTeaser(next, today));
}

export function termMessage(user: UserRecord, now = moscowNow()): string {
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return needDates(user.userName);
  }

  const enlistment = fromIsoDay(user.enlistmentDate);
  const demobilization = fromIsoDay(user.demobilizationDate);
  const progress = calculateServiceProgress(enlistment, demobilization, now);
  const { passed, remaining } = serviceTimeBreakdowns(
    enlistment,
    demobilization,
    now,
    progress.phase,
  );
  const percent =
    progress.phase === 'before' ? 0 : progress.phase === 'after' ? 100 : Math.floor(progress.progressPercent);
  const dates = `${formatDotDate(enlistment)} – ${formatDotDate(demobilization)}`;

  if (progress.phase === 'before') {
    const lines = [`💔 ${boldText('Служба скоро')}`, ''];
    if (progress.daysUntilStart === 1) {
      lines.push('Завтра призыв', '');
    }
    lines.push(...timeBlock('До призыва осталось', remaining));
    appendNextEventLine(lines, user, moscowCalendarToday(now));
    return lines.join('\n');
  }

  if (progress.phase === 'after') {
    const lines = [`🎖️ ${boldText('Служба завершена!')}`, '', dates, '', starsLine(percent), ''];
    if (progress.daysAfterEnd === 0) {
      lines.push('Сегодня дембель', '');
    }
    lines.push(...timeBlock('Прошло с дембеля', passed));
    return lines.join('\n');
  }

  const lines = [`🪖 ${boldText('Срок службы')}`, '', dates, '', starsLine(percent), ''];

  if (progress.daysPassed === 0) {
    lines.push('Сегодня призыв', '');
  }

  const remainingLabel = remainingHeading(remaining.days);
  lines.push(...timeBlock(passedHeading(passed.days), passed), '', ...timeBlock(remainingLabel, remaining));
  if (progress.daysLeft === 1) {
    lines.push('Завтра дембель');
  }
  appendNextEventLine(lines, user, moscowCalendarToday(now));
  return lines.join('\n');
}

export function currentDates(user: UserRecord): string {
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return needDates(user.userName);
  }

  return withLead(
    [
      'Сейчас стоят такие даты:',
      `Призыв: ${formatHumanDate(fromIsoDay(user.enlistmentDate))}`,
      `Дембель: ${formatHumanDate(fromIsoDay(user.demobilizationDate))}`,
      '',
      'Чтобы поменять, напиши новую дату призыва в формате ДД.ММ.ГГГГ:',
    ].join('\n'),
    user.userName,
  );
}

export function eventsMessages(user: UserRecord, now = moscowCalendarToday()): string[] {
  const enlistment = user.enlistmentDate ? fromIsoDay(user.enlistmentDate) : null;
  const demobilization = user.demobilizationDate ? fromIsoDay(user.demobilizationDate) : null;
  const events = buildDisplayEvents(user.events, enlistment, demobilization, now);

  const lines = [`📍 ${boldText('События')}`];
  if (!enlistment || !demobilization) {
    lines.push(
      '',
      escapeHtml('Сначала поставь даты службы. Тогда появятся призыв, дембель и остальные события срока.'),
    );
  } else if (events.length === 0) {
    lines.push('', escapeHtml('На оставшийся срок событий нет.'));
  } else {
    for (const event of events) {
      lines.push('', formatEventLine(event, now));
    }
  }
  return packLines(lines, 4096);
}

function packLines(lines: string[], limit: number): string[] {
  const parts: string[] = [];
  let current = '';
  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (current && next.length > limit) {
      parts.push(current);
      current = line;
      continue;
    }
    current = next;
  }
  if (current) {
    parts.push(current);
  }
  return parts;
}

export function knownEventsMessages(): string[] {
  return catalogMessages().parts;
}

export function askCustomEvent(): string {
  return [
    boldText('Добавить событие'),
    '',
    'Напиши мне название, а строкой ниже дату в формате ДД.ММ.ГГГГ или X ддд или X дпп',
    '',
    `${boldText('Пример:')}`,
    'Название твоего события',
    '01.01.2001 / 100 ддд / 300 дпп',
  ].join('\n');
}

export function askKnownEventDate(name: string): string {
  return `${name} я знаю. Напиши дату: ДД.ММ.ГГГГ или X ддд или X дпп`;
}

export function unknownEvent(userName?: string): string {
  return withLead(
    'Я не знаю такого события, напиши название ещё раз. Либо мы можем создать индивидуальное событие 🤍',
    userName,
  );
}

export function eventAdded(name: string): string {
  return `Добавила «${name}» 🤍`;
}

export function eventAlreadyThere(name: string): string {
  return `«${name}» уже есть.`;
}

export function eventOutsideService(userName?: string): string {
  return withLead(
    'Событие можно поставить только после дня призыва и до дня дембеля. В день призыва, в день дембеля и за этими датами его добавить нельзя.',
    userName,
  );
}

export function eventsAllAdded(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'событий';
  if (!(mod100 >= 11 && mod100 <= 14)) {
    if (mod10 === 1) {
      word = 'событие';
    } else if (mod10 >= 2 && mod10 <= 4) {
      word = 'события';
    }
  }
  return `Добавила ${count} ${word} 🤍`;
}

export function eventsAllNone(): string {
  return 'Новых событий нет. Они уже стоят, либо их день попадает на призыв, на дембель или за эти даты.';
}

export function badEventInput(userName?: string): string {
  return withLead(
    `Название не длиннее ${EVENT_NAME_MAX_LENGTH} символов. Дату напиши так: ДД.ММ.ГГГГ или 50 ддд или 100 дпп.`,
    userName,
  );
}

export function needServiceDates(userName?: string): string {
  return withLead(
    'Сначала поставь даты службы. Без них я не пойму, на какой день ставить событие.',
    userName,
  );
}

export function deleteEventsMessages(events: DisplayEvent[], now = moscowCalendarToday()): string[] {
  const lines = [`📍 ${boldText('Удаление события')}`];
  events.forEach((event, index) => {
    lines.push('', `${index + 1}. ${formatEventLine(event, now)}`);
  });
  lines.push('', escapeHtml('Напиши номер. Можно несколько через запятую.'));
  return packLines(lines, 4096);
}

/** Номера из сообщения. Пробелы не важны: «1,2» и «1, 2» одно и то же. */
export function parseEventNumbers(input: string): number[] | null {
  const compact = input.replace(/\s+/g, '');
  if (!compact) {
    return null;
  }
  const numbers: number[] = [];
  const seen = new Set<number>();
  for (const part of compact.split(',')) {
    if (!part) {
      continue;
    }
    if (!/^\d+$/.test(part)) {
      return null;
    }
    const value = Number(part);
    if (!Number.isSafeInteger(value) || value < 1) {
      return null;
    }
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    numbers.push(value);
  }
  return numbers.length > 0 ? numbers : null;
}

export function badEventNumbers(userName?: string): string {
  return withLead(
    'Не поняла номер. Напиши цифру из списка. Несколько можно через запятую: 1, 2, 3',
    userName,
  );
}

export function nothingToDelete(userName?: string): string {
  return withLead('Пока нечего удалять.', userName);
}

export function eventRemoved(name: string): string {
  return `Удалила событие «${name}».`;
}

export function eventsRemoved(names: string[]): string {
  return names.map((name) => eventRemoved(name)).join('\n');
}

export function settingsMessage(user?: UserRecord, now = moscowNow()): string {
  const lines = [`⚙️ ${boldText('Настройки')}`, ''];
  const status = user ? settingsStatusLine(user, now) : null;
  if (status) {
    lines.push(status, '');
  }
  lines.push('Хочешь изменить данные?');
  return lines.join('\n');
}

export function deleteAllDataConfirm(userName?: string): string {
  return withLead(
    'Удалю имена, даты службы и события. Это нельзя отменить. Точно удалить?',
    userName,
  );
}

export function deleteAllDataDone(userName?: string): string {
  return withLead('Готово, все данные удалила 🤍', userName);
}

function settingsStatusLine(user: UserRecord, now: Date): string | null {
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return null;
  }

  const enlistment = fromIsoDay(user.enlistmentDate);
  const demobilization = fromIsoDay(user.demobilizationDate);
  const progress = calculateServiceProgress(enlistment, demobilization, now);
  const address = escapeHtml(capitalizeWord(user.userName.trim() || 'милая'));
  const loved = partnerPhrase(user.partnerName);
  const enlistmentLabel = formatHumanDate(enlistment);
  const demobilizationLabel = formatHumanDate(demobilization);

  if (progress.phase === 'before') {
    return `${address}, ${loved} уйдёт в армию ${enlistmentLabel}.`;
  }
  if (progress.phase === 'after') {
    return `${address}, ${loved} окончил службу ${demobilizationLabel}.`;
  }
  return `${address}, ${loved} в армии с ${enlistmentLabel} до ${demobilizationLabel}.`;
}

function partnerPhrase(partnerName: string): string {
  const name = partnerName.trim();
  return name ? `твой любимый ${escapeHtml(name)}` : 'твой любимый';
}

function capitalizeWord(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.charAt(0).toLocaleUpperCase('ru') + trimmed.slice(1);
}

export function askNames(userName?: string): string {
  return withLead('Напиши оба имени через косую черту – твоё имя / имя любимого', userName);
}

export function askServiceDates(userName?: string): string {
  return withLead(
    'Напиши даты призыва и дембеля в таком виде: дата призыва / дата дембеля. Формат даты вот такой: ДД.ММ.ГГГГ',
    userName,
  );
}

export function badNames(userName?: string): string {
  return withLead('Напиши оба имени через /. Например, твоё имя / имя любимого', userName);
}

export function namesIncomplete(userName?: string): string {
  return withLead('Нужны оба имени – твоё и имя любимого', userName);
}

export function namesTooLong(userName?: string): string {
  return withLead(`Каждое имя не длиннее ${NAME_MAX_LENGTH} символов.`, userName);
}

export function namesSaved(userName: string, partnerName: string): string {
  const own = userName.trim();
  const loved = partnerName.trim();
  return `Записала: ${escapeHtml(own)} / ${escapeHtml(loved)} 🤍`;
}

export function badServiceDates(userName?: string): string {
  return withLead('Напиши так: ДД.ММ.ГГГГ / ДД.ММ.ГГГГ', userName);
}

export function splitSlashPair(input: string): { left: string; right: string } | null {
  const index = input.indexOf('/');
  if (index === -1) {
    return null;
  }
  return {
    left: input.slice(0, index).trim(),
    right: input.slice(index + 1).trim(),
  };
}

export function askFeedbackKind(userName?: string): string {
  return withTrail(`✍🏻 ${boldText('Написать автору')}\n\nЧто хочешь передать автору?`, userName);
}

export function askFeedbackText(userName?: string): string {
  return withLead('Теперь напиши, что хочешь сказать:', userName);
}

export function feedbackTooLong(userName?: string): string {
  return withLead(`Слишком длинно. Уложись в ${FEEDBACK_TEXT_LIMIT} символов.`, userName);
}

export function feedbackReply(kind: FeedbackKind | string, userName?: string): string {
  switch (kind) {
    case 'liked':
      return likedReply(userName);
    case 'annoys':
      return annoysReply(userName);
    case 'bug':
      return bugReply(userName);
    case 'idea':
      return ideaReply(userName);
    default:
      return 'Передала 🤍';
  }
}

function likedReply(userName?: string): string {
  const plain = 'Рада, что тебе понравилось! Я уже передала весточку счастья создательнице 🤍';
  return withOneSlot(userName, plain, [
    (v) => `${v.lead}, рада, что тебе понравилось! Я уже передала весточку счастья создательнице 🤍`,
    (v) => `Рада, что тебе понравилось, ${v.mid}! Я уже передала весточку счастья создательнице 🤍`,
    (v) => `Рада, что тебе понравилось! ${v.lead}, я уже передала весточку счастья создательнице 🤍`,
    (v) => `Рада, что тебе понравилось! Я уже передала весточку счастья создательнице, ${v.mid} 🤍`,
  ]);
}

function annoysReply(userName?: string): string {
  const plain =
    'Создательница подумает, как можно это исправить. Спасибо, что говоришь об этом! Это важно 🤍';
  return withOneSlot(userName, plain, [
    (v) =>
      `${v.lead}, создательница подумает, как можно это исправить. Спасибо, что говоришь об этом! Это важно 🤍`,
    (v) =>
      `Создательница подумает, как можно это исправить, ${v.mid}. Спасибо, что говоришь об этом! Это важно 🤍`,
    (v) =>
      `Создательница подумает, как можно это исправить. ${v.lead}, спасибо, что говоришь об этом! Это важно 🤍`,
    (v) =>
      `Создательница подумает, как можно это исправить. Спасибо, что говоришь об этом, ${v.mid}! Это важно 🤍`,
  ]);
}

function bugReply(userName?: string): string {
  const plain =
    'Упс! Я очень рада, что ты сказала об этом. Ты помогаешь делать приложение лучше! Твоё сообщение доставлено 🤍';
  return withOneSlot(userName, plain, [
    (v) =>
      `${v.lead}, упс! Я очень рада, что ты сказала об этом. Ты помогаешь делать приложение лучше! Твоё сообщение доставлено 🤍`,
    (v) =>
      `Упс! ${v.lead}, я очень рада, что ты сказала об этом. Ты помогаешь делать приложение лучше! Твоё сообщение доставлено 🤍`,
    (v) =>
      `Упс! Я очень рада, что ты сказала об этом, ${v.mid}. Ты помогаешь делать приложение лучше! Твоё сообщение доставлено 🤍`,
    (v) =>
      `Упс! Я очень рада, что ты сказала об этом. ${v.lead}, ты помогаешь делать приложение лучше! Твоё сообщение доставлено 🤍`,
    (v) =>
      `Упс! Я очень рада, что ты сказала об этом. Ты помогаешь делать приложение лучше! ${v.lead}, твоё сообщение доставлено 🤍`,
    (v) =>
      `Упс! Я очень рада, что ты сказала об этом. Ты помогаешь делать приложение лучше! Твоё сообщение доставлено, ${v.mid} 🤍`,
  ]);
}

function ideaReply(userName?: string): string {
  const plain = 'Крутая идея! Спасибо за помощь и твой светлый ум. Я уже передала 🤍';
  return withOneSlot(userName, plain, [
    (v) => `${v.lead}, крутая идея! Спасибо за помощь и твой светлый ум. Я уже передала 🤍`,
    (v) => `Крутая идея! ${v.lead}, спасибо за помощь и твой светлый ум. Я уже передала 🤍`,
    (v) => `Крутая идея! Спасибо за помощь и твой светлый ум, ${v.mid}. Я уже передала 🤍`,
    (v) => `Крутая идея! Спасибо за помощь и твой светлый ум. ${v.lead}, я уже передала 🤍`,
    (v) => `Крутая идея! Спасибо за помощь и твой светлый ум. Я уже передала, ${v.mid} 🤍`,
  ]);
}

function feedbackLead(kind: FeedbackKind | string, who: string): string {
  switch (kind) {
    case 'liked':
      return `${who} зашло:`;
    case 'annoys':
      return `${who} бесит:`;
    case 'bug':
      return `${who} сообщает о баге:`;
    case 'idea':
      return `${who} предлагает идею:`;
    default:
      return `${who} пишет:`;
  }
}

function unknownUserLabel(kind: FeedbackKind | string): string {
  switch (kind) {
    case 'liked':
      return 'Неопознанному пользователю';
    case 'annoys':
      return 'Неопознанного пользователя';
    default:
      return 'Неопознанный пользователь';
  }
}

function feedbackActor(input: {
  fromUsername: string | null;
  fromId: number;
  kind: FeedbackKind | string;
}): string {
  const id = escapeHtml(String(input.fromId));
  const username = input.fromUsername?.replace(/^@/, '').trim();
  if (username) {
    return `@${escapeHtml(username)} (id ${id})`;
  }
  return `${unknownUserLabel(input.kind)} (id ${id})`;
}

export function formatFeedbackForAdmin(input: {
  fromName: string;
  fromUsername: string | null;
  fromId: number;
  kind: FeedbackKind | string;
  text: string;
}): string {
  const who = feedbackActor(input);
  return [
    `‼️ ${boldText('Новое сообщение')}`,
    '',
    feedbackLead(input.kind, who),
    '',
    `<blockquote>${escapeHtml(input.text.trim())}</blockquote>`,
  ].join('\n');
}

export function digestTimeMsk(hour: number = DIGEST_HOUR): string {
  const safe = Math.min(23, Math.max(0, Math.trunc(hour) || DIGEST_HOUR));
  return `${String(safe).padStart(2, '0')}:00 МСК`;
}

export function nearestEventMessage(user: UserRecord, today = moscowCalendarToday()): string | null {
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return null;
  }
  const enlistment = fromIsoDay(user.enlistmentDate);
  const demobilization = fromIsoDay(user.demobilizationDate);
  const next = findNextUpcomingEvent(user.events, enlistment, demobilization, today);
  if (!next) {
    return null;
  }
  return formatNextEventTeaser(next, today);
}

export function nearestEventForPersonMessage(user: UserRecord, today = moscowCalendarToday()): string {
  const name = personHtml(user);
  const line = nearestEventMessage(user, today);
  if (!line) {
    return `${boldText(name)}\n\nНа срок службы ближайших событий не осталось`;
  }
  return `${boldText(name)}\n\n${line}`;
}

export function groupNearestEventsMessage(users: UserRecord[], today = moscowCalendarToday()): string[] {
  const lines: string[] = [`📍 ${boldText('Ближайшие события')}`, ''];
  const rows: string[] = [];
  for (const user of users) {
    const line = nearestEventMessage(user, today);
    if (!line) {
      continue;
    }
    rows.push(`${coupleHtml(user)}: ${line.replace(/^📍\s*/, '')}`);
  }
  rows.sort((a, b) => a.localeCompare(b, 'ru'));
  if (rows.length === 0) {
    lines.push('На срок службы ближайших событий не осталось');
    return packLines(lines, 4096);
  }
  lines.push(...rows);
  return packLines(lines, 4096);
}

function calendarMonthTitle(monthAnchor: Date): string {
  return format(monthAnchor, 'LLLL yyyy', { locale: ru });
}

function calendarLinesForUser(user: UserRecord, monthAnchor: Date, today: Date): string[] {
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return [];
  }
  const enlistment = fromIsoDay(user.enlistmentDate);
  const demobilization = fromIsoDay(user.demobilizationDate);
  const events = eventsInCalendarMonth(user.events, enlistment, demobilization, monthAnchor, today);
  if (events.length === 0) {
    return [];
  }
  const head = `${coupleHtml(user)}:`;
  const body = events.map((event) => {
    const title = escapeHtml(event.name.trim() || event.name);
    const when = escapeHtml(format(event.date, 'd MMM', { locale: ru }));
    return `  ${when} — <b>${title}</b>`;
  });
  return [head, ...body, ''];
}

export function calendarMonthForPersonMessage(user: UserRecord, today = moscowCalendarToday()): string {
  const monthTitle = calendarMonthTitle(today);
  const lines = [`📅 ${boldText('Календарь')} — ${escapeHtml(monthTitle)}`, ''];
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return lines.concat('Сначала поставь даты службы в личке').join('\n');
  }
  const block = calendarLinesForUser(user, today, today);
  if (block.length === 0) {
    lines.push(`В ${monthTitle.toLocaleLowerCase('ru')} событий нет`);
  } else {
    lines.push(...block);
  }
  return lines.join('\n').trimEnd();
}

export function groupCalendarMonthMessage(users: UserRecord[], today = moscowCalendarToday()): string[] {
  const monthTitle = calendarMonthTitle(today);
  const lines: string[] = [`📅 ${boldText('Календарь')} — ${escapeHtml(monthTitle)}`, ''];
  const blocks: string[][] = [];
  for (const user of users) {
    const block = calendarLinesForUser(user, today, today);
    if (block.length === 0) {
      continue;
    }
    blocks.push(block);
  }
  blocks.sort((a, b) => a[0]?.localeCompare(b[0] ?? '', 'ru') ?? 0);
  if (blocks.length === 0) {
    lines.push(`В ${monthTitle.toLocaleLowerCase('ru')} у сводки событий нет`);
    return packLines(lines, 4096);
  }
  for (const block of blocks) {
    lines.push(...block);
  }
  return packLines(lines, 4096);
}

export function buildTomorrowPreviewLines(users: UserRecord[], today: Date): string[] {
  const tomorrow = startOfDay(addDays(today, 1));
  const messages: string[] = [];
  for (const user of users) {
    if (!user.enlistmentDate || !user.demobilizationDate) {
      continue;
    }
    const enlistment = fromIsoDay(user.enlistmentDate);
    const demobilization = fromIsoDay(user.demobilizationDate);
    const names = eventsOnDate(user.events, enlistment, demobilization, tomorrow);
    if (names.length === 0) {
      continue;
    }
    const who = coupleHtml(user);
    const list = names.map((name) => escapeHtml(name)).join(', ');
    messages.push(`🌙 Завтра у ${who}: <b>${list}</b>`);
  }
  return messages;
}

export function groupHello(): string {
  const digestTime = digestTimeMsk();
  const tomorrowTime = digestTimeMsk(TOMORROW_EVENING_HOUR);
  return [
    `${boldText('Привет, девчата')}! Я ваша верная подружка на период армии 🤍`,
    '',
    `Я могу подсказать ${boldText('каждой')} из вас:`,
    `– срок службы (команда ${codeText('ддд')} или /mydmb);`,
    `– ближайшее событие (${codeText('ближайшее')} или /next_event, ${codeText('ближайшие')} или /list_next_events);`,
    `– календарь на месяц (${codeText('календарь')} или /calendar);`,
    `– дембеля в чате (${codeText('Сводка')} или /list_dmb);`,
    `– события на сегодня (${codeText('События')} или /list_events)`,
    '',
    `✍🏻 Сводку ддд присылаю в настраиваемый час (по умолчанию ${digestTime}). О вехах на завтра напомню вечером около ${tomorrowTime}. Поздравляю с событиями в день!`,
    '',
    `Админы: ${codeText('Частота')} и ${codeText('Время')}, или /lists_settings — настройки автосводки и событий`,
    '',
    `В сводку: личка с датами, затем ${codeText('Новый таймер')} или /newdmb. Выйти: ${codeText('убрать меня')} или /out_dmb`,
    '',
    boldText('Я рада быть здесь!'),
  ].join('\n');
}

export function groupNeedPrivate(): string {
  return 'Сначала напиши мне в личку и укажи даты';
}

function digestNick(user: UserRecord): string {
  return user.firstName.trim() || 'подруга';
}

export function groupJoinedDigest(user: UserRecord): string {
  return `Супер! ${digestNick(user)}, теперь ты появишься в сводке и я смогу тебя поздравить с армейскими событиями 🤍`;
}

export function groupAlreadyInDigest(): string {
  return 'Милая, ты уже зарегистрирована 🤍';
}

export function digestIntervalPhrase(mode: DigestMode, customDays: number): string {
  switch (mode) {
    case 'daily':
      return 'каждый день';
    case 'weekly':
      return 'раз в неделю, каждые 7 дней';
    case 'monthly':
      return 'раз в месяц, каждые 30 дней';
    case 'custom': {
      const days = Math.min(365, Math.max(1, Math.trunc(customDays) || 1));
      return `раз в ${formatDays(days)}`;
    }
    case 'never':
      return 'никогда';
  }
}

export function digestListJoinHint(): string {
  return 'Чтобы попасть в этот список, напиши мне в личку и укажи даты, а затем в этом чате пришли команду Новый таймер или /newdmb';
}

export function digestHolidayJoinHint(): string {
  return 'Чтобы получать поздравления, напиши мне в личку и укажи даты, а затем в этом чате пришли команду Новый таймер или /newdmb';
}

function groupGirlName(user: UserRecord): string {
  return escapeHtml(user.firstName.trim() || 'подруга');
}

export function groupDemobilizationCelebration(user: UserRecord): string {
  const name = groupGirlName(user);
  const username = user.username?.replace(/^@/, '').trim();
  const closing = username
    ? `@${escapeHtml(username)}, счастливого <b>совместного</b> будущего!`
    : `${name}, счастливого <b>совместного</b> будущего!`;
  return [
    '🎖️ <b>ДОЛГОЖДАННЫЙ ДЕМБЕЛЬ</b>',
    '',
    `Любимый отслужил – ${name} дождалась!`,
    '',
    closing,
  ].join('\n');
}

export function groupEnlistmentCelebration(user: UserRecord): string {
  return [
    '💔 <b>ПРИЗЫВ</b>',
    '',
    `${groupGirlName(user)} сегодня отправила любимого на службу`,
    '',
    'Это не повод расстраиваться, ведь таймер наконец-то начал тикать!',
  ].join('\n');
}

export function listsSettingsText(
  mode: DigestMode,
  phrase: string,
  digestHour: number,
  eventsHour: number,
): string {
  const dmbTime = digestTimeMsk(digestHour);
  const eventsTime = digestTimeMsk(eventsHour);
  const scheduleLine =
    mode === 'never'
      ? 'Авторассылки в чат не присылаю — сводку, события, вехи, «завтра»'
      : `Сводку дембелей присылаю ${phrase}, не раньше ${dmbTime}`;
  const eventsLine =
    mode === 'never'
      ? 'События за сегодня, вехи и напоминания не шлю автоматически'
      : `События за сегодня шлю не раньше ${eventsTime}`;
  return [
    scheduleLine,
    eventsLine,
    '',
    `Как часто сводка: ${codeText('Частота Никогда')}, ${codeText('Частота 10')} или /lists_settings никогда, /lists_settings 10`,
    `Час сводки: ${codeText('Время 10')}, /lists_settings dmb 10`,
    `Час событий: /lists_settings events 9`,
    'Кнопки ниже — интервал, часы',
  ].join('\n');
}

export function digestSaved(mode: DigestMode, phrase: string, digestHour: number): string {
  if (mode === 'never') {
    return 'Хорошо. Авторассылки в чат не присылаю. Сводка — Сводка или /list_dmb, события — События или /list_events';
  }
  return `Хорошо. Сводка дембелей будет ${phrase}, не раньше ${digestTimeMsk(digestHour)}`;
}

export function listDmbHourSettingsText(digestHour: number): string {
  return [
    `Сводку дембелей присылаю не раньше ${digestTimeMsk(digestHour)}`,
    '',
    `Напиши час от 0 до 23: ${codeText('Время 10')} или /lists_settings dmb 10`,
  ].join('\n');
}

export function listEventsHourSettingsText(eventsHour: number): string {
  return [
    `События за сегодня шлю не раньше ${digestTimeMsk(eventsHour)}`,
    '',
    'Напиши час от 0 до 23: /lists_settings events 9',
  ].join('\n');
}

export function listDmbHourSaved(hour: number): string {
  return `Хорошо. Сводку дембелей буду слать не раньше ${digestTimeMsk(hour)}`;
}

export function listEventsHourSaved(hour: number): string {
  return `Хорошо. События за сегодня буду слать не раньше ${digestTimeMsk(hour)}`;
}

export function listHourCustomHint(): string {
  return 'Напиши час от 0 до 23. Например /lists_settings dmb 10 или /lists_settings events 9';
}

export function groupLeftDigest(user: UserRecord): string {
  return `${digestNick(user)}, убрала тебя из сводки этого чата. Вернуться — Новый таймер или /newdmb`;
}

export function groupNotInDigest(): string {
  return 'Тебя нет в сводке этой беседы. Чтобы вернуться — Новый таймер или /newdmb';
}

export function groupNoNearestEvent(): string {
  return 'На срок службы ближайших событий не осталось';
}

export function digestCustomHint(): string {
  return 'Напиши число дней. Например «Частота 10» или /lists_settings 10, раз в 10 дней. Можно от 0 до 365.';
}

export function digestAdminsOnly(): string {
  return `Настройки списков меняет ${boldText('только')} администратор беседы`;
}

export function digestAdminsOnlyAlert(): string {
  return 'Настройки списков меняет только администратор беседы';
}

export function groupFeatureOnly(): string {
  return 'Это команда для беседы. Здесь смотри срок через /mydmb.';
}

export function groupNeedDates(): string {
  return 'У тебя ещё нет дат службы. Напиши мне в личку, я запишу.';
}

export function groupTermForPerson(user: UserRecord, now = moscowNow()): string {
  const name = user.firstName.trim() || 'друг';
  return `${boldText(name)}\n\n${termMessage(user, now)}`;
}

export function groupTimerOnlyInChat(): string {
  return 'Чужой срок и события смотри в беседе: «ддд @имя», «ближайшее @имя» или ответь на сообщение этими словами';
}

export function groupTimerUnknown(): string {
  return 'Этого человека я не знаю. Пусть напишет мне в личку /start и поставит даты.';
}

export function groupTimerNotInChat(): string {
  return 'Этого человека нет в чате';
}

export function groupTimerMembershipUnknown(): string {
  return 'Не получилось проверить, состоит ли этот человек в беседе.';
}

export function groupTimerNoDates(): string {
  return 'Дат службы ещё нет. Пусть твоя подруга напишет мне в личку';
}

export function groupNeedSubscription(): string {
  return `Чтобы я могла отвечать, подпишись на канал «Девичья служба»: ${channelUrl}`;
}

export function menuHint(userName?: string): string {
  return withLead('Можно смотреть срок, события или написать автору. Кнопки внизу.', userName);
}
