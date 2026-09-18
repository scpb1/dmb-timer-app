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
import { Feather } from '@expo/vector-icons';

import { CallDurationInput } from '@/components/trackers/CallDurationInput';
import { MoodPicker } from '@/components/trackers/MoodPicker';
import type { CallEntryInput } from '@/hooks/useCallTracker';
import type { TrackerMood } from '@/types/trackers';
import { pickAudioFile } from '@/utils/pickAudioFile';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface CallEntryFormModalProps {
  visible: boolean;
  date: string;
  onClose: () => void;
  onSave: (date: string, input: CallEntryInput) => Promise<boolean>;
}

export function CallEntryFormModal({ visible, date, onClose, onSave }: CallEntryFormModalProps) {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [moods, setMoods] = useState<TrackerMood[]>([]);
  const [impressions, setImpressions] = useState('');
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [audioName, setAudioName] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setMinutes(0);
      setSeconds(0);
      setMoods([]);
      setImpressions('');
      setAudioUri(undefined);
      setAudioName(undefined);
      setIsSaving(false);
    }
  }, [visible]);

  const formattedDate = format(parseISO(date), 'd MMMM yyyy', { locale: ru });

  const attachAudio = async () => {
    const picked = await pickAudioFile();
    if (!picked) {
      return;
    }
    setAudioUri(picked.uri);
    setAudioName(picked.name);
  };

  const handleSave = async () => {
    const durationSeconds = minutes * 60 + seconds;
    if (durationSeconds <= 0) {
      Alert.alert('Укажите длительность', 'Длительность звонка должна быть больше 0');
      return;
    }

    setIsSaving(true);
    const success = await onSave(date, {
      durationSeconds,
      moods: moods.length > 0 ? moods : undefined,
      audioUri,
      audioName,
      impressions,
    });
    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      Alert.alert('Ошибка', 'Не удалось сохранить звонок');
    }
  };

  return (
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
                <Text style={styles.title}>Новый звонок</Text>
                <Text style={styles.subtitle}>{formattedDate}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <Feather name="x" size={22} color={colors.light.text.primary} />
              </Pressable>
            </View>

            <CallDurationInput
              minutes={minutes}
              seconds={seconds}
              onChangeMinutes={setMinutes}
              onChangeSeconds={setSeconds}
            />

            <MoodPicker value={moods} onChange={setMoods} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Аудиозапись</Text>
              <Pressable style={styles.attachButton} onPress={attachAudio}>
                <Feather name="paperclip" size={18} color={colors.light.text.primary} />
                <Text style={styles.attachButtonText}>{audioName ?? 'Прикрепить файл'}</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Впечатления о звонке</Text>
              <TextInput
                style={styles.textArea}
                value={impressions}
                onChangeText={setImpressions}
                placeholder="Как прошёл звонок?"
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
    maxHeight: '90%',
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
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
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
    maxWidth: 220,
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
