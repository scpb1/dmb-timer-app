import { addDays, format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { CallEntry, MeetingEntry } from '@/types/trackers';
import {
  getCallStats,
  getDatesWithEntries,
  getEntriesForDate,
  getEntryCountsByDate,
  getMeetingStats,
} from '@/utils/trackerCalculations';
import { isMeetingFinished, validateMeetingTimes } from '@/utils/meetingTime';

function call(partial: Partial<CallEntry> & Pick<CallEntry, 'id' | 'date' | 'durationSeconds'>): CallEntry {
  return {
    createdAt: `${partial.date}T12:00:00.000Z`,
    ...partial,
  };
}

function meeting(
  partial: Partial<MeetingEntry> & Pick<MeetingEntry, 'id' | 'date'>,
): MeetingEntry {
  return {
    durationSeconds: 0,
    createdAt: `${partial.date}T12:00:00.000Z`,
    ...partial,
  };
}

describe('trackerCalculations', () => {
  it('пустые звонки дают прочерки', () => {
    const stats = getCallStats([]);

    expect(stats[0].value).toBe('0');
    expect(stats[0].subValue).toBeUndefined();
    expect(stats[2].value).toBe('—');
    expect(stats[3].value).toBe('—');
    expect(stats[3].label).toBe('Последний звонок');
  });

  it('считает сумму, среднее и дату последнего звонка', () => {
    const stats = getCallStats([
      call({ id: '1', date: '2025-01-06', durationSeconds: 120 }),
      call({ id: '2', date: '2025-01-06', durationSeconds: 60 }),
      call({ id: '3', date: '2025-01-07', durationSeconds: 30 }),
    ]);

    expect(stats[0].value).toBe('3');
    expect(stats[1].value).toBe('3 мин');
    expect(stats[2].value).toBe('1 мин');
    expect(stats[3].value).toBe(format(new Date(2025, 0, 7), 'd MMM yyyy', { locale: ru }));
  });

  it('делит встречи на прошлые и будущие относительно сейчас', () => {
    const now = new Date(2026, 8, 19, 16, 0, 0);
    const today = format(now, 'yyyy-MM-dd');
    const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');
    const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');

    const stats = getMeetingStats(
      [
        meeting({ id: 'past', date: yesterday, startTime: '12:00', endTime: '14:00', durationSeconds: 7200 }),
        meeting({ id: 'done-today', date: today, startTime: '10:00', endTime: '12:00', durationSeconds: 7200 }),
        meeting({ id: 'later-today', date: today, startTime: '18:00', endTime: '20:00', durationSeconds: 7200 }),
        meeting({ id: 'next', date: tomorrow, startTime: '11:00', endTime: '13:00', durationSeconds: 7200 }),
      ],
      now,
    );

    expect(stats[0].value).toBe('4');
    expect(stats[0].subValue).toBeUndefined();
    expect(stats[2].value).toBe(format(now, 'd MMM yyyy', { locale: ru }));
    expect(stats[2].subValue).toBe('10:00–12:00');
    expect(stats[3].value).toBe(format(now, 'd MMM yyyy', { locale: ru }));
    expect(stats[3].subValue).toBe('18:00–20:00');
  });

  it('считает точки на датах', () => {
    const entries = [{ date: '2025-01-01' }, { date: '2025-01-01' }, { date: '2025-01-02' }];

    expect(getEntryCountsByDate(entries)).toEqual({ '2025-01-01': 2, '2025-01-02': 1 });
    expect([...getDatesWithEntries(entries)].sort()).toEqual(['2025-01-01', '2025-01-02']);
    expect(getEntriesForDate(entries, '2025-01-01')).toHaveLength(2);
  });
});

describe('meetingTime', () => {
  const now = new Date(2026, 8, 19, 16, 0, 0);

  it('для прошедшей встречи требует начало и конец', () => {
    expect(validateMeetingTimes('2026-09-18', undefined, undefined, now)).toBe(
      'Для прошедшей встречи укажите начало и конец',
    );
    expect(validateMeetingTimes('2026-09-18', '12:00', '14:00', now)).toBeNull();
  });

  it('для сегодняшней и будущей позволяет пустые часы, но не конец без начала', () => {
    expect(validateMeetingTimes('2026-09-19', undefined, undefined, now)).toBeNull();
    expect(validateMeetingTimes('2026-09-20', '12:00', undefined, now)).toBeNull();
    expect(validateMeetingTimes('2026-09-19', undefined, '18:00', now)).toBe(
      'Сначала укажите начало встречи',
    );
  });

  it('сегодняшняя встреча закончилась, если конец уже прошёл', () => {
    expect(
      isMeetingFinished(
        meeting({ id: 'done', date: '2026-09-19', startTime: '10:00', endTime: '12:00' }),
        now,
      ),
    ).toBe(true);
    expect(
      isMeetingFinished(
        meeting({ id: 'open', date: '2026-09-19', startTime: '18:00' }),
        now,
      ),
    ).toBe(false);
  });
});
