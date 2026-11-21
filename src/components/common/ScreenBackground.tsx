import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { OnboardingAtmosphere } from '@/components/common/OnboardingAtmosphere';
import { colors } from '@/theme/colors';
import { useColorTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { ColorTokens } from '@/theme/tokens';
import type { ThemeMode } from '@/types/onboarding';

interface ScreenBackgroundProps {
  /** Только онбординг: кроссфейд лён ↔ графит. Без пропа — выбранная тема приложения. */
  themeMode?: ThemeMode;
}

interface GradientSize {
  width: number;
  height: number;
}

interface ThemeGradientProps extends GradientSize {
  tokens: ColorTokens;
  gradientId: string;
  sheenEndY: string;
}

function hasVisibleSheen(tokens: ColorTokens): boolean {
  const { sheen } = tokens.background;
  return sheen.startOpacity > 0 || sheen.midOpacity > 0 || sheen.endOpacity > 0;
}

function ThemeGradient({ tokens, width, height, gradientId, sheenEndY }: ThemeGradientProps) {
  const baseId = `${gradientId}Base`;
  const sheenId = `${gradientId}Sheen`;
  const showSheen = hasVisibleSheen(tokens);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={baseId} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={tokens.background.start} />
          <Stop offset="50%" stopColor={tokens.background.mid} />
          <Stop offset="100%" stopColor={tokens.background.end} />
        </LinearGradient>
        {showSheen ? (
          <LinearGradient id={sheenId} x1="100%" y1="0%" x2="0%" y2={sheenEndY}>
            <Stop
              offset="0%"
              stopColor={tokens.background.sheen.start}
              stopOpacity={tokens.background.sheen.startOpacity}
            />
            <Stop
              offset="50%"
              stopColor={tokens.background.sheen.mid}
              stopOpacity={tokens.background.sheen.midOpacity}
            />
            <Stop
              offset="100%"
              stopColor={tokens.background.sheen.end}
              stopOpacity={tokens.background.sheen.endOpacity}
            />
          </LinearGradient>
        ) : null}
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${baseId})`} />
      {showSheen ? (
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${sheenId})`} />
      ) : null}
    </Svg>
  );
}

function readGradientSize(windowWidth: number, windowHeight: number): GradientSize {
  const screen = Dimensions.get('screen');
  return {
    width: windowWidth,
    /** Клавиатура на Android уменьшает window.height — градиент держим на высоте экрана. */
    height: Math.max(windowHeight, screen.height),
  };
}

/** Сразу берём размер экрана, чтобы SVG не сжимался вместе с клавиатурой. */
function useGradientSize() {
  const window = useWindowDimensions();
  const [size, setSize] = useState<GradientSize>(() =>
    readGradientSize(window.width, window.height),
  );

  useEffect(() => {
    const next = readGradientSize(window.width, window.height);
    setSize((current) =>
      current.width === next.width && current.height === next.height ? current : next,
    );
  }, [window.width, window.height]);

  useEffect(() => {
    const restore = () => {
      const next = readGradientSize(
        Dimensions.get('window').width,
        Dimensions.get('window').height,
      );
      setSize((current) =>
        current.width === next.width && current.height === next.height ? current : next,
      );
    };
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      restore,
    );
    return () => hide.remove();
  }, []);

  return size;
}

function AppThemeBackground() {
  const { theme } = useColorTheme();
  const size = useGradientSize();
  const sheenEndY = theme.scheme === 'dark' ? '100%' : '85%';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.start }]}>
      {size.width > 0 ? (
        <ThemeGradient
          tokens={theme.colors}
          gradientId={`app-${theme.id}`}
          sheenEndY={sheenEndY}
          width={size.width}
          height={size.height}
        />
      ) : null}
    </View>
  );
}

function OnboardingBackground({ themeMode }: { themeMode: ThemeMode }) {
  const themeProgress = useSharedValue(themeMode === 'dark' ? 0 : 1);
  const size = useGradientSize();

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
    <View style={styles.container}>
      <Animated.View
        style={[styles.layer, { backgroundColor: colors.dark.background.start }, darkLayerStyle]}
      >
        {size.width > 0 ? (
          <>
            <ThemeGradient
              tokens={colors.dark}
              gradientId="onboarding-dark"
              sheenEndY="100%"
              width={size.width}
              height={size.height}
            />
            <OnboardingAtmosphere width={size.width} height={size.height} />
          </>
        ) : null}
      </Animated.View>
      <Animated.View
        style={[styles.layer, { backgroundColor: colors.light.background.start }, lightLayerStyle]}
      >
        {size.width > 0 ? (
          <ThemeGradient
            tokens={colors.light}
            gradientId="onboarding-light"
            sheenEndY="85%"
            width={size.width}
            height={size.height}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

/** Фон экрана: выбранная тема или кроссфейд онбординга */
export function ScreenBackground({ themeMode }: ScreenBackgroundProps) {
  if (themeMode) {
    return <OnboardingBackground themeMode={themeMode} />;
  }
  return <AppThemeBackground />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
