/** Формы русского существительного: 1 / 2–4 / 5+ */
export type NounForms = readonly [one: string, few: string, many: string];

export type InflectableNoun =
  | 'day'
  | 'week'
  | 'month'
  | 'hour'
  | 'minute'
  | 'second'
  | 'call'
  | 'meeting';

export const NOUN_FORMS: Record<InflectableNoun, NounForms> = {
  day: ['день', 'дня', 'дней'],
  week: ['неделя', 'недели', 'недель'],
  month: ['месяц', 'месяца', 'месяцев'],
  hour: ['час', 'часа', 'часов'],
  minute: ['минута', 'минуты', 'минут'],
  second: ['секунда', 'секунды', 'секунд'],
  call: ['звонок', 'звонка', 'звонков'],
  meeting: ['встреча', 'встречи', 'встреч'],
};

/** Склонение русских существительных по числу (1 / 2–4 / 5+) */
export function pluralize(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const abs = Math.abs(Math.trunc(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  return many;
}

/** Возвращает нужную форму заранее описанного слова */
export function inflect(count: number, noun: InflectableNoun): string {
  const [one, few, many] = NOUN_FORMS[noun];
  return pluralize(count, one, few, many);
}

/** Собирает строку вида «43 недели» */
export function formatCount(count: number, noun: InflectableNoun): string {
  return `${count} ${inflect(count, noun)}`;
}
