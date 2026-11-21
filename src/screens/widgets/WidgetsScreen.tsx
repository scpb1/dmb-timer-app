import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { APP_NAME } from '@/constants';
import { ColorThemePicker } from '@/components/common/ColorThemePicker';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SettingsDropdown } from '@/components/common/SettingsDropdown';
import { SettingsSegmented } from '@/components/common/SettingsSegmented';
import { SettingsSlider } from '@/components/common/SettingsSlider';
import { TimerTypeTilePicker } from '@/components/timer/TimerTypeTilePicker';
import { WidgetPreview } from '@/components/widgets/WidgetPreview';
import { useHolidays } from '@/hooks/useHolidays';
import {
  computeActiveTimerView,
  readPublishedTimerView,
  useServiceTimer,
} from '@/hooks/useServiceTimer';
import type { ServiceProgress, TimeBreakdown } from '@/utils/timerCalculations';
import { useTimerUpcoming } from '@/hooks/useTimerUpcoming';
import { useWidgetStudio } from '@/hooks/useWidgetStudio';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import {
  DOT_GRID_CELL_SHAPE_LABELS,
  STAT_CARD_MODE_LABELS,
  defaultProgressBarModeForTimerType,
  getProgressBarModeOptions,
  normalizeProgressBarMode,
  timerSettingsShowPercentDecimals,
  timerTypeUsesProgressBarModes,
  type DotGridCellShape,
  type StatCardMode,
  type TimerCenterDisplay,
  type TimerType,
} from '@/types/timer';
import {
  WIDGET_FAMILY_LABELS,
  WIDGET_HOLIDAY_MODE_LABELS,
  WIDGET_PREVIEW_SIZE_LABELS,
  WIDGET_TIMER_KINDS,
  type WidgetFamily,
  type WidgetHolidayMode,
  type WidgetPreviewSize,
} from '@/types/widgets';
import { isAndroidWidgetAvailable } from '@/utils/nativeAvailability';
import { resolveWidgetHoliday } from '@/utils/widgetStudio';

export function WidgetsScreen() {
  const theme = useAppTheme();
  const studio = useWidgetStudio();
  const timer = useServiceTimer({ tick: false });
  const [previewSample, setPreviewSample] = useState<{
    progress: ServiceProgress;
    passedBreakdown: TimeBreakdown;
    remainingBreakdown: TimeBreakdown;
  } | null>(null);

  const refreshPreview = useCallback(() => {
    const active = timer.activeTimer;
    if (!active) {
      setPreviewSample(null);
      return;
    }

    const published = readPublishedTimerView();
    if (
      published &&
      published.activeTimerId === active.id &&
      Date.now() - published.at < 60_000
    ) {
      setPreviewSample({
        progress: published.progress,
        passedBreakdown: published.passedBreakdown,
        remainingBreakdown: published.remainingBreakdown,
      });
      return;
    }

    const computed = computeActiveTimerView(active, timer.settings, new Date());
    if (!computed.progress || !computed.passedBreakdown || !computed.remainingBreakdown) {
      setPreviewSample(null);
      return;
    }

    setPreviewSample({
      progress: computed.progress,
      passedBreakdown: computed.passedBreakdown,
      remainingBreakdown: computed.remainingBreakdown,
    });
  }, [timer.activeTimer, timer.settings]);

  useFocusEffect(
    useCallback(() => {
      refreshPreview();
      const intervalId = setInterval(refreshPreview, 60_000);
      return () => clearInterval(intervalId);
    }, [refreshPreview]),
  );
  const { holidays, isLoading: holidaysLoading } = useHolidays();
  const timerUpcoming = useTimerUpcoming(timer.settings);
  const { settings } = studio;
  const surface = settings[settings.family];

  const holidayItem = useMemo(
    () => resolveWidgetHoliday(holidays, settings.holiday),
    [holidays, settings.holiday],
  );

  const holidayOptions = holidays.map((item) => ({ value: item.id, label: item.name }));
  const isLoading = studio.isLoading || timer.isLoading || holidaysLoading;
  const barOptions = getProgressBarModeOptions(settings.timer.kind);

  const installHint =
    Platform.OS !== 'android'
      ? 'Виджет для iPhone пока недоступен. Превью — как тот же таймер, что на главной.'
      : isAndroidWidgetAvailable()
        ? `Долгое нажатие на рабочий стол → «Виджеты» → «${APP_NAME}». Три виджета: таймер, праздник и плашки.`
        : `Виджет появится после сборки с нативным модулем. Превью уже рисует тот же таймер, что в приложении.`;

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          <ScreenHeader title="Виджеты" />
          {isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={theme.text.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.previewWrap}>
                <WidgetPreview
                  family={settings.family}
                  size={settings.previewSize}
                  timer={settings.timer}
                  holiday={settings.holiday}
                  stats={settings.stats}
                  activeTimer={timer.activeTimer}
                  progress={previewSample?.progress ?? timer.progress}
                  passedBreakdown={previewSample?.passedBreakdown ?? timer.passedBreakdown}
                  remainingBreakdown={previewSample?.remainingBreakdown ?? timer.remainingBreakdown}
                  holidayItem={holidayItem}
                  frameUpcoming={timerUpcoming.frameItem}
                />
              </View>

              <SettingsSegmented
                label="Что настраиваем"
                value={settings.family}
                options={(Object.keys(WIDGET_FAMILY_LABELS) as WidgetFamily[]).map((value) => ({
                  value,
                  label: WIDGET_FAMILY_LABELS[value],
                }))}
                onChange={(family) => void studio.setFamily(family)}
                equalWidth
              />

              <SettingsSegmented
                label="Размер на столе"
                value={settings.previewSize}
                options={(Object.keys(WIDGET_PREVIEW_SIZE_LABELS) as WidgetPreviewSize[]).map(
                  (value) => ({
                    value,
                    label: WIDGET_PREVIEW_SIZE_LABELS[value],
                  }),
                )}
                onChange={(previewSize) => void studio.updateSettings({ previewSize })}
                equalWidth
              />

              {settings.family === 'timer' ? (
                <>
                  <TimerTypeTilePicker
                    value={settings.timer.kind}
                    types={WIDGET_TIMER_KINDS as TimerType[]}
                    onChange={(kind: TimerType) => {
                      if (kind === 'milestones') {
                        return;
                      }
                      void studio.updateTimer({
                        kind,
                        progressBarMode: normalizeProgressBarMode(
                          kind,
                          defaultProgressBarModeForTimerType(kind),
                        ),
                      });
                    }}
                  />
                  {settings.timer.kind === 'dotGrid' ? (
                    <SettingsSegmented
                      label="Ячейки"
                      value={settings.timer.cellShape}
                      options={(Object.keys(DOT_GRID_CELL_SHAPE_LABELS) as DotGridCellShape[]).map(
                        (value) => ({
                          value,
                          label: DOT_GRID_CELL_SHAPE_LABELS[value],
                        }),
                      )}
                      onChange={(cellShape) => void studio.updateTimer({ cellShape })}
                      equalWidth
                    />
                  ) : null}
                  {timerTypeUsesProgressBarModes(settings.timer.kind) ? (
                    <SettingsSegmented
                      label="Шкала"
                      value={settings.timer.progressBarMode}
                      options={barOptions}
                      onChange={(progressBarMode) =>
                        void studio.updateTimer({
                          progressBarMode: normalizeProgressBarMode(
                            settings.timer.kind,
                            progressBarMode,
                          ),
                        })
                      }
                      equalWidth
                    />
                  ) : null}
                  {timerSettingsShowPercentDecimals(
                    settings.timer.kind,
                    normalizeProgressBarMode(settings.timer.kind, settings.timer.progressBarMode),
                  ) ? (
                    <SettingsSegmented
                      label="Знаков после запятой"
                      value={settings.timer.percentDecimalPlaces}
                      options={[0, 1, 2, 3, 4, 5, 6].map((value) => ({
                        value,
                        label: String(value),
                      }))}
                      onChange={(percentDecimalPlaces) =>
                        void studio.updateTimer({ percentDecimalPlaces })
                      }
                      compact
                      equalWidth
                    />
                  ) : null}
                  <SettingsSegmented
                    label="В центре"
                    value={settings.timer.centerDisplay}
                    options={[
                      { value: 'remaining' as TimerCenterDisplay, label: 'Осталось' },
                      { value: 'elapsed' as TimerCenterDisplay, label: 'Прошло' },
                    ]}
                    onChange={(centerDisplay) => void studio.updateTimer({ centerDisplay })}
                    equalWidth
                  />
                </>
              ) : null}

              {settings.family === 'holiday' ? (
                <>
                  <SettingsSegmented
                    label="Какой праздник"
                    value={settings.holiday.mode}
                    options={(Object.keys(WIDGET_HOLIDAY_MODE_LABELS) as WidgetHolidayMode[]).map(
                      (value) => ({
                        value,
                        label: WIDGET_HOLIDAY_MODE_LABELS[value],
                      }),
                    )}
                    onChange={(mode) => void studio.updateHoliday({ mode })}
                    equalWidth
                  />
                  {settings.holiday.mode === 'pinned' && holidayOptions.length > 0 ? (
                    <SettingsDropdown
                      label="Закрепить"
                      value={settings.holiday.pinnedHolidayId ?? holidayOptions[0].value}
                      options={holidayOptions}
                      onChange={(pinnedHolidayId) => void studio.updateHoliday({ pinnedHolidayId })}
                    />
                  ) : null}
                </>
              ) : null}

              {settings.family === 'stats' ? (
                <SettingsSegmented
                  label="Плашки"
                  value={settings.stats.mode}
                  options={(Object.keys(STAT_CARD_MODE_LABELS) as StatCardMode[]).map((value) => ({
                    value,
                    label: STAT_CARD_MODE_LABELS[value],
                  }))}
                  onChange={(mode) => void studio.updateStats({ mode })}
                  equalWidth
                />
              ) : null}

              <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
                Тема приложения
              </Text>
              <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
                Те же цвета, что у таймера. Меняется везде сразу.
              </Text>
              <ColorThemePicker />

              <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
                Фото на фоне
              </Text>
              <View style={styles.photoRow}>
                <Pressable
                  style={[
                    styles.photoButton,
                    { borderColor: theme.overlay.border, backgroundColor: theme.overlay.fill },
                  ]}
                  onPress={() => void studio.pickBackground(settings.family)}
                  accessibilityRole="button"
                  accessibilityLabel="Выбрать фото на фон виджета"
                >
                  <Feather name="image" size={18} color={theme.text.primary} />
                  <Text style={[styles.photoButtonText, { color: theme.text.primary }]}>
                    {surface.backgroundImageUri ? 'Заменить фото' : 'Выбрать фото'}
                  </Text>
                </Pressable>
                {surface.backgroundImageUri ? (
                  <Pressable
                    style={[
                      styles.photoIconButton,
                      { borderColor: theme.overlay.border, backgroundColor: theme.overlay.fill },
                    ]}
                    onPress={() => void studio.clearBackground(settings.family)}
                    accessibilityRole="button"
                    accessibilityLabel="Убрать фото с фона виджета"
                  >
                    <Feather name="trash-2" size={19} color={theme.text.secondary} />
                  </Pressable>
                ) : null}
              </View>
              {surface.backgroundImageUri ? (
                <SettingsSlider
                  label="Затемнение фото"
                  value={surface.backgroundDim}
                  min={0}
                  max={80}
                  onCommit={(backgroundDim) => {
                    if (settings.family === 'timer') {
                      void studio.updateTimer({ backgroundDim });
                    } else if (settings.family === 'holiday') {
                      void studio.updateHoliday({ backgroundDim });
                    } else {
                      void studio.updateStats({ backgroundDim });
                    }
                  }}
                  formatValue={(value) => `${value}%`}
                />
              ) : null}

              <Text style={[styles.hint, { color: theme.text.secondary }]}>{installHint}</Text>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  previewWrap: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
  },
  photoIconButton: {
    width: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 20,
  },
});
