import { ReactNode, useEffect, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ShakeViewProps {
  children: ReactNode;
  trigger: boolean;
  onShakeComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Контейнер с shake-анимацией при ошибке валидации */
export function ShakeView({ children, trigger, onShakeComplete, style }: ShakeViewProps) {
  const translateX = useSharedValue(0);
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      translateX.value = withSequence(
        withTiming(-8, { duration: 50, easing: Easing.linear }),
        withTiming(8, { duration: 50, easing: Easing.linear }),
        withTiming(-6, { duration: 50, easing: Easing.linear }),
        withTiming(6, { duration: 50, easing: Easing.linear }),
        withTiming(0, { duration: 50, easing: Easing.linear }),
      );
      onShakeComplete?.();
    }
    prevTrigger.current = trigger;
  }, [trigger, translateX, onShakeComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
