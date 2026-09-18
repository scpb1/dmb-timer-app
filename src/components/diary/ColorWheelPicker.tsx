import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { hexToHsv, hsvToHex, normalizeHex } from '@/utils/color';

const WHEEL_SIZE = 220;
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const SLICE_COUNT = 180;

interface ColorWheelPickerProps {
  visible: boolean;
  color: string;
  onClose: () => void;
  onChange: (hex: string) => void;
}

function hueSlicePath(index: number): string {
  const start = (index / SLICE_COUNT) * Math.PI * 2 - Math.PI / 2;
  const end = ((index + 1) / SLICE_COUNT) * Math.PI * 2 - Math.PI / 2;
  const x1 = WHEEL_RADIUS + Math.cos(start) * WHEEL_RADIUS;
  const y1 = WHEEL_RADIUS + Math.sin(start) * WHEEL_RADIUS;
  const x2 = WHEEL_RADIUS + Math.cos(end) * WHEEL_RADIUS;
  const y2 = WHEEL_RADIUS + Math.sin(end) * WHEEL_RADIUS;
  return `M ${WHEEL_RADIUS} ${WHEEL_RADIUS} L ${x1} ${y1} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${x2} ${y2} Z`;
}

const HUE_SLICES = Array.from({ length: SLICE_COUNT }, (_, index) => ({
  path: hueSlicePath(index),
  color: hsvToHex(((index + 0.5) / SLICE_COUNT) * 360, 1, 1),
}));

const HueWheel = memo(function HueWheel() {
  return (
    <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
      <Defs>
        <RadialGradient id="satFade" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="72%" stopColor="#ffffff" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {HUE_SLICES.map((slice, index) => (
        <Path
          key={index}
          d={slice.path}
          fill={slice.color}
          stroke={slice.color}
          strokeWidth={1.5}
        />
      ))}
      <Rect
        x={0}
        y={0}
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        fill="url(#satFade)"
      />
    </Svg>
  );
});

/** Круг HSV + яркость + поле HEX */
export function ColorWheelPicker({ visible, color, onClose, onChange }: ColorWheelPickerProps) {
  const initial = hexToHsv(color) ?? { h: 24, s: 0.24, v: 0.24 };
  const [hue, setHue] = useState(initial.h);
  const [saturation, setSaturation] = useState(initial.s);
  const [value, setValue] = useState(initial.v);
  const [hexInput, setHexInput] = useState(normalizeHex(color) ?? '#3E3630');
  const wasVisibleRef = useRef(false);
  const hueValue = useSharedValue(initial.h);
  const saturationValue = useSharedValue(initial.s);
  const brightnessValue = useSharedValue(initial.v);
  const sliderWidth = useSharedValue(0);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      const hsv = hexToHsv(color) ?? { h: 24, s: 0.24, v: 0.24 };
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      setHexInput(normalizeHex(color) ?? '#3E3630');
      hueValue.value = hsv.h;
      saturationValue.value = hsv.s;
      brightnessValue.value = hsv.v;
    }

    wasVisibleRef.current = visible;
  }, [brightnessValue, color, hueValue, saturationValue, visible]);

  const hex = useMemo(() => hsvToHex(hue, saturation, value), [hue, saturation, value]);

  const commitColor = (nextHue: number, nextSat: number, nextValue: number) => {
    const nextHex = hsvToHex(nextHue, nextSat, nextValue);
    setHue(nextHue);
    setSaturation(nextSat);
    setValue(nextValue);
    setHexInput(nextHex);
    onChange(nextHex);
  };

  const wheelGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      const dx = event.x - WHEEL_RADIUS;
      const dy = event.y - WHEEL_RADIUS;
      saturationValue.value = Math.min(
        1,
        Math.max(0, Math.sqrt(dx * dx + dy * dy) / WHEEL_RADIUS),
      );
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) {
        angle += 360;
      }
      hueValue.value = angle;
    })
    .onUpdate((event) => {
      const dx = event.x - WHEEL_RADIUS;
      const dy = event.y - WHEEL_RADIUS;
      saturationValue.value = Math.min(
        1,
        Math.max(0, Math.sqrt(dx * dx + dy * dy) / WHEEL_RADIUS),
      );
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) {
        angle += 360;
      }
      hueValue.value = angle;
    })
    .onEnd(() => {
      runOnJS(commitColor)(
        hueValue.value,
        saturationValue.value,
        brightnessValue.value,
      );
    });

  const brightnessGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      if (sliderWidth.value > 0) {
        brightnessValue.value = Math.min(1, Math.max(0, event.x / sliderWidth.value));
      }
    })
    .onUpdate((event) => {
      if (sliderWidth.value > 0) {
        brightnessValue.value = Math.min(1, Math.max(0, event.x / sliderWidth.value));
      }
    })
    .onEnd(() => {
      runOnJS(commitColor)(
        hueValue.value,
        saturationValue.value,
        brightnessValue.value,
      );
    });

  const wheelMarkerStyle = useAnimatedStyle(() => {
    const angle = ((hueValue.value - 90) * Math.PI) / 180;
    const radius = saturationValue.value * WHEEL_RADIUS;
    return {
      transform: [
        { translateX: WHEEL_RADIUS + Math.cos(angle) * radius - 9 },
        { translateY: WHEEL_RADIUS + Math.sin(angle) * radius - 9 },
      ],
    };
  });

  const brightnessMarkerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderWidth.value * brightnessValue.value - 2 }],
  }));

  const handleHexSubmit = (raw: string) => {
    const normalized = normalizeHex(raw.startsWith('#') ? raw : `#${raw}`);
    if (!normalized) {
      setHexInput(hex);
      return;
    }

    const hsv = hexToHsv(normalized);
    if (!hsv) {
      setHexInput(hex);
      return;
    }

    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);
    setHexInput(normalized);
    hueValue.value = hsv.h;
    saturationValue.value = hsv.s;
    brightnessValue.value = hsv.v;
    onChange(normalized);
  };

  const fullColor = hsvToHex(hue, saturation, 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Цвет текста</Text>

            <GestureDetector gesture={wheelGesture}>
              <View style={styles.wheelWrap} collapsable={false}>
                <HueWheel />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.marker,
                    { backgroundColor: hex },
                    wheelMarkerStyle,
                  ]}
                />
              </View>
            </GestureDetector>

            <Text style={styles.label}>Яркость</Text>
            <GestureDetector gesture={brightnessGesture}>
              <View
                style={styles.sliderTouchArea}
                collapsable={false}
                onLayout={(event) => {
                  sliderWidth.value = event.nativeEvent.layout.width;
                }}
              >
                <View style={styles.sliderTrack}>
                  <Svg width="100%" height="100%">
                    <Defs>
                      <LinearGradient id="brightness" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#000000" />
                        <Stop offset="100%" stopColor={fullColor} />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#brightness)" />
                  </Svg>
                </View>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.sliderMarker, brightnessMarkerStyle]}
                />
              </View>
            </GestureDetector>

            <Text style={styles.label}>HEX</Text>
            <TextInput
              value={hexInput}
              onChangeText={(text) => setHexInput(text.toUpperCase())}
              onEndEditing={(event) => handleHexSubmit(event.nativeEvent.text)}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              style={styles.hexInput}
              placeholder="#3E3630"
              placeholderTextColor={colors.light.input.placeholder}
            />

            <View style={styles.previewRow}>
              <View style={[styles.preview, { backgroundColor: hex }]} />
              <Pressable style={styles.doneButton} onPress={onClose}>
                <Text style={styles.doneLabel}>Готово</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFDF6',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.35)',
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    color: colors.light.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  wheelWrap: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignSelf: 'center',
    borderRadius: WHEEL_RADIUS,
    overflow: 'hidden',
  },
  marker: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  sliderTouchArea: {
    height: 36,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 24,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(62, 54, 48, 0.2)',
  },
  sliderMarker: {
    position: 'absolute',
    top: 3,
    width: 4,
    height: 30,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(62, 54, 48, 0.65)',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  hexInput: {
    borderWidth: 1,
    borderColor: colors.light.input.border,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.primary,
    letterSpacing: 1,
  },
  previewRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preview: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(62, 54, 48, 0.25)',
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.light.background.end,
    borderRadius: 7,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.35)',
  },
  doneLabel: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
    color: colors.light.text.primary,
  },
});
