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

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SettingsField } from '@/components/common/SettingsField';
import { useDatabaseProfile } from '@/hooks/useDatabaseProfile';
import { reloadAppSession } from '@/appSession';
import {
  reseedSandboxDatabase,
  switchDatabaseProfile,
} from '@/services/database';
import {
  DIARY_PIN_LENGTH,
  DIARY_RECOVERY_ANSWER_MIN_LENGTH,
  getBiometricAvailability,
  getDiaryRecoveryQuestion,
  hasDiaryRecovery,
  isDiaryBiometricsEnabled,
  isDiaryLockEnabled,
  removeDiaryLock,
  setDiaryBiometricsEnabled,
  setDiaryPin,
} from '@/services/diaryLock';
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
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryEnabled, setRecoveryEnabled] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [isSwitchingDatabase, setIsSwitchingDatabase] = useState(false);

  useEffect(() => {
    void Promise.all([
      isDiaryLockEnabled(),
      isDiaryBiometricsEnabled(),
      getBiometricAvailability(),
      hasDiaryRecovery(),
      getDiaryRecoveryQuestion(),
    ]).then(([enabled, bioEnabled, availability, hasRecovery, question]) => {
      setLockEnabled(enabled);
      setBiometricsEnabled(bioEnabled);
      setBiometricsAvailable(availability.hardware && availability.enrolled);
      setRecoveryEnabled(hasRecovery);
      setRecoveryQuestion(question ?? '');
    });
  }, []);

  const handleSavePin = async () => {
    if (pin.length !== DIARY_PIN_LENGTH || pin !== pinRepeat) {
      Alert.alert('Код', 'Введите одинаковый код из 4 цифр');
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
    const ok = await setDiaryPin(
      pin,
      recoveryQuestion.trim() && recoveryAnswer.trim()
        ? { question: recoveryQuestion, answer: recoveryAnswer }
        : undefined,
    );
    if (ok) {
      setLockEnabled(true);
      setRecoveryEnabled(true);
      setPin('');
      setPinRepeat('');
      setRecoveryAnswer('');
      if (biometricsAvailable && !biometricsEnabled) {
        await setDiaryBiometricsEnabled(true);
        setBiometricsEnabled(true);
      }
      Alert.alert('Готово', 'Личный дневник теперь закрыт кодом');
    } else {
      Alert.alert('Ошибка', 'Не удалось сохранить код. Проверьте вопрос и ответ.');
    }
  };

  const handleRemoveLock = () => {
    Alert.alert('Снять защиту?', 'Личный дневник станет открытым', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Снять',
        style: 'destructive',
        onPress: async () => {
          await removeDiaryLock();
          setLockEnabled(false);
          setBiometricsEnabled(false);
        },
      },
    ]);
  };

  const handleBiometricsToggle = async (next: boolean) => {
    if (next && !lockEnabled) {
      Alert.alert('Сначала задайте код', 'Биометрия — дополнительный способ входа');
      return;
    }
    if (next && !biometricsAvailable) {
      Alert.alert('Недоступно', 'На устройстве нет сохранённого отпечатка или лица');
      return;
    }
    await setDiaryBiometricsEnabled(next);
    setBiometricsEnabled(next);
  };

  const handleToggleSandbox = (next: boolean) => {
    Alert.alert(
      next ? 'Открыть тестовую базу?' : 'Вернуться к основной?',
      next
        ? 'Основная база не изменится. Откроется отдельный файл с 365 днями писем, звонками и встречами.'
        : 'Вернёмся к вашим данным. Тестовый файл останется на устройстве.',
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
      'Письма и трекеры в тестовом файле перезапишутся. Основная база не пострадает.',
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
      <ScreenBackground />
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
            <Text style={styles.hint}>
              Код спрашивается при входе в личный дневник.
              {FEATURES.biometrics
                ? ' Если на телефоне есть отпечаток или Face ID, можно открывать им.'
                : ''}{' '}
              Имена и даты службы теперь в настройках таймера на главной.
            </Text>
            <SettingsField
              label={lockEnabled ? 'Новый код' : 'Код из 4 цифр'}
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
            <Pressable style={styles.button} onPress={() => void handleSavePin()}>
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
