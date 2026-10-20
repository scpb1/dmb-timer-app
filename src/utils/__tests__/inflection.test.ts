import { formatCount, inflect, pluralize } from '@/utils/inflection';
import {
  clampDurationPart,
  formatCallDuration,
  formatDurationShort,
  formatMeetingDuration,
  parseDurationPart,
} from '@/utils/durationFormat';

describe('pluralize', () => {
  it('выбирает форму 1 / 2–4 / 5+ и исключения 11–14', () => {
    expect(pluralize(1, 'день', 'дня', 'дней')).toBe('день');
    expect(pluralize(2, 'день', 'дня', 'дней')).toBe('дня');
    expect(pluralize(5, 'день', 'дня', 'дней')).toBe('дней');
    expect(pluralize(11, 'день', 'дня', 'дней')).toBe('дней');
    expect(pluralize(21, 'день', 'дня', 'дней')).toBe('день');
    expect(pluralize(22, 'день', 'дня', 'дней')).toBe('дня');
  });

  it('склоняет заранее описанные слова', () => {
    expect(inflect(1, 'week')).toBe('неделя');
    expect(inflect(3, 'month')).toBe('месяца');
    expect(formatCount(43, 'week')).toBe('43 недели');
  });
});

describe('durationFormat', () => {
  it('коротко форматирует длительность', () => {
    expect(formatDurationShort(0)).toBe('0 сек');
    expect(formatDurationShort(90)).toBe('1 мин');
    expect(formatDurationShort(3661)).toBe('1 ч 1 мин');
  });

  it('форматирует звонок и встречу по-разному', () => {
    expect(formatCallDuration(65)).toBe('1 мин 5 сек');
    expect(formatMeetingDuration(3660)).toBe('1 ч 1 мин');
  });

  it('режет поля длительности', () => {
    expect(clampDurationPart(-1, 59)).toBe(0);
    expect(clampDurationPart(99, 59)).toBe(59);
    expect(parseDurationPart('12abc', 59)).toBe(12);
    expect(parseDurationPart('', 59)).toBe(0);
  });
});
