import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FramedTimerDisplay } from '@/components/timer/FramedTimerDisplay';
import { SegmentedCircularProgress } from '@/components/timer/SegmentedCircularProgress';
import { SegmentedLinearProgress } from '@/components/timer/SegmentedLinearProgress';
import { TimerDotGridDisplay } from '@/components/timer/TimerDotGridDisplay';
import { TimerMilestonesTimelineDisplay } from '@/components/timer/TimerMilestonesTimelineDisplay';
import { TimerStatCard } from '@/components/timer/TimerStatCard';
import { TimerUnifiedStatCard } from '@/components/timer/TimerUnifiedStatCard';
import { TimerUpcomingCard } from '@/components/timer/TimerUpcomingCard';
import { PositionedCoverImage } from '@/components/common/PositionedCoverImage';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import type { ActiveTimer, TimerSettings } from '@/types/timer';
import { FEATURES } from '@/constants';
import {
  DEFAULT_TIMER_SETTINGS,
  PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN,
} from '@/types/timer';
import {
  getCenterDisplayLabels,
  getFrameDisplayValues,
  getLinearDisplayValues,
  getPhaseCardTitle,
  getServiceStatCardPair,
  getStatCardDisplay,
  type CenterDisplayValues,
  type ServiceProgress,
  type TimeBreakdown,
} from '@/utils/timerCalculations';
import { getBackgroundScrimColor } from '@/utils/timerBackground';
import type { EventGlyph } from '@/utils/eventGlyphs';
import type { DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';
import type { TimerUpcomingItem } from '@/utils/timerUpcoming';
import {
  formatTimerVizUpcomingHeadline,
  shouldOmitDemobilizationCountdown,
} from '@/utils/timerUpcoming';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface TimerShareCardProps {
  width: number;
  height: number;
  settings: TimerSettings;
  activeTimer: ActiveTimer;
  progress: ServiceProgress;
  centerDisplay: CenterDisplayValues;
  passedBreakdown: TimeBreakdown;
  remainingBreakdown: TimeBreakdown;
  frameUpcoming?: TimerUpcomingItem | null;
  frameUpcomingGlyph?: EventGlyph | null;
  upcoming?: TimerUpcomingItem | null;
  upcomingGlyph?: EventGlyph | null;
  showStatCards?: boolean;
  timelineEvents?: DisplayEvent[];
  timelineHolidays?: DisplayHoliday[];
  timelineDefaultListEventIds?: string[];
  timelineUpcoming?: TimerUpcomingItem | null;
}

/** Постер таймера без кнопок, чипов и нижней панели */
export function TimerShareCard({
  width,
  height,
  settings,
  activeTimer,
  progress,
  centerDisplay,
  passedBreakdown,
  remainingBreakdown,
  frameUpcoming = null,
  frameUpcomingGlyph = null,
  upcoming = null,
  upcomingGlyph = null,
  showStatCards = true,
  timelineEvents = [],
  timelineHolidays = [],
  timelineDefaultListEventIds = [],
  timelineUpcoming = null,
}: TimerShareCardProps) {
  const hasPhotoBackground = Boolean(settings.backgroundImageUri);
  const photoStatCardBorder = FEATURES.showPhotoElementBorderSwitches
    ? settings.photoStatCardBorder
    : PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN.photoStatCardBorder;
  const showPhotoStatBorder = !hasPhotoBackground || photoStatCardBorder;
  const statCardMode = settings.statCardMode ?? DEFAULT_TIMER_SETTINGS.statCardMode;
  const filledCount = progress.filledSegments[settings.progressBarMode];
  const segmentCount = progress.segmentCounts[settings.progressBarMode];
  const phase = progress.phase;
  const phaseCardTitle = getPhaseCardTitle(phase, activeTimer.kind);
  const phaseBreakdown = phase === 'before' ? remainingBreakdown : passedBreakdown;
  const linearDisplay =
    settings.timerType === 'linear'
      ? getLinearDisplayValues(
          settings.progressBarMode,
          progress,
          settings.percentDecimalPlaces,
          settings.centerDisplay,
          getCenterDisplayLabels(activeTimer.kind),
        )
      : null;
  const frameDisplay =
    settings.timerType === 'frame'
      ? getFrameDisplayValues(
          progress,
          settings.centerDisplay,
          getCenterDisplayLabels(activeTimer.kind),
        )
      : null;
  const isFrameTimer = settings.timerType === 'frame';
  const isDotGridTimer = settings.timerType === 'dotGrid';
  const isMilestonesTimer = settings.timerType === 'milestones';
  const hideActiveUnifiedStats = isDotGridTimer && phase === 'active';
  const omitDemobilizationCountdown = shouldOmitDemobilizationCountdown(
    settings.timerType,
    settings.progressBarMode,
    statCardMode,
  );
  const photoUpcomingCardBorder = FEATURES.showPhotoElementBorderSwitches
    ? settings.photoUpcomingCardBorder
    : PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN.photoUpcomingCardBorder;
  const showPhotoUpcomingBorder = !hasPhotoBackground || photoUpcomingCardBorder;
  const showUpcomingCard =
    !isFrameTimer &&
    !isDotGridTimer &&
    !isMilestonesTimer &&
    settings.timerUpcomingPreview !== 'off' &&
    upcoming != null &&
    upcomingGlyph != null;
  const vizUpcomingHeadline =
    (isDotGridTimer || isMilestonesTimer) &&
    settings.timerUpcomingPreview !== 'off' &&
    timelineUpcoming
      ? formatTimerVizUpcomingHeadline(
          timelineUpcoming,
          new Date(),
          omitDemobilizationCountdown,
        )
      : null;
  const showPhaseStat = showStatCards && !isFrameTimer && phase !== 'active' && phaseBreakdown != null;
  const showActiveStat =
    showStatCards && !isFrameTimer && phase === 'active' && !hideActiveUnifiedStats;
  const activeStatCards = showActiveStat
    ? getServiceStatCardPair(progress, passedBreakdown, remainingBreakdown, statCardMode)
    : null;
  const plaqueEstimate =
    (showUpcomingCard ? 120 : 0) +
    (showPhaseStat || showActiveStat ? 200 : 0) +
    (showUpcomingCard && (showPhaseStat || showActiveStat) ? 16 : 0);
  const circularSize = Math.round(Math.min(280, Math.max(148, height - 174 - plaqueEstimate)));
  const [contentHeight, setContentHeight] = useState(0);
  const posterScale = contentHeight > height && height > 0 ? height / contentHeight : 1;

  return (
    <View style={[styles.card, { width, height }]} collapsable={false}>
      {settings.backgroundImageUri ? (
        <>
          <PositionedCoverImage
            uri={settings.backgroundImageUri}
            focusX={settings.backgroundFocusX}
            focusY={settings.backgroundFocusY}
            width={width}
            height={height}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: getBackgroundScrimColor(settings.backgroundDim) },
            ]}
          />
        </>
      ) : (
        <ScreenBackground />
      )}

      <View style={styles.fit} collapsable={false}>
      <View
        style={[styles.content, posterScale < 1 && { transform: [{ scale: posterScale }] }]}
        collapsable={false}
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0 && Math.abs(nextHeight - contentHeight) > 1) {
            setContentHeight(nextHeight);
          }
        }}
      >
        <Text style={[styles.timerName, hasPhotoBackground && styles.photoText]}>
          {activeTimer.name}
        </Text>

        {settings.timerType === 'circular' ? (
          <SegmentedCircularProgress
            segmentCount={segmentCount}
            filledCount={filledCount}
            primaryValue={centerDisplay.primaryValue}
            secondaryValue={centerDisplay.secondaryValue}
            unitLabel={centerDisplay.unitLabel}
            progressBarMode={settings.progressBarMode}
            percentDecimalPlaces={settings.percentDecimalPlaces}
            photoBackground={hasPhotoBackground}
            size={circularSize}
          />
        ) : linearDisplay ? (
          <SegmentedLinearProgress
            mode={settings.progressBarMode}
            segmentCount={segmentCount}
            filledCount={filledCount}
            display={linearDisplay}
            photoBackground={hasPhotoBackground}
          />
        ) : isDotGridTimer ? (
          <TimerDotGridDisplay
            mode={settings.progressBarMode}
            progress={progress}
            endDate={activeTimer.endDate}
            decimalPlaces={settings.percentDecimalPlaces}
            timerKind={activeTimer.kind}
            cellShape={settings.dotGridCellShape}
            photoBackground={hasPhotoBackground}
            upcomingHeadline={vizUpcomingHeadline}
            centerDisplay={settings.centerDisplay}
          />
        ) : isMilestonesTimer ? (
          <TimerMilestonesTimelineDisplay
            progress={progress}
            startDate={activeTimer.startDate}
            endDate={activeTimer.endDate}
            decimalPlaces={settings.percentDecimalPlaces}
            timerKind={activeTimer.kind}
            photoBackground={hasPhotoBackground}
            upcomingHeadline={vizUpcomingHeadline}
            events={timelineEvents}
            holidays={timelineHolidays}
            defaultListEventIds={timelineDefaultListEventIds}
            layout={settings.milestonesLayout ?? DEFAULT_TIMER_SETTINGS.milestonesLayout}
            centerDisplay={settings.centerDisplay}
          />
        ) : frameDisplay ? (
          <FramedTimerDisplay
            primaryValue={frameDisplay.primaryValue}
            unitLabel={frameDisplay.unitLabel}
            upcoming={frameUpcoming}
            glyph={frameUpcomingGlyph}
            photoBackground={hasPhotoBackground}
            omitDemobilizationCountdown={omitDemobilizationCountdown}
          />
        ) : null}

        {showUpcomingCard || showPhaseStat || showActiveStat ? (
          <View style={styles.plaques}>
            {showUpcomingCard && upcoming && upcomingGlyph ? (
              <TimerUpcomingCard
                item={upcoming}
                glyph={upcomingGlyph}
                photoBackground={hasPhotoBackground}
                showBorder={showPhotoUpcomingBorder}
                omitDemobilizationCountdown={omitDemobilizationCountdown}
              />
            ) : null}

            {showPhaseStat && phaseBreakdown ? (
              <View style={styles.statsRow}>
                <TimerStatCard
                  title={phaseCardTitle}
                  display={getStatCardDisplay(phaseBreakdown, statCardMode, {
                    phase,
                    kind: activeTimer.kind,
                    progress,
                  })}
                  photoBackground={hasPhotoBackground}
                  showBorder={showPhotoStatBorder}
                />
              </View>
            ) : null}

            {activeStatCards ? (
              <View style={styles.statsRow}>
                <TimerUnifiedStatCard
                  elapsed={activeStatCards.elapsed}
                  remaining={activeStatCards.remaining}
                  photoBackground={hasPhotoBackground}
                  showBorder={showPhotoStatBorder}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.light.background.start,
  },
  fit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 28,
  },
  plaques: {
    alignSelf: 'stretch',
    flexShrink: 0,
    gap: 16,
  },
  timerName: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    color: colors.light.text.primary,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
