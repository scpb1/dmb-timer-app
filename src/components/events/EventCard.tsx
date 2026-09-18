import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import type { EventGlyph } from '@/utils/eventGlyphs';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface EventCardProps {
  name: string;
  dateText: string;
  subtitle?: string | null;
  isPast: boolean;
  kind: 'event' | 'holiday';
  glyph: EventGlyph;
  onEdit: () => void;
  onDelete: () => void;
}

export function EventCard({
  name,
  dateText,
  subtitle,
  isPast,
  kind,
  glyph,
  onEdit,
  onDelete,
}: EventCardProps) {
  const isHoliday = kind === 'holiday';

  return (
    <View
      style={[
        styles.card,
        isHoliday && styles.cardHoliday,
        isPast && styles.cardPast,
      ]}
    >
      <EventGlyphBadge glyph={glyph} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.date}>{dateText}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isHoliday ? 'Изменить праздник' : 'Изменить событие'}
        >
          <Feather name="edit-2" size={18} color={colors.light.text.secondary} />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isHoliday ? 'Удалить праздник' : 'Удалить событие'}
        >
          <Feather name="x" size={20} color={colors.light.text.secondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  cardHoliday: {
    backgroundColor: colors.light.holiday.cardBackground,
    borderColor: colors.light.holiday.cardBorder,
  },
  cardPast: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text.primary,
    marginBottom: 4,
  },
  date: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    marginTop: 2,
    opacity: 0.85,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
