import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Feather } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface DiaryDateButtonProps {
  date: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
}

/** Компактный выбор даты в шапке дневника */
export function DiaryDateButton({ date, onChange, maximumDate }: DiaryDateButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(date);

  const openPicker = () => {
    setTempDate(date);
    setShowPicker(true);
  };

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

  return (
    <>
      <Pressable
        style={styles.button}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel="Выбрать дату"
      >
        <Feather name="calendar" size={18} color={colors.light.text.primary} />
        <Text style={styles.label}>{format(date, 'd MMMM', { locale: ru })}</Text>
      </Pressable>

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
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
                <Pressable
                  onPress={() => {
                    onChange(tempDate);
                    setShowPicker(false);
                  }}
                >
                  <Text style={[styles.modalAction, styles.modalConfirm]}>Готово</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                maximumDate={maximumDate}
                locale="ru-RU"
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.primary,
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
