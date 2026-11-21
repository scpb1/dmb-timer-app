import { addDays } from 'date-fns';

import {
  calculateServiceProgress,
  formatProgressPercent,
  getServiceDisplayPercents,
  calendarMonthParts,
  getCenterDisplayLabels,
  getCenterDisplayValues,
  getDotGridColumnCount,
  getDotGridMetrics,
  getDotGridUnitTotal,
  getDotGridUnitsPassed,
  getPhaseCardTitle,
  getTimerVizSummaryCopy,
  getProgressBarSegmentCount,
  getServiceStatCardPair,
  getServiceTimeBreakdowns,
  getStatCardDisplay,
  getTimeBreakdown,
  resolveTimerPhase,
} from '@/utils/timerCalculations';

function at(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

const ENLISTMENT = at('2025-01-01');
const DEMOBILIZATION = at('2026-01-01');

describe('resolveTimerPhase', () => {
  it('до полуночи дня призыва — before', () => {
    expect(resolveTimerPhase(ENLISTMENT, DEMOBILIZATION, at('2024-12-31'))).toBe('before');
  });

  it('в день призыва и до дня дембеля — active', () => {
    expect(resolveTimerPhase(ENLISTMENT, DEMOBILIZATION, at('2025-01-01'))).toBe('active');
    expect(resolveTimerPhase(ENLISTMENT, DEMOBILIZATION, at('2025-12-31'))).toBe('active');
  });

  it('с полуночи дня дембеля — after', () => {
    expect(resolveTimerPhase(ENLISTMENT, DEMOBILIZATION, at('2026-01-01'))).toBe('after');
  });
});

describe('getTimeBreakdown', () => {
  it('раскладывает интервал на дни, часы, минуты и секунды', () => {
    const from = new Date('2025-01-01T00:00:00');
    const to = new Date('2025-01-02T02:03:04');

    expect(getTimeBreakdown(from, to)).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
  });

  it('отрицательный интервал даёт нули', () => {
    expect(getTimeBreakdown(at('2025-01-02'), at('2025-01-01'))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});

describe('calculateServiceProgress', () => {
  it('до призыва прогресс нулевой', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2024-12-01'));

    expect(progress.phase).toBe('before');
    expect(progress.totalDays).toBe(365);
    expect(progress.daysPassed).toBe(0);
    expect(progress.daysUntilStart).toBe(31);
    expect(progress.progressRatio).toBe(0);
    expect(progress.filledSegments.percent).toBe(0);
  });

  it('в середине службы считает ддд и дпп', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2025-07-01'));
    const enlistmentStart = new Date('2025-01-01T00:00:00');
    const demobilizationStart = new Date('2026-01-01T00:00:00');
    const now = at('2025-07-01');
    const totalMs = demobilizationStart.getTime() - enlistmentStart.getTime();
    const elapsedMs = now.getTime() - enlistmentStart.getTime();

    expect(progress.phase).toBe('active');
    expect(progress.totalDays).toBe(365);
    expect(progress.daysPassed).toBe(181);
    expect(progress.daysLeft).toBe(184);
    expect(progress.progressRatio).toBeCloseTo(elapsedMs / totalMs);
    expect(progress.weeksPassed).toBe(Math.floor(181 / 7));
    expect(progress.weeksLeft).toBe(Math.floor(365 / 7) - Math.floor(181 / 7));
  });

  it('осталось недель = целые недели срока минус целые пройденные', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, addDays(ENLISTMENT, 126));

    expect(progress.totalDays).toBe(365);
    expect(progress.daysPassed).toBe(126);
    expect(progress.weeksPassed).toBe(18);
    expect(progress.weeksLeft).toBe(52 - 18);
    expect(getCenterDisplayValues('weeks', progress, 0, 'elapsed').primaryValue).toBe('18');
    expect(getCenterDisplayValues('weeks', progress, 0, 'remaining').primaryValue).toBe('34');
  });

  it('прогресс по доле прошедших мс, а не только календарных дней', () => {
    const enlistment = new Date('2025-01-01T00:00:00');
    const demobilization = new Date('2026-01-01T00:00:00');
    const after17h = new Date('2025-01-01T17:00:00');
    const totalMs = demobilization.getTime() - enlistment.getTime();
    const progress = calculateServiceProgress(enlistment, demobilization, after17h);

    expect(progress.daysPassed).toBe(0);
    expect(progress.progressRatio).toBeCloseTo((17 * 3600 * 1000) / totalMs);
  });

  it('в день дембеля служба уже закончена', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2026-01-01'));

    expect(progress.phase).toBe('after');
    expect(progress.daysPassed).toBe(365);
    expect(progress.daysLeft).toBe(0);
    expect(progress.progressRatio).toBe(1);
    expect(progress.filledSegments.percent).toBe(100);
  });

  it('другой срок даёт другой прогресс кольца и центра', () => {
    const now = at('2025-07-01');
    const service = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, now);
    const custom = calculateServiceProgress(at('2025-06-20'), at('2025-07-10'), now);

    expect(custom.daysPassed).not.toBe(service.daysPassed);
    expect(custom.daysLeft).not.toBe(service.daysLeft);
    expect(custom.filledSegments.percent).not.toBe(service.filledSegments.percent);
    expect(getCenterDisplayValues('percent', custom, 2, 'remaining').primaryValue).not.toBe(
      getCenterDisplayValues('percent', service, 2, 'remaining').primaryValue,
    );
  });

  it('число сегментов совпадает с целыми единицами срока', () => {
    const year = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2026-01-01'));

    expect(year.segmentCounts).toEqual({ percent: 100, days: 100, weeks: 52, months: 12 });
    expect(year.filledSegments).toEqual(year.segmentCounts);

    const longEnd = addDays(ENLISTMENT, 547);
    const done = calculateServiceProgress(ENLISTMENT, longEnd, longEnd);

    expect(done.totalDays).toBe(547);
    expect(done.segmentCounts).toEqual({ percent: 100, days: 100, weeks: 78, months: 18 });
    expect(done.filledSegments).toEqual(done.segmentCounts);
  });

  it('в длинном сроке закрашивает целые недели, а не обрезает их до 52', () => {
    const longEnd = addDays(ENLISTMENT, 547);
    const progress = calculateServiceProgress(ENLISTMENT, longEnd, addDays(ENLISTMENT, 400));

    expect(progress.daysPassed).toBe(400);
    expect(progress.segmentCounts.weeks).toBe(78);
    expect(progress.filledSegments.weeks).toBe(57);
    expect(progress.filledSegments.days).toBe(Math.floor(progress.progressPercent));
    expect(progress.filledSegments.months).toBe(Math.floor(400 / 30));
    expect(progress.segmentCounts.percent).toBe(100);
    expect(progress.filledSegments.percent).toBe(Math.floor(progress.progressPercent));
  });
});

describe('getProgressBarSegmentCount', () => {
  it('проценты и дни — 100 сегментов, недели и месяцы только целые', () => {
    expect(getProgressBarSegmentCount('percent', 10)).toBe(100);
    expect(getProgressBarSegmentCount('percent', 547)).toBe(100);
    expect(getProgressBarSegmentCount('days', 365)).toBe(100);
    expect(getProgressBarSegmentCount('days', 547)).toBe(100);
    expect(getProgressBarSegmentCount('weeks', 365)).toBe(52);
    expect(getProgressBarSegmentCount('weeks', 547)).toBe(78);
    expect(getProgressBarSegmentCount('months', 365)).toBe(12);
    expect(getProgressBarSegmentCount('months', 547)).toBe(18);
  });

  it('срок короче единицы даёт один сегмент', () => {
    expect(getProgressBarSegmentCount('weeks', 6)).toBe(1);
    expect(getProgressBarSegmentCount('months', 20)).toBe(1);
  });
});

describe('getServiceTimeBreakdowns', () => {
  it('до призыва считает оставшееся до старта', () => {
    const result = getServiceTimeBreakdowns(
      ENLISTMENT,
      DEMOBILIZATION,
      new Date('2024-12-31T12:00:00'),
    );

    expect(result.phase).toBe('before');
    expect(result.passed).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    expect(result.remaining.days).toBe(0);
    expect(result.remaining.hours).toBe(12);
  });
});

describe('center and cards', () => {
  const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2025-07-01'));

  it('в режиме remaining показывает ддд', () => {
    const display = getCenterDisplayValues('days', progress, 2, 'remaining');

    expect(display.primaryValue).toBe('184');
    expect(display.unitLabel).toBe('ддд');
    expect(display.secondaryValue).toBe(
      formatProgressPercent(getServiceDisplayPercents(progress, 2).remaining, 2),
    );
  });

  it('в режиме percent по центру только проценты', () => {
    const display = getCenterDisplayValues('percent', progress, 2, 'remaining');

    expect(display.primaryValue).toBe(
      formatProgressPercent(getServiceDisplayPercents(progress, 2).remaining, 2),
    );
    expect(display.secondaryValue).toBeNull();
    expect(display.unitLabel).toBe('');
  });

  it('в режиме elapsed показывает дпп', () => {
    const display = getCenterDisplayValues('days', progress, 0, 'elapsed');

    expect(display.primaryValue).toBe('181');
    expect(display.unitLabel).toBe('дпп');
  });

  it('подписывает плашки по фазе', () => {
    expect(getPhaseCardTitle('before', 'service')).toBe('осталось');
    expect(getPhaseCardTitle('after', 'service')).toBe('прошло');
    expect(getPhaseCardTitle('before', 'custom')).toBe('осталось');
    expect(getPhaseCardTitle('after', 'custom')).toBe('прошло');
    expect(getPhaseCardTitle('active', 'custom')).toBe('осталось');
  });

  it('до призыва в days показывает склонённые дни до призыва', () => {
    const beforeProgress = calculateServiceProgress(
      ENLISTMENT,
      DEMOBILIZATION,
      at('2024-12-01'),
    );
    const labels = getCenterDisplayLabels('service');
    const display = getCenterDisplayValues('days', beforeProgress, 0, 'remaining', labels);

    expect(beforeProgress.phase).toBe('before');
    expect(display.primaryValue).toBe('31');
    expect(display.unitLabel).toBe('день до призыва');
  });

  it('до призыва на плашке показывает дней до призыва', () => {
    const result = getServiceTimeBreakdowns(
      ENLISTMENT,
      DEMOBILIZATION,
      at('2024-12-01'),
    );
    const card = getStatCardDisplay(result.remaining, 'days', {
      phase: 'before',
      kind: 'service',
    });

    expect(card.unitLabel).toBe('дней до призыва');
  });

  it('плашка в днях показывает часы-минуты-секунды', () => {
    const card = getStatCardDisplay(
      { days: 10, hours: 2, minutes: 3, seconds: 4 },
      'days',
    );

    expect(card.primaryValue).toBe(10);
    expect(card.unitLabel).toBe('дней');
    expect(card.detailLines[0]).toBe('2 часа');
  });

  it('на плашке недель не пишет нулевой остаток дней', () => {
    const exact = getStatCardDisplay(
      { days: 126, hours: 3, minutes: 0, seconds: 0 },
      'weeks',
    );
    const withDays = getStatCardDisplay(
      { days: 130, hours: 0, minutes: 0, seconds: 0 },
      'weeks',
    );

    expect(exact.primaryValue).toBe(18);
    expect(exact.detailLines).toEqual([]);
    expect(withDays.primaryValue).toBe(18);
    expect(withDays.detailLines).toEqual(['4 дня']);
  });

  it('плашки недель делят все календарные дни срока', () => {
    const empty = { days: 0, hours: 12, minutes: 0, seconds: 0 };
    const year = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, addDays(ENLISTMENT, 126));
    const mid = getServiceStatCardPair(year, empty, empty, 'weeks');

    expect(year.daysPassed + year.daysLeft).toBe(365);
    expect(mid.elapsed.primaryValue).toBe(18);
    expect(mid.elapsed.detailLines).toEqual([]);
    expect(mid.remaining.primaryValue).toBe(34);
    expect(mid.remaining.detailLines).toEqual(['1 день']);

    const last = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, addDays(ENLISTMENT, 364));
    const end = getServiceStatCardPair(last, empty, empty, 'weeks');

    expect(end.elapsed.primaryValue).toBe(52);
    expect(end.elapsed.detailLines).toEqual([]);
    expect(end.remaining.primaryValue).toBe(0);
    expect(end.remaining.unitLabel).toBe('недель');
    expect(end.remaining.detailLines).toEqual(['1 день']);
  });

  it('плашки месяцев считают календарные месяцы, а не по 30 дней', () => {
    const empty = { days: 0, hours: 12, minutes: 0, seconds: 0 };
    const start = at('2025-07-08');
    const endDate = at('2026-07-08');
    const progress = calculateServiceProgress(start, endDate, at('2025-11-11'));
    const pair = getServiceStatCardPair(progress, empty, empty, 'months');
    const passed = calendarMonthParts(start, at('2025-11-11'));
    const left = calendarMonthParts(at('2025-11-11'), endDate);

    expect(progress.daysPassed).toBe(126);
    expect(passed.months).toBe(4);
    expect(passed.days).toBe(3);
    expect(pair.elapsed.primaryValue).toBe(4);
    expect(pair.elapsed.detailLines).toEqual(['3 дня']);
    expect(pair.remaining.primaryValue).toBe(left.months);
    expect(pair.remaining.detailLines).toEqual(['27 дней']);
    expect(Math.floor(126 / 30)).toBe(4);
    expect(126 % 30).toBe(6);
  });

  it('хвост любой длины срока остаётся на плашках', () => {
    const empty = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const cases = [
      { total: 10, passed: 7, weeksPassed: 1, daysPassed: 0, weeksLeft: 0, daysLeft: 3 },
      { total: 547, passed: 400, weeksPassed: 57, daysPassed: 1, weeksLeft: 21, daysLeft: 0 },
      { total: 365, passed: 130, weeksPassed: 18, daysPassed: 4, weeksLeft: 33, daysLeft: 4 },
    ];

    for (const item of cases) {
      const progress = calculateServiceProgress(
        ENLISTMENT,
        addDays(ENLISTMENT, item.total),
        addDays(ENLISTMENT, item.passed),
      );
      const pair = getServiceStatCardPair(progress, empty, empty, 'weeks');

      expect(progress.daysPassed + progress.daysLeft).toBe(item.total);
      expect(pair.elapsed.primaryValue).toBe(item.weeksPassed);
      expect(pair.elapsed.detailLines).toEqual(
        item.daysPassed === 0 ? [] : [`${item.daysPassed} ${item.daysPassed === 1 ? 'день' : 'дня'}`],
      );
      expect(pair.remaining.primaryValue).toBe(item.weeksLeft);
      expect(pair.remaining.detailLines).toEqual(
        item.daysLeft === 0 ? [] : [`${item.daysLeft} ${item.daysLeft === 1 ? 'день' : 'дня'}`],
      );
    }
  });
});

describe('formatProgressPercent', () => {
  it('усекаает знаки после запятой вниз и не даёт больше шести', () => {
    expect(formatProgressPercent(12.3456, 2)).toBe('12.34');
    expect(formatProgressPercent(35.78, 0)).toBe('35');
    expect(formatProgressPercent(1, 0)).toBe('1');
    expect(formatProgressPercent(1, 9)).toBe('1.000000');
  });

  it('осталось = 100 − усечённое прошло', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2025-07-01'));
    const pair = getServiceDisplayPercents(progress, 1);
    expect(pair.passed + pair.remaining).toBe(100);
  });
});

describe('getDotGridUnitTotal', () => {
  it('365 дней — 52 недели и 12 месяцев', () => {
    expect(getDotGridUnitTotal('weeks', 365)).toBe(52);
    expect(getDotGridUnitTotal('months', 365)).toBe(12);
  });

  it('547 дней — 78 недель и 18 месяцев', () => {
    expect(getDotGridUnitTotal('weeks', 547)).toBe(78);
    expect(getDotGridUnitTotal('months', 547)).toBe(18);
  });
});

describe('getDotGridMetrics', () => {
  it('фиксированное число колонок по режимам', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2025-07-01'));

    expect(getDotGridMetrics('days', progress).columns).toBe(20);
    expect(getDotGridMetrics('percent', progress).columns).toBe(10);
    expect(getDotGridMetrics('weeks', progress).columns).toBe(10);
    expect(getDotGridMetrics('months', progress).columns).toBe(6);
  });

  it('год службы — 12 месяцев на сетке, не 13', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2025-07-01'));
    expect(getDotGridMetrics('months', progress).total).toBe(12);
  });

  it('547 дней — 18 месяцев и 78 недель', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2025-07-01'));
    const longService = { ...progress, totalDays: 547 };

    expect(getDotGridMetrics('months', longService).total).toBe(18);
    expect(getDotGridMetrics('weeks', longService).total).toBe(78);
  });
});

describe('getDotGridColumnCount', () => {
  it('дни — 20 колонок при достаточном числе ячеек', () => {
    expect(getDotGridColumnCount('days', 365)).toBe(20);
  });
});

describe('getDotGridUnitsPassed', () => {
  it('в середине срока меньше полного числа месяцев', () => {
    const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2025-07-01'));
    const passed = getDotGridUnitsPassed('months', progress);
    const total = getDotGridUnitTotal('months', progress.totalDays);

    expect(passed).toBeGreaterThan(0);
    expect(passed).toBeLessThan(total);
    expect(passed + (total - passed)).toBe(total);
  });
});

describe('getTimerVizSummaryCopy', () => {
  const progress = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2025-07-01'));

  it('в сетке дней remaining показывает ддд', () => {
    const copy = getTimerVizSummaryCopy(progress, 'days', 2, 'remaining', 'service');

    expect(copy.heroValue).toBe(String(progress.daysLeft));
    expect(copy.heroSuffix).toBe(' ддд');
    expect(copy.heroIncludesPercent).toBe(false);
  });

  it('в сетке дней elapsed показывает дпп', () => {
    const copy = getTimerVizSummaryCopy(progress, 'days', 2, 'elapsed', 'service');

    expect(copy.heroValue).toBe(String(progress.daysPassed));
    expect(copy.heroSuffix).toBe(' дпп');
  });

  it('в ленте событий remaining и elapsed меняют дни', () => {
    const remaining = getTimerVizSummaryCopy(progress, 'days', 2, 'remaining', 'service');
    const elapsed = getTimerVizSummaryCopy(progress, 'days', 2, 'elapsed', 'service');

    expect(remaining.heroValue).not.toBe(elapsed.heroValue);
    expect(remaining.heroSuffix).toBe(' ддд');
    expect(elapsed.heroSuffix).toBe(' дпп');
  });

  it('в процентах remaining и elapsed меняют героя', () => {
    const remaining = getTimerVizSummaryCopy(progress, 'percent', 2, 'remaining', 'service');
    const elapsed = getTimerVizSummaryCopy(progress, 'percent', 2, 'elapsed', 'service');

    expect(remaining.heroSuffix).toBe(' осталось');
    expect(elapsed.heroSuffix).toBe(' прошло');
    expect(remaining.heroIncludesPercent).toBe(true);
    expect(remaining.heroValue).not.toBe(elapsed.heroValue);
  });

  it('до призыва не зависит от centerDisplay', () => {
    const before = calculateServiceProgress(ENLISTMENT, DEMOBILIZATION, at('2024-12-01'));
    const remaining = getTimerVizSummaryCopy(before, 'days', 0, 'remaining', 'service');
    const elapsed = getTimerVizSummaryCopy(before, 'days', 0, 'elapsed', 'service');

    expect(remaining).toEqual(elapsed);
    expect(remaining.heroValue).toBe('31');
    expect(remaining.heroSuffix).toContain('до призыва');
  });
});
