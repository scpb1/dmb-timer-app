import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { dateToTimeLabel, isPastMeetingDate, timeLabelToDate } from '@/utils/meetingTime';

interface MeetingTimeRangeInputProps {
  date: string;
  startTime?: string;
  endTime?: string;
  onChangeStart: (value: string | undefined) => void;
  onChangeEnd: (value: string | undefined) => void;
}

interface TimeFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  disabled?: boolean;
  canClear?: boolean;
  onChange: (value: string) => void;
  onClear?: () => void;
}

function TimeField({
  label,
  value,
  placeholder,
  disabled = false,
  canClear = false,
  onChange,
  onClear,
}: TimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(() => timeLabelToDate(value));

  const openPicker = () => {
    if (disabled) {
      return;
    }

    const initial = timeLabelToDate(value);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'time',
        is24Hour: true,
        display: 'default',
        onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
          if (event.type !== 'set' || !selectedDate) {
            return;
          }
          onChange(dateToTimeLabel(selectedDate));
        },
      });
      return;
    }

    setTempDate(initial);
    setShowPicker(true);
  };

  return (
    <View style={[styles.field, disabled && styles.fieldDisabled]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <Pressable
          style={[styles.timeButton, disabled && styles.timeButtonDisabled]}
          onPress={openPicker}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
        >
          <Text style={[styles.timeText, !value && styles.timePlaceholder]}>
            {value ?? placeholder}
          </Text>
        </Pressable>
        {canClear && value ? (
          <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Очистить">
            <Text style={styles.clearText}>Сбросить</Text>
          </Pressable>
        ) : null}
      </View>

      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalAction}>Отмена</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChange(dateToTimeLabel(tempDate));
                    setShowPicker(false);
                  }}
                >
                  <Text style={[styles.modalAction, styles.modalConfirm]}>Готово</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="spinner"
                is24Hour
                onChange={(_event, selectedDate) => {
                  if (selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

export function MeetingTimeRangeInput({
  date,
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
}: MeetingTimeRangeInputProps) {
  const past = isPastMeetingDate(date);
  const endDisabled = !past && !startTime;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Время встречи</Text>
      <View style={styles.row}>
        <TimeField
          label="Начало"
          value={startTime}
          placeholder="не указано"
          canClear={!past}
          onChange={onChangeStart}
          onClear={() => {
            onChangeStart(undefined);
            onChangeEnd(undefined);
          }}
        />
        <TimeField
          label="Конец"
          value={endTime}
          placeholder="не указано"
          disabled={endDisabled}
          canClear={!past && Boolean(startTime)}
          onChange={onChangeEnd}
          onClear={() => onChangeEnd(undefined)}
        />
      </View>
      <Text style={styles.hint}>
        {past
          ? 'Для прошедшей встречи укажите начало и конец'
          : 'Начало и конец можно не заполнять. Без начала конец недоступен'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldDisabled: {
    opacity: 0.45,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
  },
  fieldRow: {
    gap: 6,
  },
  timeButton: {
    borderWidth: 1,
    borderColor: colors.light.input.border,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  timeButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
  },
  timePlaceholder: {
    fontFamily: typography.fontFamily.sans,
    color: colors.light.input.placeholder,
  },
  clearText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.accent,
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    color: colors.light.text.secondary,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  modalAction: {
    fontSize: 16,
    color: '#666',
  },
  modalConfirm: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
