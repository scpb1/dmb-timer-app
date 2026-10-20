import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { ProgressBarMode } from '@/types/timer';
import type { ServiceProgress } from '@/utils/timerCalculations';
import {
  formatProgressPercent,
  getDotGridUnitsLeft,
} from '@/utils/timerCalculations';
import { inflect } from '@/utils/inflection';
import { layout, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface TimerVizSummaryCardProps {
  progress: ServiceProgress;
  endDate: Date;
  decimalPlaces: number;
  photoBackground?: boolean;
  dotGridUnitMode?: ProgressBarMode;
  upcomingHeadline?: string | null;
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
      <Text style={[styles.heroNumber, strong, photoBackground && styles.photoText]}>{value}</Text>
      {valueIncludesPercent ? (
        <Text style={[styles.heroNumber, strong, photoBackground && styles.photoText]}>%</Text>
      ) : null}
      <Text style={[styles.heroUnit, muted]}>{suffix}</Text>
    </View>
  );
}

export function TimerVizSummaryCard({
  progress,
  endDate,
  decimalPlaces,
  photoBackground = false,
  dotGridUnitMode,
  upcomingHeadline = null,
}: TimerVizSummaryCardProps) {
  const theme = useAppTheme();
  const unitMode = dotGridUnitMode;
  const useDotGridCounts = unitMode === 'weeks' || unitMode === 'months';

  const weeksHero = useDotGridCounts
    ? getDotGridUnitsLeft('weeks', progress)
    : progress.phase === 'before'
      ? Math.ceil(progress.daysUntilStart / 7)
      : progress.phase === 'after'
        ? 0
        : progress.weeksLeft;

  const monthsHero = useDotGridCounts
    ? getDotGridUnitsLeft('months', progress)
    : progress.phase === 'before'
      ? Math.ceil(progress.daysUntilStart / 30)
      : progress.phase === 'after'
        ? 0
        : progress.monthsLeft;

  const daysHero =
    progress.phase === 'before'
      ? progress.daysUntilStart
      : progress.phase === 'after'
        ? progress.daysAfterEnd
        : progress.daysLeft;

  const remainingPercent =
    progress.phase === 'before'
      ? 100
      : progress.phase === 'after'
        ? 0
        : (1 - progress.progressRatio) * 100;

  const progressPercentLabel = `${formatProgressPercent(progress.progressPercent, decimalPlaces)}%`;
  const remainingPercentValue = formatProgressPercent(remainingPercent, decimalPlaces);
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

  const weeksSuffix =
    progress.phase === 'before'
      ? ` ${inflect(weeksHero, 'week')} до старта`
      : progress.phase === 'after'
        ? ` ${inflect(weeksHero, 'week')} после`
        : ` ${inflect(weeksHero, 'week')} осталось`;

  const monthsSuffix =
    progress.phase === 'before'
      ? ` ${inflect(monthsHero, 'month')} до старта`
      : progress.phase === 'after'
        ? ` ${inflect(monthsHero, 'month')} после`
        : ` ${inflect(monthsHero, 'month')} осталось`;

  const daysSuffix =
    progress.phase === 'before'
      ? ' до старта'
      : progress.phase === 'after'
        ? ' после'
        : ' ддд';

  const renderLeftCol = () => {
    if (isPercentPlaque) {
      return (
        <HeroStatInline
          value={remainingPercentValue}
          suffix=" осталось"
          strong={strong}
          muted={muted}
          photoBackground={photoBackground}
          valueIncludesPercent
        />
      );
    }
    if (unitMode === 'days') {
      return (
        <HeroStatInline
          value={String(daysHero)}
          suffix={daysSuffix}
          strong={strong}
          muted={muted}
          photoBackground={photoBackground}
        />
      );
    }
    if (unitMode === 'months') {
      return (
        <HeroStatInline
          value={String(monthsHero)}
          suffix={monthsSuffix}
          strong={strong}
          muted={muted}
          photoBackground={photoBackground}
        />
      );
    }
    if (unitMode === 'weeks') {
      return (
        <HeroStatInline
          value={String(weeksHero)}
          suffix={weeksSuffix}
          strong={strong}
          muted={muted}
          photoBackground={photoBackground}
        />
      );
    }
    return (
      <HeroStatInline
        value={String(weeksHero)}
        suffix={weeksSuffix}
        strong={strong}
        muted={muted}
        photoBackground={photoBackground}
      />
    );
  };

  const renderRightCol = () => {
    if (isPercentPlaque) {
      return (
        <>
          <Text style={[styles.metaBoldSans, strong, photoBackground && styles.photoText]}>
            {daysHero}
            {daysSuffix}
          </Text>
          <Text style={[styles.metaLine, muted]}>{endLabel}</Text>
        </>
      );
    }
    return (
      <>
        <Text style={[styles.metaStrong, strong]}>{progressPercentLabel}</Text>
        <Text style={[styles.metaLine, muted]}>{endLabel}</Text>
      </>
    );
  };

  return (
    <View style={cardStyle}>
      <View style={styles.rowTop}>
        <View style={styles.heroCol}>
          {upcomingHeadline ? (
            <Text style={[styles.upcomingInCard, muted]} numberOfLines={2}>
              {upcomingHeadline}
            </Text>
          ) : null}
          {renderLeftCol()}
        </View>
        <View style={styles.metaCol}>{renderRightCol()}</View>
      </View>

      <View style={[styles.barTrack, photoBackground && styles.barTrackPhoto]}>
        <View
          style={[
            styles.barFill,
            { width: barWidth as `${number}%`, backgroundColor: barFillColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(167, 154, 138, 0.28)',
    overflow: 'hidden',
  },
  barTrackPhoto: {
    backgroundColor: 'rgba(242, 240, 236, 0.22)',
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
