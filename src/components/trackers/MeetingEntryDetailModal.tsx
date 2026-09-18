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
import type { MeetingEntry } from '@/types/trackers';
import { getMeetingPhotos, getMeetingVideos } from '@/types/trackers';
import { formatMeetingDuration } from '@/utils/durationFormat';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface MeetingEntryDetailModalProps {
  visible: boolean;
  entry: MeetingEntry | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export function MeetingEntryDetailModal({
  visible,
  entry,
  onClose,
  onDelete,
}: MeetingEntryDetailModalProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (!entry) {
    return null;
  }

  const photos = getMeetingPhotos(entry);
  const videos = getMeetingVideos(entry);

  const handleDelete = () => {
    Alert.alert('Удалить встречу?', 'Запись будет удалена без возможности восстановления', [
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
                <Text style={styles.title}>Встреча</Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Feather name="x" size={22} color={colors.light.text.primary} />
                </Pressable>
              </View>

              <Text style={styles.duration}>{formatMeetingDuration(entry.durationSeconds)}</Text>

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
                    photos={photos}
                    onPhotoPress={(index) => {
                      setViewerIndex(index);
                      setViewerVisible(true);
                    }}
                  />
                </View>
              ) : null}

              {videos.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Видео</Text>
                  {videos.map((video) => (
                    <View key={video.uri} style={styles.videoBadge}>
                      <Feather name="video" size={18} color={colors.light.text.accent} />
                      <Text style={styles.videoText}>Видео прикреплено</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {entry.impressions ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Впечатления о встрече</Text>
                  <Text style={styles.impressions}>{entry.impressions}</Text>
                </View>
              ) : null}

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
        photos={photos}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  videoText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.accent,
  },
  impressions: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.primary,
    lineHeight: 22,
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
