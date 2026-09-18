import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { ThemeMode } from '@/types/onboarding';

interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  labelStyle?: TextStyle;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  themeMode?: ThemeMode;
}

/** Выбор даты с нативным пикером на iOS/Android */
export function DatePicker({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  labelStyle,
  buttonStyle,
  buttonTextStyle,
  themeMode = 'light',
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date());
  const theme = colors[themeMode];

  const formattedValue = value
    ? format(value, 'd MMMM yyyy', { locale: ru })
    : 'Выберите дату';

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
      return;
    }

    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirmIOS = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const openPicker = () => {
    setTempDate(value ?? new Date());
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text.primary }, labelStyle]}>{label}</Text>

      <Pressable
        style={[
          styles.button,
          { borderColor: theme.input.border },
          buttonStyle,
        ]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.buttonText, { color: theme.text.primary }, buttonTextStyle]}>
          {formattedValue}
        </Text>
      </Pressable>

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          locale="ru-RU"
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalAction}>Отмена</Text>
                </Pressable>
                <Pressable onPress={handleConfirmIOS}>
                  <Text style={[styles.modalAction, styles.modalConfirm]}>Готово</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="ru-RU"
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 24,
  },
  buttonText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
