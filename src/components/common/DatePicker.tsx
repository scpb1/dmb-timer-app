import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { SETTINGS_FIELD_HEIGHT } from '@/components/common/settingsFieldMetrics';
import { colors, useAppTheme, useColorTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { ThemeMode } from '@/types/onboarding';

interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Как поля в настройках (`SettingsField`): подпись 14, поле overlay, текст слева */
  appearance?: 'default' | 'settings';
  labelStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonTextStyle?: StyleProp<TextStyle>;
  themeMode?: ThemeMode;
  onBeforeOpen?: () => void;
}

function pickerValue(value: Date | null): Date {
  return startOfDay(value ?? new Date());
}

function commitIfSet(
  event: DateTimePickerEvent,
  selectedDate: Date | undefined,
  onChange: (date: Date) => void,
) {
  if (event.type !== 'set' || !selectedDate) {
    return;
  }
  onChange(startOfDay(selectedDate));
}

/** Выбор даты: системный календарь на Android, спиннер в модалке на iOS */
export function DatePicker({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  appearance = 'default',
  labelStyle,
  buttonStyle,
  buttonTextStyle,
  themeMode,
  onBeforeOpen,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(pickerValue(value));
  const appTheme = useAppTheme();
  const { theme: selectedTheme } = useColorTheme();
  const theme = themeMode ? colors[themeMode] : appTheme;
  const scheme = themeMode ?? selectedTheme.scheme;

  const formattedValue = value
    ? format(value, 'd MMMM yyyy', { locale: ru })
    : 'Выберите дату';

  const isSettings = appearance === 'settings';
  const labelColor = isSettings ? theme.text.secondary : theme.text.primary;

  const openPicker = () => {
    onBeforeOpen?.();
    const initial = pickerValue(value);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        display: 'calendar',
        minimumDate: minimumDate ? startOfDay(minimumDate) : undefined,
        maximumDate: maximumDate ? startOfDay(maximumDate) : undefined,
        onChange: (event, selectedDate) => {
          commitIfSet(event, selectedDate, onChange);
        },
      });
      return;
    }

    setTempDate(initial);
    setShowPicker(true);
  };

  const handleIOSChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(startOfDay(selectedDate));
    }
  };

  const handleConfirmIOS = () => {
    onChange(startOfDay(tempDate));
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, isSettings && styles.containerSettings]}>
      <Text
        style={[
          isSettings ? styles.labelSettings : styles.label,
          { color: labelColor },
          labelStyle,
        ]}
      >
        {label}
      </Text>

      <Pressable
        style={[
          isSettings ? styles.buttonSettings : styles.button,
          {
            borderColor: isSettings ? theme.overlay.border : theme.input.border,
            backgroundColor: isSettings ? theme.overlay.fill : undefined,
          },
          buttonStyle,
        ]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text
          style={[
            isSettings ? styles.buttonTextSettings : styles.buttonText,
            { color: theme.text.primary },
            buttonTextStyle,
          ]}
        >
          {formattedValue}
        </Text>
      </Pressable>

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
                onChange={handleIOSChange}
                minimumDate={minimumDate ? startOfDay(minimumDate) : undefined}
                maximumDate={maximumDate ? startOfDay(maximumDate) : undefined}
                themeVariant={scheme === 'dark' ? 'dark' : 'light'}
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
  containerSettings: {
    marginBottom: 0,
    gap: 8,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  labelSettings: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    textAlign: 'left',
  },
  button: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 24,
  },
  buttonSettings: {
    borderWidth: 1,
    borderRadius: 4,
    height: SETTINGS_FIELD_HEIGHT,
    paddingHorizontal: 14,
    marginHorizontal: 0,
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 18,
    textAlign: 'center',
  },
  buttonTextSettings: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    textAlign: 'left',
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
