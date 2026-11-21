import { DEFAULT_TIMER_SETTINGS } from '@/types/timer';
import { parseTimerSettings } from '@/services/timerSettingsRepository';

jest.mock('@/services/database', () => ({
  getConfigs: jest.fn(),
  setConfig: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://docs/',
}));

jest.mock(
  'expo-image-manipulator',
  () => ({
    SaveFormat: { JPEG: 'jpeg' },
    manipulateAsync: jest.fn(),
  }),
  { virtual: true },
);

jest.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 390, height: 844, scale: 2, fontScale: 2 }) },
  PixelRatio: { get: () => 2 },
}));

const defaults = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
] as const;

describe('parseTimerSettings', () => {
  it('пустые и кривые значения возвращают настройки по умолчанию', () => {
    expect(parseTimerSettings(...defaults)).toEqual(DEFAULT_TIMER_SETTINGS);
    expect(
      parseTimerSettings(
        'spiral',
        'years',
        '9',
        'middle',
        'hours',
        '',
        'nope',
        '',
        'nope',
        'always',
        '   ',
        'maybe',
        'maybe',
        'square',
        'cards',
      ),
    ).toEqual(DEFAULT_TIMER_SETTINGS);
  });

  it('сохраняет допустимый тип, режим и число знаков', () => {
    const parsed = parseTimerSettings(
      'linear',
      'percent',
      '0',
      'elapsed',
      'weeks',
      'file://photo.jpg',
      '0',
      '1',
      '10',
      'pinned',
      'event:1',
      '1',
      '0',
      'circle',
      'checklist',
    );
    expect(parsed.timerType).toBe('linear');
    expect(parsed.progressBarMode).toBe('percent');
    expect(parsed.percentDecimalPlaces).toBe(0);
    expect(parsed.centerDisplay).toBe('elapsed');
    expect(parsed.statCardMode).toBe('weeks');
    expect(parsed.backgroundImageUri).toBe('file://photo.jpg');
    expect(parsed.timerUpcomingPreview).toBe('pinned');
    expect(parsed.timerUpcomingPinnedRef).toBe('event:1');
    expect(parsed.dotGridCellShape).toBe('circle');
    expect(parsed.milestonesLayout).toBe('checklist');
  });
});
