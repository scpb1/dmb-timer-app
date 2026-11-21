import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { FramedTimerDisplay } from '@/components/timer/FramedTimerDisplay';
import { SegmentedCircularProgress } from '@/components/timer/SegmentedCircularProgress';
import { SegmentedLinearProgress } from '@/components/timer/SegmentedLinearProgress';
import { TimerDotGridDisplay } from '@/components/timer/TimerDotGridDisplay';
import { TimerMilestonesTimelineDisplay } from '@/components/timer/TimerMilestonesTimelineDisplay';
import type { ColorTokens } from '@/theme';
import type { ActiveTimer, TimerSettings } from '@/types/timer';
import type { EventGlyph } from '@/utils/eventGlyphs';
import type {
  CenterDisplayValues,
  LinearDisplayValues,
  ServiceProgress,
} from '@/utils/timerCalculations';
import type { TimerUpcomingItem } from '@/utils/timerUpcoming';

type StageStyles = {
  scroll: StyleProp<ViewStyle>;
  scrollContent: StyleProp<ViewStyle>;
  scrollContentViz: StyleProp<ViewStyle>;
  scrollContentDotGrid: StyleProp<ViewStyle>;
  summaryButton: StyleProp<ViewStyle>;
  summaryButtonPhoto: StyleProp<ViewStyle>;
  summaryButtonText: StyleProp<TextStyle>;
  summaryButtonPhotoText: StyleProp<TextStyle>;
};

type FrameDisplay = { primaryValue: string; unitLabel: string; allowCenterToggle: boolean };

export function HomeTimerStage({
  styles,
  theme,
  settings,
  activeTimer,
  progress,
  centerDisplay,
  linearDisplay,
  frameDisplay,
  segmentCount,
  filledCount,
  hasPhotoBackground,
  canSwitchCenterDisplay,
  isDotGridTimer,
  isMilestonesTimer,
  isFrameTimer,
  vizUpcomingHeadline,
  frameUpcoming,
  frameUpcomingGlyph,
  omitDemobilizationCountdown,
  events,
  holidays,
  defaultListEventIds,
  isSharingArmyChecklist,
  foregroundColor,
  belowTimer,
  showServiceSummaryButton,
  onCenterDisplayChange,
  onDownloadArmyChecklist,
  onOpenSummary,
}: {
  styles: StageStyles;
  theme: ColorTokens;
  settings: TimerSettings;
  activeTimer: ActiveTimer | null;
  progress: ServiceProgress | null;
  centerDisplay: CenterDisplayValues | null;
  linearDisplay: LinearDisplayValues | null;
  frameDisplay: FrameDisplay | null;
  segmentCount: number;
  filledCount: number;
  hasPhotoBackground: boolean;
  canSwitchCenterDisplay: boolean;
  isDotGridTimer: boolean;
  isMilestonesTimer: boolean;
  isFrameTimer: boolean;
  vizUpcomingHeadline: string | null;
  frameUpcoming: TimerUpcomingItem | null;
  frameUpcomingGlyph: EventGlyph | null;
  omitDemobilizationCountdown: boolean;
  events: ComponentProps<typeof TimerMilestonesTimelineDisplay>['events'];
  holidays: ComponentProps<typeof TimerMilestonesTimelineDisplay>['holidays'];
  defaultListEventIds: string[];
  isSharingArmyChecklist: boolean;
  foregroundColor: string;
  belowTimer: ReactNode;
  showServiceSummaryButton: boolean;
  onCenterDisplayChange: ComponentProps<typeof SegmentedCircularProgress>['onCenterDisplayChange'];
  onDownloadArmyChecklist: () => void;
  onOpenSummary: () => void;
}) {
  const centerChange = canSwitchCenterDisplay ? onCenterDisplayChange : undefined;

  return (
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
          onCenterDisplayChange={centerChange}
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
          onCenterDisplayChange={centerChange}
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
          centerDisplay={settings.centerDisplay}
          onCenterDisplayChange={centerChange}
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
          events={events}
          holidays={holidays}
          defaultListEventIds={defaultListEventIds}
          layout={settings.milestonesLayout}
          onDownloadArmyChecklist={
            settings.milestonesLayout === 'checklist' ? onDownloadArmyChecklist : undefined
          }
          isDownloadingArmyChecklist={isSharingArmyChecklist}
          centerDisplay={settings.centerDisplay}
          onCenterDisplayChange={centerChange}
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
            canSwitchCenterDisplay && frameDisplay.allowCenterToggle ? onCenterDisplayChange : undefined
          }
          omitDemobilizationCountdown={omitDemobilizationCountdown}
        />
      ) : null}

      {belowTimer}

      {showServiceSummaryButton ? (
        <Pressable
          style={[styles.summaryButton, hasPhotoBackground && styles.summaryButtonPhoto]}
          onPress={onOpenSummary}
          accessibilityRole="button"
          accessibilityLabel="Итоги службы"
        >
          <MaterialCommunityIcons name="chart-box-outline" size={22} color={foregroundColor} />
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
  );
}
