import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { SettingsDropdown } from '@/components/common/SettingsDropdown';
import { SettingsSlider } from '@/components/common/SettingsSlider';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import type { HomeStackParamList } from '@/types/navigation';
import {
  DEFAULT_TIMER_SETTINGS,
  STAT_CARD_MODE_LABELS,
  TIMER_TYPE_LABELS,
  getProgressBarModeOptions,
  normalizeProgressBarMode,
  type StatCardMode,
  type TimerType,
} from '@/types/timer';
import { useServiceTimer } from '@/hooks/useServiceTimer';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { persistTimerBackground, removeTimerBackground } from '@/utils/timerBackground';
import { logger } from '@/utils/logger';

type Props = StackScreenProps<HomeStackParamList, 'TimerSettings'>;

const TIMER_TYPE_OPTIONS = (Object.entries(TIMER_TYPE_LABELS) as [TimerType, string][]).map(
  ([value, label]) => ({ value, label }),
);

const STAT_CARD_MODE_OPTIONS = (
  Object.entries(STAT_CARD_MODE_LABELS) as [StatCardMode, string][]
).map(([value, label]) => ({ value, label }));

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((value) => ({
  value,
  label: String(value),
}));

export function TimerSettingsScreen({ navigation }: Props) {
  const { settings, updateSettings } = useServiceTimer();
  const [isPickingBackground, setIsPickingBackground] = useState(false);
  const dimShared = useSharedValue(settings.backgroundDim);
  const theme = colors.light;

  useEffect(() => {
    dimShared.value = settings.backgroundDim;
  }, [dimShared, settings.backgroundDim]);

  const previewScrimStyle = useAnimatedStyle(() => ({
    opacity: dimShared.value / 100,
  }));

  const statCardMode = settings.statCardMode ?? DEFAULT_TIMER_SETTINGS.statCardMode;
  const progressModeOptions = getProgressBarModeOptions(settings.timerType);
  const safeProgressBarMode = normalizeProgressBarMode(
    settings.timerType,
    settings.progressBarMode,
  );

  const handleTimerTypeChange = (timerType: TimerType) => {
    updateSettings({
      timerType,
      progressBarMode: normalizeProgressBarMode(timerType, settings.progressBarMode),
    });
  };

  const handlePickBackground = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нет доступа', 'Разрешите доступ к галерее, чтобы выбрать фон');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      const sourceUri = !result.canceled ? result.assets[0]?.uri : null;
      if (!sourceUri) {
        return;
      }

      setIsPickingBackground(true);
      const savedUri = await persistTimerBackground(sourceUri);

      try {
        await updateSettings({ backgroundImageUri: savedUri });
      } catch (error) {
        await removeTimerBackground(savedUri);
        throw error;
      }

      try {
        await removeTimerBackground(settings.backgroundImageUri);
      } catch (error) {
        // Новый фон уже сохранён — ошибка уборки старого файла не должна его откатывать.
        logger.error('Не удалось удалить предыдущий фон таймера', error);
      }
    } catch (error) {
      logger.error('Ошибка выбора фона таймера', error);
      Alert.alert('Не удалось установить фото', 'Попробуйте выбрать другое изображение');
    } finally {
      setIsPickingBackground(false);
    }
  };

  const handleRemoveBackground = () => {
    Alert.alert('Убрать фото?', 'Вернуть обычный фон таймера?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Убрать',
        style: 'destructive',
        onPress: async () => {
          const currentUri = settings.backgroundImageUri;
          try {
            await updateSettings({ backgroundImageUri: null });
            await removeTimerBackground(currentUri);
          } catch (error) {
            logger.error('Ошибка удаления фона таймера', error);
            Alert.alert('Ошибка', 'Не удалось убрать фото');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={28} color={theme.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Настройки таймера</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backgroundSection}>
            <Text style={styles.sectionLabel}>Фото на фоне</Text>

            <View style={styles.backgroundPreview}>
              {settings.backgroundImageUri ? (
                <>
                  <Image
                    source={{ uri: settings.backgroundImageUri }}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                  />
                  <Animated.View style={[styles.previewScrim, previewScrimStyle]} />
                </>
              ) : (
                <View style={styles.backgroundPlaceholder}>
                  <Feather name="image" size={30} color={theme.text.secondary} />
                  <Text style={styles.placeholderText}>Обычный фон</Text>
                </View>
              )}

              {isPickingBackground ? (
                <View style={styles.previewLoader}>
                  <ActivityIndicator color="#F2F0EC" />
                </View>
              ) : null}
            </View>

            <View style={styles.backgroundActions}>
              <Pressable
                style={styles.photoButton}
                onPress={() => void handlePickBackground()}
                disabled={isPickingBackground}
              >
                <Feather name="image" size={18} color={theme.text.primary} />
                <Text style={styles.photoButtonText}>
                  {settings.backgroundImageUri ? 'Заменить фото' : 'Выбрать фото'}
                </Text>
              </Pressable>

              {settings.backgroundImageUri ? (
                <Pressable
                  style={styles.removePhotoButton}
                  onPress={handleRemoveBackground}
                  disabled={isPickingBackground}
                  accessibilityLabel="Убрать фото с фона"
                >
                  <Feather name="trash-2" size={19} color={theme.text.accent} />
                </Pressable>
              ) : null}
            </View>

            {settings.backgroundImageUri ? (
              <SettingsSlider
                label="Затемнение"
                value={settings.backgroundDim}
                min={0}
                max={80}
                sharedValue={dimShared}
                onCommit={(backgroundDim) => {
                  if (backgroundDim !== settings.backgroundDim) {
                    void updateSettings({ backgroundDim });
                  }
                }}
                formatValue={(value) => `${value}%`}
              />
            ) : null}

            <Text style={styles.backgroundHint}>
              {settings.backgroundImageUri
                ? 'Фото заполнит экран. Затемнение можно подкрутить, чтобы текст читался.'
                : 'Фото автоматически заполнит экран. Затемнение можно будет настроить после выбора.'}
            </Text>
          </View>

          <SettingsDropdown
            label="Тип таймера"
            value={settings.timerType}
            options={TIMER_TYPE_OPTIONS}
            onChange={handleTimerTypeChange}
          />

          <SettingsDropdown
            label="Режим прогресс-бара"
            value={safeProgressBarMode}
            options={progressModeOptions}
            onChange={(progressBarMode) => updateSettings({ progressBarMode })}
          />

          {safeProgressBarMode === 'percent' ? (
            <SettingsDropdown
              label="Знаков после запятой"
              value={settings.percentDecimalPlaces}
              options={DECIMAL_OPTIONS}
              onChange={(percentDecimalPlaces) => updateSettings({ percentDecimalPlaces })}
            />
          ) : null}

          <SettingsDropdown
            label="Режим плашек"
            value={statCardMode}
            options={STAT_CARD_MODE_OPTIONS}
            onChange={(statCardMode) => updateSettings({ statCardMode })}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: 20,
    color: colors.light.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  backgroundSection: {
    marginTop: 12,
    marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    color: colors.light.text.secondary,
    marginBottom: 8,
  },
  backgroundPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  previewScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 10, 1)',
  },
  backgroundPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.secondary,
  },
  previewLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  backgroundActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  photoButton: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  photoButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    color: colors.light.text.primary,
  },
  removePhotoButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  backgroundHint: {
    marginTop: 8,
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.light.text.secondary,
  },
});
