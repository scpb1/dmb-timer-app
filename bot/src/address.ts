import { randomInt } from 'node:crypto';

import { escapeHtml } from './mention';

const PET_NAMES = ['солнышко', 'милая', 'родная', 'дорогая', 'подруга'] as const;

const NO_VOCATIVE_SHARE = 30;
const NAMED_EACH_SHARE = 70;

export interface VocativeParts {
  lead: string;
  mid: string;
}

export function pickGirlWord(userName?: string | null): string | null {
  const name = userName?.trim() ?? '';
  const namedSlots = PET_NAMES.length + (name ? 1 : 0);

  const weighted: Array<{ value: string | null; weight: number }> = [
    ...PET_NAMES.map((pet) => ({ value: pet, weight: NAMED_EACH_SHARE })),
    { value: null, weight: NO_VOCATIVE_SHARE * namedSlots },
  ];
  if (name) {
    weighted.push({ value: name, weight: NAMED_EACH_SHARE });
  }

  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let pick = randomInt(total);
  for (const entry of weighted) {
    if (pick < entry.weight) {
      return entry.value;
    }
    pick -= entry.weight;
  }
  return null;
}

export function withLead(text: string, userName?: string | null): string {
  const word = pickGirlWord(userName);
  if (!word) {
    return text;
  }

  const vocative = maybeEscape(capitalizeWord(word), text);
  const lines = text.split('\n');
  const index = lines.findIndex((line) => !isSkippableLine(line));
  if (index === -1) {
    return text;
  }
  lines[index] = `${vocative}, ${lowercaseFirstLetter(lines[index])}`;
  return lines.join('\n');
}

export function withTrail(text: string, userName?: string | null): string {
  const word = pickGirlWord(userName);
  if (!word) {
    return text;
  }

  const vocative = maybeEscape(midSentenceWord(word), text);
  const lines = text.split('\n');
  let index = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (!isSkippableLine(lines[i])) {
      index = i;
      break;
    }
  }
  if (index === -1) {
    return text;
  }
  lines[index] = appendVocative(lines[index], vocative);
  return lines.join('\n');
}

export function withThanks(text: string, userName?: string | null): string {
  const word = pickGirlWord(userName);
  if (!word) {
    return text;
  }

  const vocative = maybeEscape(midSentenceWord(word), text);
  return text.replace(/спасибо/i, (match, offset: number) => {
    const rest = text.slice(offset + match.length).trimStart();
    if (!rest || /^[!?.,…🤍]/.test(rest)) {
      return `${match}, ${vocative}`;
    }
    return `${match}, ${vocative},`;
  });
}

export function withOneSlot(
  userName: string | undefined,
  plain: string,
  variants: Array<(vocative: VocativeParts) => string>,
): string {
  const word = pickGirlWord(userName);
  if (!word) {
    return plain;
  }

  const vocative: VocativeParts = {
    lead: maybeEscape(capitalizeWord(word), plain),
    mid: maybeEscape(midSentenceWord(word), plain),
  };
  return variants[randomInt(variants.length)](vocative);
}

function appendVocative(line: string, vocative: string): string {
  const match = line.match(/^(.*?)([.!?…]+)?(\s*🤍)?\s*$/u);
  if (!match) {
    return `${line}, ${vocative}`;
  }
  const body = match[1].replace(/[,\s]+$/u, '');
  const punct = match[2] ?? '';
  const heart = match[3] ?? '';
  return `${body}, ${vocative}${punct}${heart}`;
}

function capitalizeWord(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.charAt(0).toLocaleUpperCase('ru') + trimmed.slice(1);
}

function midSentenceWord(word: string): string {
  const trimmed = word.trim();
  const lower = trimmed.toLocaleLowerCase('ru');
  if ((PET_NAMES as readonly string[]).includes(lower)) {
    return lower;
  }
  return trimmed;
}

function maybeEscape(word: string, text: string): string {
  return /[&<]/.test(text) ? escapeHtml(word) : word;
}

function isSkippableLine(line: string): boolean {
  const plain = line.replace(/<[^>]+>/g, '').trim();
  if (!plain) {
    return true;
  }
  if (/^\s*<b>[\s\S]*<\/b>\s*$/i.test(line) && !/[.!?…]/.test(plain)) {
    return true;
  }
  return plain.length <= 40 && !/[.!?…]/.test(plain) && /^[^\p{L}]/u.test(plain);
}

function lowercaseFirstLetter(text: string): string {
  return text.replace(/^((?:<[^>]+>|\s)*)(\p{Lu})/u, (_full, prefix: string, letter: string) => {
    return `${prefix}${letter.toLocaleLowerCase('ru')}`;
  });
}
