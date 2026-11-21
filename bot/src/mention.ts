export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function personHtml(user: { firstName: string }): string {
  return escapeHtml(user.firstName.trim() || 'друг');
}

export function coupleHtml(user: { userName: string; partnerName: string; firstName: string }): string {
  const girl = user.userName.trim() || user.firstName.trim() || 'подруга';
  const partner = user.partnerName.trim();
  const girlEsc = escapeHtml(girl);
  if (partner) {
    return `${girlEsc} и ${escapeHtml(partner)}`;
  }
  return girlEsc;
}

export function usernameTagHtml(user: { username: string | null }, include: boolean): string {
  if (!include) {
    return '';
  }
  const username = user.username?.replace(/^@/, '').trim();
  if (!username) {
    return '';
  }
  return ` (@${escapeHtml(username)})`;
}

export interface TimerMentionEntity {
  type: string;
  offset: number;
  length: number;
  user?: { id: number };
}

export type TimerAsk =
  | { kind: 'self' }
  | { kind: 'username'; username: string }
  | { kind: 'id'; telegramId: number };

export const TIMER_WORD = 'ддд';
export const NEAREST_EVENT_WORD = 'ближайшее';
export const NEAREST_EVENTS_WORD = 'ближайшие';
export const CALENDAR_WORD = 'календарь';
export const LEAVE_DIGEST_WORDS = ['убрать меня', 'выйти из сводки'] as const;
export const HOUR_WORD = 'время';

export function isExactWord(text: string, word: string): boolean {
  return text.trim().toLocaleLowerCase('ru') === word.toLocaleLowerCase('ru');
}

export function isLeaveDigestPhrase(text: string): boolean {
  const key = text.trim().toLocaleLowerCase('ru');
  return LEAVE_DIGEST_WORDS.some((phrase) => key === phrase);
}

export function parseMentionAsk(
  triggerWord: string,
  text: string,
  entities?: readonly TimerMentionEntity[],
): TimerAsk | null {
  const wordLower = triggerWord.toLocaleLowerCase('ru');
  if (text.trim().toLocaleLowerCase('ru') === wordLower) {
    return { kind: 'self' };
  }

  const leading = text.match(/^\s*/u)?.[0].length ?? 0;
  const word = text.slice(leading, leading + triggerWord.length);
  if (word.toLocaleLowerCase('ru') !== wordLower) {
    return null;
  }

  const afterWord = leading + word.length;
  const gap = text.slice(afterWord);
  if (!/^\s+\S/u.test(gap)) {
    return null;
  }

  const mention = (entities ?? []).find(
    (entity) =>
      (entity.type === 'mention' || entity.type === 'text_mention') && entity.offset >= afterWord,
  );
  if (mention) {
    if (text.slice(afterWord, mention.offset).trim() !== '') {
      return null;
    }
    if (text.slice(mention.offset + mention.length).trim() !== '') {
      return null;
    }
    if (mention.type === 'text_mention') {
      if (!mention.user) {
        return null;
      }
      return { kind: 'id', telegramId: mention.user.id };
    }
    const token = text.slice(mention.offset, mention.offset + mention.length).replace(/^@/, '').trim();
    if (!token) {
      return null;
    }
    return { kind: 'username', username: token };
  }

  const at = gap.trim().match(/^@([A-Za-z0-9_]{5,32})$/u);
  if (!at?.[1]) {
    return null;
  }
  return { kind: 'username', username: at[1] };
}

export function parseTimerAsk(text: string, entities?: readonly TimerMentionEntity[]): TimerAsk | null {
  return parseMentionAsk(TIMER_WORD, text, entities);
}

export function parseNearestEventAsk(text: string, entities?: readonly TimerMentionEntity[]): TimerAsk | null {
  return parseMentionAsk(NEAREST_EVENT_WORD, text, entities);
}

export function parseCalendarAsk(text: string, entities?: readonly TimerMentionEntity[]): TimerAsk | null {
  return parseMentionAsk(CALENDAR_WORD, text, entities);
}

export function askFromReply(text: string, triggerWords: string[], replyUserId: number): TimerAsk | null {
  const trimmed = text.trim().toLocaleLowerCase('ru');
  for (const word of triggerWords) {
    if (trimmed === word.toLocaleLowerCase('ru')) {
      return { kind: 'id', telegramId: replyUserId };
    }
  }
  return null;
}

export function isSummaryWord(text: string): boolean {
  return text.trim().toLocaleLowerCase('ru') === 'сводка';
}

const GROUP_EVENTS_WORD = 'события';

export function isGroupEventsWord(text: string): boolean {
  return text.trim().toLocaleLowerCase('ru') === GROUP_EVENTS_WORD;
}

const NEW_TIMER_WORD = 'новый таймер';

export function isNewTimerWord(text: string): boolean {
  return text.trim().toLocaleLowerCase('ru') === NEW_TIMER_WORD;
}

const FREQUENCY_WORD = 'частота';

export function parseFrequencyAsk(text: string): { days?: number; never?: boolean } | null {
  const leading = text.match(/^\s*/u)?.[0].length ?? 0;
  const word = text.slice(leading, leading + FREQUENCY_WORD.length);
  if (word.toLocaleLowerCase('ru') !== FREQUENCY_WORD) {
    return null;
  }

  const tail = text.slice(leading + word.length).trim();
  if (tail === '') {
    return {};
  }
  if (tail.toLocaleLowerCase('ru') === 'никогда') {
    return { never: true };
  }
  if (!/^\d+$/.test(tail)) {
    return null;
  }
  return { days: Number(tail) };
}

export function parseDigestHourAsk(text: string): { hour?: number } | null {
  const leading = text.match(/^\s*/u)?.[0].length ?? 0;
  const word = text.slice(leading, leading + HOUR_WORD.length);
  if (word.toLocaleLowerCase('ru') !== HOUR_WORD) {
    return null;
  }

  const tail = text.slice(leading + word.length).trim();
  if (tail === '') {
    return {};
  }
  if (!/^\d{1,2}$/.test(tail)) {
    return null;
  }
  const hour = Number(tail);
  if (hour < 0 || hour > 23) {
    return null;
  }
  return { hour };
}