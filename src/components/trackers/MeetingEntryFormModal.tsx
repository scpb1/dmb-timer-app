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
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { MeetingDurationInput } from '@/components/trackers/MeetingDurationInput';
import { MoodPicker } from '@/components/trackers/MoodPicker';
import { PhotoGrid } from '@/components/trackers/PhotoGrid';
import { PhotoViewerModal } from '@/components/trackers/PhotoViewerModal';
import type { MeetingEntryInput } from '@/hooks/useMeetingTracker';
import type { MeetingMediaItem, TrackerMood } from '@/types/trackers';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface MeetingEntryFormModalProps {
  visible: boolean;
  date: string;
  onClose: () => void;
  onSave: (date: string, input: MeetingEntryInput) => Promise<boolean>;
}

export function MeetingEntryFormModal({
  visible,
  date,
  onClose,
  onSave,
}: MeetingEntryFormModalProps) {
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [moods, setMoods] = useState<TrackerMood[]>([]);
  const [impressions, setImpressions] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<MeetingMediaItem | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setHours(1);
      setMinutes(0);
      setMoods([]);
      setImpressions('');
      setPhotos([]);
      setVideo(undefined);
      setIsSaving(false);
      setViewerVisible(false);
    }
  }, [visible]);

  const formattedDate = format(parseISO(date), 'd MMMM yyyy', { locale: ru });

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
      setPhotos((current) => [...current, ...result.assets.map((asset) => asset.uri)]);
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
      setPhotos((current) => [...current, result.assets[0].uri]);
    }
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 600,
    });

    if (!result.canceled && result.assets[0]) {
      setVideo({ uri: result.assets[0].uri, type: 'video' });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSave = async () => {
    const durationSeconds = hours * 3600 + minutes * 60;
    if (durationSeconds <= 0) {
      Alert.alert('Укажите длительность', 'Длительность встречи должна быть больше 0');
      return;
    }

    const mediaItems: MeetingMediaItem[] = [
      ...photos.map((uri) => ({ uri, type: 'photo' as const })),
      ...(video ? [video] : []),
    ];

    setIsSaving(true);
    const success = await onSave(date, {
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
                  <Text style={styles.title}>Новая встреча</Text>
                  <Text style={styles.subtitle}>{formattedDate}</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Feather name="x" size={22} color={colors.light.text.primary} />
                </Pressable>
              </View>

              <MeetingDurationInput
                hours={hours}
                minutes={minutes}
                onChangeHours={setHours}
                onChangeMinutes={setMinutes}
              />

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
                  photos={photos}
                  editable
                  onPhotoPress={(index) => {
                    setViewerIndex(index);
                    setViewerVisible(true);
                  }}
                  onRemove={removePhoto}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Видео</Text>
                <Pressable style={styles.attachButton} onPress={pickVideo}>
                  <Feather name="video" size={18} color={colors.light.text.primary} />
                  <Text style={styles.attachButtonText}>
                    {video ? 'Видео выбрано' : 'Прикрепить видео'}
                  </Text>
                </Pressable>
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
    maxHeight: '92%',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 22,
    color: colors.light.text.primary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
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
    borderRadius: 10,
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
    borderRadius: 6,
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
    borderRadius: 7,
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
