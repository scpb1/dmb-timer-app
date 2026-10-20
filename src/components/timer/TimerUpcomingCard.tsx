import { StyleSheet, Text, View } from 'react-native';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import type { EventGlyph } from '@/utils/eventGlyphs';
import { colors, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import {
  formatTimerUpcomingCountdown,
  timerUpcomingDisplayName,
  type TimerUpcomingItem,
} from '@/utils/timerUpcoming';
import { formatEventDate, isCalendarToday } from '@/utils/eventCalculations';
import { formatHolidayDate } from '@/utils/holidayCalculations';

interface TimerUpcomingCardProps {
  item: TimerUpcomingItem;
  glyph: EventGlyph;
  photoBackground?: boolean;
  showBorder?: boolean;
}

export function TimerUpcomingCard({
  item,
  glyph,
  photoBackground = false,
  showBorder = true,
}: TimerUpcomingCardProps) {
  const theme = useAppTheme();
  const isHoliday = item.kind === 'holiday';
  const date = item.kind === 'event' ? item.event.date : item.holiday.date;
  const isPast = item.kind === 'event' ? item.event.isPast : item.holiday.isPast;
  const isToday = isCalendarToday(date);
  const dateText =
    item.kind === 'event' ? formatEventDate(item.event.date) : formatHolidayDate(item.holiday);
  const subtitle = formatTimerUpcomingCountdown(item);

  if (photoBackground) {
    return (
      <View
        style={[
          styles.card,
          styles.cardPhoto,
          isToday && showBorder && styles.cardTodayPhoto,
          !showBorder && styles.borderless,
        ]}
      >
        <EventGlyphBadge glyph={glyph} />
        <View style={styles.content}>
          <Text style={[styles.name, styles.photoText]} numberOfLines={2}>
            {timerUpcomingDisplayName(item)}
          </Text>
          <Text style={[styles.date, styles.photoTextSecondary]}>{dateText}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, styles.photoTextSecondary]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        isHoliday && styles.cardHoliday,
        isToday && styles.cardToday,
        isPast && styles.cardPast,
      ]}
    >
      <EventGlyphBadge glyph={glyph} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text.primary }]} numberOfLines={2}>
          {timerUpcomingDisplayName(item)}
        </Text>
        <Text style={[styles.date, { color: theme.text.secondary }]}>{dateText}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  cardHoliday: {
    backgroundColor: colors.light.holiday.cardBackground,
    borderColor: colors.light.holiday.cardBorder,
  },
  cardPhoto: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderColor: 'rgba(242, 240, 236, 0.38)',
  },
  borderless: {
    borderWidth: 0,
  },
  cardToday: {
    borderColor: colors.light.text.primary,
    borderWidth: 1.5,
  },
  cardTodayPhoto: {
    borderColor: '#F2F0EC',
    borderWidth: 1.5,
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
