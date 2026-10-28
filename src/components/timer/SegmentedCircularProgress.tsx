import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CenterDisplayToggle } from '@/components/timer/CenterDisplayToggle';
import type { ProgressBarMode, TimerCenterDisplay } from '@/types/timer';
import { timerPhotoTextStyles } from '@/components/timer/timerPhotoStyles';
import { colors, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface SegmentedCircularProgressProps {
  segmentCount: number;
  filledCount: number;
  primaryValue: string;
  secondaryValue?: string | null;
  unitLabel: string;
  progressBarMode?: ProgressBarMode;
  percentDecimalPlaces?: number;
  size?: number;
  photoBackground?: boolean;
  centerDisplay?: TimerCenterDisplay;
  onCenterDisplayChange?: (display: TimerCenterDisplay) => void;
}

const DEFAULT_SIZE = 280;
const RING_THICKNESS = 32;
const GAP_ANGLE_DEG = 1.4;
const CENTER_LINE_GAP = 6;

function getPercentCenterTypography(decimalPlaces: number): {
  fontSize: number;
  lineHeight: number;
} {
  if (decimalPlaces === 0) {
    return { fontSize: 42, lineHeight: 46 };
  }
  if (decimalPlaces === 1) {
    return { fontSize: 36, lineHeight: 40 };
  }
  return { fontSize: 32, lineHeight: 36 };
}

function describeSegmentPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const startRad = toRad(startAngleDeg);
  const endRad = toRad(endAngleDeg);
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  const ix1 = cx + innerRadius * Math.cos(startRad);
  const iy1 = cy + innerRadius * Math.sin(startRad);
  const ox1 = cx + outerRadius * Math.cos(startRad);
  const oy1 = cy + outerRadius * Math.sin(startRad);
  const ox2 = cx + outerRadius * Math.cos(endRad);
  const oy2 = cy + outerRadius * Math.sin(endRad);
  const ix2 = cx + innerRadius * Math.cos(endRad);
  const iy2 = cy + innerRadius * Math.sin(endRad);

  return [
    `M ${ix1} ${iy1}`,
    `L ${ox1} ${oy1}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ');
}

export function SegmentedCircularProgress({
  segmentCount,
  filledCount,
  primaryValue,
  secondaryValue,
  unitLabel,
  progressBarMode = 'days',
  percentDecimalPlaces = 2,
  size = DEFAULT_SIZE,
  photoBackground = false,
  centerDisplay = 'remaining',
  onCenterDisplayChange,
}: SegmentedCircularProgressProps) {
  const count = Math.max(1, segmentCount);
  const filled = Math.min(count, Math.max(0, filledCount));
  const theme = useAppTheme();
  const accent = theme.text.accent;
  const percentCenterType = getPercentCenterTypography(percentDecimalPlaces);

  const segments = useMemo(() => {
    const center = size / 2;
    const outerRadius = size / 2 - 8;
    const innerRadius = outerRadius - RING_THICKNESS;
    const angleStep = 360 / count;
    const gapAngle = Math.min(GAP_ANGLE_DEG, angleStep * 0.22);
    const segmentSpan = angleStep - gapAngle;

    return Array.from({ length: count }, (_, index) => {
      const segmentCenter = index * angleStep + angleStep / 2;
      const startAngle = segmentCenter - segmentSpan / 2;
      const endAngle = segmentCenter + segmentSpan / 2;
      const isFilled = index < filled;

      return {
        key: index,
        d: describeSegmentPath(center, center, innerRadius, outerRadius, startAngle, endAngle),
        fill: photoBackground
          ? isFilled
            ? '#F2F0EC'
            : 'rgba(242, 240, 236, 0.30)'
          : isFilled
            ? accent
            : 'rgba(167, 154, 138, 0.35)',
      };
    });
  }, [accent, count, filled, photoBackground, size]);

  return (
    <View style={[styles.block, { width: size }]}>
      {onCenterDisplayChange ? (
        <View style={styles.toggleRow}>
          <CenterDisplayToggle
            value={centerDisplay}
            onChange={onCenterDisplayChange}
            photoBackground={photoBackground}
          />
        </View>
      ) : null}

      <View style={[styles.wrapper, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {segments.map((segment) => (
            <Path key={`${segment.key}-${segment.fill}`} d={segment.d} fill={segment.fill} />
          ))}
        </Svg>

        <View style={styles.centerContent} pointerEvents="none">
          {progressBarMode === 'percent' ? (
            <>
              <Text
                style={[
                  styles.primaryValue,
                  styles.percentCenterValue,
                  percentCenterType,
                  { color: theme.text.primary },
                  photoBackground && timerPhotoTextStyles.heroNumber,
                ]}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {primaryValue}%
              </Text>
              {unitLabel ? (
                <Text
                  style={[
                    styles.unitLabel,
                    styles.percentPhaseLabel,
                    { color: theme.text.secondary },
                    photoBackground && styles.photoText,
                  ]}
                >
                  {unitLabel}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              {secondaryValue != null ? (
                <Text
                  style={[
                    styles.secondaryValue,
                    { color: theme.text.secondary },
                    photoBackground && styles.photoText,
                  ]}
                >
                  {secondaryValue}%
                </Text>
              ) : null}
              <Text
                style={[
                  styles.primaryValue,
                  { color: theme.text.primary },
                  photoBackground && timerPhotoTextStyles.heroNumber,
                ]}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {primaryValue}
              </Text>
              <Text
                style={[
                  styles.unitLabel,
                  { color: theme.text.secondary },
                  photoBackground && styles.photoText,
                ]}
              >
                {unitLabel}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
  },
  toggleRow: {
    width: '100%',
    marginBottom: 8,
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: CENTER_LINE_GAP,
  },
  secondaryValue: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.secondary,
  },
  primaryValue: {
    fontFamily: typography.fontFamily.display,
    fontSize: 56,
    color: colors.light.text.primary,
    lineHeight: 58,
  },
  unitLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.secondary,
    marginTop: -10,
  },
  percentCenterValue: {
    marginTop: 0,
  },
  percentPhaseLabel: {
    marginTop: 0,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
