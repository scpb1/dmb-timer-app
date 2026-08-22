import { useEffect } from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { typography } from '@/theme/typography';

interface PulsingHintProps {
  children: string;
  style?: StyleProp<TextStyle>;
}

/** Полупрозрачная подсказка с мягкой пульсацией */
export function PulsingHint({ children, style }: PulsingHintProps) {
  const opacity = useSharedValue(0.22);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.38, {
        duration: typography.animation.pulseDurationMs,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.hint, style, animatedStyle]}>{children}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 16,
    textAlign: 'center',
  },
});
