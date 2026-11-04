import { channelUrl } from './config';
import {
  HOLIDAY_NAME_MAX_LENGTH,
  buildDisplayHolidays,
  formatHolidayLine,
  type DisplayHoliday,
} from './holidays';
import { starsLine } from './bars';
import {
  calculateServiceProgress,
  formatDays,
  formatHumanDate,
  fromIsoDay,
  passedHeading,
  remainingHeading,
} from './progress';
import type { FeedbackKind, UserRecord } from './store';
import { format } from 'date-fns';

export const BTN = {
  subscribe: 'Подписаться на канал',
  checkSub: 'Проверить подписку',
  term: '⏳ Срок службы',
  holidays: '📍 События',
  author: '✍🏻 Написать автору',
  dates: '⚙️ Настройки',
  cancel: 'Отмена',
  days365: '365 дней',
  days547: '547 дней',
  addHoliday: 'Добавить праздник',
} as const;

export const FEEDBACK_KIND_LABEL: Record<FeedbackKind, string> = {
  question: 'вопрос',
  idea: 'идея',
  bug: 'ошибка',
};

export function greeting(firstName: string): string {
  const name = firstName.trim() || 'друг';
  return [
    `Привет, ${name}! 🤍`,
    '',
    'Я счётчик ДДД. С моей помощью ты можешь:',
    '– узнать сколько дней прошло с призыва и сколько дней осталось до дембеля,',
    '– отметить армейские события,',
    '– и ещё кое-что находится в разработке.',
    '',
    'Моя создательница – автор канала «Девичья служба». Там она рассказывает, как разрабатывает мобильное приложение для подсчёта дней армии.',
    '',
    '✍🏻 Если у тебя есть идеи, пожелания, критика – пиши мне, я ей обязательно передам!',
    '',
    '❗Подпишись на канал «Девичья служба», чтобы мы могли общаться.',
  ].join('\n');
}

export function needSubscription(): string {
  return 'Похоже, подписки ещё нет. Подпишись на канал «Девичья служба» и нажми «Проверить подписку» ещё раз 🤍';
}

export function subscriptionOk(): string {
  return 'Супер! Есть подписка, спасибо!';
}

export function subscriptionStillOk(): string {
  return 'Всё в порядке, подписка на месте 🤍';
}

export function askEnlistment(): string {
  return 'Чтобы считать дни, напиши дату призыва в формате ДД.ММ.ГГГГ:';
}

export function askDemobilization(): string {
  return 'Теперь напиши дату дембеля – тоже в формате ДД.ММ.ГГГГ, либо выбери количество дней ниже:';
}

export function badDate(): string {
  return 'Не получилось прочитать дату. Напиши так: ДД.ММ.ГГГГ';
}

export function demobilizationBeforeEnlistment(): string {
  return 'Дата дембеля должна быть позже даты призыва. Напиши другую дату или выбери срок кнопкой.';
}

export function datesSaved(): string {
  return 'Отлично, я записала!';
}

export function needDates(): string {
  return 'Сначала укажи даты службы — без них я не могу считать дни.';
}

export function cancelled(): string {
  return 'Ок, отменила.';
}

function formatDotDate(date: Date): string {
  return format(date, 'dd.MM.yyyy');
}

export function termMessage(user: UserRecord): string {
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return needDates();
  }

  const enlistment = fromIsoDay(user.enlistmentDate);
  const demobilization = fromIsoDay(user.demobilizationDate);
  const progress = calculateServiceProgress(enlistment, demobilization);
  const percent =
    progress.phase === 'before'
      ? 0
      : progress.phase === 'after'
        ? 100
        : Math.round(progress.progressPercent);

  const passedDays = progress.phase === 'before' ? 0 : progress.daysPassed;
  const leftDays = progress.phase === 'after' ? 0 : progress.daysLeft;

  return [
    '── Срок службы ────────',
    '',
    `${formatDotDate(enlistment)} – ${formatDotDate(demobilization)}`,
    '',
    starsLine(percent),
    '',
    `<b>${passedHeading(passedDays)}:</b> ${formatDays(passedDays)}`,
    '',
    `<b>${remainingHeading(leftDays)}:</b> ${formatDays(leftDays)}`,
    '────────────────────',
  ].join('\n');
}

export function currentDates(user: UserRecord): string {
  if (!user.enlistmentDate || !user.demobilizationDate) {
    return needDates();
  }

  return [
    'Сейчас стоят такие даты:',
    `Призыв: ${formatHumanDate(fromIsoDay(user.enlistmentDate))}`,
    `Дембель: ${formatHumanDate(fromIsoDay(user.demobilizationDate))}`,
    '',
    'Чтобы поменять, напиши новую дату призыва в формате ДД.ММ.ГГГГ:',
  ].join('\n');
}

export function holidaysMessage(user: UserRecord): string {
  const enlistment = user.enlistmentDate ? fromIsoDay(user.enlistmentDate) : null;
  const demobilization = user.demobilizationDate ? fromIsoDay(user.demobilizationDate) : null;
  const holidays = buildDisplayHolidays(user.holidays, enlistment, demobilization);
  const upcoming = holidays.filter((item) => !item.isPast).slice(0, 12);
  const custom = uniqueCustom(holidays);

  const lines = ['📍 События'];

  if (!enlistment || !demobilization) {
    lines.push('', 'Без дат службы показываю праздники на этот год.');
  }

  if (upcoming.length > 0) {
    lines.push('', 'Ближайшие:');
    for (const holiday of upcoming) {
      lines.push(`• ${formatHolidayLine(holiday)}`);
    }
  } else {
    lines.push('', 'На оставшийся срок праздников нет.');
  }

  if (custom.length > 0) {
    lines.push('', 'Твои:');
    for (const holiday of custom) {
      lines.push(`• ${holiday.day.toString().padStart(2, '0')}.${holiday.month.toString().padStart(2, '0')} — ${holiday.name}`);
    }
  }

  lines.push('', 'Можно добавить свой праздник — день и месяц, как день рождения.');
  return lines.join('\n');
}

function uniqueCustom(holidays: DisplayHoliday[]): DisplayHoliday[] {
  const seen = new Set<string>();
  const result: DisplayHoliday[] = [];
  for (const holiday of holidays) {
    if (!holiday.isCustom || seen.has(holiday.id)) {
      continue;
    }
    seen.add(holiday.id);
    result.push(holiday);
  }
  return result;
}

export function askHolidayName(): string {
  return 'Напиши название праздника, например: День рождения мамы';
}

export function askHolidayDate(): string {
  return 'Теперь дату — день и месяц, например 12.05';
}

export function badHolidayName(): string {
  return `Название не длиннее ${HOLIDAY_NAME_MAX_LENGTH} символов и не должно быть пустым.`;
}

export function badHolidayDate(): string {
  return 'Не получилось прочитать дату. Напиши так: 12.05';
}

export function holidayAdded(name: string, month: number, day: number): string {
  const dd = day.toString().padStart(2, '0');
  const mm = month.toString().padStart(2, '0');
  return `Добавила «${name}» на ${dd}.${mm} 🤍`;
}

export function holidayRemoved(name: string): string {
  return `Убрала «${name}».`;
}

export function askFeedbackKind(): string {
  return 'Что хочешь передать автору?';
}

export function askFeedbackText(_kind?: FeedbackKind): string {
  return 'Теперь напиши, что хочешь сказать:';
}

export function feedbackReply(kind: FeedbackKind): string {
  switch (kind) {
    case 'question':
      return 'Спасибо за вопрос! Моя создательница уже его получила и скоро ответит! 🤍';
    case 'idea':
      return 'Крутая идея! Спасибо за помощь и твой светлый ум. Я уже передала 🤍';
    case 'bug':
      return 'Упс! Я очень рада, что ты сказала об этом. Ты помогаешь делать приложение лучше! Твоё сообщение доставлено 🤍';
  }
}

export function formatFeedbackForAdmin(input: {
  fromName: string;
  fromUsername: string | null;
  fromId: number;
  kind: FeedbackKind;
  text: string;
}): string {
  const username = input.fromUsername ? `@${input.fromUsername}` : 'без username';
  return [
    'Новое сообщение автору',
    `Тип: ${FEEDBACK_KIND_LABEL[input.kind] ?? input.kind}`,
    `От: ${input.fromName} (${username}, id ${input.fromId})`,
    '',
    input.text,
  ].join('\n');
}

export function groupHello(): string {
  return [
    'Я счётчик ДДД 🤍',
    '',
    'Команда /srok покажет срок того, кто её написал.',
    'Сначала напиши мне в личку /start, укажи даты и подпишись на канал.',
  ].join('\n');
}

export function groupNeedPrivate(): string {
  return 'Сначала напиши мне в личку /start — там подписка и даты. Потом повтори /srok здесь.';
}

export function groupNeedDates(firstName: string): string {
  return `${firstName}, у тебя ещё нет дат службы. Напиши мне в личку, я запишу.`;
}

export function groupNeedSubscription(): string {
  return `Чтобы я могла отвечать, подпишись на канал «Девичья служба»: ${channelUrl}`;
}

export function menuHint(): string {
  return 'Можно смотреть срок, праздники или написать автору — кнопки внизу.';
}
