import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import {
  DIARY_PIN_LENGTH,
  DIARY_RECOVERY_ANSWER_MIN_LENGTH,
  authenticateDiaryBiometrics,
  getBiometricAvailability,
  getDiaryLockStatus,
  getDiaryRecoveryQuestion,
  hasDiaryRecovery,
  isDiaryBiometricsEnabled,
  resetDiaryPinAfterRecovery,
  verifyDiaryPin,
  verifyDiaryRecoveryAnswer,
} from '@/services/diaryLock';
import { FEATURES } from '@/constants';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface DiaryLockScreenProps {
  onUnlock: () => void;
  onCancel: () => void;
}

type LockMode = 'pin' | 'recovery' | 'newPin';

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

function lockHint(lockedUntil: number | null): string {
  if (!lockedUntil) {
    return 'Слишком много попыток. Подождите немного.';
  }
  const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
  return `Слишком много попыток. Подождите ${minutes} мин.`;
}

export function DiaryLockScreen({ onUnlock, onCancel }: DiaryLockScreenProps) {
  const [mode, setMode] = useState<LockMode>('pin');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinRepeat, setNewPinRepeat] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const [biometricsOn, setBiometricsOn] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [hasFingerprint, setHasFingerprint] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const pinLocked = Boolean(lockedUntil && lockedUntil > Date.now());

  useEffect(() => {
    void Promise.all([
      isDiaryBiometricsEnabled(),
      getBiometricAvailability(),
      hasDiaryRecovery(),
      getDiaryRecoveryQuestion(),
      getDiaryLockStatus(),
    ]).then(([bioEnabled, availability, hasRecovery, recoveryQuestion, status]) => {
      const canUseBio = FEATURES.biometrics && bioEnabled && availability.enrolled;
      setBiometricsOn(canUseBio);
      setHasFace(availability.face);
      setHasFingerprint(availability.fingerprint);
      setRecoveryAvailable(hasRecovery);
      setQuestion(recoveryQuestion);
      setLockedUntil(status.lockedUntil);
      if (canUseBio && !status.locked) {
        void tryBiometrics();
      }
    });
  }, []);

  const tryBiometrics = async () => {
    const status = await getDiaryLockStatus();
    if (status.locked) {
      setLockedUntil(status.lockedUntil);
      setError(lockHint(status.lockedUntil));
      return;
    }
    const ok = await authenticateDiaryBiometrics();
    if (ok) {
      onUnlock();
    }
  };

  const verifyEnteredPin = async (value: string) => {
    setBusy(true);
    const result = await verifyDiaryPin(value);
    setBusy(false);
    if (result.ok) {
      onUnlock();
      return;
    }

    setPin('');
    setLockedUntil(result.lockedUntil);
    if (result.locked) {
      setError(lockHint(result.lockedUntil));
      return;
    }
    setError(`Неверный код. Осталось попыток: ${result.remaining}`);
  };

  const handleDigit = (digit: string) => {
    if (busy || pinLocked || pin.length >= DIARY_PIN_LENGTH) {
      return;
    }
    setError(null);
    const next = pin + digit;
    setPin(next);
    if (next.length === DIARY_PIN_LENGTH) {
      void verifyEnteredPin(next);
    }
  };

  const handleBackspace = () => {
    if (busy || pinLocked) {
      return;
    }
    setError(null);
    setPin((current) => current.slice(0, -1));
  };

  const handleRecovery = async () => {
    if (answer.trim().length < DIARY_RECOVERY_ANSWER_MIN_LENGTH) {
      setError('Ответ слишком короткий');
      return;
    }

    const result = await verifyDiaryRecoveryAnswer(answer);
    if (result.ok) {
      setMode('newPin');
      setError(null);
      setAnswer('');
      return;
    }

    setLockedUntil(result.lockedUntil);
    if (result.locked) {
      setError(lockHint(result.lockedUntil));
      return;
    }
    setError(`Неверный ответ. Осталось попыток: ${result.remaining}`);
  };

  const handleSetNewPin = async () => {
    if (newPin.length !== DIARY_PIN_LENGTH || newPin !== newPinRepeat) {
      setError('Введите одинаковый код из 4 цифр');
      return;
    }
    const ok = await resetDiaryPinAfterRecovery(newPin);
    if (ok) {
      onUnlock();
      return;
    }
    setError('Не удалось сохранить новый код');
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Pressable
          onPress={onCancel}
          style={styles.back}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Назад"
        >
          <Feather name="chevron-left" size={26} color={colors.light.text.primary} />
        </Pressable>

        <View style={styles.body}>
          <Text style={styles.title}>Личный дневник</Text>

          {mode === 'pin' ? (
            <>
              <Text style={styles.hint}>Введите код, чтобы открыть записи</Text>
              <View style={styles.dots} accessibilityLabel={`Введено ${pin.length} из ${DIARY_PIN_LENGTH}`}>
                {Array.from({ length: DIARY_PIN_LENGTH }, (_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, index < pin.length ? styles.dotFilled : null]}
                  />
                ))}
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSlot} />}

              <View style={styles.pad}>
                {PIN_KEYS.map((digit) => (
                  <Pressable
                    key={digit}
                    style={({ pressed }) => [styles.key, pressed ? styles.keyPressed : null]}
                    onPress={() => handleDigit(digit)}
                    disabled={busy || pinLocked}
                    accessibilityRole="button"
                    accessibilityLabel={digit}
                  >
                    <Text style={styles.keyDigit}>{digit}</Text>
                  </Pressable>
                ))}

                <Pressable
                  style={({ pressed }) => [styles.key, pressed && biometricsOn ? styles.keyPressed : null]}
                  onPress={() => {
                    if (biometricsOn) {
                      void tryBiometrics();
                    }
                  }}
                  disabled={!biometricsOn || pinLocked}
                  accessibilityRole="button"
                  accessibilityLabel={
                    hasFace && hasFingerprint
                      ? 'Открыть по лицу или отпечатку'
                      : hasFace
                        ? 'Открыть по лицу'
                        : hasFingerprint
                          ? 'Открыть по отпечатку'
                          : 'Биометрия недоступна'
                  }
                >
                  {biometricsOn ? (
                    <View style={styles.bioIcons}>
                      {hasFace ? (
                        <MaterialCommunityIcons
                          name="face-recognition"
                          size={22}
                          color={colors.light.text.primary}
                        />
                      ) : null}
                      {hasFingerprint ? (
                        <MaterialCommunityIcons
                          name="fingerprint"
                          size={24}
                          color={colors.light.text.primary}
                        />
                      ) : null}
                      {!hasFace && !hasFingerprint ? (
                        <MaterialCommunityIcons
                          name="shield-key-outline"
                          size={24}
                          color={colors.light.text.primary}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.key, pressed ? styles.keyPressed : null]}
                  onPress={() => handleDigit('0')}
                  disabled={busy || pinLocked}
                  accessibilityRole="button"
                  accessibilityLabel="0"
                >
                  <Text style={styles.keyDigit}>0</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.key, pressed ? styles.keyPressed : null]}
                  onPress={handleBackspace}
                  disabled={busy || pinLocked || pin.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Стереть"
                >
                  <Feather name="delete" size={22} color={colors.light.text.primary} />
                </Pressable>
              </View>

              {recoveryAvailable ? (
                <Pressable style={styles.linkButton} onPress={() => { setMode('recovery'); setError(null); }}>
                  <Text style={styles.linkText}>Забыли код?</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {mode === 'recovery' ? (
            <>
              <Text style={styles.hint}>{question ?? 'Кодовый вопрос'}</Text>
              <TextInput
                value={answer}
                onChangeText={setAnswer}
                style={styles.answer}
                placeholder="Кодовый ответ"
                placeholderTextColor={colors.light.input.placeholder}
                autoCapitalize="none"
                autoFocus
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable style={styles.bioButton} onPress={() => void handleRecovery()}>
                <Text style={styles.bioText}>Проверить ответ</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={() => { setMode('pin'); setError(null); }}>
                <Text style={styles.linkText}>Вернуться к коду</Text>
              </Pressable>
            </>
          ) : null}

          {mode === 'newPin' ? (
            <>
              <Text style={styles.hint}>Придумайте новый код из 4 цифр</Text>
              <TextInput
                value={newPin}
                onChangeText={(value) => setNewPin(value.replace(/\D/g, '').slice(0, DIARY_PIN_LENGTH))}
                keyboardType="number-pad"
                maxLength={DIARY_PIN_LENGTH}
                secureTextEntry
                style={styles.pin}
                placeholder="Новый код"
                placeholderTextColor={colors.light.input.placeholder}
              />
              <TextInput
                value={newPinRepeat}
                onChangeText={(value) => setNewPinRepeat(value.replace(/\D/g, '').slice(0, DIARY_PIN_LENGTH))}
                keyboardType="number-pad"
                maxLength={DIARY_PIN_LENGTH}
                secureTextEntry
                style={styles.pin}
                placeholder="Повторите код"
                placeholderTextColor={colors.light.input.placeholder}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable style={styles.bioButton} onPress={() => void handleSetNewPin()}>
                <Text style={styles.bioText}>Сохранить код</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
  },
  back: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 40,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 24,
    color: colors.light.text.primary,
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.secondary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.light.text.primary,
  },
  dotFilled: {
    backgroundColor: colors.light.text.primary,
  },
  pad: {
    width: 276,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginTop: 8,
  },
  key: {
    width: 80,
    height: 64,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
  },
  keyPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  keyDigit: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 26,
    color: colors.light.text.primary,
  },
  bioIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pin: {
    width: 180,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.input.border,
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
    color: colors.light.text.primary,
    paddingVertical: 8,
  },
  answer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.input.border,
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    textAlign: 'center',
    color: colors.light.text.primary,
    paddingVertical: 8,
  },
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.accent,
    textAlign: 'center',
    minHeight: 20,
  },
  errorSlot: {
    minHeight: 20,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
  },
  bioText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.text.primary,
  },
  linkButton: {
    paddingVertical: 10,
  },
  linkText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.accent,
  },
});
