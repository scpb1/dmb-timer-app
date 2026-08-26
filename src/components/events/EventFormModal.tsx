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
import type { DisplayEvent } from '@/types/events';
import { EVENT_NAME_MAX_LENGTH, type EventDateFormat } from '@/types/events';
import type { EventFormData } from '@/hooks/useEvents';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface EventFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  event: DisplayEvent | null;
  onClose: () => void;
  onSave: (form: EventFormData) => Promise<boolean>;
}

const DATE_FORMAT_OPTIONS: Array<{ value: EventDateFormat; label: string }> = [
  { value: 'ddd', label: 'ддд' },
  { value: 'date', label: 'Дата' },
];

function buildInitialForm(event: DisplayEvent | null): EventFormData {
  if (!event) {
    return {
      name: '',
      dateFormat: 'ddd',
      dddValue: '',
      dateValue: null,
    };
  }

  if (event.dateFormat === 'dpp') {
    return {
      name: event.name,
      dateFormat: 'date',
      dddValue: '',
      dateValue: event.date,
    };
  }

  return {
    name: event.name,
    dateFormat: event.dateFormat === 'date' ? 'date' : 'ddd',
    dddValue: event.dddValue !== undefined ? String(event.dddValue) : '',
    dateValue: event.dateValue ? new Date(event.dateValue) : event.date,
  };
}

export function EventFormModal({ visible, mode, event, onClose, onSave }: EventFormModalProps) {
  const [name, setName] = useState('');
  const [dateFormat, setDateFormat] = useState<EventDateFormat>('ddd');
  const [dddValue, setDddValue] = useState('');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const initial = buildInitialForm(event);
      setName(initial.name);
      setDateFormat(initial.dateFormat);
      setDddValue(initial.dddValue);
      setDateValue(initial.dateValue);
      setError(null);
      setIsSaving(false);
    }
  }, [visible, event]);

  const handleSave = async () => {
    const form: EventFormData = { name, dateFormat, dddValue, dateValue };

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Введите название');
      return;
    }
    if (trimmedName.length > EVENT_NAME_MAX_LENGTH) {
      setError(`Название не длиннее ${EVENT_NAME_MAX_LENGTH} символов`);
      return;
    }
    if (dateFormat === 'ddd') {
      const parsed = Number(dddValue.trim());
      if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
        setError('Введите целое число ддд (дней до дембеля) от 0');
        return;
      }
    } else if (!dateValue) {
      setError('Выберите дату');
      return;
    }

    setIsSaving(true);
    const success = await onSave(form);
    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setError('Не удалось сохранить событие');
    }
  };

  const title = mode === 'add' ? 'Новое событие' : 'Изменить событие';

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
            <Pressable onPress={handleSave} hitSlop={8} disabled={isSaving}>
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
                setName(text.slice(0, EVENT_NAME_MAX_LENGTH));
                setError(null);
              }}
              placeholder="Название события"
              placeholderTextColor={colors.light.input.placeholder}
              style={styles.textInput}
              maxLength={EVENT_NAME_MAX_LENGTH}
            />
            <Text style={styles.charCount}>
              {name.length}/{EVENT_NAME_MAX_LENGTH}
            </Text>

            <Text style={styles.fieldLabel}>Формат даты</Text>
            <View style={styles.formatRow}>
              {DATE_FORMAT_OPTIONS.map((option) => {
                const isActive = dateFormat === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.formatButton, isActive && styles.formatButtonActive]}
                    onPress={() => {
                      setDateFormat(option.value);
                      setError(null);
                    }}
                  >
                    <Text style={[styles.formatButtonText, isActive && styles.formatButtonTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {dateFormat === 'ddd' ? (
              <>
                <Text style={styles.fieldLabel}>Дней до дембеля (ддд)</Text>
                <TextInput
                  value={dddValue}
                  onChangeText={(text) => {
                    setDddValue(text.replace(/[^0-9]/g, ''));
                    setError(null);
                  }}
                  placeholder="Например, 303"
                  placeholderTextColor={colors.light.input.placeholder}
                  style={styles.textInput}
                  keyboardType="number-pad"
                />
              </>
            ) : (
              <DatePicker
                label="Дата события"
                value={dateValue}
                onChange={(date) => {
                  setDateValue(date);
                  setError(null);
                }}
                labelStyle={styles.datePickerLabel}
                buttonStyle={styles.datePickerButton}
              />
            )}

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
    borderRadius: 12,
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
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.4)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  formatButtonActive: {
    borderColor: colors.light.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  formatButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.secondary,
  },
  formatButtonTextActive: {
    color: colors.light.text.primary,
    fontWeight: '600',
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
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.accent,
    marginTop: 8,
    textAlign: 'center',
  },
});
