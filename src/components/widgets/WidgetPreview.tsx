import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { FramedTimerDisplay } from '@/components/timer/FramedTimerDisplay';
import { SegmentedCircularProgress } from '@/components/timer/SegmentedCircularProgress';
import { SegmentedLinearProgress } from '@/components/timer/SegmentedLinearProgress';
import { TimerDotGridDisplay } from '@/components/timer/TimerDotGridDisplay';
import { TimerStatCard } from '@/components/timer/TimerStatCard';
import { TimerUnifiedStatCard } from '@/components/timer/TimerUnifiedStatCard';
import { TimerUpcomingCard } from '@/components/timer/TimerUpcomingCard';
import { PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN } from '@/types/timer';
import type { ActiveTimer } from '@/types/timer';
import type { DisplayHoliday } from '@/types/holidays';
import type {
  WidgetFamily,
  WidgetHolidayAppearance,
  WidgetPreviewSize,
  WidgetStatsAppearance,
  WidgetSurfaceAppearance,
  WidgetTimerAppearance,
} from '@/types/widgets';
import { getEventGlyph, getHolidayGlyph } from '@/utils/eventGlyphs';
import { getBackgroundScrimColor } from '@/utils/timerBackground';
import {
  getCenterDisplayLabels,
  getCenterDisplayValues,
  getFrameDisplayValues,
  getLinearDisplayValues,
  getPhaseCardTitle,
  getServiceStatCardPair,
  getStatCardDisplay,
  type ServiceProgress,
  type TimeBreakdown,
} from '@/utils/timerCalculations';
import type { TimerUpcomingItem } from '@/utils/timerUpcoming';
import { previewFrameSize } from '@/utils/widgetStudio';
import { layout, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

const CIRCULAR_DESIGN = 280;
const LINEAR_DESIGN = { width: 320, height: 80 };
const FRAME_DESIGN = { width: 320, height: 300 };
const DOT_GRID_DESIGN = { width: 320, height: 420 };
const CARD_DESIGN = { width: 320, height: 96 };
const STATS_DESIGN = { width: 320, height: 168 };
const CHROME_INSET = 12;

interface WidgetPreviewProps {
  family: WidgetFamily;
  size: WidgetPreviewSize;
  timer: WidgetTimerAppearance;
  holiday: WidgetHolidayAppearance;
  stats: WidgetStatsAppearance;
  activeTimer: ActiveTimer | null;
  progress: ServiceProgress | null;
  passedBreakdown: TimeBreakdown | null;
  remainingBreakdown: TimeBreakdown | null;
  holidayItem: DisplayHoliday | null;
  frameUpcoming: TimerUpcomingItem | null;
}

function ScaledFit({
  designWidth,
  designHeight,
  maxWidth,
  maxHeight,
  children,
}: {
  designWidth: number;
  designHeight: number;
  maxWidth: number;
  maxHeight: number;
  children: ReactNode;
}) {
  const scale = Math.min(maxWidth / designWidth, maxHeight / designHeight);
  const width = Math.round(designWidth * scale);
  const height = Math.round(designHeight * scale);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <View
        style={{
          width: designWidth,
          height: designHeight,
          position: 'absolute',
          left: (width - designWidth) / 2,
          top: (height - designHeight) / 2,
          transform: [{ scale }],
        }}
      >
        {children}
      </View>
    </View>
  );
}

function WidgetChrome({
  size,
  surface,
  children,
}: {
  size: WidgetPreviewSize;
  surface: WidgetSurfaceAppearance;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  const frame = previewFrameSize(size);
  const hasPhoto = Boolean(surface.backgroundImageUri);

  return (
    <View
      style={[
        styles.chrome,
        {
          width: frame.width,
          height: frame.height,
          borderColor: theme.overlay.border,
        },
      ]}
    >
      {hasPhoto ? (
        <>
          <Image
            source={{ uri: surface.backgroundImageUri ?? undefined }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: getBackgroundScrimColor(surface.backgroundDim) },
            ]}
          />
        </>
      ) : (
        <ScreenBackground />
      )}
      <View style={styles.chromeInner}>{children}</View>
    </View>
  );
}

function TimerBody({
  appearance,
  activeTimer,
  progress,
  frameUpcoming,
  size,
}: {
  appearance: WidgetTimerAppearance;
  activeTimer: ActiveTimer;
  progress: ServiceProgress;
  frameUpcoming: TimerUpcomingItem | null;
  size: WidgetPreviewSize;
}) {
  const hasPhoto = Boolean(appearance.backgroundImageUri);
  const labels = getCenterDisplayLabels(activeTimer.kind);
  const center = getCenterDisplayValues(
    appearance.progressBarMode,
    progress,
    appearance.percentDecimalPlaces,
    appearance.centerDisplay,
    labels,
  );
  const filledCount = progress.filledSegments[appearance.progressBarMode];
  const segmentCount = progress.segmentCounts[appearance.progressBarMode];
  const frame = previewFrameSize(size);
  const maxWidth = frame.width - CHROME_INSET * 2;
  const maxHeight = frame.height - CHROME_INSET * 2;

  if (appearance.kind === 'circular') {
    return (
      <ScaledFit
        designWidth={CIRCULAR_DESIGN}
        designHeight={CIRCULAR_DESIGN}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      >
        <SegmentedCircularProgress
          size={CIRCULAR_DESIGN}
          segmentCount={segmentCount}
          filledCount={filledCount}
          primaryValue={center.primaryValue}
          secondaryValue={center.secondaryValue}
          unitLabel={center.unitLabel}
          progressBarMode={appearance.progressBarMode}
          percentDecimalPlaces={appearance.percentDecimalPlaces}
          photoBackground={hasPhoto}
          centerDisplay={appearance.centerDisplay}
        />
      </ScaledFit>
    );
  }

  if (appearance.kind === 'linear') {
    return (
      <ScaledFit
        designWidth={LINEAR_DESIGN.width}
        designHeight={LINEAR_DESIGN.height}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      >
        <View style={{ width: LINEAR_DESIGN.width }}>
          <SegmentedLinearProgress
            mode={appearance.progressBarMode}
            segmentCount={segmentCount}
            filledCount={filledCount}
            display={getLinearDisplayValues(
              appearance.progressBarMode,
              progress,
              appearance.percentDecimalPlaces,
              appearance.centerDisplay,
              labels,
            )}
            centerDisplay={appearance.centerDisplay}
            photoBackground={hasPhoto}
          />
        </View>
      </ScaledFit>
    );
  }

  if (appearance.kind === 'dotGrid') {
    return (
      <ScaledFit
        designWidth={DOT_GRID_DESIGN.width}
        designHeight={DOT_GRID_DESIGN.height}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      >
        <View style={{ width: DOT_GRID_DESIGN.width }}>
          <TimerDotGridDisplay
            mode={appearance.progressBarMode}
            progress={progress}
            endDate={activeTimer.endDate}
            decimalPlaces={appearance.percentDecimalPlaces}
            timerKind={activeTimer.kind}
            cellShape={appearance.cellShape}
            photoBackground={hasPhoto}
            centerDisplay={appearance.centerDisplay}
          />
        </View>
      </ScaledFit>
    );
  }

  const frameDisplay = getFrameDisplayValues(progress, appearance.centerDisplay, labels);
  const glyph = frameUpcoming
    ? frameUpcoming.kind === 'event'
      ? getEventGlyph(frameUpcoming.event)
      : getHolidayGlyph(frameUpcoming.holiday)
    : null;

  return (
    <ScaledFit
      designWidth={FRAME_DESIGN.width}
      designHeight={FRAME_DESIGN.height}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
    >
      <View style={{ width: FRAME_DESIGN.width }}>
        <FramedTimerDisplay
          primaryValue={frameDisplay.primaryValue}
          unitLabel={frameDisplay.unitLabel}
          upcoming={frameUpcoming}
          glyph={glyph}
          photoBackground={hasPhoto}
          centerDisplay={appearance.centerDisplay}
        />
      </View>
    </ScaledFit>
  );
}

export function WidgetPreview({
  family,
  size,
  timer,
  holiday,
  stats,
  activeTimer,
  progress,
  passedBreakdown,
  remainingBreakdown,
  holidayItem,
  frameUpcoming,
}: WidgetPreviewProps) {
  const theme = useAppTheme();
  const surface =
    family === 'timer' ? timer : family === 'holiday' ? holiday : stats;
  const hasPhoto = Boolean(surface.backgroundImageUri);
  const phase = progress?.phase ?? 'active';
  const frame = previewFrameSize(size);
  const maxWidth = frame.width - CHROME_INSET * 2;
  const maxHeight = frame.height - CHROME_INSET * 2;

  let body: ReactNode = (
    <Text style={[styles.empty, { color: theme.text.secondary }]}>Нет дат таймера</Text>
  );

  if (family === 'timer' && activeTimer && progress) {
    body = (
      <TimerBody
        appearance={timer}
        activeTimer={activeTimer}
        progress={progress}
        frameUpcoming={frameUpcoming}
        size={size}
      />
    );
  }

  if (family === 'holiday') {
    body = holidayItem ? (
      <ScaledFit
        designWidth={CARD_DESIGN.width}
        designHeight={CARD_DESIGN.height}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      >
        <View style={{ width: CARD_DESIGN.width }}>
          <TimerUpcomingCard
            item={{ kind: 'holiday', holiday: holidayItem }}
            glyph={getHolidayGlyph(holidayItem)}
            photoBackground={hasPhoto}
            showBorder={
              !hasPhoto || PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN.photoUpcomingCardBorder
            }
          />
        </View>
      </ScaledFit>
    ) : (
      <Text style={[styles.empty, { color: theme.text.secondary }]}>Нет праздников</Text>
    );
  }

  if (family === 'stats' && activeTimer && progress && passedBreakdown && remainingBreakdown) {
    const showBorder =
      !hasPhoto || PHOTO_ELEMENT_BORDER_WHEN_SWITCHES_HIDDEN.photoStatCardBorder;
    body = (
      <ScaledFit
        designWidth={STATS_DESIGN.width}
        designHeight={STATS_DESIGN.height}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      >
        <View style={{ width: STATS_DESIGN.width }}>
          {phase === 'active' ? (
            <TimerUnifiedStatCard
              elapsed={
                getServiceStatCardPair(progress, passedBreakdown, remainingBreakdown, stats.mode)
                  .elapsed
              }
              remaining={
                getServiceStatCardPair(progress, passedBreakdown, remainingBreakdown, stats.mode)
                  .remaining
              }
              photoBackground={hasPhoto}
              showBorder={showBorder}
            />
          ) : (
            <TimerStatCard
              title={getPhaseCardTitle(phase, activeTimer.kind)}
              display={getStatCardDisplay(
                phase === 'before' ? remainingBreakdown : passedBreakdown,
                stats.mode,
                { phase, kind: activeTimer.kind, progress },
              )}
              photoBackground={hasPhoto}
              showBorder={showBorder}
            />
          )}
        </View>
      </ScaledFit>
    );
  }

  return (
    <View style={styles.stage}>
      <Text style={[styles.stageHint, { color: theme.text.secondary }]}>Как будет выглядеть</Text>
      <WidgetChrome size={size} surface={surface}>
        {body}
      </WidgetChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  stageHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
  },
  chrome: {
    borderRadius: layout.cardBorderRadius,
    overflow: 'hidden',
    borderWidth: 1,
  },
  chromeInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: CHROME_INSET,
  },
  empty: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    textAlign: 'center',
  },
});
