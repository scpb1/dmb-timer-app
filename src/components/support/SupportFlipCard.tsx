import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ScrollRail } from '@/components/common/ScrollRail';
import type { SupportCard } from '@/types/support';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface SupportFlipCardProps {
  card: SupportCard | null;
  visible: boolean;
  onClose: () => void;
}

const FLIP_MS = 520;
const CARD_RATIO = 7 / 5;

export function SupportFlipCard({ card, visible, onClose }: SupportFlipCardProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const progress = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);
  const [backViewport, setBackViewport] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setFlipped(false);
      progress.value = 0;
      scrollY.value = 0;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible, card?.id, progress, scrollY]);

  const flip = () => {
    const next = !flipped;
    setFlipped(next);
    progress.value = withTiming(next ? 1 : 0, {
      duration: FLIP_MS,
      easing: Easing.inOut(Easing.cubic),
    });
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [0, 180]);
    const opacity = interpolate(progress.value, [0, 0.49, 0.5, 1], [1, 1, 0, 0]);
    return {
      opacity,
      transform: [{ perspective: 1400 }, { rotateY: `${rotate}deg` }],
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [180, 360]);
    const opacity = interpolate(progress.value, [0, 0.5, 0.51, 1], [0, 0, 1, 1]);
    return {
      opacity,
      transform: [{ perspective: 1400 }, { rotateY: `${rotate}deg` }],
    };
  });

  if (!card) {
    return null;
  }

  const maxWidth = Math.min(window.width - 40, 340);
  const maxHeight = window.height - insets.top - insets.bottom - 56;
  let cardWidth = maxWidth;
  let cardHeight = cardWidth * CARD_RATIO;
  if (cardHeight > maxHeight) {
    cardHeight = maxHeight;
    cardWidth = cardHeight / CARD_RATIO;
  }

  const cardColors = {
    backgroundColor: theme.background.start,
    borderColor: theme.overlay.border,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Закрыть" />

        <Pressable
          onPress={onClose}
          style={[styles.close, { top: insets.top + 6 }]}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        >
          <Feather name="x" size={28} color="#F2F0EC" />
        </Pressable>

        <View style={[styles.stage, { width: cardWidth, height: cardHeight }]}>
          <Animated.View
            style={[styles.face, cardColors, frontStyle]}
            pointerEvents={flipped ? 'none' : 'auto'}
          >
            <Pressable
              style={styles.frontPress}
              onPress={flip}
              accessibilityRole="button"
              accessibilityLabel={`${card.title}. ${card.teaser}`}
              accessibilityHint="Перевернуть карточку"
            >
              <Text style={[styles.frontTitle, { color: theme.text.primary }]}>{card.title}</Text>
              <Text style={[styles.hint, { color: theme.text.secondary }]}>
                Нажми, чтобы перевернуть
              </Text>
              <View style={styles.frontMiddle}>
                <Text style={[styles.teaser, { color: theme.text.primary }]}>{card.teaser}</Text>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[styles.face, cardColors, backStyle]}
            pointerEvents={flipped ? 'auto' : 'none'}
          >
            <Pressable onPress={flip} style={styles.backHeader} accessibilityRole="button">
              <Text style={[styles.backTitle, { color: theme.text.primary }]}>{card.title}</Text>
              <Text style={[styles.hint, { color: theme.text.secondary }]}>
                Нажми, чтобы перевернуть
              </Text>
            </Pressable>
            <View style={styles.scrollWrap}>
              <ScrollView
                ref={scrollRef}
                style={styles.backScroll}
                contentContainerStyle={styles.backContent}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(event) => {
                  scrollY.value = event.nativeEvent.contentOffset.y;
                }}
                onContentSizeChange={(_width, height) => {
                  contentHeight.value = height;
                }}
                onLayout={(event) => {
                  const height = event.nativeEvent.layout.height;
                  viewportHeight.value = height;
                  setBackViewport(height);
                }}
              >
                <Pressable
                  onPress={flip}
                  accessibilityRole="button"
                  accessibilityLabel="Перевернуть карточку"
                  style={[styles.backPress, backViewport > 0 ? { minHeight: backViewport } : null]}
                >
                  {card.sections.map((section) => (
                    <View key={section.heading} style={styles.section}>
                      <Text style={[styles.sectionHeading, { color: theme.text.primary }]}>
                        {section.heading}
                      </Text>
                      <Text style={[styles.sectionBody, { color: theme.text.primary }]}>
                        {section.body}
                      </Text>
                    </View>
                  ))}
                </Pressable>
              </ScrollView>
              <ScrollRail
                axis="vertical"
                scrollOffset={scrollY}
                contentLength={contentHeight}
                viewportLength={viewportHeight}
                trackColor={theme.overlay.border}
                thumbColor={theme.text.secondary}
              />
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    right: 14,
    zIndex: 2,
  },
  stage: {
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  frontPress: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
  },
  frontTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  frontMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  teaser: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  backHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  backTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  scrollWrap: {
    flex: 1,
    position: 'relative',
  },
  backScroll: {
    flex: 1,
  },
  backContent: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  backPress: {
    gap: 16,
  },
  section: {
    gap: 6,
  },
  sectionHeading: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  sectionBody: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    lineHeight: 23,
  },
});
