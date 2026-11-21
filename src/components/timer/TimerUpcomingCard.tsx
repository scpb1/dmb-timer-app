import { StyleSheet, Text, View } from 'react-native';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import { timerEventGlyphColorOverride } from '@/components/timer/timerEventGlyphColor';
import { solidWhiteStatCard, solidWhiteStatCardColors } from '@/components/timer/timerStatCardStyles';
import type { EventGlyph } from '@/utils/eventGlyphs';
import { resolveHolidayCardStyle } from '@/utils/cardHighlight';
import {
  BOUNDARY_GLYPH_ON_FILL,
  resolveEventCardStyle,
} from '@/utils/serviceBoundaryEvents';
import { layout, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import {
  formatTimerUpcomingCountdown,
  timerUpcomingDisplayName,
  type TimerUpcomingItem,
} from '@/utils/timerUpcoming';
import { formatEventDate } from '@/utils/eventCalculations';
import { formatHolidayDate } from '@/utils/holidayCalculations';

interface TimerUpcomingCardProps {
  item: TimerUpcomingItem;
  glyph: EventGlyph;
  photoBackground?: boolean;
  showBorder?: boolean;
  omitDemobilizationCountdown?: boolean;
  /** Белая карточка для PNG. «Выделение строки» остаётся цветным. */
  solidWhite?: boolean;
}

export function TimerUpcomingCard({
  item,
  glyph,
  photoBackground = false,
  showBorder = true,
  omitDemobilizationCountdown = false,
  solidWhite = false,
}: TimerUpcomingCardProps) {
  const theme = useAppTheme();
  const isPast = item.kind === 'event' ? item.event.isPast : item.holiday.isPast;
  const dateText =
    item.kind === 'event' ? formatEventDate(item.event.date) : formatHolidayDate(item.holiday);
  const subtitle = formatTimerUpcomingCountdown(item, new Date(), omitDemobilizationCountdown);
  const boundaryStyle =
    item.kind === 'holiday'
      ? resolveHolidayCardStyle(item.holiday, theme.text.primary)
      : resolveEventCardStyle(item.event, theme.text.primary);
  const rowAccent = boundaryStyle?.rowAccent ?? null;
  const isAccentRow = rowAccent != null && rowAccent.length > 0;
  const isWhiteSheet = solidWhite && !isAccentRow;
  const onPhoto = photoBackground && !solidWhite;
  const iconOpacity = onPhoto ? undefined : isPast ? 0.72 : undefined;
  const nameColor = isAccentRow
    ? BOUNDARY_GLYPH_ON_FILL
    : isWhiteSheet
      ? solidWhiteStatCardColors.ink
      : isPast
        ? theme.text.secondary
        : theme.text.primary;
  const secondaryColor = isAccentRow
    ? 'rgba(255, 255, 255, 0.88)'
    : isWhiteSheet
      ? solidWhiteStatCardColors.muted
      : theme.text.secondary;

  const accentRowStyle =
    isAccentRow && rowAccent
      ? {
          backgroundColor: rowAccent,
          borderColor: 'rgba(255, 255, 255, 0.28)',
          overflow: 'hidden' as const,
        }
      : null;

  const cardStyle = [
    styles.card,
    onPhoto
      ? styles.photoCard
      : {
          backgroundColor: theme.overlay.fill,
          borderColor: theme.overlay.border,
        },
    !showBorder && !solidWhite && styles.borderless,
    !onPhoto && !solidWhite && isPast && styles.cardPast,
    isWhiteSheet && solidWhiteStatCard.card,
    accentRowStyle,
  ];

  return (
    <View style={cardStyle}>
      <EventGlyphBadge
        glyph={glyph}
        color={
          isAccentRow
            ? boundaryStyle?.glyphOnFill
              ? BOUNDARY_GLYPH_ON_FILL
              : boundaryStyle?.glyphColor
            : timerEventGlyphColorOverride(glyph, onPhoto)
        }
        backgroundColor={isAccentRow ? boundaryStyle?.badgeFill : undefined}
        opacity={iconOpacity}
      />
      <View style={styles.content}>
        {onPhoto ? (
          <>
            <Text style={[styles.name, styles.photoText]} numberOfLines={2}>
              {timerUpcomingDisplayName(item)}
            </Text>
            <Text style={[styles.date, styles.photoTextSecondary]}>{dateText}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, styles.photoTextSecondary]}>{subtitle}</Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={[styles.name, { color: nameColor }]} numberOfLines={2}>
              {timerUpcomingDisplayName(item)}
            </Text>
            <Text style={[styles.date, { color: secondaryColor }]}>{dateText}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: secondaryColor }]}>{subtitle}</Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: layout.cardBorderRadius,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  photoCard: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(242, 240, 236, 0.38)',
  },
  borderless: {
    borderWidth: 0,
  },
  cardPast: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  name: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
  },
  subtitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.85,
  },
  photoText: {
    color: '#F2F0EC',
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoTextSecondary: {
    color: 'rgba(242, 240, 236, 0.88)',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
