import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { ThemeMode } from '@/types/onboarding';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: ReactNode;
  /** Как у ServiceDurationPresets на онбординге — те же overlay-токены для light/dark */
  themeMode?: ThemeMode;
}

/** Кнопка с анимацией нажатия */
export function AnimatedButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  themeMode,
}: AnimatedButtonProps) {
  const appTheme = useAppTheme();
  const theme = themeMode ? colors[themeMode] : appTheme;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.button,
        {
          backgroundColor: theme.overlay.fill,
          borderColor: theme.overlay.border,
        },
        style,
        animatedStyle,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={theme.text.primary} />
      ) : (
        <Text style={[styles.label, { color: theme.text.primary }, textStyle]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 4,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: 18,
    fontFamily: typography.fontFamily.primary,
  },
});
