import {
  timerSettingsShowPercentDecimals,
  type ProgressBarMode,
  type TimerType,
} from '@/types/timer';

describe('timerSettingsShowPercentDecimals', () => {
  const circularDays: [TimerType, ProgressBarMode, boolean][] = [
    ['circular', 'percent', true],
    ['circular', 'days', true],
    ['circular', 'weeks', false],
    ['circular', 'months', false],
    ['linear', 'percent', true],
    ['linear', 'days', true],
    ['linear', 'weeks', false],
    ['dotGrid', 'weeks', true],
    ['dotGrid', 'days', true],
    ['milestones', 'days', true],
    ['frame', 'percent', false],
  ];

  it.each(circularDays)('%s + %s → %s', (timerType, mode, expected) => {
    expect(timerSettingsShowPercentDecimals(timerType, mode)).toBe(expected);
  });
});
