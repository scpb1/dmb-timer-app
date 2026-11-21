import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

const THUMB_SIZE = 20;
const TRACK_INSET = 10;

interface SettingsSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onCommit?: (value: number) => void;
  formatValue?: (value: number) => string;
  /** Живое значение на UI-потоке: обновляется при перетаскивании без ререндера экрана */
  sharedValue?: SharedValue<number>;
  orientation?: 'horizontal' | 'vertical';
  /** Вертикальный ползунок внутри прокрутки: на время жеста её лучше отключить */
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function ratioFromValue(value: number, min: number, max: number): number {
  if (max === min) {
    return 0;
  }
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

function readSlider(
  position: number,
  span: number,
  min: number,
  max: number,
  vertical: boolean,
) {
  'worklet';
  const usable = Math.max(1, span - TRACK_INSET * 2);
  const raw = (position - TRACK_INSET) / usable;
  const ratio = Math.min(1, Math.max(0, vertical ? 1 - raw : raw));
  const next = Math.round(min + ratio * (max - min));
  return { ratio, next };
}

function SliderReadout({
  source,
  formatValue,
}: {
  source: SharedValue<number>;
  formatValue: (value: number) => string;
}) {
  const [textValue, setTextValue] = useState(Math.round(source.value));

  useAnimatedReaction(
    () => Math.round(source.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setTextValue)(current);
      }
    },
  );

  const theme = useAppTheme();
  return <Text style={[styles.value, { color: theme.text.primary }]}>{formatValue(textValue)}</Text>;
}

/** Горизонтальный ползунок: жест и анимация идут на UI-потоке */
export function SettingsSlider({
  label,
  value,
  min = 0,
  max = 100,
  onCommit,
  formatValue = String,
  sharedValue,
  orientation = 'horizontal',
  onDragStart,
  onDragEnd,
}: SettingsSliderProps) {
  const theme = useAppTheme();
  const trackWidth = useSharedValue(0);
  const progress = useSharedValue(ratioFromValue(value, min, max));
  const liveValue = useSharedValue(value);
  const minValue = useSharedValue(min);
  const maxValue = useSharedValue(max);
  const vertical = orientation === 'vertical';
  const onCommitRef = useRef(onCommit);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  onCommitRef.current = onCommit;
  onDragStartRef.current = onDragStart;
  onDragEndRef.current = onDragEnd;

  useEffect(() => {
    minValue.value = min;
    maxValue.value = max;
  }, [max, maxValue, min, minValue]);

  useEffect(() => {
    progress.value = ratioFromValue(value, min, max);
    liveValue.value = value;
    if (sharedValue) {
      sharedValue.value = value;
    }
  }, [liveValue, max, min, progress, sharedValue, value]);

  const notifyCommit = (next: number) => {
    onCommitRef.current?.(next);
  };
  const notifyDragStart = () => {
    onDragStartRef.current?.();
  };
  const notifyDragEnd = () => {
    onDragEndRef.current?.();
  };

  const pan = useMemo(() => {
    const gesture = Gesture.Pan()
      .minDistance(0)
      .shouldCancelWhenOutside(false)
      .onBegin((event) => {
        if (trackWidth.value <= 0) {
          return;
        }
        runOnJS(notifyDragStart)();

        const { ratio, next } = readSlider(
          vertical ? event.y : event.x,
          trackWidth.value,
          minValue.value,
          maxValue.value,
          vertical,
        );
        progress.value = ratio;
        liveValue.value = next;
        if (sharedValue) {
          sharedValue.value = minValue.value + ratio * (maxValue.value - minValue.value);
        }
      })
      .onUpdate((event) => {
        if (trackWidth.value <= 0) {
          return;
        }

        const { ratio, next } = readSlider(
          vertical ? event.y : event.x,
          trackWidth.value,
          minValue.value,
          maxValue.value,
          vertical,
        );
        progress.value = ratio;
        liveValue.value = next;
        if (sharedValue) {
          sharedValue.value = minValue.value + ratio * (maxValue.value - minValue.value);
        }
      })
      .onFinalize(() => {
        runOnJS(notifyDragEnd)();
        runOnJS(notifyCommit)(liveValue.value);
      });

    return vertical ? gesture.failOffsetX([-24, 24]) : gesture.failOffsetY([-24, 24]);
  }, [liveValue, maxValue, minValue, progress, sharedValue, trackWidth, vertical]);

  const fillStyle = useAnimatedStyle(() => {
    const usable = Math.max(0, trackWidth.value - TRACK_INSET * 2) * progress.value;
    return vertical ? { height: usable } : { width: usable };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const usable = Math.max(0, trackWidth.value - TRACK_INSET * 2);
    const offset = usable * progress.value - THUMB_SIZE / 2;
    return vertical
      ? { transform: [{ translateY: usable - THUMB_SIZE - offset }] }
      : { transform: [{ translateX: offset }] };
  });

  return (
    <View style={[styles.wrapper, vertical && styles.wrapperVertical]}>
      <View style={[styles.header, vertical && styles.headerVertical]}>
        <Text style={[styles.label, vertical && styles.labelVertical, { color: theme.text.secondary }]}>
          {label}
        </Text>
        <SliderReadout source={liveValue} formatValue={formatValue} />
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={vertical ? styles.hitAreaVertical : styles.hitArea}
          onTouchStart={() => {
            if (vertical) {
              onDragStartRef.current?.();
            }
          }}
          onLayout={(event) => {
            trackWidth.value = vertical
              ? event.nativeEvent.layout.height
              : event.nativeEvent.layout.width;
          }}
        >
          <View
            style={[
              vertical ? styles.trackVertical : styles.track,
              { backgroundColor: theme.overlay.muted },
            ]}
          >
            <Animated.View
              style={[
                vertical ? styles.fillVertical : styles.fill,
                { backgroundColor: theme.text.accent },
                fillStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.thumb,
                vertical && styles.thumbVertical,
                { backgroundColor: theme.text.inverse, borderColor: theme.text.accent },
                thumbStyle,
              ]}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 14,
  },
  wrapperVertical: {
    flex: 1,
    marginTop: 4,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 8,
    gap: 2,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
  },
  labelVertical: {
    textAlign: 'center',
  },
  value: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
  },
  hitArea: {
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: TRACK_INSET,
  },
  hitAreaVertical: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    paddingVertical: TRACK_INSET,
  },
  track: {
    height: 6,
    borderRadius: 4,
    justifyContent: 'center',
  },
  trackVertical: {
    flex: 1,
    width: 6,
    borderRadius: 4,
  },
  fill: {
    height: 6,
    borderRadius: 4,
  },
  fillVertical: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 6,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
  },
  thumbVertical: {
    left: (6 - THUMB_SIZE) / 2,
    top: 0,
  },
});
