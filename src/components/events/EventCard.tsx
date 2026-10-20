import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import type { EventGlyph } from '@/utils/eventGlyphs';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface EventCardProps {
  name: string;
  dateText: string;
  subtitle?: string | null;
  isPast: boolean;
  isToday?: boolean;
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
  isToday = false,
  kind,
  glyph,
  onEdit,
  onDelete,
}: EventCardProps) {
  const theme = useAppTheme();
  const isHoliday = kind === 'holiday';
  const pastText = isPast ? { opacity: 0.72 } : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.overlay.fill,
          borderColor: theme.overlay.border,
        },
        isHoliday && {
          backgroundColor: theme.holiday.cardBackground,
          borderColor: theme.holiday.cardBorder,
        },
        isToday && {
          borderColor: theme.text.primary,
          borderWidth: 1.5,
        },
      ]}
    >
      <EventGlyphBadge glyph={glyph} />
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: isPast ? theme.text.secondary : theme.text.primary },
            pastText,
          ]}
          numberOfLines={2}
        >
          {name}
        </Text>
        <Text style={[styles.date, { color: theme.text.secondary }, pastText]}>{dateText}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.text.secondary }, pastText]}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isHoliday ? 'Изменить праздник' : 'Изменить событие'}
        >
          <Feather name="edit-2" size={18} color={theme.text.secondary} />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isHoliday ? 'Удалить праздник' : 'Удалить событие'}
        >
          <Feather name="x" size={20} color={theme.text.secondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    paddingRight: 8,
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
    opacity: 0.9,
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
