import { StyleSheet, Text, TextInput, View } from 'react-native';

import { SETTINGS_FIELD_HEIGHT } from '@/components/common/settingsFieldMetrics';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface SettingsFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words';
  onFocus?: () => void;
}

export function SettingsField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  secureTextEntry,
  autoCapitalize = 'words',
  onFocus,
}: SettingsFieldProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={theme.input.placeholder}
        style={[
          styles.input,
          {
            color: theme.text.primary,
            borderColor: theme.overlay.border,
            backgroundColor: theme.overlay.fill,
            height: SETTINGS_FIELD_HEIGHT,
          },
        ]}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    textAlignVertical: 'center',
  },
});
