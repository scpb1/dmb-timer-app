import { useRef, useState } from 'react';
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

import { colors, useAppTheme } from '@/theme';
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
  themeMode,
}: InputFieldProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const appTheme = useAppTheme();
  const theme = themeMode ? colors[themeMode] : appTheme;

  const showAndroidCenterCaret =
    Platform.OS === 'android' && focused && value.length === 0;

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

        <View style={styles.inputShell}>
          {showAndroidCenterCaret ? (
            <View style={[styles.centerCaret, { backgroundColor: theme.text.primary }]} />
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
            textAlign="center"
            caretHidden={showAndroidCenterCaret}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            selection={
              value.length === 0 ? { start: 0, end: 0 } : undefined
            }
          />
        </View>

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
    alignItems: 'stretch',
    width: '100%',
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  inputShell: {
    position: 'relative',
    alignSelf: 'stretch',
    marginHorizontal: 24,
  },
  input: {
    fontFamily: typography.fontFamily.primary,
    borderBottomWidth: 1,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  centerCaret: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 28,
    zIndex: 1,
  },
  error: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.fontFamily.primary,
  },
});
