import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { AnimatedText } from '@/components/common/AnimatedText';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { DatePicker } from '@/components/common/DatePicker';
import { InputField } from '@/components/common/InputField';
import { PulsingHint } from '@/components/common/PulsingHint';
import { ServiceDurationPresets } from '@/components/common/ServiceDurationPresets';
import { ShakeView } from '@/components/common/ShakeView';
import { TELEGRAM_CHANNEL_TITLE, TELEGRAM_CHANNEL_URL } from '@/constants';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useOnboardingAudio } from '@/hooks/useOnboardingAudio';
import { useStepTransition } from '@/hooks/useStepTransition';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { RootStackParamList } from '@/types/navigation';

type Props = StackScreenProps<RootStackParamList, 'Onboarding'> & {
  onComplete: () => void;
};

const TAP_STEPS = new Set([
  'welcome',
  'service_question',
  'reasons',
  'help_text',
  'value_text',
]);

const CONTINUE_HINT = 'нажми, чтобы продолжить';

const BODY_TEXT_COLOR = (themeMode: 'dark' | 'light') => colors[themeMode].text.primary;

export function OnboardingScreen({ onComplete }: Props) {
  const { displayStep, contentOpacity, isTransitioning, transitionTo, transitionContent } =
    useStepTransition('welcome');

  const stopAmbientRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const onboarding = useOnboarding({
    onComplete,
    transitionTo,
    stopOnboardingAmbient: () => stopAmbientRef.current(),
  });
  const {
    step,
    themeMode,
    userName,
    partnerName,
    enlistmentDate,
    demobilizationDate,
    visibleReasonCount: reasonLineIndex,
    reasons,
    visibleHelpCount: helpLineIndex,
    helpLines,
    visibleValueCount: valueLineIndex,
    valueLines,
    setReasonLineIndex,
    setHelpLineIndex,
    setValueLineIndex,
    error,
    isSubmitting,
    shakeError,
    setUserName,
    setPartnerName,
    setEnlistmentDate,
    setDemobilizationDate,
    handleContinue,
    handleSkip,
    submitName,
    submitPartnerName,
    submitDates,
    applyServiceDuration,
    clearShakeError,
    beginLightTheme,
    confirmNotificationsChoice,
  } = onboarding;

  const { stopOnboardingAmbient } = useOnboardingAudio(step);

  useEffect(() => {
    stopAmbientRef.current = stopOnboardingAmbient;
  }, [stopOnboardingAmbient]);

  const theme = colors[themeMode];
  const bodyColor = BODY_TEXT_COLOR(themeMode);
  const hintTextStyle = {
    color:
      themeMode === 'dark' ? 'rgba(255, 255, 255, 0.55)' : colors.light.text.secondary,
  };
  const activeStep = isTransitioning ? displayStep : step;

  useEffect(() => {
    if (shakeError) {
      const timer = setTimeout(clearShakeError, 400);
      return () => clearTimeout(timer);
    }
  }, [shakeError, clearShakeError]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const isTapStep = TAP_STEPS.has(activeStep);
  const showSkip = TAP_STEPS.has(activeStep);

  const handlePress = () => {
    if (isTransitioning) {
      return;
    }

    if (activeStep === 'reasons' && reasonLineIndex < reasons.length - 1) {
      transitionContent(() => setReasonLineIndex(reasonLineIndex + 1));
      return;
    }

    if (activeStep === 'help_text' && helpLineIndex < helpLines.length - 1) {
      transitionContent(() => {
        const nextIndex = helpLineIndex + 1;
        setHelpLineIndex(nextIndex);
        if (nextIndex === 2) {
          beginLightTheme();
        }
      });
      return;
    }

    if (activeStep === 'value_text' && valueLineIndex < valueLines.length - 1) {
      transitionContent(() => setValueLineIndex(valueLineIndex + 1));
      return;
    }

    if (isTapStep) {
      handleContinue();
    }
  };

  const renderSingleLine = (text: string, options?: { highlightWord?: string }) => (
    <AnimatedText
      key={text}
      style={[styles.bodyText, { color: bodyColor }]}
      highlightWord={options?.highlightWord}
      highlightStyle={{ color: theme.text.accent }}
      highlightDelay={
        typography.animation.highlightDelayMs + typography.animation.onboardingFadeInMs
      }
      initialColor={bodyColor}
      skipEntranceAnimation
    >
      {text}
    </AnimatedText>
  );

  const renderReasons = () =>
    renderSingleLine(reasons[reasonLineIndex], {
      highlightWord: reasonLineIndex === reasons.length - 1 ? 'любишь' : undefined,
    });

  const renderStepContent = () => {
    switch (activeStep) {
      case 'welcome':
        return renderSingleLine('Привет, милая!');

      case 'service_question':
        return renderSingleLine(
          'Ты здесь, потому что вам пришлось столкнуться с армией',
          { highlightWord: 'армией' },
        );

      case 'reasons':
        return renderReasons();

      case 'help_text': {
        const line = helpLines[helpLineIndex];
        if (helpLineIndex === 2) {
          return renderSingleLine(line, { highlightWord: 'любовь навсегда' });
        }
        if (helpLineIndex === helpLines.length - 1) {
          return renderSingleLine(line, { highlightWord: 'мимолётное свидание' });
        }
        return renderSingleLine(line);
      }

      case 'value_text':
        if (valueLineIndex === 0) {
          return (
            <Text style={[styles.bodyText, { color: bodyColor }]}>
              Я ещё молодое приложение, но я развиваюсь! Следи за мной в тгк{' '}
              <Text
                style={[
                  styles.bodyText,
                  styles.channelLink,
                  { color: bodyColor },
                ]}
                onPress={() => void Linking.openURL(TELEGRAM_CHANNEL_URL)}
                accessibilityRole="link"
                accessibilityLabel={`Telegram-канал ${TELEGRAM_CHANNEL_TITLE}`}
              >
                {TELEGRAM_CHANNEL_TITLE}
              </Text>
            </Text>
          );
        }
        return renderSingleLine(valueLines[valueLineIndex]);

      case 'name_input':
        return (
          <ShakeView trigger={shakeError} style={styles.shakeWrapper}>
            <InputField
              label="Как зовут тебя?"
              value={userName}
              onChangeText={setUserName}
              error={error}
              autoFocus
              onSubmitEditing={submitName}
              themeMode={themeMode}
            />
          </ShakeView>
        );

      case 'partner_name_input':
        return (
          <ShakeView trigger={shakeError} style={styles.shakeWrapper}>
            <InputField
              label="Как зовут твоего любимого?"
              value={partnerName}
              onChangeText={setPartnerName}
              error={error}
              autoFocus
              onSubmitEditing={submitPartnerName}
              themeMode={themeMode}
            />
          </ShakeView>
        );

      case 'dates_input':
        return (
          <ShakeView trigger={shakeError} style={[styles.shakeWrapper, styles.datesShakeWrapper]}>
            <ScrollView
              contentContainerStyle={styles.datesScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.datesBlock}>
                <AnimatedText
                  style={[styles.bodyText, styles.datesPrompt, { color: bodyColor }]}
                  initialColor={bodyColor}
                  skipEntranceAnimation
                >
                  {'Милая, укажи даты\nпризыва и дембеля:'}
                </AnimatedText>

                <DatePicker
                  label="Дата призыва"
                  value={enlistmentDate}
                  onChange={setEnlistmentDate}
                  themeMode={themeMode}
                />

                <DatePicker
                  label="Дата дембеля"
                  value={demobilizationDate}
                  onChange={setDemobilizationDate}
                  minimumDate={enlistmentDate ?? undefined}
                  themeMode={themeMode}
                />

                <ServiceDurationPresets
                  themeMode={themeMode}
                  onSelect={applyServiceDuration}
                />

                {error ? (
                  <Text style={[styles.errorText, { color: theme.text.accent }]}>{error}</Text>
                ) : null}

                <Pressable
                  style={[
                    styles.saveButton,
                    { backgroundColor: theme.text.primary },
                    isSubmitting && styles.saveButtonDisabled,
                  ]}
                  onPress={submitDates}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Начать отсчёт"
                  accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={theme.text.inverse} />
                  ) : (
                    <Text style={[styles.saveButtonText, { color: theme.text.inverse }]}>
                      Начать отсчёт
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </ShakeView>
        );

      case 'notifications_prompt':
        return (
          <View style={styles.shakeWrapper}>
            <AnimatedText
              style={[styles.bodyText, { color: bodyColor }]}
              initialColor={bodyColor}
              skipEntranceAnimation
            >
              Хочешь получать уведомления о праздниках и событиях?
            </AnimatedText>

            {error ? (
              <Text style={[styles.errorText, { color: theme.text.accent }]}>{error}</Text>
            ) : null}

            <View style={styles.notificationsActions}>
              <Pressable
                style={[
                  styles.saveButton,
                  styles.notificationsButton,
                  { backgroundColor: theme.text.primary },
                ]}
                onPress={() => confirmNotificationsChoice(true)}
                accessibilityRole="button"
                accessibilityLabel="Да, включить уведомления"
              >
                <Text style={[styles.saveButtonText, { color: theme.text.inverse }]}>Да</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.notificationsSecondaryButton,
                  { borderColor: theme.text.primary },
                ]}
                onPress={() => confirmNotificationsChoice(false)}
                accessibilityRole="button"
                accessibilityLabel="Нет, без уведомлений"
              >
                <Text style={[styles.notificationsSecondaryText, { color: theme.text.primary }]}>
                  Нет
                </Text>
              </Pressable>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderBottomHint = () => {
    if (activeStep === 'dates_input' || activeStep === 'notifications_prompt') {
      return null;
    }

    const hint = <PulsingHint style={hintTextStyle}>{CONTINUE_HINT}</PulsingHint>;

    if (activeStep === 'name_input') {
      return <Pressable onPress={submitName}>{hint}</Pressable>;
    }

    if (activeStep === 'partner_name_input') {
      return <Pressable onPress={submitPartnerName}>{hint}</Pressable>;
    }

    return hint;
  };

  const mainContent = (
    <>
      <ScreenBackground themeMode={themeMode} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {showSkip ? (
          <Pressable style={styles.skipButton} onPress={handleSkip} hitSlop={12}>
            <PulsingHint style={[hintTextStyle, styles.skipHint]}>Пропустить</PulsingHint>
          </Pressable>
        ) : null}
      </SafeAreaView>

      <Animated.View style={[styles.centerContent, contentAnimatedStyle]}>
        {renderStepContent()}
      </Animated.View>

      <View style={styles.bottomHintContainer} pointerEvents="box-none">
        {renderBottomHint()}
      </View>
    </>
  );

  if (isTapStep) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.flex} onPress={handlePress}>
          {mainContent}
        </Pressable>
      </View>
    );
  }

  return <View style={styles.container}>{mainContent}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 24,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  skipHint: {
    textAlign: 'right',
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bottomHintContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: '12.5%',
    alignItems: 'center',
    zIndex: 1,
  },
  shakeWrapper: {
    width: '100%',
  },
  datesShakeWrapper: {
    flex: 1,
    alignSelf: 'stretch',
  },
  datesScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  datesBlock: {
    width: '100%',
    gap: 8,
  },
  datesPrompt: {
    marginBottom: 16,
  },
  bodyText: {
    width: '100%',
    fontFamily: typography.fontFamily.primary,
    fontSize: 22,
    lineHeight: 34,
    textAlign: 'center',
  },
  channelLink: {
    fontFamily: typography.fontFamily.sansBold,
  },
  saveButton: {
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 4,
    paddingVertical: 13,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    fontFamily: typography.fontFamily.primary,
  },
  notificationsActions: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  notificationsButton: {
    marginTop: 0,
  },
  notificationsSecondaryButton: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 13,
  },
  notificationsSecondaryText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
  },
});
