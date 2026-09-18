import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CenterDisplayToggle } from '@/components/timer/CenterDisplayToggle';
import type { ProgressBarMode, TimerCenterDisplay } from '@/types/timer';
import { PROGRESS_BAR_SEGMENT_COUNT } from '@/types/timer';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface SegmentedCircularProgressProps {
  mode: ProgressBarMode;
  filledCount: number;
  primaryValue: string;
  secondaryValue?: string | null;
  unitLabel: string;
  size?: number;
  photoBackground?: boolean;
  centerDisplay?: TimerCenterDisplay;
  onCenterDisplayChange?: (display: TimerCenterDisplay) => void;
}

const DEFAULT_SIZE = 280;
const RING_THICKNESS = 32;
const GAP_ANGLE_DEG = 1.4;
const CENTER_LINE_GAP = 6;

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
  mode,
  filledCount,
  primaryValue,
  secondaryValue,
  unitLabel,
  size = DEFAULT_SIZE,
  photoBackground = false,
  centerDisplay = 'remaining',
  onCenterDisplayChange,
}: SegmentedCircularProgressProps) {
  const segmentCount = PROGRESS_BAR_SEGMENT_COUNT[mode];
  const center = size / 2;
  const outerRadius = size / 2 - 8;
  const innerRadius = outerRadius - RING_THICKNESS;
  const theme = colors.light;
  const angleStep = 360 / segmentCount;
  const segmentSpan = Math.max(angleStep - GAP_ANGLE_DEG, angleStep * 0.6);

  const segments = Array.from({ length: segmentCount }, (_, index) => {
    const segmentCenter = index * angleStep + angleStep / 2;
    const startAngle = segmentCenter - segmentSpan / 2;
    const endAngle = segmentCenter + segmentSpan / 2;
    const isFilled = index < filledCount;

    return {
      key: index,
      d: describeSegmentPath(center, center, innerRadius, outerRadius, startAngle, endAngle),
      fill: photoBackground
        ? isFilled
          ? '#F2F0EC'
          : 'rgba(242, 240, 236, 0.30)'
        : isFilled
          ? theme.text.accent
          : 'rgba(167, 154, 138, 0.35)',
    };
  });

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
            <Path key={segment.key} d={segment.d} fill={segment.fill} />
          ))}
        </Svg>

        <View style={styles.centerContent} pointerEvents="none">
          {secondaryValue != null ? (
            <Text style={[styles.secondaryValue, photoBackground && styles.photoText]}>
              {secondaryValue}%
            </Text>
          ) : null}
          <Text
            style={[styles.primaryValue, photoBackground && styles.photoText]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {primaryValue}
          </Text>
          <Text style={[styles.unitLabel, photoBackground && styles.photoText]}>
            {unitLabel}
          </Text>
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
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
