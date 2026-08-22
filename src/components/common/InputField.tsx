import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { ThemeMode } from '@/types/onboarding';

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  autoFocus?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  onSubmitEditing?: () => void;
  themeMode?: ThemeMode;
}

/** Поле ввода с оформлением под текущую тему */
export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  autoFocus = false,
  containerStyle,
  inputStyle,
  labelStyle,
  onSubmitEditing,
  themeMode = 'light',
}: InputFieldProps) {
  const inputRef = useRef<TextInput>(null);
  const theme = colors[themeMode];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={[styles.wrapper, containerStyle]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {label ? (
          <Text style={[styles.label, { color: theme.text.primary }, labelStyle]}>{label}</Text>
        ) : null}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.input.placeholder}
          style={[
            styles.input,
            {
              color: theme.text.primary,
              borderBottomColor: error ? theme.text.accent : theme.input.border,
            },
            inputStyle,
          ]}
          autoFocus={autoFocus}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onSubmitEditing}
        />

        {error ? <Text style={[styles.error, { color: theme.text.accent }]}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  input: {
    fontFamily: typography.fontFamily.primary,
    borderBottomWidth: 1,
    fontSize: 24,
    textAlign: 'center',
    paddingVertical: 12,
    marginHorizontal: 24,
  },
  error: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.fontFamily.primary,
  },
});
