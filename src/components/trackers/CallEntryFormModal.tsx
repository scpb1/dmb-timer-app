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
import { Feather } from '@expo/vector-icons';

import { DatePicker } from '@/components/common/DatePicker';
import { CallDurationInput } from '@/components/trackers/CallDurationInput';
import { MoodPicker } from '@/components/trackers/MoodPicker';
import type { CallEntryInput } from '@/hooks/useCallTracker';
import type { CallEntry, TrackerMood } from '@/types/trackers';
import { parseDateKey } from '@/utils/meetingTime';
import { pickAudioFile } from '@/utils/pickAudioFile';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface CallEntryFormModalProps {
  visible: boolean;
  date: string;
  entry?: CallEntry | null;
  onClose: () => void;
  onSave: (date: string, input: CallEntryInput) => Promise<boolean>;
}

export function CallEntryFormModal({
  visible,
  date,
  entry,
  onClose,
  onSave,
}: CallEntryFormModalProps) {
  const [entryDate, setEntryDate] = useState(date);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [title, setTitle] = useState('');
  const [moods, setMoods] = useState<TrackerMood[]>([]);
  const [impressions, setImpressions] = useState('');
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [audioName, setAudioName] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (entry) {
      setEntryDate(entry.date);
      setMinutes(Math.floor(entry.durationSeconds / 60));
      setSeconds(entry.durationSeconds % 60);
      setTitle(entry.title ?? '');
      setMoods(entry.moods ?? []);
      setImpressions(entry.impressions ?? '');
      setAudioUri(entry.audioUri);
      setAudioName(entry.audioName);
      setIsSaving(false);
      return;
    }

    setEntryDate(date);
    setMinutes(0);
    setSeconds(0);
    setTitle('');
    setMoods([]);
    setImpressions('');
    setAudioUri(undefined);
    setAudioName(undefined);
    setIsSaving(false);
  }, [visible, entry, date]);

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
    const success = await onSave(entryDate, {
      title,
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
                <Text style={styles.title}>{entry ? 'Изменить звонок' : 'Новый звонок'}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть">
                <Feather name="x" size={22} color={colors.light.text.primary} />
              </Pressable>
            </View>

            <DatePicker
              label="Дата"
              value={parseDateKey(entryDate)}
              onChange={(next) => setEntryDate(format(next, 'yyyy-MM-dd'))}
              maximumDate={new Date()}
              labelStyle={styles.datePickerLabel}
              buttonStyle={styles.datePickerButton}
              buttonTextStyle={styles.datePickerButtonText}
            />

            <CallDurationInput
              minutes={minutes}
              seconds={seconds}
              onChangeMinutes={setMinutes}
              onChangeSeconds={setSeconds}
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Название</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Как назвать звонок?"
                placeholderTextColor={colors.light.input.placeholder}
              />
            </View>

            <MoodPicker value={moods} onChange={setMoods} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Аудиозапись</Text>
              <Pressable style={styles.attachButton} onPress={attachAudio}>
                <Feather name="paperclip" size={18} color={colors.light.text.primary} />
                <Text style={styles.attachButtonText}>{audioName ?? 'Прикрепить файл'}</Text>
              </Pressable>
              {audioUri ? (
                <Pressable onPress={() => { setAudioUri(undefined); setAudioName(undefined); }}>
                  <Text style={styles.removeAudio}>Убрать аудио</Text>
                </Pressable>
              ) : null}
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
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
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
    maxWidth: 220,
  },
  removeAudio: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.accent,
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
