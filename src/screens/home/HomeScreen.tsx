import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { ExtraTimerFormModal } from '@/components/timer/ExtraTimerFormModal';
import { FramedTimerDisplay } from '@/components/timer/FramedTimerDisplay';
import { SegmentedCircularProgress } from '@/components/timer/SegmentedCircularProgress';
import { SegmentedLinearProgress } from '@/components/timer/SegmentedLinearProgress';
import { TimerDotGridDisplay } from '@/components/timer/TimerDotGridDisplay';
import { TimerMilestonesTimelineDisplay } from '@/components/timer/TimerMilestonesTimelineDisplay';
import { TimerUpcomingCard } from '@/components/timer/TimerUpcomingCard';
import { ServiceSummaryModal } from '@/components/timer/ServiceSummaryModal';
import { LetterBookExportModal } from '@/components/diary/LetterBookExportModal';
import { ArmyEventsChecklistShareCard } from '@/components/timer/ArmyEventsChecklistShareCard';
import { TimerShareCard } from '@/components/timer/TimerShareCard';
import { TimerStatCard } from '@/components/timer/TimerStatCard';
import { TimerUnifiedStatCard } from '@/components/timer/TimerUnifiedStatCard';
import { TimerSwitcher } from '@/components/timer/TimerSwitcher';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { SandboxModeBanner } from '@/components/common/SandboxModeBanner';
import { useServiceSummaryAutoOpen } from '@/hooks/useServiceSummaryAutoOpen';
import { useServiceTimer } from '@/hooks/useServiceTimer';
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
  getPhaseCardTitle,
  getStatCardDisplay,
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
    activeTimer,
    partnerName,
    enlistmentDate,
    demobilizationDate,
    reload,
    updateSettings,
    setActiveTimerId,
    addCustomTimer,
    updateCustomTimer,
    deleteCustomTimer,
  } = useServiceTimer();
  const databaseProfile = useDatabaseProfile();
  const timerUpcoming = useTimerUpcoming(settings);

  useFocusEffect(
    useCallback(() => {
      reload();
      void timerUpcoming.reload();
      void incrementTimerVisitCount();
    }, [reload, timerUpcoming.reload]),
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
  const vizUpcomingHeadline =
    isVizTimer &&
    settings.timerUpcomingPreview !== 'off' &&
    timerUpcoming.item
      ? formatTimerVizUpcomingHeadline(
          timerUpcoming.item,
          new Date(),
          omitDemobilizationCountdown,
        )
      : null;
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

  const phaseCardTitle = activeTimer
    ? getPhaseCardTitle(phase, activeTimer.kind)
    : 'осталось';
  const phaseBreakdown = phase === 'before' ? remainingBreakdown : passedBreakdown;
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

  const statCards =
    showStatCards && phase !== 'active' && phaseBreakdown ? (
      <View style={styles.statsRow}>
        <TimerStatCard
          title={phaseCardTitle}
          display={getStatCardDisplay(phaseBreakdown, statCardMode, {
            phase,
            kind: activeTimer?.kind ?? 'service',
          })}
          photoBackground={hasPhotoBackground}
          showBorder={showPhotoStatBorder}
        />
      </View>
    ) : showStatCards && phase === 'active' && passedBreakdown && remainingBreakdown ? (
      <View style={styles.statsRow}>
        <TimerUnifiedStatCard
          elapsed={getStatCardDisplay(passedBreakdown, statCardMode)}
          remaining={getStatCardDisplay(remainingBreakdown, statCardMode)}
          photoBackground={hasPhotoBackground}
          showBorder={showPhotoStatBorder}
        />
      </View>
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
          <Image
            source={{ uri: settings.backgroundImageUri }}
            style={styles.backgroundImage}
            resizeMode="cover"
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
              photoBackground={hasPhotoBackground}
              onSelect={(id) => void setActiveTimerId(id)}
              onAdd={() => {
                setEditingTimer(null);
                setTimerModalVisible(true);
              }}
              onEdit={(timer) => {
                setEditingTimer(timer);
                setTimerModalVisible(true);
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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isMilestonesTimer && styles.scrollContentViz,
            isDotGridTimer && styles.scrollContentDotGrid,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {settings.timerType === 'circular' && centerDisplay && progress ? (
            <SegmentedCircularProgress
              key={activeTimer?.id ?? 'circular'}
              segmentCount={segmentCount}
              filledCount={filledCount}
              primaryValue={centerDisplay.primaryValue}
              secondaryValue={centerDisplay.secondaryValue}
              unitLabel={centerDisplay.unitLabel}
              progressBarMode={settings.progressBarMode}
              percentDecimalPlaces={settings.percentDecimalPlaces}
              photoBackground={hasPhotoBackground}
              centerDisplay={settings.centerDisplay}
              onCenterDisplayChange={
                canSwitchCenterDisplay
                  ? (nextDisplay) => updateSettings({ centerDisplay: nextDisplay })
                  : undefined
              }
            />
          ) : null}

          {settings.timerType === 'linear' && linearDisplay && progress ? (
            <SegmentedLinearProgress
              key={activeTimer?.id ?? 'linear'}
              mode={settings.progressBarMode}
              segmentCount={segmentCount}
              filledCount={filledCount}
              display={linearDisplay}
              centerDisplay={settings.centerDisplay}
              onCenterDisplayChange={
                canSwitchCenterDisplay
                  ? (centerDisplayValue) => updateSettings({ centerDisplay: centerDisplayValue })
                  : undefined
              }
              photoBackground={hasPhotoBackground}
            />
          ) : null}

          {isDotGridTimer && activeTimer && progress ? (
            <TimerDotGridDisplay
              key={activeTimer.id ?? 'dotGrid'}
              mode={settings.progressBarMode}
              progress={progress}
              endDate={activeTimer.endDate}
              decimalPlaces={settings.percentDecimalPlaces}
              timerKind={activeTimer.kind}
              cellShape={settings.dotGridCellShape}
              photoBackground={hasPhotoBackground}
              upcomingHeadline={vizUpcomingHeadline}
            />
          ) : null}

          {isMilestonesTimer && activeTimer && progress ? (
            <TimerMilestonesTimelineDisplay
              key={activeTimer.id ?? 'milestones'}
              progress={progress}
              startDate={activeTimer.startDate}
              endDate={activeTimer.endDate}
              decimalPlaces={settings.percentDecimalPlaces}
              timerKind={activeTimer.kind}
              photoBackground={hasPhotoBackground}
              upcomingHeadline={vizUpcomingHeadline}
              events={timerUpcoming.events}
              holidays={timerUpcoming.holidays}
              defaultListEventIds={timerUpcoming.defaultListEventIds}
              layout={settings.milestonesLayout}
              onDownloadArmyChecklist={
                settings.milestonesLayout === 'checklist'
                  ? handleDownloadArmyChecklist
                  : undefined
              }
              isDownloadingArmyChecklist={isSharingArmyChecklist}
            />
          ) : null}

          {isFrameTimer && frameDisplay && progress ? (
            <FramedTimerDisplay
              key={activeTimer?.id ?? 'frame'}
              primaryValue={frameDisplay.primaryValue}
              unitLabel={frameDisplay.unitLabel}
              upcoming={frameUpcoming}
              glyph={frameUpcomingGlyph}
              photoBackground={hasPhotoBackground}
              centerDisplay={settings.centerDisplay}
              onCenterDisplayChange={
                canSwitchCenterDisplay && frameDisplay.allowCenterToggle
                  ? (centerDisplayValue) => updateSettings({ centerDisplay: centerDisplayValue })
                  : undefined
              }
              omitDemobilizationCountdown={omitDemobilizationCountdown}
            />
          ) : null}

          {upcomingAndStatCards}

          {showServiceSummaryButton ? (
            <Pressable
              style={[styles.summaryButton, hasPhotoBackground && styles.summaryButtonPhoto]}
              onPress={() => setSummaryVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Итоги службы"
            >
              <MaterialCommunityIcons
                name="chart-box-outline"
                size={22}
                color={foregroundColor}
              />
              <Text
                style={[
                  styles.summaryButtonText,
                  { color: theme.text.primary },
                  hasPhotoBackground && styles.summaryButtonPhotoText,
                ]}
              >
                Итоги
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <ExtraTimerFormModal
        visible={timerModalVisible}
        timer={editingTimer}
        onClose={() => setTimerModalVisible(false)}
        onSave={(input) =>
          editingTimer ? updateCustomTimer(editingTimer.id, input) : addCustomTimer(input)
        }
        onDelete={
          editingTimer
            ? () => deleteCustomTimer(editingTimer.id)
            : undefined
        }
      />

      <ServiceSummaryModal
        visible={summaryVisible}
        partnerName={partnerName}
        enlistmentDate={enlistmentDate}
        demobilizationDate={demobilizationDate}
        onClose={() => setSummaryVisible(false)}
        onOpenLetterBook={() => {
          setSummaryVisible(false);
          setLetterBookVisible(true);
        }}
      />

      <LetterBookExportModal
        visible={letterBookVisible}
        onClose={() => setLetterBookVisible(false)}
      />

      {isSharingArmyChecklist && armyChecklistShareItems.length > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.sharePoster, { width: shareWidth, height: shareHeight }]}
          collapsable={false}
        >
          <View
            ref={armyChecklistShareRef}
            collapsable={false}
            style={{ width: shareWidth, height: shareHeight }}
          >
            <ArmyEventsChecklistShareCard
              width={shareWidth}
              height={shareHeight}
              settings={settings}
              items={armyChecklistShareItems}
              showEventDates={armyChecklistShowDates}
            />
          </View>
        </View>
      ) : null}

      {isSharing &&
      activeTimer &&
      progress &&
      centerDisplay &&
      passedBreakdown &&
      remainingBreakdown ? (
        <View
          pointerEvents="none"
          style={[styles.sharePoster, { width: shareWidth, height: shareHeight }]}
          collapsable={false}
        >
          <View
            ref={shareRef}
            collapsable={false}
            style={{ width: shareWidth, height: shareHeight }}
          >
            <TimerShareCard
              width={shareWidth}
              height={shareHeight}
              settings={settings}
              activeTimer={activeTimer}
              progress={progress}
              centerDisplay={centerDisplay}
              passedBreakdown={passedBreakdown}
              remainingBreakdown={remainingBreakdown}
              frameUpcoming={frameUpcoming}
              frameUpcomingGlyph={frameUpcomingGlyph}
              timelineEvents={timerUpcoming.events}
              timelineHolidays={timerUpcoming.holidays}
              timelineDefaultListEventIds={timerUpcoming.defaultListEventIds}
              timelineUpcoming={timerUpcoming.item}
            />
          </View>
        </View>
      ) : null}
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
    alignItems: 'center',
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
    width: '100%',
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
  sharePoster: {
    position: 'absolute',
    top: 0,
    left: -100000,
    zIndex: -1,
  },
});
