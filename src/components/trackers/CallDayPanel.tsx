import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Feather } from '@expo/vector-icons';

import { CallEntryFormModal } from '@/components/trackers/CallEntryFormModal';
import { MoodTags } from '@/components/trackers/MoodTags';
import type { CallEntryInput } from '@/hooks/useCallTracker';
import type { CallEntry } from '@/types/trackers';
import { formatCallDuration } from '@/utils/durationFormat';
import { getEntriesForDate } from '@/utils/trackerCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface CallDayPanelProps {
  date: string;
  entries: CallEntry[];
  onAdd: (date: string, input: CallEntryInput) => Promise<boolean>;
  onEntryPress: (entry: CallEntry) => void;
}

export function CallDayPanel({ date, entries, onAdd, onEntryPress }: CallDayPanelProps) {
  const [formVisible, setFormVisible] = useState(false);

  const dayEntries = useMemo(() => getEntriesForDate(entries, date), [entries, date]);
  const formattedDate = format(parseISO(date), 'd MMMM yyyy', { locale: ru });

  return (
    <View style={styles.container}>
      <Text style={styles.dateTitle}>{formattedDate}</Text>
      <Text style={styles.sectionTitle}>Звонки за день</Text>

      {dayEntries.length === 0 ? (
        <Text style={styles.emptyText}>Нет записей за этот день</Text>
      ) : (
        <View style={styles.list}>
          {dayEntries.map((entry, index) => (
            <Pressable
              key={entry.id}
              style={styles.card}
              onPress={() => onEntryPress(entry)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Звонок {index + 1}</Text>
                <Text style={styles.cardDuration}>{formatCallDuration(entry.durationSeconds)}</Text>
              </View>
              <MoodTags moods={entry.moods} compact />
              {entry.impressions ? (
                <Text style={styles.cardPreview} numberOfLines={2}>
                  {entry.impressions}
                </Text>
              ) : null}
              {entry.audioUri ? (
                <View style={styles.metaItem}>
                  <Feather name="music" size={14} color={colors.light.text.secondary} />
                  <Text style={styles.metaText}>Аудио</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}

      <Pressable style={styles.addButton} onPress={() => setFormVisible(true)}>
        <Feather name="plus" size={18} color={colors.light.text.primary} />
        <Text style={styles.addButtonText}>Добавить звонок</Text>
      </Pressable>

      <CallEntryFormModal
        visible={formVisible}
        date={date}
        onClose={() => setFormVisible(false)}
        onSave={onAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  dateTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 20,
    color: colors.light.text.primary,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.text.secondary,
  },
  emptyText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 7,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.text.primary,
  },
  cardDuration: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  cardPreview: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.primary,
    lineHeight: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  addButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.text.primary,
  },
});
