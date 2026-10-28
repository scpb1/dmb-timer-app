import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface OnboardingAtmosphereProps {
  width: number;
  height: number;
}

interface AshSpec {
  id: number;
  xPct: number;
  startYPct: number;
  w: number;
  h: number;
  opacity: number;
  durationMs: number;
  delayMs: number;
  driftX: number;
}

function buildAsh(count: number): AshSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const spread = count > 1 ? i / (count - 1) : 0.5;
    const jitter = ((i * 17 + 3) % 11) / 11 - 0.5;

    return {
      id: i,
      xPct: Math.min(0.92, Math.max(0.08, 0.08 + spread * 0.84 + jitter * 0.04)),
      startYPct: ((i * 13 + 7) % 10) / 10,
      w: 2 + (i % 3),
      h: 3 + (i % 2) * 2,
      opacity: 0.08 + (i % 4) * 0.03,
      durationMs: 16000 + (i % 5) * 2000,
      delayMs: (i % 8) * 450,
      driftX: ((i % 7) - 3) * 4,
    };
  });
}

function AshParticle({ spec, width, height }: { spec: AshSpec; width: number; height: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delayMs,
      withRepeat(
        withTiming(1, { duration: spec.durationMs, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [progress, spec.delayMs, spec.durationMs]);

  const style = useAnimatedStyle(() => {
    const travel = height * 1.15;
    const startY = spec.startYPct * height;
    const baseX = spec.xPct * width - spec.w / 2;

    return {
      transform: [
        { translateX: baseX + spec.driftX * progress.value },
        { translateY: startY + travel * progress.value },
      ],
      opacity: spec.opacity * (1 - progress.value * 0.35),
    };
  }, [height, spec, width]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ash,
        {
          width: spec.w,
          height: spec.h,
          borderRadius: spec.h,
        },
        style,
      ]}
    />
  );
}

/** Тлен на графite в онбординге */
export function OnboardingAtmosphere({ width, height }: OnboardingAtmosphereProps) {
  const ash = useMemo(() => buildAsh(10), []);
  const uid = 'onboarding-decay-vignette';

  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={uid} cx="50%" cy="48%" r="72%">
            <Stop offset="55%" stopColor="#000000" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.38} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${uid})`} />
      </Svg>
      {ash.map((spec) => (
        <AshParticle key={spec.id} spec={spec} width={width} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ash: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(140, 132, 122, 0.85)',
  },
});
