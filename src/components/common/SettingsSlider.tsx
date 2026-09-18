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

import { colors } from '@/theme/colors';
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
}

function ratioFromValue(value: number, min: number, max: number): number {
  if (max === min) {
    return 0;
  }
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

function readSlider(x: number, width: number, min: number, max: number) {
  'worklet';
  const usable = Math.max(1, width - TRACK_INSET * 2);
  const ratio = Math.min(1, Math.max(0, (x - TRACK_INSET) / usable));
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

  return <Text style={styles.value}>{formatValue(textValue)}</Text>;
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
}: SettingsSliderProps) {
  const trackWidth = useSharedValue(0);
  const progress = useSharedValue(ratioFromValue(value, min, max));
  const liveValue = useSharedValue(value);
  const minValue = useSharedValue(min);
  const maxValue = useSharedValue(max);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

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

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .failOffsetY([-24, 24])
        .shouldCancelWhenOutside(false)
        .onBegin((event) => {
          if (trackWidth.value <= 0) {
            return;
          }

          const { ratio, next } = readSlider(
            event.x,
            trackWidth.value,
            minValue.value,
            maxValue.value,
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
            event.x,
            trackWidth.value,
            minValue.value,
            maxValue.value,
          );
          progress.value = ratio;
          liveValue.value = next;
          if (sharedValue) {
            sharedValue.value = minValue.value + ratio * (maxValue.value - minValue.value);
          }
        })
        .onFinalize(() => {
          runOnJS(notifyCommit)(liveValue.value);
        }),
    [liveValue, maxValue, minValue, progress, sharedValue, trackWidth],
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, trackWidth.value - TRACK_INSET * 2) * progress.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          Math.max(0, trackWidth.value - TRACK_INSET * 2) * progress.value - THUMB_SIZE / 2,
      },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <SliderReadout source={liveValue} formatValue={formatValue} />
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={styles.hitArea}
          onLayout={(event) => {
            trackWidth.value = event.nativeEvent.layout.width;
          }}
        >
          <View style={styles.track}>
            <Animated.View style={[styles.fill, fillStyle]} />
            <Animated.View style={[styles.thumb, thumbStyle]} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  value: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.primary,
  },
  hitArea: {
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: TRACK_INSET,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(167, 154, 138, 0.28)',
    justifyContent: 'center',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.light.text.accent,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FCF7DF',
    borderWidth: 2,
    borderColor: colors.light.text.accent,
  },
});
