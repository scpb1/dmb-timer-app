import { StyleSheet, Text, View } from 'react-native';

import type { ProgressBarMode } from '@/types/timer';
import { PROGRESS_BAR_SEGMENT_COUNT } from '@/types/timer';
import type { LinearDisplayValues } from '@/utils/timerCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface SegmentedLinearProgressProps {
  mode: ProgressBarMode;
  filledCount: number;
  display: LinearDisplayValues;
  width?: number;
}

const BAR_HEIGHT = 24;
const SEGMENT_GAP = 2;

export function SegmentedLinearProgress({
  mode,
  filledCount,
  display,
  width = 320,
}: SegmentedLinearProgressProps) {
  const segmentCount = PROGRESS_BAR_SEGMENT_COUNT[mode];
  const theme = colors.light;

  return (
    <View style={[styles.wrapper, { width }]}>
      <View style={styles.bar}>
        {Array.from({ length: segmentCount }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor:
                  index < filledCount
                    ? theme.text.accent
                    : 'rgba(167, 154, 138, 0.35)',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.labelRow}>
        {display.mode === 'percent' ? (
          <Text style={styles.percentText}>{display.percentText}</Text>
        ) : (
          <>
            <Text style={styles.valueText}>{display.primaryValue}</Text>
            <Text style={styles.unitText}>{display.unitLabel}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    height: BAR_HEIGHT,
    gap: SEGMENT_GAP,
  },
  segment: {
    flex: 1,
    borderRadius: 2,
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
});
