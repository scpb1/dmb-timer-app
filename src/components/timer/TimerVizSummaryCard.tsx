import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { CenterDisplayToggle } from '@/components/timer/CenterDisplayToggle';
import type { ProgressBarMode, TimerCenterDisplay } from '@/types/timer';
import type { ServiceProgress } from '@/utils/timerCalculations';
import { getTimerVizSummaryCopy } from '@/utils/timerCalculations';
import { timerVizUnpassedColor } from '@/components/timer/progressSegmentColors';
import { timerPhotoTextStyles } from '@/components/timer/timerPhotoStyles';
import { layout, useAppTheme, useColorTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface TimerVizSummaryCardProps {
  progress: ServiceProgress;
  endDate: Date;
  decimalPlaces: number;
  timerKind?: 'service' | 'custom';
  photoBackground?: boolean;
  dotGridUnitMode?: ProgressBarMode;
  upcomingHeadline?: string | null;
  centerDisplay?: TimerCenterDisplay;
  onCenterDisplayChange?: (display: TimerCenterDisplay) => void;
}

export function TimerVizUpcomingLabel({
  text,
  photoBackground = false,
}: {
  text: string;
  photoBackground?: boolean;
}) {
  const theme = useAppTheme();
  const color = photoBackground ? 'rgba(242, 240, 236, 0.78)' : theme.text.secondary;

  return (
    <Text style={[styles.upcomingLabel, { color }]} numberOfLines={2}>
      {text}
    </Text>
  );
}

function HeroStatInline({
  value,
  suffix,
  strong,
  muted,
  photoBackground,
  valueIncludesPercent = false,
}: {
  value: string;
  suffix: string;
  strong: StyleProp<TextStyle>;
  muted: StyleProp<TextStyle>;
  photoBackground: boolean;
  valueIncludesPercent?: boolean;
}) {
  return (
    <View style={styles.heroInline}>
      <Text
        style={[
          styles.heroNumber,
          strong,
          photoBackground && timerPhotoTextStyles.heroNumber,
        ]}
      >
        {value}
      </Text>
      {valueIncludesPercent ? (
        <Text
          style={[
            styles.heroNumber,
            strong,
            photoBackground && timerPhotoTextStyles.heroNumber,
          ]}
        >
          %
        </Text>
      ) : null}
      <Text style={[styles.heroUnit, muted]}>{suffix}</Text>
    </View>
  );
}

export function TimerVizSummaryCard({
  progress,
  endDate,
  decimalPlaces,
  timerKind = 'service',
  photoBackground = false,
  dotGridUnitMode,
  upcomingHeadline = null,
  centerDisplay = 'remaining',
  onCenterDisplayChange,
}: TimerVizSummaryCardProps) {
  const theme = useAppTheme();
  const { theme: appTheme } = useColorTheme();
  const unitMode = dotGridUnitMode;
  const copy = getTimerVizSummaryCopy(
    progress,
    unitMode,
    decimalPlaces,
    centerDisplay,
    timerKind,
  );

  const endLabel = format(startOfDay(endDate), 'd MMM yyyy', { locale: ru });
  const barWidth = `${Math.min(100, Math.max(0, progress.progressRatio * 100))}%`;
  const isPercentPlaque = unitMode === 'percent';

  const cardStyle = [
    styles.card,
    {
      backgroundColor: photoBackground ? 'transparent' : theme.overlay.fill,
      borderColor: photoBackground ? 'rgba(242, 240, 236, 0.38)' : theme.overlay.border,
    },
  ];
  const muted = photoBackground ? styles.photoMuted : { color: theme.text.secondary };
  const strong = photoBackground ? styles.photoText : { color: theme.text.primary };
  const barFillColor = photoBackground ? '#F2F0EC' : theme.text.accent;
  const barTrackColor = timerVizUnpassedColor(
    theme.overlay.muted,
    theme.text.secondary,
    appTheme.scheme,
    photoBackground,
  );

  return (
    <View style={styles.wrapper}>
      {onCenterDisplayChange ? (
        <View style={styles.toggleRow}>
          <CenterDisplayToggle
            value={centerDisplay}
            onChange={onCenterDisplayChange}
            photoBackground={photoBackground}
          />
        </View>
      ) : null}

      <View style={cardStyle}>
        <View style={styles.rowTop}>
          <View style={styles.heroCol}>
            {upcomingHeadline ? (
              <Text style={[styles.upcomingInCard, muted]} numberOfLines={2}>
                {upcomingHeadline}
              </Text>
            ) : null}
            <HeroStatInline
              value={copy.heroValue}
              suffix={copy.heroSuffix}
              strong={strong}
              muted={muted}
              photoBackground={photoBackground}
              valueIncludesPercent={copy.heroIncludesPercent}
            />
          </View>
          <View style={styles.metaCol}>
            <Text
              style={[
                isPercentPlaque ? styles.metaBoldSans : styles.metaStrong,
                strong,
                photoBackground && styles.photoText,
              ]}
            >
              {copy.metaPrimary}
            </Text>
            <Text style={[styles.metaLine, muted]}>{endLabel}</Text>
          </View>
        </View>

        <View style={[styles.barTrack, { backgroundColor: barTrackColor }]}>
          <View
            style={[
              styles.barFill,
              { width: barWidth as `${number}%`, backgroundColor: barFillColor },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  toggleRow: {
    width: '100%',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    borderRadius: layout.cardBorderRadius,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  upcomingLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    width: '100%',
  },
  upcomingInCard: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  heroCol: {
    flexShrink: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  heroInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  heroNumber: {
    fontFamily: typography.fontFamily.display,
    fontSize: 36,
    lineHeight: 38,
  },
  heroUnit: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    lineHeight: 38,
  },
  metaCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  metaStrong: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 14,
    textAlign: 'right',
  },
  metaBoldSans: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'right',
  },
  metaLine: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
  },
  barTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoMuted: {
    color: 'rgba(242, 240, 236, 0.78)',
  },
});
