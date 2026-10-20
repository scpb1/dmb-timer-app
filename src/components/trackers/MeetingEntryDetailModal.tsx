import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { MoodTags } from '@/components/trackers/MoodTags';
import { PhotoGrid } from '@/components/trackers/PhotoGrid';
import { PhotoViewerModal } from '@/components/trackers/PhotoViewerModal';
import type { MeetingEntry, MeetingMediaItem } from '@/types/trackers';
import { getMeetingPhotos, getMeetingVideos } from '@/types/trackers';
import { formatMeetingListMeta } from '@/utils/meetingTime';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface MeetingEntryDetailModalProps {
  visible: boolean;
  entry: MeetingEntry | null;
  onClose: () => void;
  onEdit: (entry: MeetingEntry) => void;
  onDelete: (id: string) => Promise<void>;
}

export function MeetingEntryDetailModal({
  visible,
  entry,
  onClose,
  onEdit,
  onDelete,
}: MeetingEntryDetailModalProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerItems, setViewerItems] = useState<MeetingMediaItem[]>([]);

  if (!entry) {
    return null;
  }

  const photos = getMeetingPhotos(entry).map((uri) => ({ uri, type: 'photo' as const }));
  const videos = getMeetingVideos(entry);
  const timeLabel = formatMeetingListMeta(entry);

  const handleDelete = () => {
    Alert.alert('Удалить встречу?', 'Запись можно вернуть сразу после удаления', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await onDelete(entry.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />

          <View style={styles.sheet}>
            <View style={styles.handle} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                  <Text style={styles.title} numberOfLines={2}>{entry.title?.trim() || 'Встреча'}</Text>
                <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
                  <Feather name="x" size={22} color={colors.light.text.primary} />
                </Pressable>
              </View>

              {timeLabel ? <Text style={styles.duration}>{timeLabel}</Text> : null}

              {entry.moods && entry.moods.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Настроение</Text>
                  <MoodTags moods={entry.moods} />
                </View>
              ) : null}

              {photos.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Фото</Text>
                  <PhotoGrid
                    items={photos}
                    onItemPress={(index) => {
                      setViewerItems(photos);
                      setViewerIndex(index);
                      setViewerVisible(true);
                    }}
                  />
                </View>
              ) : null}

              {videos.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Видео</Text>
                  <PhotoGrid
                    items={videos}
                    onItemPress={(index) => {
                      setViewerItems(videos);
                      setViewerIndex(index);
                      setViewerVisible(true);
                    }}
                  />
                </View>
              ) : null}

              {entry.impressions ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Впечатления о встрече</Text>
                  <Text style={styles.impressions}>{entry.impressions}</Text>
                </View>
              ) : null}

              <Pressable
                style={styles.editButton}
                onPress={() => {
                  onEdit(entry);
                  onClose();
                }}
              >
                <Feather name="edit-2" size={18} color={colors.light.text.primary} />
                <Text style={styles.editButtonText}>Изменить встречу</Text>
              </Pressable>

              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Feather name="trash-2" size={18} color={colors.light.text.accent} />
                <Text style={styles.deleteButtonText}>Удалить встречу</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PhotoViewerModal
        visible={viewerVisible}
        items={viewerItems}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.light.background.start,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(167, 154, 138, 0.4)',
    marginTop: 10,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    marginRight: 12,
    fontFamily: typography.fontFamily.primary,
    fontSize: 22,
    color: colors.light.text.primary,
  },
  duration: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    color: colors.light.text.secondary,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  impressions: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.primary,
    lineHeight: 22,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  editButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.text.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.accent,
  },
});
