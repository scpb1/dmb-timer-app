import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { TimerUpcomingCard } from '@/components/timer/TimerUpcomingCard';
import { TimerLiveStatCards } from '@/components/timer/TimerLiveStatCards';
import { TimerSwitcher } from '@/components/timer/TimerSwitcher';
import { PositionedCoverImage } from '@/components/common/PositionedCoverImage';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { SandboxModeBanner } from '@/components/common/SandboxModeBanner';
import { useServiceSummaryAutoOpen } from '@/hooks/useServiceSummaryAutoOpen';
import { useServiceTimer } from '@/hooks/useServiceTimer';
import { warmProfileSnapshot } from '@/hooks/useProfile';
import { useTimerUpcoming } from '@/hooks/useTimerUpcoming';
import { useDatabaseProfile } from '@/hooks/useDatabaseProfile';
import type { HomeStackParamList } from '@/types/navigation';
import { FEATURES } from '@/constants';
import {
  DEFAULT_TIMER_SETTINGS,
  PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN,
  type CustomTimerRecord,
} from '@/types/timer';
import { isServiceAfterEnd } from '@/utils/serviceSummary';
import {
  getCenterDisplayLabels,
  getFrameDisplayValues,
  getLinearDisplayValues,
} from '@/utils/timerCalculations';
import { getEventGlyph, getHolidayGlyph } from '@/utils/eventGlyphs';
import {
  formatTimerVizUpcomingHeadline,
  shouldOmitDemobilizationCountdown,
} from '@/utils/timerUpcoming';
import { buildDefaultEventsChecklistItems } from '@/utils/eventsTimeline';
import { shareTimerImage } from '@/utils/shareTimerImage';
import { incrementTimerVisitCount } from '@/utils/timerVisitCount';
import { isViewShotAvailable } from '@/utils/nativeAvailability';
import { HomeScreenOverlays } from '@/screens/home/HomeScreenOverlays';
import { HomeTimerStage } from '@/screens/home/HomeTimerStage';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { getBackgroundScrimColor } from '@/utils/timerBackground';

type Props = StackScreenProps<HomeStackParamList, 'HomeMain'> & {
  onResetToOnboarding: () => void;
};

export function HomeScreen({ navigation }: Props) {
  const {
    isLoading,
    settings,
    progress,
    centerDisplay,
    passedBreakdown,
    remainingBreakdown,
    customTimers,
    notificationDisabledIds,
    activeTimer,
    partnerName,
    enlistmentDate,
    demobilizationDate,
    reload,
    updateSettings,
    setActiveTimerId,
    setTimerNotificationsEnabled,
    addCustomTimer,
    updateCustomTimer,
    deleteCustomTimer,
  } = useServiceTimer();
  const databaseProfile = useDatabaseProfile();
  const timerUpcoming = useTimerUpcoming(settings);
  const reloadUpcoming = timerUpcoming.reload;

  useFocusEffect(
    useCallback(() => {
      reload();
      void reloadUpcoming();
      void incrementTimerVisitCount();
      void warmProfileSnapshot();
    }, [reload, reloadUpcoming]),
  );

  const [showStats, setShowStats] = useState(true);
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [letterBookVisible, setLetterBookVisible] = useState(false);
  const [editingTimer, setEditingTimer] = useState<CustomTimerRecord | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSharingArmyChecklist, setIsSharingArmyChecklist] = useState(false);
  const [armyChecklistShowDates, setArmyChecklistShowDates] = useState(false);
  const shareRef = useRef<View>(null);
  const armyChecklistShareRef = useRef<View>(null);
  const { width: shareWidth, height: shareHeight } = Dimensions.get('window');

  useServiceSummaryAutoOpen(demobilizationDate, () => setSummaryVisible(true));

  const theme = useAppTheme();
  const statCardMode = settings.statCardMode ?? DEFAULT_TIMER_SETTINGS.statCardMode;
  const hasPhotoBackground = Boolean(settings.backgroundImageUri);
  const foregroundColor = hasPhotoBackground ? '#F2F0EC' : theme.text.primary;
  const phase = progress?.phase ?? 'active';
  const isFrameTimer = settings.timerType === 'frame';
  const isDotGridTimer = settings.timerType === 'dotGrid';
  const isMilestonesTimer = settings.timerType === 'milestones';
  const isVizTimer = isDotGridTimer || isMilestonesTimer;
  const canSwitchCenterDisplay = phase === 'active';
  const photoUpcomingCardBorder = FEATURES.showPhotoElementBorderSwitches
    ? settings.photoUpcomingCardBorder
    : PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN.photoUpcomingCardBorder;
  const photoStatCardBorder = FEATURES.showPhotoElementBorderSwitches
    ? settings.photoStatCardBorder
    : PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN.photoStatCardBorder;
  const showPhotoUpcomingBorder = !hasPhotoBackground || photoUpcomingCardBorder;
  const showPhotoStatBorder = !hasPhotoBackground || photoStatCardBorder;
  const showStatCards =
    showStats && !isFrameTimer && !(isDotGridTimer && phase === 'active');
  const showUpcomingCard =
    !isFrameTimer &&
    !isDotGridTimer &&
    !isMilestonesTimer &&
    settings.timerUpcomingPreview !== 'off' &&
    timerUpcoming.item != null;
  const frameUpcoming = timerUpcoming.frameItem;
  const upcomingGlyphFor = (upcoming: typeof timerUpcoming.item) =>
    upcoming
      ? upcoming.kind === 'event'
        ? getEventGlyph(upcoming.event)
        : getHolidayGlyph(upcoming.holiday)
      : null;
  const upcomingGlyph = upcomingGlyphFor(timerUpcoming.item);
  const frameUpcomingGlyph = upcomingGlyphFor(frameUpcoming);
  const omitDemobilizationCountdown = shouldOmitDemobilizationCountdown(
    settings.timerType,
    settings.progressBarMode,
    statCardMode,
  );
  const headlineClock = `${progress?.phase ?? ''}:${progress?.daysPassed ?? ''}`;
  const vizUpcomingHeadline = useMemo(() => {
    if (!isVizTimer || settings.timerUpcomingPreview === 'off' || !timerUpcoming.item) {
      return null;
    }
    const headlineAt = new Date(headlineClock ? Date.now() : Date.now());
    return formatTimerVizUpcomingHeadline(
      timerUpcoming.item,
      headlineAt,
      omitDemobilizationCountdown,
    );
  }, [
    headlineClock,
    isVizTimer,
    omitDemobilizationCountdown,
    settings.timerUpcomingPreview,
    timerUpcoming.item,
  ]);
  const showServiceSummaryButton = Boolean(
    enlistmentDate &&
      demobilizationDate &&
      isServiceAfterEnd(enlistmentDate, demobilizationDate),
  );

  const armyChecklistShareItems = useMemo(() => {
    if (!activeTimer || timerUpcoming.defaultListEventIds.length === 0) {
      return [];
    }
    return buildDefaultEventsChecklistItems(
      timerUpcoming.events,
      timerUpcoming.defaultListEventIds,
      { start: activeTimer.startDate, end: activeTimer.endDate },
    );
  }, [
    activeTimer,
    timerUpcoming.defaultListEventIds,
    timerUpcoming.events,
  ]);

  const exportArmyChecklistImage = async (showDates: boolean) => {
    setArmyChecklistShowDates(showDates);
    setIsSharingArmyChecklist(true);
    try {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, hasPhotoBackground ? 420 : 220);
      });
      await shareTimerImage(armyChecklistShareRef, {
        alertTitle: 'Чеклист армейских событий',
        alertMessage: 'Сохранить в галерею или отправить',
        shareDialogTitle: 'Чеклист армейских событий',
      });
    } finally {
      setIsSharingArmyChecklist(false);
    }
  };

  const handleDownloadArmyChecklist = () => {
    if (!isViewShotAvailable()) {
      Alert.alert('Ошибка', 'Не удалось подготовить картинку');
      return;
    }

    if (armyChecklistShareItems.length === 0) {
      Alert.alert('Нет событий', 'В списке по умолчанию нет событий для чеклиста');
      return;
    }

    Alert.alert('Чеклист армейских событий', 'Добавить даты под названиями?', [
      {
        text: 'С датами',
        onPress: () => {
          void exportArmyChecklistImage(true);
        },
      },
      {
        text: 'Без дат',
        onPress: () => {
          void exportArmyChecklistImage(false);
        },
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const handleShare = async () => {
    if (!isViewShotAvailable()) {
      Alert.alert('Ошибка', 'Не удалось поделиться картинкой');
      return;
    }

    if (!activeTimer || !progress || !centerDisplay || !passedBreakdown || !remainingBreakdown) {
      Alert.alert('Подождите', 'Таймер ещё не готов');
      return;
    }

    setIsSharing(true);
    try {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, hasPhotoBackground ? 420 : 220);
      });
      await shareTimerImage(shareRef);
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.text.primary} />
        </View>
      </View>
    );
  }

  const filledCount = progress?.filledSegments[settings.progressBarMode] ?? 0;
  const segmentCount = progress?.segmentCounts[settings.progressBarMode] ?? 1;
  const linearDisplay =
    progress && settings.timerType === 'linear'
      ? getLinearDisplayValues(
          settings.progressBarMode,
          progress,
          settings.percentDecimalPlaces,
          settings.centerDisplay,
          activeTimer ? getCenterDisplayLabels(activeTimer.kind) : undefined,
        )
      : null;

  const frameDisplay =
    progress && activeTimer
      ? getFrameDisplayValues(
          progress,
          settings.centerDisplay,
          getCenterDisplayLabels(activeTimer.kind),
        )
      : null;

  const upcomingCard =
    showUpcomingCard && timerUpcoming.item && upcomingGlyph ? (
      <TimerUpcomingCard
        item={timerUpcoming.item}
        glyph={upcomingGlyph}
        photoBackground={hasPhotoBackground}
        showBorder={showPhotoUpcomingBorder}
        omitDemobilizationCountdown={omitDemobilizationCountdown}
      />
    ) : null;

  const statCards = showStatCards ? (
    <TimerLiveStatCards
      startDate={activeTimer?.startDate ?? null}
      endDate={activeTimer?.endDate ?? null}
      progress={progress}
      phase={phase}
      statCardMode={statCardMode}
      timerKind={activeTimer?.kind ?? 'service'}
      photoBackground={hasPhotoBackground}
      showBorder={showPhotoStatBorder}
    />
  ) : null;

  const upcomingAndStatCards =
    upcomingCard && statCards ? (
      <View style={styles.upcomingStatsGroup}>
        {upcomingCard}
        {statCards}
      </View>
    ) : (
      <>
        {upcomingCard}
        {statCards}
      </>
    );

  return (
    <View style={styles.root}>
      {settings.backgroundImageUri ? (
        <>
          <PositionedCoverImage
            uri={settings.backgroundImageUri}
            focusX={settings.backgroundFocusX}
            focusY={settings.backgroundFocusY}
            style={styles.backgroundImage}
            cached
          />
          <View
            style={[
              styles.backgroundScrim,
              { backgroundColor: getBackgroundScrimColor(settings.backgroundDim) },
            ]}
          />
        </>
      ) : (
        <ScreenBackground />
      )}

      <SafeAreaView style={styles.container} edges={['top']}>
        {databaseProfile === 'sandbox' ? (
          <View style={styles.sandboxBannerWrap}>
            <SandboxModeBanner />
          </View>
        ) : null}
        <View style={styles.topBar}>
          <View style={styles.topBarCenter} pointerEvents="box-none">
            <TimerSwitcher
              activeTimer={activeTimer}
              serviceTimerName={partnerName.trim() || 'Служба'}
              customTimers={customTimers}
              notificationDisabledIds={notificationDisabledIds}
              photoBackground={hasPhotoBackground}
              onSelect={(id) => {
                void (async () => {
                  await setActiveTimerId(id);
                  void timerUpcoming.reload();
                })();
              }}
              onAdd={() => {
                setEditingTimer(null);
                setTimerModalVisible(true);
              }}
              onEdit={(timer) => {
                setEditingTimer(timer);
                setTimerModalVisible(true);
              }}
              onToggleNotifications={(id, enabled) => {
                void setTimerNotificationsEnabled(id, enabled);
              }}
            />
          </View>

          <View style={styles.topBarSide}>
            <Pressable
              style={styles.iconButton}
              onPress={() => navigation.navigate('TimerSettings')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Настройки"
            >
              <MaterialCommunityIcons name="cog-outline" size={26} color={foregroundColor} />
            </Pressable>

            <Pressable
              style={styles.iconButton}
              onPress={() => setShowStats((prev) => !prev)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={showStats ? 'Скрыть плашки таймера' : 'Показать плашки таймера'}
              accessibilityState={{ selected: showStats }}
            >
              <MaterialCommunityIcons
                name={showStats ? 'eye' : 'eye-off'}
                size={26}
                color={foregroundColor}
              />
            </Pressable>
          </View>

          {!isMilestonesTimer ? (
            <View style={styles.topBarSideRight}>
              <Pressable
                style={styles.iconButton}
                onPress={() => void handleShare()}
                hitSlop={12}
                disabled={isSharing}
                accessibilityRole="button"
                accessibilityLabel="Поделиться картинкой таймера"
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color={foregroundColor} />
                ) : (
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={24}
                    color={foregroundColor}
                  />
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        <HomeTimerStage
          styles={styles}
          theme={theme}
          settings={settings}
          activeTimer={activeTimer}
          progress={progress}
          centerDisplay={centerDisplay}
          linearDisplay={linearDisplay}
          frameDisplay={frameDisplay}
          segmentCount={segmentCount}
          filledCount={filledCount}
          hasPhotoBackground={hasPhotoBackground}
          canSwitchCenterDisplay={canSwitchCenterDisplay}
          isDotGridTimer={isDotGridTimer}
          isMilestonesTimer={isMilestonesTimer}
          isFrameTimer={isFrameTimer}
          vizUpcomingHeadline={vizUpcomingHeadline}
          frameUpcoming={frameUpcoming}
          frameUpcomingGlyph={frameUpcomingGlyph}
          omitDemobilizationCountdown={omitDemobilizationCountdown}
          events={timerUpcoming.events}
          holidays={timerUpcoming.holidays}
          defaultListEventIds={timerUpcoming.defaultListEventIds}
          isSharingArmyChecklist={isSharingArmyChecklist}
          foregroundColor={foregroundColor}
          belowTimer={upcomingAndStatCards}
          showServiceSummaryButton={showServiceSummaryButton}
          onCenterDisplayChange={(nextDisplay) => updateSettings({ centerDisplay: nextDisplay })}
          onDownloadArmyChecklist={handleDownloadArmyChecklist}
          onOpenSummary={() => setSummaryVisible(true)}
        />
      </SafeAreaView>

      <HomeScreenOverlays
        timerModalVisible={timerModalVisible}
        editingTimer={editingTimer}
        onCloseTimerModal={() => setTimerModalVisible(false)}
        onSaveTimer={async (input) => {
          const ok = editingTimer
            ? await updateCustomTimer(editingTimer.id, input)
            : await addCustomTimer(input);
          if (ok) {
            void timerUpcoming.reload();
          }
          return ok;
        }}
        onDeleteTimer={
          editingTimer
            ? async () => {
                await deleteCustomTimer(editingTimer.id);
                void timerUpcoming.reload();
              }
            : undefined
        }
        summaryVisible={summaryVisible}
        partnerName={partnerName}
        enlistmentDate={enlistmentDate}
        demobilizationDate={demobilizationDate}
        onCloseSummary={() => setSummaryVisible(false)}
        onOpenLetterBook={() => {
          setSummaryVisible(false);
          setLetterBookVisible(true);
        }}
        letterBookVisible={letterBookVisible}
        onCloseLetterBook={() => setLetterBookVisible(false)}
        isSharingArmyChecklist={isSharingArmyChecklist}
        armyChecklistShareItems={armyChecklistShareItems}
        shareWidth={shareWidth}
        shareHeight={shareHeight}
        armyChecklistShareRef={armyChecklistShareRef}
        settings={settings}
        armyChecklistShowDates={armyChecklistShowDates}
        isSharing={isSharing}
        activeTimer={activeTimer}
        progress={progress}
        centerDisplay={centerDisplay}
        passedBreakdown={passedBreakdown}
        remainingBreakdown={remainingBreakdown}
        shareRef={shareRef}
        frameUpcoming={frameUpcoming}
        frameUpcomingGlyph={frameUpcomingGlyph}
        upcoming={showUpcomingCard ? timerUpcoming.item : null}
        upcomingGlyph={showUpcomingCard ? upcomingGlyph : null}
        showStatCards={showStatCards}
        timelineEvents={timerUpcoming.events}
        timelineHolidays={timerUpcoming.holidays}
        timelineDefaultListEventIds={timerUpcoming.defaultListEventIds}
        timelineUpcoming={timerUpcoming.item}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    paddingBottom: 96,
  },
  sandboxBannerWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 48,
  },
  topBarCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSide: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 88,
    zIndex: 3,
  },
  topBarSideRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 88,
    zIndex: 3,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 32,
  },
  scrollContentViz: {
    justifyContent: 'flex-start',
    gap: 20,
  },
  scrollContentDotGrid: {
    justifyContent: 'center',
    gap: 20,
  },
  upcomingStatsGroup: {
    alignSelf: 'stretch',
    flexShrink: 0,
    gap: 16,
  },
  summaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 4,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  summaryButtonPhoto: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(242, 240, 236, 0.38)',
  },
  summaryButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
  },
  summaryButtonPhotoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
