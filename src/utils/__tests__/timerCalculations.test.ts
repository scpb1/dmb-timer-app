import {
  calculateServiceProgress,
  formatProgressPercent,
  getCenterDisplayValues,
  getDotGridColumnCount,
  getDotGridMetrics,
  getDotGridUnitTotal,
  getPhaseCardTitle,
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

    expect(progress.phase).toBe('active');
    expect(progress.totalDays).toBe(365);
    expect(progress.daysPassed).toBe(181);
    expect(progress.daysLeft).toBe(184);
    expect(progress.progressRatio).toBeCloseTo(181 / 365);
    expect(progress.weeksLeft).toBe(Math.ceil(184 / 7));
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
    const display = getCenterDisplayValues('percent', progress, 2, 'remaining');

    expect(display.primaryValue).toBe('184');
    expect(display.unitLabel).toBe('ддд');
    expect(display.secondaryValue).toBe(formatProgressPercent((1 - progress.progressRatio) * 100, 2));
  });

  it('в режиме elapsed показывает дпп', () => {
    const display = getCenterDisplayValues('days', progress, 0, 'elapsed');

    expect(display.primaryValue).toBe('181');
    expect(display.unitLabel).toBe('дпп');
  });

  it('подписывает плашки по фазе', () => {
    expect(getPhaseCardTitle('before', 'service')).toBe('ДО ПРИЗЫВА');
    expect(getPhaseCardTitle('after', 'service')).toBe('ПОСЛЕ ДЕМБЕЛЯ');
    expect(getPhaseCardTitle('active', 'custom')).toBe('осталось');
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
});

describe('formatProgressPercent', () => {
  it('режет знаки после запятой и не даёт больше шести', () => {
    expect(formatProgressPercent(12.3456, 2)).toBe('12.35');
    expect(formatProgressPercent(1, 0)).toBe('1');
    expect(formatProgressPercent(1, 9)).toBe('1.000000');
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
