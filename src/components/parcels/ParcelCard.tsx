import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { ParcelEntry } from '@/types/parcels';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import {
  parcelCardDateLine,
  parcelCardSubtitle,
  parcelCardTitle,
  parcelKindLabel,
  parcelStatusLabel,
} from '@/utils/parcelCalculations';

interface ParcelCardProps {
  entry: ParcelEntry;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ParcelCard({ entry, onPress, onEdit, onDelete }: ParcelCardProps) {
  const theme = useAppTheme();
  const received = entry.status === 'received';
  const fade = received ? { opacity: 0.55 } : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.overlay.fill,
          borderColor: theme.overlay.border,
        },
      ]}
    >
      <Pressable
        style={styles.body}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${parcelKindLabel(entry.kind)}. ${parcelCardTitle(entry)}`}
      >
        <View style={[styles.kindBadge, { backgroundColor: theme.overlay.muted }, fade]}>
          <Feather
            name={entry.kind === 'handover' ? 'heart' : 'package'}
            size={16}
            color={theme.text.primary}
          />
        </View>
        <View style={styles.content}>
          <Text style={[styles.kind, { color: theme.text.secondary }, fade]}>
            {parcelKindLabel(entry.kind)} · {parcelStatusLabel(entry.kind, entry.status)}
          </Text>
          <Text style={[styles.title, { color: theme.text.primary }, fade]} numberOfLines={2}>
            {parcelCardTitle(entry)}
          </Text>
          <Text style={[styles.date, { color: theme.text.secondary }, fade]}>
            {parcelCardDateLine(entry)}
          </Text>
          {parcelCardSubtitle(entry) ? (
            <Text style={[styles.subtitle, { color: theme.text.secondary }, fade]} numberOfLines={2}>
              {parcelCardSubtitle(entry)}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Изменить"
        >
          <Feather name="edit-2" size={18} color={theme.text.secondary} />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Удалить"
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  kindBadge: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  kind: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    marginBottom: 2,
  },
  title: {
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
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
