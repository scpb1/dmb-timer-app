import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SettingsField } from '@/components/common/SettingsField';
import { useDatabaseProfile } from '@/hooks/useDatabaseProfile';
import { reloadAppSession } from '@/appSession';
import {
  reseedSandboxDatabase,
  switchDatabaseProfile,
} from '@/services/database';
import {
  DIARY_LEGACY_PIN_LENGTH,
  DIARY_LOCK_DISCLOSURE,
  DIARY_PIN_LENGTH,
  DIARY_RECOVERY_ANSWER_MIN_LENGTH,
  authenticateDiaryBiometrics,
  getBiometricAvailability,
  getDiaryPinLength,
  getDiaryRecoveryQuestion,
  hasDiaryRecovery,
  isDiaryBiometricsEnabled,
  isDiaryLockEnabled,
  removeDiaryLock,
  setDiaryBiometricsEnabled,
  setDiaryPin,
  verifyDiaryPin,
} from '@/services/diaryLock';
import { lockDiarySession } from '@/services/diarySession';
import { FEATURES } from '@/constants';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { logger } from '@/utils/logger';
import type { DiaryStackParamList } from '@/types/navigation';

interface SettingsScreenProps {
  navigation: StackNavigationProp<DiaryStackParamList, 'Settings'>;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const databaseProfile = useDatabaseProfile();
  const [pin, setPin] = useState('');
  const [pinRepeat, setPinRepeat] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const [storedPinLength, setStoredPinLength] = useState(DIARY_PIN_LENGTH);
  const [isSaving, setIsSaving] = useState(false);
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryEnabled, setRecoveryEnabled] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockReady, setLockReady] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [isSwitchingDatabase, setIsSwitchingDatabase] = useState(false);

  useEffect(() => {
    void Promise.all([
      isDiaryLockEnabled(),
      isDiaryBiometricsEnabled(),
      getBiometricAvailability(),
      hasDiaryRecovery(),
      getDiaryPinLength(),
    ]).then(([enabled, bioEnabled, availability, hasRecovery, length]) => {
      setLockEnabled(enabled);
      setBiometricsEnabled(bioEnabled);
      setBiometricsAvailable(availability.hardware && availability.enrolled);
      setRecoveryEnabled(hasRecovery);
      setStoredPinLength(length);
      setLockReady(true);
    }).catch(() => {
      setLockEnabled(false);
      setLockReady(true);
    });
  }, []);

  const revealRecoveryQuestion = async () => {
    const question = await getDiaryRecoveryQuestion();
    setRecoveryQuestion(question ?? '');
  };

  const handleConfirmPin = async () => {
    setIsSaving(true);
    const result = await verifyDiaryPin(currentPin);
    setIsSaving(false);
    if (!result.ok || !result.grant) {
      setCurrentPin('');
      Alert.alert(
        'Код',
        result.locked ? 'Слишком много попыток. Подождите и попробуйте снова' : 'Неверный код',
      );
      return;
    }
    setProof(result.grant);
    await revealRecoveryQuestion();
  };

  const handleConfirmBiometrics = async () => {
    const result = await authenticateDiaryBiometrics();
    if (!result.ok || !result.grant) {
      Alert.alert('Биометрия', 'Не удалось подтвердить');
      return;
    }
    setProof(result.grant);
    await revealRecoveryQuestion();
  };

  const handleSavePin = async () => {
    if (pin.length !== DIARY_PIN_LENGTH || pin !== pinRepeat) {
      Alert.alert('Код', `Введите одинаковый код из ${DIARY_PIN_LENGTH} цифр`);
      return;
    }
    if (lockEnabled && !proof) {
      Alert.alert('Код', 'Сначала подтвердите текущий код');
      return;
    }
    if (!recoveryEnabled || recoveryAnswer.trim()) {
      if (
        !recoveryQuestion.trim() ||
        recoveryAnswer.trim().length < DIARY_RECOVERY_ANSWER_MIN_LENGTH
      ) {
        Alert.alert(
          'Кодовое слово',
          `Укажите вопрос и ответ не короче ${DIARY_RECOVERY_ANSWER_MIN_LENGTH} символов`,
        );
        return;
      }
    }
    setIsSaving(true);
    const ok = await setDiaryPin(
      pin,
      recoveryQuestion.trim() && recoveryAnswer.trim()
        ? { question: recoveryQuestion, answer: recoveryAnswer }
        : undefined,
      lockEnabled ? proof ?? undefined : undefined,
      { enableBiometrics: !lockEnabled && biometricsAvailable && !biometricsEnabled },
    );
    setIsSaving(false);
    if (ok) {
      const firstSetup = !lockEnabled;
      setLockEnabled(true);
      setRecoveryEnabled(true);
      setStoredPinLength(DIARY_PIN_LENGTH);
      setPin('');
      setPinRepeat('');
      setCurrentPin('');
      setRecoveryAnswer('');
      setRecoveryQuestion('');
      setProof(null);
      if (firstSetup && biometricsAvailable) {
        setBiometricsEnabled(true);
      }
      Alert.alert('Готово', 'Личный дневник закрыт кодом из 6 цифр');
    } else {
      setProof(null);
      Alert.alert(
        'Ошибка',
        lockEnabled
          ? 'Не удалось сохранить код. Подтвердите текущий код ещё раз'
          : 'Не удалось сохранить код. Проверьте вопрос и ответ',
      );
    }
  };

  const handleRemoveLock = () => {
    if (!proof) {
      Alert.alert('Код', 'Сначала подтвердите текущий код');
      return;
    }
    const grant = proof;
    Alert.alert('Снять защиту?', 'Личный дневник станет открытым', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Снять',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const removed = await removeDiaryLock(grant);
            if (!removed) {
              setProof(null);
              Alert.alert('Код', 'Подтвердите текущий код ещё раз');
              return;
            }
            lockDiarySession();
            setLockEnabled(false);
            setBiometricsEnabled(false);
            setRecoveryEnabled(false);
            setRecoveryQuestion('');
            setProof(null);
            setCurrentPin('');
          })();
        },
      },
    ]);
  };

  const handleBiometricsToggle = async (next: boolean) => {
    if (!lockEnabled) {
      Alert.alert('Сначала задайте код', 'Биометрия — дополнительный способ входа');
      return;
    }
    if (!proof) {
      Alert.alert('Код', 'Сначала подтвердите текущий код');
      return;
    }
    if (next && !biometricsAvailable) {
      Alert.alert('Недоступно', 'На устройстве нет сохранённого отпечатка или лица');
      return;
    }
    const ok = await setDiaryBiometricsEnabled(next, proof);
    setProof(null);
    setRecoveryQuestion('');
    if (!ok) {
      Alert.alert('Код', 'Подтвердите текущий код ещё раз');
      return;
    }
    setBiometricsEnabled(next);
  };

  const handleToggleSandbox = (next: boolean) => {
    Alert.alert(
      next ? 'Открыть тестовую базу?' : 'Вернуться к основной?',
      next
        ? 'Основная база не изменится. Откроется отдельный файл с 365 днями писем, звонками и встречами'
        : 'Вернёмся к вашим данным. Тестовый файл останется на устройстве',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: next ? 'Открыть тестовую' : 'К основной',
          onPress: () => {
            void (async () => {
              setIsSwitchingDatabase(true);
              try {
                await switchDatabaseProfile(next ? 'sandbox' : 'main');
                await reloadAppSession();
              } catch (error) {
                logger.error('Ошибка переключения базы', error);
                setIsSwitchingDatabase(false);
                Alert.alert('Ошибка', 'Не удалось переключить базу');
              }
            })();
          },
        },
      ],
    );
  };

  const handleReseedSandbox = () => {
    Alert.alert(
      'Заполнить тестовую базу заново?',
      'Письма и трекеры в тестовом файле перезапишутся. Основная база не пострадает',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Заполнить',
          onPress: () => {
            void (async () => {
              setIsSwitchingDatabase(true);
              try {
                await reseedSandboxDatabase();
                await reloadAppSession();
              } catch (error) {
                logger.error('Ошибка заполнения тестовой базы', error);
                setIsSwitchingDatabase(false);
                Alert.alert('Ошибка', 'Не удалось заполнить тестовую базу');
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <Feather name="chevron-left" size={26} color={colors.light.text.primary} />
          </Pressable>
          <ScreenHeader title="Настройки" />
        </View>

        {isSwitchingDatabase ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.light.text.primary} />
            {isSwitchingDatabase ? (
              <Text style={styles.switchingHint}>Подождите, переключаем данные…</Text>
            ) : null}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle}>Защита личного дневника</Text>
            <Text style={styles.hint}>{DIARY_LOCK_DISCLOSURE}</Text>
            <Text style={styles.hint}>
              {FEATURES.biometrics
                ? 'Если на телефоне есть отпечаток или Face ID, можно открывать им. '
                : ''}
              Имена и даты службы теперь в настройках таймера на главной. Экран сам закрывается через минуту и когда приложение уходит в фон.
            </Text>

            {!lockReady ? (
              <ActivityIndicator color={colors.light.text.primary} />
            ) : lockEnabled && !proof ? (
              <>
                {storedPinLength === DIARY_LEGACY_PIN_LENGTH ? (
                  <Text style={styles.hint}>
                    Сейчас код из 4 цифр. После подтверждения задайте новый из 6: короткий код перебирается слишком быстро.
                  </Text>
                ) : (
                  <Text style={styles.hint}>
                    Смена кода, вопрос, биометрия и снятие защиты — только после текущего кода.
                  </Text>
                )}
                <SettingsField
                  label={
                    storedPinLength === DIARY_LEGACY_PIN_LENGTH ? 'Текущий код из 4 цифр' : 'Текущий код'
                  }
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  keyboardType="number-pad"
                  maxLength={storedPinLength}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Pressable
                  style={styles.button}
                  onPress={() => void handleConfirmPin()}
                  disabled={isSaving}
                >
                  <Text style={styles.buttonText}>Подтвердить код</Text>
                </Pressable>
                {FEATURES.biometrics && biometricsEnabled ? (
                  <Pressable style={styles.linkButton} onPress={() => void handleConfirmBiometrics()}>
                    <Text style={styles.linkText}>Подтвердить биометрией</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <>
            <SettingsField
              label={lockEnabled ? 'Новый код из 6 цифр' : 'Код из 6 цифр'}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={DIARY_PIN_LENGTH}
              secureTextEntry
              autoCapitalize="none"
            />
            <SettingsField
              label="Повторите код"
              value={pinRepeat}
              onChangeText={setPinRepeat}
              keyboardType="number-pad"
              maxLength={DIARY_PIN_LENGTH}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={styles.sectionTitle}>Восстановление</Text>
            <Text style={styles.hint}>
              Если код забудется, его можно сбросить кодовым вопросом. Лимит — 5 попыток, потом
              пауза 15 минут.
            </Text>
            <SettingsField
              label="Кодовый вопрос"
              value={recoveryQuestion}
              onChangeText={setRecoveryQuestion}
              placeholder="Как звали первого кота?"
            />
            <SettingsField
              label="Кодовый ответ"
              value={recoveryAnswer}
              onChangeText={setRecoveryAnswer}
              placeholder={recoveryEnabled ? 'Оставьте пустым, чтобы не менять' : 'Ответ'}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.button}
              onPress={() => void handleSavePin()}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>{lockEnabled ? 'Сменить код' : 'Включить код'}</Text>
            </Pressable>

            {FEATURES.biometrics ? (
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel}>Вход по биометрии</Text>
                  <Text style={styles.hint}>
                    {biometricsAvailable
                      ? 'На экране кода можно открыть лицом или отпечатком, как на телефоне'
                      : 'На этом устройстве биометрия не настроена'}
                  </Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={(value) => void handleBiometricsToggle(value)}
                  trackColor={{ false: 'rgba(167, 154, 138, 0.35)', true: colors.light.text.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ) : null}

            {lockEnabled ? (
              <Pressable style={styles.linkButton} onPress={handleRemoveLock}>
                <Text style={styles.linkText}>Отключить защиту</Text>
              </Pressable>
            ) : null}
              </>
            )}

            <Text style={styles.sectionTitle}>Данные для проверки</Text>
            <Text style={styles.hint}>
              Основная база — ваши настоящие письма, её этот переключатель не трогает. Тестовая —
              отдельный файл zhdi-sandbox.db: 365 писем с разным цветом и кеглем, звонки, встречи и
              личный дневник. Удобно проверить книгу PDF.
            </Text>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchLabel}>Тестовая база (365 дней)</Text>
                <Text style={styles.hint}>
                  {databaseProfile === 'sandbox'
                    ? 'Сейчас открыт тестовый файл'
                    : 'Сейчас открыта основная база'}
                </Text>
              </View>
              <Switch
                value={databaseProfile === 'sandbox'}
                onValueChange={handleToggleSandbox}
                trackColor={{ false: 'rgba(167, 154, 138, 0.35)', true: colors.light.text.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
            {databaseProfile === 'sandbox' ? (
              <Pressable style={styles.button} onPress={handleReseedSandbox}>
                <Text style={styles.buttonText}>Заполнить тестовую заново</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
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
    paddingBottom: 96,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 52,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 4,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  switchingHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
  },
  content: {
    gap: 14,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    color: colors.light.text.primary,
    marginTop: 12,
  },
  hint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
    lineHeight: 18,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.light.text.primary,
    borderRadius: 4,
    paddingVertical: 13,
  },
  buttonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.background.start,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  switchText: {
    flex: 1,
    gap: 4,
  },
  switchLabel: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: colors.light.text.primary,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.accent,
  },
});
