import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { typography } from '@/theme/typography';
import type { OnboardingStep } from '@/types/onboarding';

interface UseStepTransitionResult {
  displayStep: OnboardingStep;
  contentOpacity: { value: number };
  isTransitioning: boolean;
  transitionTo: (nextStep: OnboardingStep, onMidTransition?: () => void) => void;
  transitionContent: (onMidTransition?: () => void) => void;
  setContentVisible: (visible: boolean) => void;
}

/** Управляет плавными переходами: fade-out → fade-in (без паузы на пустом экране) */
export function useStepTransition(initialStep: OnboardingStep): UseStepTransitionResult {
  const [displayStep, setDisplayStep] = useState(initialStep);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentOpacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    contentOpacity.value = withTiming(1, {
      duration: typography.animation.onboardingFadeInMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [contentOpacity]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const setContentVisible = useCallback(
    (visible: boolean) => {
      contentOpacity.value = withTiming(visible ? 1 : 0, {
        duration: visible
          ? typography.animation.onboardingFadeInMs
          : typography.animation.stepFadeOutMs,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      });
    },
    [contentOpacity],
  );

  const runContentTransition = useCallback(
    (onMidTransition?: () => void, onComplete?: () => void) => {
      clearTimers();
      setIsTransitioning(true);

      contentOpacity.value = withTiming(0, {
        duration: typography.animation.stepFadeOutMs,
        easing: Easing.in(Easing.cubic),
      });

      timerRef.current = setTimeout(() => {
        onMidTransition?.();

        timerRef.current = setTimeout(() => {
          contentOpacity.value = withTiming(1, {
            duration: typography.animation.onboardingFadeInMs,
            easing: Easing.out(Easing.cubic),
          });
          setIsTransitioning(false);
          onComplete?.();
        }, typography.animation.stepPauseMs);
      }, typography.animation.stepFadeOutMs);
    },
    [clearTimers, contentOpacity],
  );

  const transitionContent = useCallback(
    (onMidTransition?: () => void) => {
      runContentTransition(onMidTransition);
    },
    [runContentTransition],
  );

  const transitionTo = useCallback(
    (nextStep: OnboardingStep, onMidTransition?: () => void) => {
      runContentTransition(() => {
        onMidTransition?.();
        setDisplayStep(nextStep);
      });
    },
    [runContentTransition],
  );

  return {
    displayStep,
    contentOpacity,
    isTransitioning,
    transitionTo,
    transitionContent,
    setContentVisible,
  };
}
