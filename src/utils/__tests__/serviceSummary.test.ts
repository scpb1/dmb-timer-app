jest.mock('@/services/database', () => ({
  getConfig: jest.fn(),
  setConfig: jest.fn(),
  countDiaryEntriesByKind: jest.fn(),
}));

import {
  isDemobilizationDay,
  shouldAutoOpenServiceSummary,
  toDateKey,
} from '@/utils/serviceSummary';

describe('serviceSummary', () => {
  it('ключ даты без времени', () => {
    expect(toDateKey(new Date(2026, 0, 1, 18, 30))).toBe('2026-01-01');
  });

  it('день дембеля — календарный, не момент времени', () => {
    expect(isDemobilizationDay(new Date(2026, 0, 1), new Date(2026, 0, 1, 23, 0))).toBe(true);
    expect(isDemobilizationDay(new Date(2026, 0, 1), new Date(2025, 11, 31))).toBe(false);
  });

  it('автопоказ итогов один раз в день дембеля', () => {
    const demob = new Date(2026, 0, 1);
    const now = new Date(2026, 0, 1, 10, 0);

    expect(shouldAutoOpenServiceSummary(demob, null, now)).toBe(true);
    expect(shouldAutoOpenServiceSummary(demob, '2026-01-01', now)).toBe(false);
    expect(shouldAutoOpenServiceSummary(demob, null, new Date(2026, 0, 2))).toBe(false);
  });
});
