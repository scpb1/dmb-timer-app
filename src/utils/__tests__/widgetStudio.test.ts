import { getColorTheme } from '@/theme/themes';
import { PREDEFINED_HOLIDAY_IDS } from '@/types/holidays';
import { DEFAULT_WIDGET_STUDIO } from '@/types/widgets';
import { nativeThemeColors, parseWidgetStudioSettings, resolveWidgetHoliday } from '@/utils/widgetStudio';

function widgetHex(value: string): string {
  return value.startsWith('#') ? value.slice(0, 7) : value;
}

describe('widgetStudio', () => {
  it('подставляет значения по умолчанию для пустого хранилища', () => {
    const settings = parseWidgetStudioSettings(null);
    expect(settings.timer.kind).toBe('circular');
    expect(settings.timer.cellShape).toBe('heart');
    expect(settings.holiday.mode).toBe('nearest');
    expect(settings.stats.mode).toBe('days');
    expect(settings.family).toBe(DEFAULT_WIDGET_STUDIO.family);
  });

  it('не берёт ленту событий как тип таймера', () => {
    const settings = parseWidgetStudioSettings(
      JSON.stringify({
        timer: { kind: 'milestones', progressBarMode: 'days' },
      }),
    );
    expect(settings.timer.kind).toBe('circular');
  });

  it('выбирает ближайший и закреплённый праздник', () => {
    const holidays = [
      {
        id: PREDEFINED_HOLIDAY_IDS.NEW_YEAR,
        name: 'Новый год',
        month: 1,
        day: 1,
        date: new Date(2026, 0, 1),
        isCustom: false,
        isPast: false,
      },
      {
        id: 'birthday',
        name: 'День рождения',
        month: 5,
        day: 12,
        date: new Date(2026, 4, 12),
        isCustom: true,
        isPast: false,
      },
    ];

    const nearest = resolveWidgetHoliday(
      holidays,
      { ...DEFAULT_WIDGET_STUDIO.holiday, mode: 'nearest' },
      new Date(2025, 11, 20),
    );
    expect(nearest?.name).toBe('Новый год');

    const pinned = resolveWidgetHoliday(
      holidays,
      {
        ...DEFAULT_WIDGET_STUDIO.holiday,
        mode: 'pinned',
        pinnedHolidayId: 'birthday',
      },
      new Date(2025, 11, 20),
    );
    expect(pinned?.name).toBe('День рождения');
  });

  it('берёт цвета текущей темы приложения', () => {
    const linenTheme = getColorTheme('linen');
    const linen = nativeThemeColors('linen');
    expect(linen.background).toBe(widgetHex(linenTheme.colors.background.start));
    expect(linen.accent).toBe(widgetHex(linenTheme.colors.text.accent));
    expect(linen.overlayFill).toBe(linenTheme.colors.overlay.fill);
    const graphiteTheme = getColorTheme('graphite');
    const graphite = nativeThemeColors('graphite');
    expect(graphite.background).toBe(widgetHex(graphiteTheme.colors.background.start));
    expect(graphite.muted).toBe(graphiteTheme.colors.text.secondary);
  });
});
