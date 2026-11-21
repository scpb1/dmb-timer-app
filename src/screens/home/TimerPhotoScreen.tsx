import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { FEATURES } from '@/constants';
import { PositionedCoverImage } from '@/components/common/PositionedCoverImage';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { SettingsSlider } from '@/components/common/SettingsSlider';
import { BackgroundFocusEditor } from '@/components/timer/BackgroundFocusEditor';
import { useServiceTimer } from '@/hooks/useServiceTimer';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { HomeStackParamList } from '@/types/navigation';
import { DEFAULT_BACKGROUND_FOCUS } from '@/types/timer';
import { logger } from '@/utils/logger';
import { persistTimerBackground, removeTimerBackground } from '@/utils/timerBackground';

type Props = StackScreenProps<HomeStackParamList, 'TimerPhoto'>;

export function TimerPhotoScreen({ navigation }: Props) {
  const { settings, updateSettings, isLoading } = useServiceTimer({ tick: false });
  const hasPhoto = Boolean(settings.backgroundImageUri);
  const showPhotoUi = hasPhoto || !isLoading;
  const theme = useAppTheme();
  const [isPicking, setIsPicking] = useState(false);
  const [focusEditorOpen, setFocusEditorOpen] = useState(false);
  const [focusEditorSession, setFocusEditorSession] = useState(0);
  const dimShared = useSharedValue(settings.backgroundDim);
  const windowSize = Dimensions.get('window');
  const previewScale = 0.68;
  const previewWidth = Math.round((windowSize.width - 48) * previewScale);
  const previewHeight = Math.round(
    previewWidth * (windowSize.height / Math.max(windowSize.width, 1)),
  );

  useEffect(() => {
    dimShared.value = settings.backgroundDim;
  }, [dimShared, settings.backgroundDim]);

  const previewScrimStyle = useAnimatedStyle(() => ({
    opacity: dimShared.value / 100,
  }));

  const openFocusEditor = () => {
    setFocusEditorSession((session) => session + 1);
    setFocusEditorOpen(true);
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

      setIsPicking(true);
      const savedUri = await persistTimerBackground(sourceUri);

      try {
        await updateSettings({
          backgroundImageUri: savedUri,
          backgroundFocusX: DEFAULT_BACKGROUND_FOCUS,
          backgroundFocusY: DEFAULT_BACKGROUND_FOCUS,
        });
      } catch (error) {
        await removeTimerBackground(savedUri);
        throw error;
      }

      openFocusEditor();

      try {
        await removeTimerBackground(settings.backgroundImageUri);
      } catch (error) {
        logger.error('Не удалось удалить предыдущий фон таймера', error);
      }
    } catch (error) {
      logger.error('Ошибка выбора фона таймера', error);
      Alert.alert('Не удалось установить фото', 'Попробуйте выбрать другое изображение');
    } finally {
      setIsPicking(false);
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
            await updateSettings({
              backgroundImageUri: null,
              backgroundFocusX: DEFAULT_BACKGROUND_FOCUS,
              backgroundFocusY: DEFAULT_BACKGROUND_FOCUS,
            });
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Фото</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.preview,
              {
                width: previewWidth,
                height: previewHeight,
                backgroundColor: theme.overlay.fill,
                borderColor: theme.overlay.border,
              },
            ]}
          >
            {isLoading && !hasPhoto ? (
              <View style={styles.placeholder}>
                <ActivityIndicator color={theme.text.primary} />
              </View>
            ) : hasPhoto ? (
              <>
                <PositionedCoverImage
                  uri={settings.backgroundImageUri!}
                  focusX={settings.backgroundFocusX}
                  focusY={settings.backgroundFocusY}
                  cached
                  style={styles.previewImage}
                />
                <Animated.View style={[styles.previewScrim, previewScrimStyle]} />
              </>
            ) : (
              <View style={styles.placeholder}>
                <Feather name="image" size={30} color={theme.text.secondary} />
                <Text style={[styles.placeholderText, { color: theme.text.secondary }]}>
                  Обычный фон
                </Text>
              </View>
            )}

            {isPicking ? (
              <View style={styles.previewLoader}>
                <ActivityIndicator color="#F2F0EC" />
              </View>
            ) : null}
          </View>

          {!showPhotoUi ? null : !hasPhoto ? (
            <Pressable
              style={[
                styles.button,
                { backgroundColor: theme.overlay.fill, borderColor: theme.overlay.border },
              ]}
              onPress={() => void handlePickBackground()}
              disabled={isPicking}
              accessibilityRole="button"
            >
              <Feather name="image" size={18} color={theme.text.primary} />
              <Text style={[styles.buttonText, { color: theme.text.primary }]}>Выбрать</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.actionRow}>
                <Pressable
                  style={[
                    styles.button,
                    styles.buttonFlex,
                    { backgroundColor: theme.overlay.fill, borderColor: theme.overlay.border },
                  ]}
                  onPress={() => void handlePickBackground()}
                  disabled={isPicking}
                  accessibilityRole="button"
                >
                  <Feather name="image" size={18} color={theme.text.primary} />
                  <Text style={[styles.buttonText, { color: theme.text.primary }]}>Заменить</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.iconButton,
                    { backgroundColor: theme.overlay.fill, borderColor: theme.overlay.border },
                  ]}
                  onPress={handleRemoveBackground}
                  disabled={isPicking}
                  accessibilityRole="button"
                  accessibilityLabel="Удалить фото"
                >
                  <Feather name="trash-2" size={19} color={theme.text.secondary} />
                </Pressable>
              </View>

              <Pressable
                style={[
                  styles.button,
                  { backgroundColor: theme.overlay.fill, borderColor: theme.overlay.border },
                ]}
                onPress={openFocusEditor}
                disabled={isPicking}
                accessibilityRole="button"
                accessibilityLabel="Сдвинуть кадр фото"
              >
                <Feather name="move" size={18} color={theme.text.primary} />
                <Text style={[styles.buttonText, { color: theme.text.primary }]}>
                  Сдвинуть кадр
                </Text>
              </Pressable>

              <View style={styles.slider}>
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
              </View>

              {FEATURES.showPhotoElementBorderSwitches ? (
                <>
                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: theme.text.primary }]}>
                      Окантовка элемента «Событие»
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
                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: theme.text.primary }]}>
                      Окантовка элемента «Таймер»
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
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <BackgroundFocusEditor
        key={focusEditorSession}
        visible={focusEditorOpen && Boolean(settings.backgroundImageUri)}
        uri={settings.backgroundImageUri}
        focusX={settings.backgroundFocusX}
        focusY={settings.backgroundFocusY}
        onCancel={() => setFocusEditorOpen(false)}
        onSave={(backgroundFocusX, backgroundFocusY) => {
          setFocusEditorOpen(false);
          if (
            backgroundFocusX !== settings.backgroundFocusX ||
            backgroundFocusY !== settings.backgroundFocusY
          ) {
            void updateSettings({ backgroundFocusX, backgroundFocusY });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
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
    alignItems: 'center',
  },
  preview: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 10, 1)',
  },
  placeholder: {
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
  actionRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    alignSelf: 'stretch',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
  buttonFlex: {
    flex: 1,
    alignSelf: 'auto',
    marginBottom: 0,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
  },
  buttonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
  },
  slider: {
    alignSelf: 'stretch',
  },
  switchRow: {
    alignSelf: 'stretch',
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
});
