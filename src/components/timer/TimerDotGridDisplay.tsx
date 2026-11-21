import { StyleSheet, View } from 'react-native';

import { TimerDotGridProgressSection } from '@/components/timer/TimerDotGridProgressSection';
import { TimerVizSummaryCard } from '@/components/timer/TimerVizSummaryCard';
import type { DotGridCellShape, ProgressBarMode, TimerCenterDisplay } from '@/types/timer';
import type { ServiceProgress } from '@/utils/timerCalculations';

/** Горизонтальный padding плашки */
export const TIMER_VIZ_CARD_H_PADDING = 14;

interface TimerDotGridDisplayProps {
  mode: ProgressBarMode;
  progress: ServiceProgress;
  endDate: Date;
  decimalPlaces: number;
  timerKind?: 'service' | 'custom';
  cellShape: DotGridCellShape;
  photoBackground?: boolean;
  upcomingHeadline?: string | null;
  centerDisplay?: TimerCenterDisplay;
  onCenterDisplayChange?: (display: TimerCenterDisplay) => void;
}

export function TimerDotGridDisplay({
  mode,
  progress,
  endDate,
  decimalPlaces,
  timerKind = 'service',
  cellShape,
  photoBackground = false,
  upcomingHeadline = null,
  centerDisplay = 'remaining',
  onCenterDisplayChange,
}: TimerDotGridDisplayProps) {
  return (
    <View style={styles.wrapper}>
      <TimerVizSummaryCard
        progress={progress}
        endDate={endDate}
        decimalPlaces={decimalPlaces}
        timerKind={timerKind}
        photoBackground={photoBackground}
        dotGridUnitMode={mode}
        upcomingHeadline={upcomingHeadline}
        centerDisplay={centerDisplay}
        onCenterDisplayChange={onCenterDisplayChange}
      />

      <TimerDotGridProgressSection
        mode={mode}
        progress={progress}
        cellShape={cellShape}
        photoBackground={photoBackground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 16,
  },
});
