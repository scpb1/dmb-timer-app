import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { addDays, startOfDay } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

import { APP_NAME, FEATURES } from '@/constants';
import { SettingsDropdown } from '@/components/common/SettingsDropdown';
import { SettingsSlider } from '@/components/common/SettingsSlider';
import { SettingsField } from '@/components/common/SettingsField';
import { DatePicker } from '@/components/common/DatePicker';
import { ServiceDurationPresets } from '@/components/common/ServiceDurationPresets';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import type { HomeStackParamList } from '@/types/navigation';
import {
  DEFAULT_TIMER_SETTINGS,
  DOT_GRID_CELL_SHAPE_LABELS,
  STAT_CARD_MODE_LABELS,
  TIMER_TYPE_LABELS,
  TIMER_UPCOMING_PREVIEW_LABELS,
  getProgressBarModeOptions,
  MILESTONES_LAYOUT_LABELS,
  normalizeProgressBarMode,
  timerTypeUsesProgressBarModes,
  type DotGridCellShape,
  type MilestonesLayout,
  type StatCardMode,
  type TimerType,
  type TimerUpcomingPreviewMode,
} from '@/types/timer';
import { useServiceTimer } from '@/hooks/useServiceTimer';
import { useTimerUpcoming } from '@/hooks/useTimerUpcoming';
import type { TimerUpcomingRef } from '@/utils/timerUpcoming';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import { persistTimerBackground, removeTimerBackground } from '@/utils/timerBackground';
import { logger } from '@/utils/logger';
import { useProfile } from '@/hooks/useProfile';
import { isAndroidWidgetAvailable } from '@/utils/nativeAvailability';

type Props = StackScreenProps<HomeStackParamList, 'TimerSettings'>;

const TIMER_TYPE_OPTIONS = (Object.entries(TIMER_TYPE_LABELS) as [TimerType, string][]).map(
  ([value, label]) => ({ value, label }),
);

const UPCOMING_PREVIEW_OPTIONS = (
  Object.entries(TIMER_UPCOMING_PREVIEW_LABELS) as [TimerUpcomingPreviewMode, string][]
).map(([value, label]) => ({ value, label }));

const STAT_CARD_MODE_OPTIONS = (
  Object.entries(STAT_CARD_MODE_LABELS) as [StatCardMode, string][]
).map(([value, label]) => ({ value, label }));

const DOT_GRID_CELL_SHAPE_OPTIONS = (
  Object.entries(DOT_GRID_CELL_SHAPE_LABELS) as [DotGridCellShape, string][]
).map(([value, label]) => ({ value, label }));

const MILESTONES_LAYOUT_OPTIONS = (
  Object.entries(MILESTONES_LAYOUT_LABELS) as [MilestonesLayout, string][]
).map(([value, label]) => ({ value, label }));

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((value) => ({
  value,
  label: String(value),
}));

export function TimerSettingsScreen({ navigation }: Props) {
  const { settings, updateSettings } = useServiceTimer();
  const timerUpcoming = useTimerUpcoming(settings);
  const profile = useProfile();
  const [isPickingBackground, setIsPickingBackground] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [enlistmentDate, setEnlistmentDate] = useState<Date | null>(null);
  const [demobilizationDate, setDemobilizationDate] = useState<Date | null>(null);
  const dimShared = useSharedValue(settings.backgroundDim);
  const theme = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      void profile.reload();
      void timerUpcoming.reload();
    }, [profile.reload, timerUpcoming.reload]),
  );

  useEffect(() => {
    setUserName(profile.userName);
    setPartnerName(profile.partnerName);
    setEnlistmentDate(profile.enlistmentDate);
    setDemobilizationDate(profile.demobilizationDate);
  }, [profile.userName, profile.partnerName, profile.enlistmentDate, profile.demobilizationDate]);

  useEffect(() => {
    dimShared.value = settings.backgroundDim;
  }, [dimShared, settings.backgroundDim]);

  const previewScrimStyle = useAnimatedStyle(() => ({
    opacity: dimShared.value / 100,
  }));

  const statCardMode = settings.statCardMode ?? DEFAULT_TIMER_SETTINGS.statCardMode;
  const isFrameTimer = settings.timerType === 'frame';
  const isDotGridTimer = settings.timerType === 'dotGrid';
  const isMilestonesTimer = settings.timerType === 'milestones';
  const progressModeOptions = getProgressBarModeOptions(settings.timerType);
  const safeProgressBarMode = normalizeProgressBarMode(
    settings.timerType,
    settings.progressBarMode,
  );
  const pinnedRef =
    settings.timerUpcomingPinnedRef ??
    timerUpcoming.pinOptions[0]?.value ??
    ('event:predefined-enlistment' as TimerUpcomingRef);

  const handleTimerTypeChange = (timerType: TimerType) => {
    const nextMode =
      timerType === 'dotGrid' && settings.progressBarMode === 'percent'
        ? 'days'
        : settings.progressBarMode;
    updateSettings({
      timerType,
      progressBarMode: normalizeProgressBarMode(timerType, nextMode),
    });
  };

  const handleSaveNames = async () => {
    const ok = await profile.saveNames(userName, partnerName);
    Alert.alert(ok ? 'Сохранено' : 'Ошибка', ok ? 'Имена обновлены' : 'Введите оба имени');
  };

  const handleSaveDates = async () => {
    if (!enlistmentDate || !demobilizationDate) {
      Alert.alert('Укажите обе даты');
      return;
    }
    const error = await profile.saveDates(enlistmentDate, demobilizationDate);
    Alert.alert(error ? 'Ошибка' : 'Сохранено', error ?? 'Даты службы обновлены');
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
      <ScreenBackground />

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <Feather name="chevron-left" size={28} color={theme.text.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Настройки таймера
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={[
              styles.themeLink,
              {
                backgroundColor: theme.overlay.fill,
                borderColor: theme.overlay.border,
              },
            ]}
            onPress={() => navigation.navigate('ColorThemes')}
            accessibilityRole="button"
            accessibilityLabel="Сменить тему приложения"
          >
            <View style={styles.themeLinkText}>
              <Text style={[styles.themeLinkTitle, { color: theme.text.primary }]}>
                Сменить тему
              </Text>
              <Text style={[styles.themeLinkHint, { color: theme.text.secondary }]}>
                Фон, плашки и текст
              </Text>
            </View>
            <Feather name="chevron-right" size={22} color={theme.text.secondary} />
          </Pressable>

          <Text style={[styles.sectionLabel, styles.sectionSpacer, { color: theme.text.secondary }]}>
            Имена
          </Text>
          <SettingsField label="Ваше имя" value={userName} onChangeText={setUserName} />
          <View style={styles.fieldGap} />
          <SettingsField
            label="Имя любимого"
            value={partnerName}
            onChangeText={setPartnerName}
          />
          <Pressable
            style={[styles.saveButton, { backgroundColor: theme.text.primary }]}
            onPress={() => void handleSaveNames()}
          >
            <Text style={[styles.saveButtonText, { color: theme.text.inverse }]}>
              Сохранить имена
            </Text>
          </Pressable>

          <Text style={[styles.sectionLabel, styles.sectionSpacer, { color: theme.text.secondary }]}>
            Даты службы
          </Text>
          <DatePicker
            label="Дата призыва"
            value={enlistmentDate}
            onChange={setEnlistmentDate}
          />
          <View style={styles.fieldGap} />
          <DatePicker
            label="Дата дембеля"
            value={demobilizationDate}
            onChange={setDemobilizationDate}
            minimumDate={enlistmentDate ?? undefined}
          />
          <ServiceDurationPresets
            onSelect={(days) => {
              if (!enlistmentDate) {
                Alert.alert('Сначала дата призыва');
                return;
              }
              setDemobilizationDate(addDays(startOfDay(enlistmentDate), days));
            }}
          />
          <Pressable
            style={[styles.saveButton, { backgroundColor: theme.text.primary }]}
            onPress={() => void handleSaveDates()}
          >
            <Text style={[styles.saveButtonText, { color: theme.text.inverse }]}>
              Сохранить даты
            </Text>
          </Pressable>

          <View style={styles.backgroundSection}>
            <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Фото на фоне</Text>

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
                  <Text style={[styles.placeholderText, { color: theme.text.secondary }]}>
                    Обычный фон
                  </Text>
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
                <Text style={[styles.photoButtonText, { color: theme.text.primary }]}>
                  {settings.backgroundImageUri ? 'Заменить фото' : 'Выбрать фото'}
                </Text>
              </Pressable>

              {settings.backgroundImageUri ? (
                <Pressable
                  style={styles.removePhotoButton}
                  onPress={handleRemoveBackground}
                  disabled={isPickingBackground}
                  accessibilityRole="button"
                  accessibilityLabel="Убрать фото с фона"
                >
                  <Feather name="trash-2" size={19} color={theme.text.accent} />
                </Pressable>
              ) : null}
            </View>

            {settings.backgroundImageUri ? (
              <>
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

                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: theme.text.primary }]}>
                    Окантовка плашек «прошло / осталось»
                  </Text>
                  <Switch
                    value={settings.photoStatCardBorder}
                    onValueChange={(photoStatCardBorder) =>
                      void updateSettings({ photoStatCardBorder })
                    }
                    trackColor={{
                      false: 'rgba(167, 154, 138, 0.35)',
                      true: theme.text.accent,
                    }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: theme.text.primary }]}>
                    Окантовка карточки события
                  </Text>
                  <Switch
                    value={settings.photoUpcomingCardBorder}
                    onValueChange={(photoUpcomingCardBorder) =>
                      void updateSettings({ photoUpcomingCardBorder })
                    }
                    trackColor={{
                      false: 'rgba(167, 154, 138, 0.35)',
                      true: theme.text.accent,
                    }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            ) : null}

            <Text style={[styles.backgroundHint, { color: theme.text.secondary }]}>
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

          {!isFrameTimer && timerTypeUsesProgressBarModes(settings.timerType) ? (
            <>
              <SettingsDropdown
                label={settings.timerType === 'dotGrid' ? 'Сетка: единица' : 'Режим прогресс-бара'}
                value={safeProgressBarMode}
                options={progressModeOptions}
                onChange={(progressBarMode) => updateSettings({ progressBarMode })}
              />

              {safeProgressBarMode === 'percent' || isDotGridTimer ? (
                <SettingsDropdown
                  label="Знаков после запятой"
                  value={settings.percentDecimalPlaces}
                  options={DECIMAL_OPTIONS}
                  onChange={(percentDecimalPlaces) => updateSettings({ percentDecimalPlaces })}
                />
              ) : null}
            </>
          ) : null}

          {isDotGridTimer ? (
            <SettingsDropdown
              label="Сетка: форма"
              value={settings.dotGridCellShape}
              options={DOT_GRID_CELL_SHAPE_OPTIONS}
              onChange={(dotGridCellShape) => updateSettings({ dotGridCellShape })}
            />
          ) : null}

          {isMilestonesTimer ? (
            <SettingsDropdown
              label="Вид ленты событий"
              value={settings.milestonesLayout}
              options={MILESTONES_LAYOUT_OPTIONS}
              onChange={(milestonesLayout) => updateSettings({ milestonesLayout })}
            />
          ) : null}

          {!isFrameTimer && !isDotGridTimer ? (
            <SettingsDropdown
              label="Режим плашек"
              value={statCardMode}
              options={STAT_CARD_MODE_OPTIONS}
              onChange={(statCardMode) => updateSettings({ statCardMode })}
            />
          ) : null}

          <SettingsDropdown
            label="Событие на таймере"
            value={settings.timerUpcomingPreview}
            options={UPCOMING_PREVIEW_OPTIONS}
            onChange={(timerUpcomingPreview) => {
              if (timerUpcomingPreview === 'pinned' && !settings.timerUpcomingPinnedRef) {
                const first = timerUpcoming.pinOptions[0]?.value;
                void updateSettings({
                  timerUpcomingPreview,
                  timerUpcomingPinnedRef: first ?? null,
                });
                return;
              }
              void updateSettings({ timerUpcomingPreview });
            }}
          />

          {settings.timerUpcomingPreview === 'pinned' && timerUpcoming.pinOptions.length > 0 ? (
            <SettingsDropdown
              label="Закрепить"
              value={pinnedRef}
              options={timerUpcoming.pinOptions}
              onChange={(timerUpcomingPinnedRef) =>
                void updateSettings({ timerUpcomingPinnedRef })
              }
            />
          ) : null}

          {FEATURES.widgets ? (
            <View style={styles.widgetCard}>
              <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
                Виджет на рабочий стол
              </Text>
              {Platform.OS === 'android' && isAndroidWidgetAvailable() ? (
                <Text style={[styles.widgetText, { color: theme.text.primary }]}>
                  {`Долгое нажатие на пустое место рабочего стола → «Виджеты» → найдите «${APP_NAME}» → перетащите на экран. Он показывает дни до дембеля, призыва или конца выбранного срока.`}
                </Text>
              ) : Platform.OS === 'android' ? (
                <Text style={[styles.widgetText, { color: theme.text.primary }]}>
                  {`Виджет появится после сборки приложения с нативным модулем. Добавляется так: долгое нажатие на рабочий стол → «Виджеты» → «${APP_NAME}».`}
                </Text>
              ) : (
                <Text style={[styles.widgetText, { color: theme.text.primary }]}>
                  {`Виджет для iPhone пока недоступен. На Android: долгое нажатие на рабочий стол → «Виджеты» → «${APP_NAME}».`}
                </Text>
              )}
            </View>
          ) : null}
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
    marginBottom: 8,
  },
  backgroundPreview: {
    width: '100%',
    height: 180,
    borderRadius: 4,
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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  photoButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
  },
  removePhotoButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  backgroundHint: {
    marginTop: 8,
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  switchLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    lineHeight: 20,
  },
  fieldGap: {
    height: 10,
  },
  themeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  themeLinkText: {
    flex: 1,
    paddingRight: 8,
  },
  themeLinkTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
  },
  themeLinkHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    marginTop: 2,
  },
  sectionSpacer: {
    marginTop: 22,
  },
  saveButton: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 4,
    paddingVertical: 13,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
  },
  widgetCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  widgetText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
});
