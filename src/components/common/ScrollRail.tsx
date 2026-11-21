import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

type Axis = 'horizontal' | 'vertical';

interface ScrollRailProps {
  axis: Axis;
  scrollOffset: SharedValue<number>;
  contentLength: SharedValue<number>;
  viewportLength: SharedValue<number>;
  trackColor: string;
  thumbColor: string;
  style?: StyleProp<ViewStyle>;
}

const MIN_THUMB = 28;

/** Округлая полоса прокрутки — всегда видна, когда контент не помещается */
export function ScrollRail({
  axis,
  scrollOffset,
  contentLength,
  viewportLength,
  trackColor,
  thumbColor,
  style,
}: ScrollRailProps) {
  const trackStyle = useAnimatedStyle(() => {
    const visible = contentLength.value > viewportLength.value + 4 && viewportLength.value > 0;
    return { opacity: visible ? 0.38 : 0 };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const content = contentLength.value;
    const viewport = viewportLength.value;
    if (content <= viewport + 4 || viewport <= 0) {
      return axis === 'vertical'
        ? { height: 0, transform: [{ translateY: 0 }] }
        : { width: 0, transform: [{ translateX: 0 }] };
    }

    const maxScroll = Math.max(0, content - viewport);
    const thumbSize = Math.max(MIN_THUMB, viewport * (viewport / content));
    const travel = Math.max(0, viewport - thumbSize);
    const offset = maxScroll <= 0 ? 0 : (scrollOffset.value / maxScroll) * travel;

    if (axis === 'vertical') {
      return { height: thumbSize, transform: [{ translateY: offset }] };
    }
    return { width: thumbSize, transform: [{ translateX: offset }] };
  });

  if (axis === 'horizontal') {
    return (
      <Animated.View
        style={[styles.trackHorizontal, { backgroundColor: trackColor }, style, trackStyle]}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View style={[styles.thumbHorizontal, { backgroundColor: thumbColor }, thumbStyle]} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.trackVertical, { backgroundColor: trackColor }, style, trackStyle]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.thumbVertical, { backgroundColor: thumbColor }, thumbStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  trackHorizontal: {
    height: 3,
    borderRadius: 99,
    overflow: 'hidden',
  },
  thumbHorizontal: {
    height: 3,
    borderRadius: 99,
  },
  trackVertical: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    right: 16,
    width: 4,
    borderRadius: 99,
    overflow: 'hidden',
    zIndex: 4,
  },
  thumbVertical: {
    width: 4,
    borderRadius: 99,
  },
});
