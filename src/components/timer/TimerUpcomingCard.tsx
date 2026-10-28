import { StyleSheet, Text, View } from 'react-native';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import { timerEventGlyphColorOverride } from '@/components/timer/timerEventGlyphColor';
import type { EventGlyph } from '@/utils/eventGlyphs';
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
}

export function TimerUpcomingCard({
  item,
  glyph,
  photoBackground = false,
  showBorder = true,
  omitDemobilizationCountdown = false,
}: TimerUpcomingCardProps) {
  const theme = useAppTheme();
  const isPast = item.kind === 'event' ? item.event.isPast : item.holiday.isPast;
  const dateText =
    item.kind === 'event' ? formatEventDate(item.event.date) : formatHolidayDate(item.holiday);
  const subtitle = formatTimerUpcomingCountdown(item, new Date(), omitDemobilizationCountdown);
  const iconOpacity = photoBackground ? undefined : isPast ? 0.72 : undefined;

  const cardStyle = [
    styles.card,
    photoBackground
      ? styles.photoCard
      : {
          backgroundColor: theme.overlay.fill,
          borderColor: theme.overlay.border,
        },
    !showBorder && styles.borderless,
    !photoBackground && isPast && styles.cardPast,
  ];

  return (
    <View style={cardStyle}>
      <EventGlyphBadge
        glyph={glyph}
        color={timerEventGlyphColorOverride(glyph, photoBackground)}
        opacity={iconOpacity}
      />
      <View style={styles.content}>
        {photoBackground ? (
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
            <Text
              style={[styles.name, { color: isPast ? theme.text.secondary : theme.text.primary }]}
              numberOfLines={2}
            >
              {timerUpcomingDisplayName(item)}
            </Text>
            <Text style={[styles.date, { color: theme.text.secondary }]}>{dateText}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{subtitle}</Text>
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
