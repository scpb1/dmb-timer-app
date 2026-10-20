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
import { IconPicker } from '@/components/events/IconPicker';
import type { HolidayFormData } from '@/hooks/useHolidays';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { HOLIDAY_NAME_MAX_LENGTH, type DisplayHoliday } from '@/types/holidays';
import { DEFAULT_HOLIDAY_ICON, getAutomaticHolidayGlyph, isCatalogIcon } from '@/utils/eventGlyphs';

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
      icon: DEFAULT_HOLIDAY_ICON,
    };
  }

  return {
    name: holiday.name,
    dateValue: holiday.date,
    icon: isCatalogIcon(holiday.icon) ? holiday.icon : holiday.isCustom ? DEFAULT_HOLIDAY_ICON : undefined,
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
  const [icon, setIcon] = useState<string | undefined>(DEFAULT_HOLIDAY_ICON);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const theme = useAppTheme();

  useEffect(() => {
    if (visible) {
      const initial = buildInitialForm(holiday);
      setName(initial.name);
      setDateValue(initial.dateValue);
      setIcon(initial.icon);
      setError(null);
      setIsSaving(false);
    }
  }, [visible, holiday]);

  const handleSave = async () => {
    const form: HolidayFormData = { name, dateValue, icon };
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

        <View style={[styles.sheet, { backgroundColor: theme.background.start }]}>
          <View style={[styles.header, { borderBottomColor: theme.overlay.border }]}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Отмена">
              <Text style={[styles.headerAction, { color: theme.text.secondary }]}>Отмена</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{title}</Text>
            <Pressable onPress={() => void handleSave()} hitSlop={8} disabled={isSaving}>
              <Text style={[styles.headerAction, styles.headerConfirm, { color: theme.text.primary }]}>
                {isSaving ? '...' : 'Готово'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.fieldLabel, { color: theme.text.primary }]}>Название</Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text.slice(0, HOLIDAY_NAME_MAX_LENGTH));
                setError(null);
              }}
              placeholder="Название праздника"
              placeholderTextColor={theme.input.placeholder}
              style={[
                styles.textInput,
                {
                  color: theme.text.primary,
                  borderColor: theme.overlay.border,
                  backgroundColor: theme.overlay.fill,
                },
              ]}
              maxLength={HOLIDAY_NAME_MAX_LENGTH}
            />
            <Text style={[styles.charCount, { color: theme.text.secondary }]}>
              {name.length}/{HOLIDAY_NAME_MAX_LENGTH}
            </Text>

            <IconPicker
              value={icon}
              onChange={setIcon}
              autoGlyph={holiday && !holiday.isCustom ? getAutomaticHolidayGlyph(holiday) : undefined}
            />

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
            <Text style={[styles.hint, { color: theme.text.secondary }]}>
              Появятся все даты этого дня за время ожидания. День и месяц задают, когда он приходится, иконка — как он выглядит в списке.
            </Text>

            {error ? <Text style={[styles.error, { color: theme.text.accent }]}>{error}</Text> : null}
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
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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
  },
  headerTitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
  },
  headerAction: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    minWidth: 64,
  },
  headerConfirm: {
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
    marginBottom: 8,
  },
  textInput: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  charCount: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
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
    lineHeight: 18,
    marginTop: 8,
  },
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
