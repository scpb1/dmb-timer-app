import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

import { FEATURES } from '@/constants';
import { reloadAppSession } from '@/appSession';
import { resetAllData } from '@/services/database';
import {
  applyAppNotificationsPreference,
  peekNotificationsEnabled,
  readNotificationsEnabled,
  rescheduleAppNotifications,
} from '@/services/holidayNotifications';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScrollRail } from '@/components/common/ScrollRail';
import { TimerStickerSheet } from '@/components/timer/TimerStickerSheet';
import type { HomeStackParamList } from '@/types/navigation';
import {
  DEFAULT_TIMER_SETTINGS,
  STAT_CARD_MODE_LABELS,
  defaultProgressBarModeForTimerType,
  getProgressBarModeOptions,
  MILESTONES_LAYOUT_LABELS,
  normalizeProgressBarMode,
  type DotGridCellShape,
  type MilestonesLayout,
  type StatCardMode,
  type TimerType,
  type TimerUpcomingPreviewMode,
} from '@/types/timer';
import { clearTimerSettingsCache, useServiceTimer } from '@/hooks/useServiceTimer';
import { useTimerUpcoming } from '@/hooks/useTimerUpcoming';
import type { TimerUpcomingRef } from '@/utils/timerUpcoming';
import { useAppTheme } from '@/theme';
import { timerSettingsStyles as styles } from '@/screens/home/timerSettingsStyles';
import {
  TimerSettingsActionsSection,
  TimerSettingsDatesSection,
  TimerSettingsDisplaySection,
  TimerSettingsNamesSection,
} from '@/screens/home/TimerSettingsSections';
import { logger } from '@/utils/logger';
import { clearProfileSnapshot, useProfile } from '@/hooks/useProfile';
import { isViewShotAvailable } from '@/utils/nativeAvailability';
import { shareTimerImage } from '@/utils/shareTimerImage';
import { getEventGlyph, getHolidayGlyph } from '@/utils/eventGlyphs';
import { shouldOmitDemobilizationCountdown } from '@/utils/timerUpcoming';

type Props = StackScreenProps<HomeStackParamList, 'TimerSettings'>;

const UPCOMING_PREVIEW_OPTIONS: { value: TimerUpcomingPreviewMode; label: string }[] = [
  { value: 'off', label: 'Выкл' },
  { value: 'nearest', label: 'Ближайшее' },
  { value: 'pinned', label: 'Закрепить' },
];

const PROGRESS_BAR_SEGMENT_LABELS: Record<string, string> = {
  percent: '%',
  days: 'Дни',
  weeks: 'Нед',
  months: 'Мес',
};

const STAT_CARD_MODE_OPTIONS = (
  Object.entries(STAT_CARD_MODE_LABELS) as [StatCardMode, string][]
).map(([value, label]) => ({ value, label }));

const DOT_GRID_CELL_SHAPE_OPTIONS: { value: DotGridCellShape; label: string }[] = [
  { value: 'circle', label: '● Кружки' },
  { value: 'heart', label: '♥ Сердечки' },
];

const MILESTONES_LAYOUT_OPTIONS: { value: MilestonesLayout; label: string }[] = [
  { value: 'spine', label: MILESTONES_LAYOUT_LABELS.spine },
  { value: 'checklist', label: MILESTONES_LAYOUT_LABELS.checklist },
  ...(FEATURES.milestonesChipsLayout
    ? [{ value: 'chips' as const, label: MILESTONES_LAYOUT_LABELS.chips }]
    : []),
];

const MILESTONES_LAYOUT_HINTS: Record<'spine' | 'checklist' | 'chips', string> = {
  spine: 'Показывает все события и праздники в сроке службы',
  checklist: 'Только армейские события',
  chips: 'Карточки событий с горизонтальной прокруткой',
};

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((value) => ({
  value,
  label: String(value),
}));

/** Дать React отрисовать overlay до тяжёлой работы */
function waitForOverlayPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function TimerSettingsScreen({ navigation }: Props) {
  const {
    settings,
    updateSettings,
    activeTimer,
    progress,
    passedBreakdown,
    remainingBreakdown,
  } = useServiceTimer({ tick: false });
  const timerUpcoming = useTimerUpcoming(settings);
  const reloadUpcoming = timerUpcoming.reload;
  const profile = useProfile();
  const reloadProfile = profile.reload;
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [userName, setUserName] = useState(profile.userName);
  const [partnerName, setPartnerName] = useState(profile.partnerName);
  const [enlistmentDate, setEnlistmentDate] = useState<Date | null>(profile.enlistmentDate);
  const [demobilizationDate, setDemobilizationDate] = useState<Date | null>(
    profile.demobilizationDate,
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(
    peekNotificationsEnabled,
  );
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [stickerExport, setStickerExport] = useState<'card' | 'withEvent' | null>(null);
  const stickerRef = useRef<View>(null);
  const stickerSizeRef = useRef({ width: 0, height: 0 });
  const windowSize = Dimensions.get('window');
  const stickerWidth = windowSize.width - 48;
  const theme = useAppTheme();
  const settingsScrollY = useSharedValue(0);
  const settingsContentHeight = useSharedValue(0);
  const settingsViewportHeight = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      void reloadProfile();
      void reloadUpcoming();
      void readNotificationsEnabled().then(setNotificationsEnabled);
    }, [reloadProfile, reloadUpcoming]),
  );

  useEffect(() => {
    setUserName(profile.userName);
    setPartnerName(profile.partnerName);
    setEnlistmentDate(profile.enlistmentDate);
    setDemobilizationDate(profile.demobilizationDate);
  }, [profile.userName, profile.partnerName, profile.enlistmentDate, profile.demobilizationDate]);

  const statCardMode = settings.statCardMode ?? DEFAULT_TIMER_SETTINGS.statCardMode;
  const isFrameTimer = settings.timerType === 'frame';
  const isDotGridTimer = settings.timerType === 'dotGrid';
  const isMilestonesTimer = settings.timerType === 'milestones';
  const progressModeOptions = getProgressBarModeOptions(settings.timerType).map((option) => ({
    value: option.value,
    label: PROGRESS_BAR_SEGMENT_LABELS[option.value] ?? option.label,
  }));
  const safeProgressBarMode = normalizeProgressBarMode(
    settings.timerType,
    settings.progressBarMode,
  );
  const pinnedRef = (settings.timerUpcomingPinnedRef ??
    timerUpcoming.pinOptions[0]?.value ??
    'event:predefined-enlistment') as TimerUpcomingRef;

  const handleTimerTypeChange = (timerType: TimerType) => {
    updateSettings({
      timerType,
      progressBarMode: normalizeProgressBarMode(
        timerType,
        defaultProgressBarModeForTimerType(timerType),
      ),
    });
  };

  const handleSaveNames = async () => {
    const ok = await profile.saveNames(userName, partnerName);
    Alert.alert(ok ? 'Сохранено' : 'Ошибка', ok ? 'Имена обновлены' : 'Введите оба имени');
  };

  const handleNotificationsToggle = async (next: boolean) => {
    if (isUpdatingNotifications) {
      return;
    }
    setIsUpdatingNotifications(true);
    setNotificationsEnabled(next);
    try {
      const result = await applyAppNotificationsPreference(next);
      if (next && result === 'denied') {
        setNotificationsEnabled(false);
        Alert.alert(
          'Нет доступа',
          'Разрешите уведомления в настройках телефона или попробуйте снова',
        );
        return;
      }
      if (next && result === 'unavailable') {
        setNotificationsEnabled(false);
        Alert.alert(
          'Недоступно',
          'Уведомления работают в сборке приложения с нативным модулем',
        );
      }
    } catch (error) {
      logger.error('Ошибка переключения уведомлений', error);
      setNotificationsEnabled(!next);
      Alert.alert('Ошибка', 'Не удалось изменить настройку уведомлений');
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleSaveDates = async () => {
    if (!enlistmentDate || !demobilizationDate) {
      Alert.alert('Укажите обе даты');
      return;
    }
    if (FEATURES.timerSettingsSaveDatesOverlay) {
      setIsSavingDates(true);
      await waitForOverlayPaint();
    }
    try {
      const error = await profile.saveDates(enlistmentDate, demobilizationDate);
      Alert.alert(error ? 'Ошибка' : 'Сохранено', error ?? 'Даты службы обновлены');
    } finally {
      if (FEATURES.timerSettingsSaveDatesOverlay) {
        setIsSavingDates(false);
      }
    }
  };

  const exportSticker = async (includeEvent: boolean) => {
    if (!isViewShotAvailable()) {
      Alert.alert('Ошибка', 'Не удалось подготовить картинку');
      return;
    }

    if (!activeTimer || !progress || !passedBreakdown || !remainingBreakdown) {
      Alert.alert('Подождите', 'Таймер ещё не готов');
      return;
    }

    if (includeEvent && !timerUpcoming.item) {
      Alert.alert(
        'Нет события',
        'Включите «Событие на таймере» — ближайшее или закреплённое. Тогда его можно выгрузить вместе с плашкой.',
      );
      return;
    }

    stickerSizeRef.current = { width: 0, height: 0 };
    setStickerExport(includeEvent ? 'withEvent' : 'card');
    try {
      let size: { width: number; height: number } | null = null;
      for (let attempt = 0; attempt < 10 && !size; attempt += 1) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, attempt === 0 ? 80 : 40);
        });
        const measured = stickerSizeRef.current;
        if (measured.width > 1 && measured.height > 1) {
          size = { width: measured.width, height: measured.height };
        }
      }

      if (!size) {
        Alert.alert('Ошибка', 'Не удалось подготовить картинку');
        return;
      }

      await shareTimerImage(stickerRef, {
        captureSize: size,
        alertTitle: includeEvent ? 'Плашка и событие' : 'Плашка',
        alertMessage: 'Сохранить в галерею или отправить',
        shareDialogTitle: includeEvent ? 'Плашка и событие' : 'Плашка',
      });
    } finally {
      setStickerExport(null);
    }
  };

  const handleExportSticker = () => {
    Alert.alert('Выгрузить плашку', 'Что положить в картинку?', [
      { text: 'Только плашку', onPress: () => void exportSticker(false) },
      { text: 'Плашку и событие', onPress: () => void exportSticker(true) },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Удалить все данные?',
      'Сотрутся таймер, дневник, звонки, встречи, фото, аудио и код дневника. Приложение вернётся к первому запуску. Это нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                clearProfileSnapshot();
                clearTimerSettingsCache();
                await resetAllData();
                await rescheduleAppNotifications();
                await reloadAppSession();
              } catch (error) {
                logger.error('Ошибка полного сброса данных', error);
                Alert.alert('Ошибка', 'Не удалось удалить данные. Попробуйте ещё раз');
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <Feather name="chevron-left" size={28} color={theme.text.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Настройки таймера
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.scrollWrap}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) => {
              settingsScrollY.value = event.nativeEvent.contentOffset.y;
            }}
            onContentSizeChange={(_width, height) => {
              settingsContentHeight.value = height;
            }}
            onLayout={(event) => {
              settingsViewportHeight.value = event.nativeEvent.layout.height;
            }}
            keyboardShouldPersistTaps="handled"
          >
          <TimerSettingsNamesSection
            theme={theme}
            userName={userName}
            partnerName={partnerName}
            onChangeUserName={setUserName}
            onChangePartnerName={setPartnerName}
            onSave={() => void handleSaveNames()}
          />
          <TimerSettingsDatesSection
            theme={theme}
            enlistmentDate={enlistmentDate}
            demobilizationDate={demobilizationDate}
            isSaving={isSavingDates}
            onChangeEnlistment={setEnlistmentDate}
            onChangeDemobilization={setDemobilizationDate}
            onSave={() => void handleSaveDates()}
          />
          <TimerSettingsDisplaySection
            theme={theme}
            settings={settings}
            notificationsEnabled={notificationsEnabled}
            isUpdatingNotifications={isUpdatingNotifications}
            isDotGridTimer={isDotGridTimer}
            isFrameTimer={isFrameTimer}
            isMilestonesTimer={isMilestonesTimer}
            safeProgressBarMode={safeProgressBarMode}
            progressModeOptions={progressModeOptions}
            statCardMode={statCardMode}
            pinnedRef={pinnedRef}
            pinOptions={timerUpcoming.pinOptions}
            cellShapeOptions={DOT_GRID_CELL_SHAPE_OPTIONS}
            milestonesOptions={MILESTONES_LAYOUT_OPTIONS}
            milestonesHints={MILESTONES_LAYOUT_HINTS}
            upcomingOptions={UPCOMING_PREVIEW_OPTIONS}
            statCardOptions={STAT_CARD_MODE_OPTIONS}
            decimalOptions={DECIMAL_OPTIONS}
            onToggleNotifications={(value) => void handleNotificationsToggle(value)}
            onOpenThemes={() => navigation.navigate('ColorThemes')}
            onOpenPhoto={() => navigation.navigate('TimerPhoto')}
            onTimerTypeChange={handleTimerTypeChange}
            onUpdateSettings={updateSettings}
          />
          <TimerSettingsActionsSection
            theme={theme}
            exportDisabled={stickerExport != null}
            onExport={handleExportSticker}
            onDeleteAll={handleDeleteAllData}
          />

          </ScrollView>
          <ScrollRail
            axis="vertical"
            scrollOffset={settingsScrollY}
            contentLength={settingsContentHeight}
            viewportLength={settingsViewportHeight}
            trackColor={theme.overlay.border}
            thumbColor={theme.text.secondary}
            style={styles.vScrollRail}
          />
        </View>
      </SafeAreaView>

      {stickerExport && activeTimer && progress && passedBreakdown && remainingBreakdown ? (
        <View pointerEvents="none" style={styles.stickerHost} collapsable={false}>
          <View
            ref={stickerRef}
            collapsable={false}
            style={{ width: stickerWidth, backgroundColor: 'transparent' }}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              stickerSizeRef.current = { width, height };
            }}
          >
            <TimerStickerSheet
              includeEvent={stickerExport === 'withEvent'}
              item={timerUpcoming.item}
              glyph={
                timerUpcoming.item
                  ? timerUpcoming.item.kind === 'event'
                    ? getEventGlyph(timerUpcoming.item.event)
                    : getHolidayGlyph(timerUpcoming.item.holiday)
                  : null
              }
              omitDemobilizationCountdown={shouldOmitDemobilizationCountdown(
                settings.timerType,
                settings.progressBarMode,
                statCardMode,
              )}
              phase={progress.phase}
              statCardMode={statCardMode}
              kind={activeTimer.kind}
              daysPassed={progress.daysPassed}
              daysLeft={progress.daysLeft}
              monthsPassed={progress.monthsPassed}
              monthDaysPassed={progress.monthDaysPassed}
              monthsLeft={progress.monthsLeft}
              monthDaysLeft={progress.monthDaysLeft}
              passed={passedBreakdown}
              remaining={remainingBreakdown}
            />
          </View>
        </View>
      ) : null}

      {FEATURES.timerSettingsSaveDatesOverlay && isSavingDates ? (
        <View
          style={[styles.savingOverlay, { backgroundColor: theme.overlay.muted }]}
          accessibilityLiveRegion="polite"
          accessibilityLabel="Сохранение дат"
        >
          <View
            style={[
              styles.savingCard,
              {
                backgroundColor: theme.overlay.fill,
                borderColor: theme.overlay.border,
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.text.primary} />
            <Text style={[styles.savingLabel, { color: theme.text.primary }]}>Сохранение…</Text>
          </View>
        </View>
      ) : null}

    </View>
  );
}
