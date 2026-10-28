jest.mock('@/services/database', () => ({
  getConfig: jest.fn(),
  setConfig: jest.fn(),
  countDiaryEntriesByKind: jest.fn(),
}));

import { DEFAULT_DIARY_TEXT_STYLE } from '@/types/diary';
import { buildLetterBookHtml, formatLetterDate } from '@/utils/letterBookHtml';
import type { LetterBookPayload } from '@/utils/letterBookHtml';

const payload: LetterBookPayload = {
  userName: 'Анна',
  partnerName: 'Иван',
  includePhotos: false,
  images: {},
  summary: {
    userName: 'Анна',
    partnerName: 'Иван',
    totalDays: 365,
    dateRangeLabel: '1 января 2025 — 1 января 2026',
    enlistmentLabel: '1 января 2025',
    demobilizationLabel: '1 января 2026',
    callStats: [],
    meetingStats: [],
    diaryStats: [],
    timerVisitCount: 0,
  },
  letters: [
    {
      date: '2025-06-15',
      dateLabel: '15 июня 2025',
      weekdayLabel: 'Воскресенье',
      monthKey: '2025-06',
      monthLabel: 'Июнь 2025',
      themeTitle: 'Тема <script>alert(1)</script>',
      document: {
        version: 1,
        blocks: [
          {
            id: 'p1',
            type: 'paragraph',
            spans: [
              {
                id: 's1',
                text: 'Привет, <мир>',
                style: DEFAULT_DIARY_TEXT_STYLE,
              },
            ],
          },
        ],
      },
    },
  ],
};

describe('letterBookHtml', () => {
  it('подписывает письмо по-русски', () => {
    expect(formatLetterDate('2025-06-15')).toEqual({
      dateLabel: '15 июня 2025',
      weekdayLabel: 'Воскресенье',
      monthKey: '2025-06',
      monthLabel: 'Июнь 2025',
    });
  });

  it('собирает HTML книги и экранирует текст письма', () => {
    const html = buildLetterBookHtml('classic', payload);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Том писем');
    expect(html).toContain('Анна');
    expect(html).toContain('Иван');
    expect(html).toContain('Привет, &lt;мир&gt;');
    expect(html).toContain('Тема &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('для альбома ставит свой заголовок', () => {
    const html = buildLetterBookHtml('album', payload);
    expect(html).toContain('Мы ждали');
  });
});
