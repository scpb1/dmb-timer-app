import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { differenceInCalendarDays, addDays, isBefore, startOfDay } from 'date-fns';

import { CONFIG_KEYS } from '@/types/config';
import type { OnboardingFormData, OnboardingStep, ThemeMode } from '@/types/onboarding';
import { getConfig, setConfig } from '@/services/database';
import { logger } from '@/utils/logger';
import { applyAppNotificationsPreference } from '@/services/holidayNotifications';

const REASONS = [
  'Рано или поздно это бы случилось, понимаешь?',
  'Я знаю, как это тяжело',
  'Как тяжело не видеть и не слышать его каждый день',
  'Как тяжело проживать моменты своей жизни без него',
  'Как тяжело сохранить яркие чувства на расстоянии',
  'Но ты всё равно решилась его ждать, потому что любишь',
] as const;

const HELP_LINES = [
  'Сейчас я скажу одну фразу',
  'Держи её в голове',
  'Армия закончится, а ваша любовь навсегда',
  'Берегите друг друга',
  'А я буду верным помощником\nна период армии',
  'Подскажу сколько дней\nпрошло и осталось',
  'Напомню о праздниках',
  'Сохраню воспоминания о службе',
  'Превращу ожидание в мимолётное свидание',
] as const;

const VALUE_LINES = [
  'Я ещё молодое приложение, но я развиваюсь! Следи за мной в тгк Девичья служба',
  'А теперь познакомимся поближе',
] as const;

interface UseOnboardingResult {
  step: OnboardingStep;
  themeMode: ThemeMode;
  userName: string;
  partnerName: string;
  enlistmentDate: Date | null;
  demobilizationDate: Date | null;
  visibleReasonCount: number;
  reasons: readonly string[];
  visibleHelpCount: number;
  helpLines: readonly string[];
  visibleValueCount: number;
  valueLines: readonly string[];
  setReasonLineIndex: (index: number) => void;
  setHelpLineIndex: (index: number) => void;
  setValueLineIndex: (index: number) => void;
  error: string | null;
  isSubmitting: boolean;
  shakeError: boolean;
  setUserName: (name: string) => void;
  setPartnerName: (name: string) => void;
  setEnlistmentDate: (date: Date) => void;
  setDemobilizationDate: (date: Date) => void;
  handleContinue: () => void;
  handleSkip: () => void;
  submitName: () => void;
  submitPartnerName: () => void;
  submitDates: () => Promise<boolean>;
  applyServiceDuration: (days: number) => void;
  clearShakeError: () => void;
  beginLightTheme: () => void;
  confirmNotificationsChoice: (enabled: boolean) => void;
}

interface UseOnboardingOptions {
  onComplete: () => void;
  transitionTo: (nextStep: OnboardingStep, onMidTransition?: () => void) => void;
  stopOnboardingAmbient: () => Promise<void>;
}

/** Управляет шагами онбординга UC-01 и сохранением профиля в SQLite */
export function useOnboarding({
  onComplete,
  transitionTo,
  stopOnboardingAmbient,
}: UseOnboardingOptions): UseOnboardingResult {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [userName, setUserName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [enlistmentDate, setEnlistmentDate] = useState<Date | null>(null);
  const [demobilizationDate, setDemobilizationDate] = useState<Date | null>(null);
  const [reasonLineIndex, setReasonLineIndex] = useState(0);
  const [helpLineIndex, setHelpLineIndex] = useState(0);
  const [valueLineIndex, setValueLineIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [notificationsOptIn, setNotificationsOptIn] = useState(false);

  const validateDates = useCallback((): string | null => {
    if (!enlistmentDate || !demobilizationDate) {
      return 'Укажи обе даты';
    }

    const enlistment = startOfDay(enlistmentDate);
    const demobilization = startOfDay(demobilizationDate);

    if (!isBefore(enlistment, demobilization)) {
      return 'Дата дембеля должна быть позже даты призыва';
    }

    return null;
  }, [enlistmentDate, demobilizationDate]);

  const persistProfile = useCallback(async (data: OnboardingFormData) => {
    if (!data.enlistmentDate || !data.demobilizationDate) {
      throw new Error('Даты не заполнены');
    }

    const enlistment = startOfDay(data.enlistmentDate);
    const demobilization = startOfDay(data.demobilizationDate);
    const today = startOfDay(new Date());

    const totalDays = differenceInCalendarDays(demobilization, enlistment);
    const daysPassed = Math.max(0, differenceInCalendarDays(today, enlistment));
    const daysLeft = Math.max(0, differenceInCalendarDays(demobilization, today));
    const progressPercent =
      totalDays > 0 ? Math.min(100, Math.round((daysPassed / totalDays) * 100)) : 0;

    await setConfig(CONFIG_KEYS.USER_NAME, data.userName.trim());
    await setConfig(CONFIG_KEYS.PARTNER_NAME, data.partnerName.trim());
    await setConfig(CONFIG_KEYS.ENLISTMENT_DATE, data.enlistmentDate.toISOString());
    await setConfig(
      CONFIG_KEYS.DEMOBILIZATION_DATE,
      data.demobilizationDate.toISOString(),
    );
    await setConfig(CONFIG_KEYS.PROGRESS_PERCENT, String(progressPercent));
    await setConfig(CONFIG_KEYS.DAYS_PASSED, String(daysPassed));
    await setConfig(CONFIG_KEYS.DAYS_LEFT, String(daysLeft));
    await setConfig(CONFIG_KEYS.ONBOARDING_COMPLETED, 'true');
  }, []);

  const resetReasons = useCallback(() => {
    setReasonLineIndex(0);
  }, []);

  const resetHelpLines = useCallback(() => {
    setHelpLineIndex(0);
  }, []);

  const resetValueLines = useCallback(() => {
    setValueLineIndex(0);
  }, []);

  const handleContinue = useCallback(() => {
    setError(null);

    switch (step) {
      case 'welcome':
        transitionTo('service_question', () => setStep('service_question'));
        break;
      case 'service_question':
        transitionTo('reasons', () => {
          setStep('reasons');
          resetReasons();
        });
        break;
      case 'reasons':
        transitionTo('help_text', () => {
          setStep('help_text');
          resetReasons();
          resetHelpLines();
        });
        break;
      case 'help_text':
        transitionTo('value_text', () => {
          setStep('value_text');
          resetHelpLines();
          resetValueLines();
        });
        break;
      case 'value_text':
        transitionTo('name_input', () => {
          setStep('name_input');
          resetValueLines();
        });
        break;
      default:
        break;
    }
  }, [step, transitionTo, resetReasons, resetHelpLines, resetValueLines]);

  const handleSkip = useCallback(() => {
    Alert.alert(
      'Пропустить знакомство?',
      'Ты сможешь вернуться к этим шагам позже, но сейчас мы сразу перейдём к вводу твоего имени',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Пропустить',
          style: 'destructive',
          onPress: () => {
            resetReasons();
            resetHelpLines();
            resetValueLines();
            transitionTo('name_input', () => {
              setStep('name_input');
              setThemeMode('light');
            });
          },
        },
      ],
    );
  }, [resetReasons, resetHelpLines, resetValueLines, transitionTo]);

  const submitName = useCallback(() => {
    const trimmed = userName.trim();

    if (!trimmed) {
      setError('Введи имя');
      setShakeError(true);
      return;
    }

    setError(null);
    transitionTo('partner_name_input', () => setStep('partner_name_input'));
  }, [userName, transitionTo]);

  const submitPartnerName = useCallback(() => {
    const trimmed = partnerName.trim();

    if (!trimmed) {
      setError('Введи имя');
      setShakeError(true);
      return;
    }

    setError(null);
    transitionTo('notifications_prompt', () => setStep('notifications_prompt'));
  }, [partnerName, transitionTo]);

  const confirmNotificationsChoice = useCallback(
    (enabled: boolean) => {
      setNotificationsOptIn(enabled);
      setError(null);
      transitionTo('dates_input', () => setStep('dates_input'));
    },
    [transitionTo],
  );

  const submitDates = useCallback(async (): Promise<boolean> => {
    const validationError = validateDates();

    if (validationError) {
      setError(validationError);
      setShakeError(true);
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await persistProfile({
        userName,
        partnerName,
        enlistmentDate,
        demobilizationDate,
      });

      const permission = await applyAppNotificationsPreference(notificationsOptIn);
      if (notificationsOptIn && permission === 'denied') {
        Alert.alert(
          'Уведомления выключены',
          'Разрешение не дано. Включить напоминания можно позже в настройках таймера',
        );
      }

      await stopOnboardingAmbient();

      logger.info('Онбординг завершён, профиль сохранён');
      onComplete();
      return true;
    } catch (err) {
      logger.error('Ошибка сохранения профиля', err);
      setError('Не удалось сохранить данные. Попробуй ещё раз');
      setShakeError(true);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateDates,
    persistProfile,
    userName,
    partnerName,
    enlistmentDate,
    demobilizationDate,
    notificationsOptIn,
    stopOnboardingAmbient,
    onComplete,
  ]);

  const applyServiceDuration = useCallback(
    (days: number) => {
      if (!enlistmentDate) {
        setError('Сначала укажи дату призыва');
        setShakeError(true);
        return;
      }

      setError(null);
      setDemobilizationDate(addDays(startOfDay(enlistmentDate), days));
    },
    [enlistmentDate],
  );

  const clearShakeError = useCallback(() => {
    setShakeError(false);
  }, []);

  const beginLightTheme = useCallback(() => {
    setThemeMode('light');
  }, []);

  return {
    step,
    themeMode,
    userName,
    partnerName,
    enlistmentDate,
    demobilizationDate,
    visibleReasonCount: reasonLineIndex,
    reasons: REASONS,
    visibleHelpCount: helpLineIndex,
    helpLines: HELP_LINES,
    visibleValueCount: valueLineIndex,
    valueLines: VALUE_LINES,
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
  };
}

/** Проверяет, завершён ли онбординг (для начального маршрута навигации) */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await getConfig(CONFIG_KEYS.ONBOARDING_COMPLETED);
    return value === 'true';
  } catch (error) {
    logger.error('Ошибка проверки статуса онбординга', error);
    return false;
  }
}
