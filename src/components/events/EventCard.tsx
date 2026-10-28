import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { EventGlyphBadge } from '@/components/events/EventGlyphBadge';
import type { EventGlyph } from '@/utils/eventGlyphs';
import {
  BOUNDARY_GLYPH_ON_FILL,
  type ServiceBoundaryCardStyle,
} from '@/utils/serviceBoundaryEvents';
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
  boundaryStyle?: ServiceBoundaryCardStyle | null;
  canDelete?: boolean;
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
  boundaryStyle = null,
  canDelete = true,
  onEdit,
  onDelete,
}: EventCardProps) {
  const theme = useAppTheme();
  const isHoliday = kind === 'holiday';
  const rowAccent = boundaryStyle?.rowAccent ?? null;
  const isAccentRow = rowAccent != null && rowAccent.length > 0;
  const pastFade = isPast ? { opacity: 0.3 } : null;

  const primaryText = isAccentRow ? BOUNDARY_GLYPH_ON_FILL : theme.text.primary;
  const secondaryText = isAccentRow ? 'rgba(255, 255, 255, 0.88)' : theme.text.secondary;
  const actionIconColor = isAccentRow ? 'rgba(255, 255, 255, 0.92)' : theme.text.secondary;
  const todayBorder = isAccentRow ? BOUNDARY_GLYPH_ON_FILL : theme.text.primary;

  const badgeFill = boundaryStyle?.badgeFill;
  const glyphOnFill = boundaryStyle?.glyphOnFill ?? false;
  const glyphColor = boundaryStyle?.glyphColor;
  return (
    <View
      style={[
        styles.card,
        isAccentRow && rowAccent
          ? {
              backgroundColor: rowAccent,
              borderColor: 'rgba(255, 255, 255, 0.28)',
            }
          : {
              backgroundColor: theme.overlay.fill,
              borderColor: theme.overlay.border,
            },
        isToday && {
          borderColor: todayBorder,
          borderWidth: 1.5,
        },
      ]}
    >
      <EventGlyphBadge
        glyph={glyph}
        color={glyphOnFill ? BOUNDARY_GLYPH_ON_FILL : glyphColor}
        backgroundColor={badgeFill}
        opacity={isPast ? 0.3 : undefined}
      />
      <View style={styles.content}>
        <Text
          style={[styles.name, { color: primaryText }, pastFade]}
          numberOfLines={2}
        >
          {name}
        </Text>
        <Text style={[styles.date, { color: secondaryText }, pastFade]}>{dateText}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: secondaryText }, pastFade]}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, pastFade]}
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isHoliday ? 'Изменить праздник' : 'Изменить событие'}
        >
          <Feather name="edit-2" size={18} color={actionIconColor} />
        </Pressable>

        {canDelete ? (
          <Pressable
            style={[styles.actionButton, pastFade]}
            onPress={onDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isHoliday ? 'Удалить праздник' : 'Удалить событие'}
          >
            <Feather name="x" size={20} color={actionIconColor} />
          </Pressable>
        ) : null}
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
