import { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { typography } from '@/theme/typography';

const AnimatedHighlightText = Animated.createAnimatedComponent(Text);

interface AnimatedTextProps {
  children: string;
  visible?: boolean;
  delay?: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  highlightWord?: string;
  highlightStyle?: StyleProp<TextStyle>;
  highlightDelay?: number;
  initialColor?: string;
}

function HighlightWord({
  word,
  fromColor,
  toColor,
  delay,
  textStyle,
}: {
  word: string;
  fromColor: string;
  toColor: string;
  delay: number;
  textStyle?: StyleProp<TextStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, progress, word]);

  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [fromColor, toColor]),
  }));

  return (
    <AnimatedHighlightText style={[styles.text, textStyle, colorStyle]}>
      {word}
    </AnimatedHighlightText>
  );
}

/** Текст с FadeIn + SlideInUp и плавным выделением слова */
export function AnimatedText({
  children,
  visible = true,
  delay = 0,
  duration = typography.animation.textAppearMs,
  style,
  highlightWord,
  highlightStyle,
  highlightDelay = typography.animation.highlightDelayMs,
  initialColor,
}: AnimatedTextProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  const flatStyle = StyleSheet.flatten(style);
  const baseColor = initialColor ?? (flatStyle?.color as string | undefined) ?? '#3E3630';
  const accentColor =
    (StyleSheet.flatten(highlightStyle)?.color as string | undefined) ?? '#e53935';

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(visible ? 1 : 0, {
        duration,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(visible ? 0 : 16, {
        duration,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      }),
    );
  }, [visible, delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const renderContent = () => {
    if (!highlightWord || !children.includes(highlightWord)) {
      return children;
    }

    const parts = children.split(highlightWord);

    return parts.map((part, index) => (
      <Text key={`${part}-${index}`}>
        {part}
        {index < parts.length - 1 ? (
          <HighlightWord
            word={highlightWord}
            fromColor={baseColor}
            toColor={accentColor}
            delay={highlightDelay}
            textStyle={style}
          />
        ) : null}
      </Text>
    ));
  };

  return (
    <Animated.Text style={[styles.text, style, animatedStyle]}>
      {highlightWord ? renderContent() : children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.fontFamily.primary,
    textAlign: 'center',
  },
});
