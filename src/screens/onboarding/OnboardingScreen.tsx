import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { AnimatedButton } from '@/components/common/AnimatedButton';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { AnimatedText } from '@/components/common/AnimatedText';
import { DatePicker } from '@/components/common/DatePicker';
import { InputField } from '@/components/common/InputField';
import { PulsingHint } from '@/components/common/PulsingHint';
import { ShakeView } from '@/components/common/ShakeView';
import { useOnboarding } from '@/hooks/useOnboarding';
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

const CONTINUE_HINT = 'нажмите, чтобы продолжить';

export function OnboardingScreen({ onComplete }: Props) {
  const { displayStep, contentOpacity, isTransitioning, transitionTo, transitionContent } =
    useStepTransition('welcome');

  const onboarding = useOnboarding({ onComplete, transitionTo });
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
    clearShakeError,
  } = onboarding;

  const theme = colors[themeMode];
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
  const showSkip = activeStep === 'welcome';

  const handlePress = () => {
    if (isTransitioning) {
      return;
    }

    if (activeStep === 'reasons' && reasonLineIndex < reasons.length) {
      transitionContent(() => setReasonLineIndex(reasonLineIndex + 1));
      return;
    }

    if (activeStep === 'help_text' && helpLineIndex < helpLines.length - 1) {
      transitionContent(() => setHelpLineIndex(helpLineIndex + 1));
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

  const renderSingleLine = (
    text: string,
    options?: {
      style?: typeof styles.mainText;
      highlightWord?: string;
      textColor?: string;
    },
  ) => (
    <AnimatedText
      key={text}
      style={[
        options?.style ?? styles.paragraphText,
        { color: options?.textColor ?? theme.text.primary },
      ]}
      highlightWord={options?.highlightWord}
      highlightStyle={{ color: theme.text.accent }}
      highlightDelay={typography.animation.highlightDelayMs}
      initialColor={options?.textColor ?? theme.text.primary}
    >
      {text}
    </AnimatedText>
  );

  const renderReasons = () => {
    if (reasonLineIndex === 0) {
      return renderSingleLine('Ты здесь, потому что…', {
        style: styles.subText,
      });
    }

    const reason = reasons[reasonLineIndex - 1];
    const isLast = reasonLineIndex === reasons.length;

    return renderSingleLine(reason, {
      style: styles.reasonText,
      highlightWord: isLast ? 'любишь' : undefined,
      textColor: isLast ? theme.text.primary : theme.text.secondary,
    });
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 'welcome':
        return (
          <AnimatedText style={[styles.mainText, { color: theme.text.primary }]}>
            Привет, дорогая
          </AnimatedText>
        );

      case 'service_question':
        return (
          <AnimatedText style={[styles.mainText, { color: theme.text.primary }]}>
            Твой любимый сейчас проходит службу?
          </AnimatedText>
        );

      case 'reasons':
        return renderReasons();

      case 'help_text':
        return renderSingleLine(helpLines[helpLineIndex], {
          highlightWord:
            helpLineIndex === helpLines.length - 1 ? 'мимолётное свидание' : undefined,
        });

      case 'value_text':
        return renderSingleLine(valueLines[valueLineIndex], {
          highlightWord: valueLineIndex === valueLines.length - 1 ? 'любовь' : undefined,
        });

      case 'name_input':
        return (
          <ShakeView trigger={shakeError} style={styles.shakeWrapper}>
            <InputField
              label="Как зовут тебя?"
              value={userName}
              onChangeText={setUserName}
              placeholder="Твоё имя"
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
              label={`Здравствуй, ${userName.trim()}. Расскажи мне, как зовут твоего любимого?`}
              value={partnerName}
              onChangeText={setPartnerName}
              placeholder="Его имя"
              error={error}
              autoFocus
              onSubmitEditing={submitPartnerName}
              themeMode={themeMode}
            />
          </ShakeView>
        );

      case 'dates_input':
        return (
          <ShakeView trigger={shakeError} style={styles.shakeWrapper}>
            <ScrollView
              contentContainerStyle={styles.datesContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <AnimatedText style={[styles.mainText, { color: theme.text.primary }]}>
                Давай продолжим. Дорогая, назовёшь мне дату призыва и дату дембеля?
              </AnimatedText>

              <DatePicker
                label="Дата призыва"
                value={enlistmentDate}
                onChange={setEnlistmentDate}
                maximumDate={new Date()}
                themeMode={themeMode}
              />

              <DatePicker
                label="Дата дембеля"
                value={demobilizationDate}
                onChange={setDemobilizationDate}
                minimumDate={enlistmentDate ?? undefined}
                themeMode={themeMode}
              />

              {error ? (
                <Text style={[styles.errorText, { color: theme.text.accent }]}>{error}</Text>
              ) : null}

              <AnimatedButton
                label="Начать отсчёт"
                onPress={submitDates}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
            </ScrollView>
          </ShakeView>
        );

      default:
        return null;
    }
  };

  const renderBottomHint = () => {
    const hint = (
      <PulsingHint
        style={{
          color:
            themeMode === 'dark'
              ? 'rgba(255, 255, 255, 0.55)'
              : colors.light.text.secondary,
        }}
      >
        {CONTINUE_HINT}
      </PulsingHint>
    );

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
            <Text style={styles.skipText}>Пропустить</Text>
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
  skipText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
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
  textBlock: {
    width: '100%',
    gap: 12,
  },
  mainText: {
    fontSize: 28,
    lineHeight: 38,
  },
  subText: {
    fontSize: 22,
    lineHeight: 32,
  },
  reasonText: {
    fontSize: 20,
    lineHeight: 30,
  },
  paragraphText: {
    fontSize: 22,
    lineHeight: 34,
  },
  datesContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    fontFamily: typography.fontFamily.primary,
  },
});
