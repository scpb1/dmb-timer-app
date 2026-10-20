import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Feather } from '@expo/vector-icons';

import { MeetingEntryFormModal } from '@/components/trackers/MeetingEntryFormModal';
import { MoodTags } from '@/components/trackers/MoodTags';
import type { MeetingEntryInput } from '@/hooks/useMeetingTracker';
import type { MeetingEntry } from '@/types/trackers';
import { getMeetingMediaCount } from '@/types/trackers';
import { formatMeetingListMeta, parseDateKey } from '@/utils/meetingTime';
import { getEntriesForDate } from '@/utils/trackerCalculations';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface MeetingDayPanelProps {
  date: string;
  entries: MeetingEntry[];
  editingEntry?: MeetingEntry | null;
  onAdd: (date: string, input: MeetingEntryInput) => Promise<boolean>;
  onUpdate: (id: string, date: string, input: MeetingEntryInput) => Promise<boolean>;
  onEntryPress: (entry: MeetingEntry) => void;
  onEditHandled?: () => void;
}

export function MeetingDayPanel({
  date,
  entries,
  editingEntry,
  onAdd,
  onUpdate,
  onEntryPress,
  onEditHandled,
}: MeetingDayPanelProps) {
  const [formVisible, setFormVisible] = useState(false);

  const dayEntries = useMemo(() => getEntriesForDate(entries, date), [entries, date]);
  const formattedDate = format(parseDateKey(date), 'd MMMM yyyy', { locale: ru });

  useEffect(() => {
    if (editingEntry) {
      setFormVisible(true);
    }
  }, [editingEntry]);

  const openCreate = () => {
    onEditHandled?.();
    setFormVisible(true);
  };

  const handleCloseForm = () => {
    setFormVisible(false);
    onEditHandled?.();
  };

  const handleSave = async (entryDate: string, input: MeetingEntryInput) => {
    if (editingEntry) {
      return onUpdate(editingEntry.id, entryDate, input);
    }
    return onAdd(entryDate, input);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dateTitle}>{formattedDate}</Text>
      <Text style={styles.sectionTitle}>Встречи за день</Text>

      {dayEntries.length === 0 ? (
        <Text style={styles.emptyText}>Нет записей за этот день</Text>
      ) : (
        <View style={styles.list}>
          {dayEntries.map((entry, index) => {
            const mediaCount = getMeetingMediaCount(entry);
            const timeLabel = formatMeetingListMeta(entry);

            return (
              <Pressable
                key={entry.id}
                style={styles.card}
                onPress={() => onEntryPress(entry)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {entry.title?.trim() || `Встреча ${index + 1}`}
                  </Text>
                  {timeLabel ? <Text style={styles.cardDuration}>{timeLabel}</Text> : null}
                </View>
                <MoodTags moods={entry.moods} compact />
                {entry.impressions ? (
                  <Text style={styles.cardPreview} numberOfLines={2}>
                    {entry.impressions}
                  </Text>
                ) : null}
                <View style={styles.cardMeta}>
                  {mediaCount.photos > 0 ? (
                    <View style={styles.metaItem}>
                      <Feather name="image" size={14} color={colors.light.text.secondary} />
                      <Text style={styles.metaText}>
                        {mediaCount.photos} фото
                      </Text>
                    </View>
                  ) : null}
                  {mediaCount.videos > 0 ? (
                    <View style={styles.metaItem}>
                      <Feather name="video" size={14} color={colors.light.text.secondary} />
                      <Text style={styles.metaText}>Видео</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable style={styles.addButton} onPress={openCreate}>
        <Feather name="plus" size={18} color={colors.light.text.primary} />
        <Text style={styles.addButtonText}>Добавить встречу</Text>
      </Pressable>

      <MeetingEntryFormModal
        visible={formVisible}
        date={date}
        entry={formVisible ? editingEntry : null}
        onClose={handleCloseForm}
        onSave={handleSave}
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
    borderRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    marginRight: 8,
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.text.primary,
  },
  cardDuration: {
    flexShrink: 0,
    maxWidth: '46%',
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
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
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
    borderRadius: 4,
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
