import { useEffect, useState } from 'react';
import {
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

import { DatePicker } from '@/components/common/DatePicker';
import type { HolidayFormData } from '@/hooks/useHolidays';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { HOLIDAY_NAME_MAX_LENGTH, type DisplayHoliday } from '@/types/holidays';

interface HolidayFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  holiday: DisplayHoliday | null;
  onClose: () => void;
  onSave: (form: HolidayFormData) => Promise<boolean>;
}

function buildInitialForm(holiday: DisplayHoliday | null): HolidayFormData {
  if (!holiday) {
    return {
      name: '',
      dateValue: null,
    };
  }

  return {
    name: holiday.name,
    dateValue: holiday.date,
  };
}

export function HolidayFormModal({
  visible,
  mode,
  holiday,
  onClose,
  onSave,
}: HolidayFormModalProps) {
  const [name, setName] = useState('');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const initial = buildInitialForm(holiday);
      setName(initial.name);
      setDateValue(initial.dateValue);
      setError(null);
      setIsSaving(false);
    }
  }, [visible, holiday]);

  const handleSave = async () => {
    const form: HolidayFormData = { name, dateValue };
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Введите название');
      return;
    }
    if (trimmedName.length > HOLIDAY_NAME_MAX_LENGTH) {
      setError(`Название не длиннее ${HOLIDAY_NAME_MAX_LENGTH} символов`);
      return;
    }
    if (!dateValue) {
      setError('Выберите дату');
      return;
    }

    setIsSaving(true);
    const success = await onSave(form);
    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setError('Не удалось сохранить праздник');
    }
  };

  const title = mode === 'add' ? 'Новый праздник' : 'Изменить праздник';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.headerAction}>Отмена</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable onPress={() => void handleSave()} hitSlop={8} disabled={isSaving}>
              <Text style={[styles.headerAction, styles.headerConfirm]}>
                {isSaving ? '...' : 'Готово'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>Название</Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text.slice(0, HOLIDAY_NAME_MAX_LENGTH));
                setError(null);
              }}
              placeholder="Название праздника"
              placeholderTextColor={colors.light.input.placeholder}
              style={styles.textInput}
              maxLength={HOLIDAY_NAME_MAX_LENGTH}
            />
            <Text style={styles.charCount}>
              {name.length}/{HOLIDAY_NAME_MAX_LENGTH}
            </Text>

            <DatePicker
              label="Дата праздника"
              value={dateValue}
              onChange={(date) => {
                setDateValue(date);
                setError(null);
              }}
              labelStyle={styles.datePickerLabel}
              buttonStyle={styles.datePickerButton}
            />
            <Text style={styles.hint}>
              В списке появятся все даты этого праздника за время службы. День и месяц задают, когда он приходится.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}
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
    backgroundColor: '#FCF7DF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(167, 154, 138, 0.4)',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text.primary,
  },
  headerAction: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.secondary,
    minWidth: 64,
  },
  headerConfirm: {
    color: colors.light.text.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.text.primary,
    marginBottom: 8,
  },
  textInput: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.4)',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  charCount: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    textAlign: 'right',
    marginBottom: 20,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 8,
  },
  datePickerButton: {
    marginHorizontal: 0,
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
    lineHeight: 18,
    marginTop: 8,
  },
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.accent,
    marginTop: 8,
    textAlign: 'center',
  },
});
