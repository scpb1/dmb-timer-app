import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { DisplayEvent } from '@/types/events';
import { formatEventDate, formatEventSubtitle } from '@/utils/eventCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface EventCardProps {
  event: DisplayEvent;
  onEdit: (event: DisplayEvent) => void;
  onDelete: (event: DisplayEvent) => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const subtitle = formatEventSubtitle(event);

  return (
    <View style={[styles.card, event.isPast && styles.cardPast]}>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {event.name}
        </Text>
        <Text style={styles.date}>{formatEventDate(event.date)}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => onEdit(event)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Изменить событие"
        >
          <Feather name="edit-2" size={18} color={colors.light.text.secondary} />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => onDelete(event)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Удалить событие"
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
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  cardPast: {
    opacity: 0.65,
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
