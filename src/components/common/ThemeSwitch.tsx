import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/theme';

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_INSET = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

interface ThemeSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/**
 * Свой тумблер вместо системного Switch.
 * На Android дорожка красится умножением и остаётся красной, а при появлении
 * с уже включённым значением проигрывается анимация включения.
 */
export function ThemeSwitch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: ThemeSwitchProps) {
  const theme = useAppTheme();
  const progress = useSharedValue(value ? 1 : 0);
  const skipNextAnimation = useRef(true);

  useEffect(() => {
    if (skipNextAnimation.current) {
      skipNextAnimation.current = false;
      progress.value = value ? 1 : 0;
      return;
    }
    progress.value = withTiming(value ? 1 : 0, { duration: 160 });
  }, [progress, value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        {
          backgroundColor: value ? theme.text.accent : theme.overlay.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: THUMB_INSET,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
});
