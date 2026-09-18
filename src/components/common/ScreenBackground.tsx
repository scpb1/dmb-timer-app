import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { ThemeMode } from '@/types/onboarding';

interface ScreenBackgroundProps {
  themeMode?: ThemeMode;
}

interface GradientSize {
  width: number;
  height: number;
}

function DarkGradient({ width, height }: GradientSize) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="darkBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.dark.background.start} />
          <Stop offset="42%" stopColor="#242427" />
          <Stop offset="100%" stopColor={colors.dark.background.end} />
        </LinearGradient>
        <LinearGradient id="darkSheen" x1="100%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#45454b" stopOpacity="0.45" />
          <Stop offset="48%" stopColor="#1a1a1c" stopOpacity="0" />
          <Stop offset="100%" stopColor="#35353a" stopOpacity="0.35" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#darkBase)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#darkSheen)" />
    </Svg>
  );
}

function LightGradient({ width, height }: GradientSize) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="lightBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.light.background.start} />
          <Stop offset="45%" stopColor="#EDE8D5" />
          <Stop offset="100%" stopColor={colors.light.background.end} />
        </LinearGradient>
        <LinearGradient id="lightSheen" x1="100%" y1="0%" x2="0%" y2="85%">
          <Stop offset="0%" stopColor="#D8E4EA" stopOpacity="0.65" />
          <Stop offset="50%" stopColor="#FCF7DF" stopOpacity="0" />
          <Stop offset="100%" stopColor="#B8C8D2" stopOpacity="0.5" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#lightBase)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#lightSheen)" />
    </Svg>
  );
}

/** Заметный статичный градиент (тёмный ↔ бежевый) */
export function ScreenBackground({ themeMode = 'light' }: ScreenBackgroundProps) {
  const themeProgress = useSharedValue(themeMode === 'dark' ? 0 : 1);
  const [size, setSize] = useState<GradientSize>({ width: 0, height: 0 });

  useEffect(() => {
    themeProgress.value = withTiming(themeMode === 'dark' ? 0 : 1, {
      duration: typography.animation.themeTransitionMs,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [themeMode, themeProgress]);

  const darkLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(themeProgress.value, [0, 1], [1, 0]),
  }));

  const lightLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(themeProgress.value, [0, 1], [0, 1]),
  }));

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
    >
      <Animated.View
        style={[styles.layer, { backgroundColor: colors.dark.background.start }, darkLayerStyle]}
      >
        {size.width > 0 ? <DarkGradient width={size.width} height={size.height} /> : null}
      </Animated.View>
      <Animated.View
        style={[styles.layer, { backgroundColor: colors.light.background.start }, lightLayerStyle]}
      >
        {size.width > 0 ? <LightGradient width={size.width} height={size.height} /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
