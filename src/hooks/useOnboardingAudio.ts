import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';

import { ONBOARDING_AMBIENT_SOURCE, ONBOARDING_AMBIENT_VOLUME } from '@/constants/onboardingAudio';
import type { OnboardingStep } from '@/types/onboarding';
import { logger } from '@/utils/logger';

const AMBIENT_STEPS = new Set<OnboardingStep>([
  'welcome',
  'service_question',
  'reasons',
  'help_text',
  'value_text',
  'name_input',
  'partner_name_input',
  'notifications_prompt',
  'dates_input',
]);

let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) {
    return;
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioModeReady = true;
}

export function useOnboardingAudio(step: OnboardingStep): {
  stopOnboardingAmbient: () => Promise<void>;
} {
  const ambientRef = useRef<Audio.Sound | null>(null);
  const shouldPlayAmbient = AMBIENT_STEPS.has(step);

  const stopOnboardingAmbient = useCallback(async () => {
    const sound = ambientRef.current;
    ambientRef.current = null;
    if (!sound) {
      return;
    }
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      // ignore teardown races
    }
  }, []);

  const startAmbient = useCallback(async () => {
    if (ambientRef.current) {
      return;
    }
    try {
      await ensureAudioMode();
      const { sound } = await Audio.Sound.createAsync(ONBOARDING_AMBIENT_SOURCE, {
        isLooping: true,
        volume: ONBOARDING_AMBIENT_VOLUME,
        shouldPlay: true,
      });
      ambientRef.current = sound;
    } catch (error) {
      logger.warn(
        'Не удалось запустить ambient онбординга (есть ли assets/audio/onboarding-ambient.mp3?)',
        error,
      );
    }
  }, []);

  useEffect(() => {
    if (shouldPlayAmbient) {
      void startAmbient();
    } else {
      void stopOnboardingAmbient();
    }
  }, [shouldPlayAmbient, startAmbient, stopOnboardingAmbient]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next !== 'active') {
        void ambientRef.current?.pauseAsync().catch(() => undefined);
        return;
      }
      if (shouldPlayAmbient) {
        void ambientRef.current?.playAsync().catch(() => undefined);
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [shouldPlayAmbient]);

  useEffect(
    () => () => {
      void stopOnboardingAmbient();
    },
    [stopOnboardingAmbient],
  );

  return { stopOnboardingAmbient };
}
