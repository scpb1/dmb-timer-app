import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { DatePicker } from '@/components/common/DatePicker';
import { MeetingTimeRangeInput } from '@/components/trackers/MeetingTimeRangeInput';
import { MoodPicker } from '@/components/trackers/MoodPicker';
import { PhotoGrid } from '@/components/trackers/PhotoGrid';
import { PhotoViewerModal } from '@/components/trackers/PhotoViewerModal';
import type { MeetingEntryInput } from '@/hooks/useMeetingTracker';
import type { MeetingEntry, MeetingMediaItem, TrackerMood } from '@/types/trackers';
import { getMeetingPhotos, getMeetingVideos } from '@/types/trackers';
import { getMeetingDurationSeconds, parseDateKey, validateMeetingTimes } from '@/utils/meetingTime';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface MeetingEntryFormModalProps {
  visible: boolean;
  date: string;
  entry?: MeetingEntry | null;
  onClose: () => void;
  onSave: (date: string, input: MeetingEntryInput) => Promise<boolean>;
}

export function MeetingEntryFormModal({
  visible,
  date,
  entry,
  onClose,
  onSave,
}: MeetingEntryFormModalProps) {
  const [entryDate, setEntryDate] = useState(date);
  const [startTime, setStartTime] = useState<string | undefined>();
  const [endTime, setEndTime] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [moods, setMoods] = useState<TrackerMood[]>([]);
  const [impressions, setImpressions] = useState('');
  const [photos, setPhotos] = useState<MeetingMediaItem[]>([]);
  const [videos, setVideos] = useState<MeetingMediaItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [viewerItems, setViewerItems] = useState<MeetingMediaItem[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (entry) {
      setEntryDate(entry.date);
      setStartTime(entry.startTime);
      setEndTime(entry.endTime);
      setTitle(entry.title ?? '');
      setMoods(entry.moods ?? []);
      setImpressions(entry.impressions ?? '');
      setPhotos(getMeetingPhotos(entry).map((uri) => ({ uri, type: 'photo' as const })));
      setVideos(getMeetingVideos(entry));
      setIsSaving(false);
      setViewerVisible(false);
      return;
    }

    setEntryDate(date);
    setStartTime(undefined);
    setEndTime(undefined);
    setTitle('');
    setMoods([]);
    setImpressions('');
    setPhotos([]);
    setVideos([]);
    setIsSaving(false);
    setViewerVisible(false);
  }, [visible, entry, date]);

  const pickPhotosFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 0,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotos((current) => [
        ...current,
        ...result.assets.map((asset) => ({ uri: asset.uri, type: 'photo' as const })),
      ]);
    }
  };

  const pickPhotoFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((current) => [...current, { uri: result.assets[0].uri, type: 'photo' }]);
    }
  };

  const pickVideosFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 0,
      videoMaxDuration: 600,
    });

    if (!result.canceled && result.assets.length > 0) {
      setVideos((current) => [
        ...current,
        ...result.assets.map((asset) => ({ uri: asset.uri, type: 'video' as const })),
      ]);
    }
  };

  const pickVideoFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 600,
    });

    if (!result.canceled && result.assets[0]) {
      setVideos((current) => [...current, { uri: result.assets[0].uri, type: 'video' }]);
    }
  };

  const openViewer = (items: MeetingMediaItem[], index: number) => {
    setViewerItems(items);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const handleSave = async () => {
    const timeError = validateMeetingTimes(entryDate, startTime, endTime);
    if (timeError) {
      Alert.alert('Укажите время', timeError);
      return;
    }

    const mediaItems: MeetingMediaItem[] = [...photos, ...videos];
    const durationSeconds =
      getMeetingDurationSeconds({
        startTime,
        endTime,
        durationSeconds: 0,
      }) ?? 0;

    setIsSaving(true);
    const success = await onSave(entryDate, {
      title,
      startTime,
      endTime,
      durationSeconds,
      moods: moods.length > 0 ? moods : undefined,
      mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
      impressions,
    });
    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      Alert.alert('Ошибка', 'Не удалось сохранить встречу');
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />

          <View style={styles.sheet}>
            <View style={styles.handle} />

            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>{entry ? 'Изменить встречу' : 'Новая встреча'}</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
                  <Feather name="x" size={22} color={colors.light.text.primary} />
                </Pressable>
              </View>

              <DatePicker
                label="Дата"
                value={parseDateKey(entryDate)}
                onChange={(next) => {
                  const nextDate = format(next, 'yyyy-MM-dd');
                  setEntryDate(nextDate);
                  if (!startTime) {
                    setEndTime(undefined);
                  }
                }}
                labelStyle={styles.datePickerLabel}
                buttonStyle={styles.datePickerButton}
                buttonTextStyle={styles.datePickerButtonText}
              />

              <MeetingTimeRangeInput
                date={entryDate}
                startTime={startTime}
                endTime={endTime}
                onChangeStart={setStartTime}
                onChangeEnd={setEndTime}
              />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Название</Text>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Как назвать встречу?"
                  placeholderTextColor={colors.light.input.placeholder}
                />
              </View>

              <MoodPicker value={moods} onChange={setMoods} />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Фото</Text>
                <View style={styles.mediaButtons}>
                  <Pressable style={styles.attachButton} onPress={pickPhotosFromLibrary}>
                    <Feather name="image" size={18} color={colors.light.text.primary} />
                    <Text style={styles.attachButtonText}>Галерея</Text>
                  </Pressable>
                  <Pressable style={styles.attachButton} onPress={pickPhotoFromCamera}>
                    <Feather name="camera" size={18} color={colors.light.text.primary} />
                    <Text style={styles.attachButtonText}>Камера</Text>
                  </Pressable>
                </View>
                <PhotoGrid
                  items={photos}
                  editable
                  onItemPress={(index) => openViewer(photos, index)}
                  onRemove={(index) => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Видео</Text>
                <View style={styles.mediaButtons}>
                  <Pressable style={styles.attachButton} onPress={pickVideosFromLibrary}>
                    <Feather name="video" size={18} color={colors.light.text.primary} />
                    <Text style={styles.attachButtonText}>Галерея</Text>
                  </Pressable>
                  <Pressable style={styles.attachButton} onPress={pickVideoFromCamera}>
                    <Feather name="camera" size={18} color={colors.light.text.primary} />
                    <Text style={styles.attachButtonText}>Камера</Text>
                  </Pressable>
                </View>
                <PhotoGrid
                  items={videos}
                  editable
                  onItemPress={(index) => openViewer(videos, index)}
                  onRemove={(index) => setVideos((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Впечатления о встрече</Text>
                <TextInput
                  style={styles.textArea}
                  value={impressions}
                  onChangeText={setImpressions}
                  placeholder="Как прошла встреча?"
                  placeholderTextColor={colors.light.input.placeholder}
                  multiline
                />
              </View>

              <Pressable
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Сохранение…' : 'Сохранить'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    maxHeight: '92%',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 22,
    color: colors.light.text.primary,
  },
  datePickerLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
    textAlign: 'left',
    fontWeight: '400',
    marginBottom: 8,
  },
  datePickerButton: {
    marginHorizontal: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingVertical: 10,
  },
  datePickerButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    textAlign: 'left',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: colors.light.input.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  attachButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.primary,
  },
  textArea: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.light.input.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    textAlignVertical: 'top',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.text.primary,
    borderRadius: 4,
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.background.start,
  },
});
