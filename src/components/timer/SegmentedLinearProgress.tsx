import { StyleSheet, Text, View } from 'react-native';

import { CenterDisplayToggle } from '@/components/timer/CenterDisplayToggle';
import type { ProgressBarMode, TimerCenterDisplay } from '@/types/timer';
import { PROGRESS_BAR_SEGMENT_COUNT } from '@/types/timer';
import type { LinearDisplayValues } from '@/utils/timerCalculations';
import { colors, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface SegmentedLinearProgressProps {
  mode: ProgressBarMode;
  filledCount: number;
  display: LinearDisplayValues;
  centerDisplay?: TimerCenterDisplay;
  onCenterDisplayChange?: (display: TimerCenterDisplay) => void;
  photoBackground?: boolean;
}

const BAR_HEIGHT = 24;
const SEGMENT_GAP = 2;
const BAR_INSET = 5;

export function SegmentedLinearProgress({
  mode,
  filledCount,
  display,
  centerDisplay = 'remaining',
  onCenterDisplayChange,
  photoBackground = false,
}: SegmentedLinearProgressProps) {
  const segmentCount = PROGRESS_BAR_SEGMENT_COUNT[mode];
  const theme = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        {onCenterDisplayChange ? (
          <View style={styles.zoneLabelsRow}>
            <CenterDisplayToggle
              value={centerDisplay}
              onChange={onCenterDisplayChange}
              photoBackground={photoBackground}
            />
          </View>
        ) : null}

        <View style={styles.bar}>
          {Array.from({ length: segmentCount }, (_, index) => {
            const isFilled = index < filledCount;
            return (
              <View
                key={`${index}-${isFilled ? 'on' : 'off'}`}
                style={[
                  styles.segment,
                  {
                    backgroundColor: photoBackground
                      ? isFilled
                        ? '#F2F0EC'
                        : 'rgba(242, 240, 236, 0.30)'
                      : isFilled
                        ? theme.text.accent
                        : theme.overlay.muted,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.labelRow}>
        {display.mode === 'percent' ? (
          <Text
            style={[
              styles.percentText,
              { color: theme.text.primary },
              photoBackground && styles.photoText,
            ]}
          >
            {display.percentText}
          </Text>
        ) : (
          <>
            <Text
              style={[
                styles.valueText,
                { color: theme.text.primary },
                photoBackground && styles.photoText,
              ]}
            >
              {display.primaryValue}
            </Text>
            <Text
              style={[
                styles.unitText,
                { color: theme.text.secondary },
                photoBackground && styles.photoText,
              ]}
            >
              {display.unitLabel}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  track: {
    width: '100%',
    paddingHorizontal: BAR_INSET,
  },
  zoneLabelsRow: {
    width: '100%',
    marginBottom: 8,
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    height: BAR_HEIGHT,
    gap: SEGMENT_GAP,
  },
  segment: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  percentText: {
    fontFamily: typography.fontFamily.display,
    fontSize: 28,
    color: colors.light.text.primary,
    lineHeight: 32,
  },
  valueText: {
    fontFamily: typography.fontFamily.display,
    fontSize: 28,
    color: colors.light.text.primary,
    lineHeight: 32,
  },
  unitText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.secondary,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
