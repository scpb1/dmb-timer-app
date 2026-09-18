import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { SegmentedCircularProgress } from '@/components/timer/SegmentedCircularProgress';
import { SegmentedLinearProgress } from '@/components/timer/SegmentedLinearProgress';
import { TimerStatCard } from '@/components/timer/TimerStatCard';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { useServiceTimer } from '@/hooks/useServiceTimer';
import type { HomeStackParamList } from '@/types/navigation';
import { DEFAULT_TIMER_SETTINGS } from '@/types/timer';
import { getLinearDisplayValues, getStatCardDisplay } from '@/utils/timerCalculations';
import { resetAllData } from '@/services/database';
import { colors } from '@/theme/colors';
import { logger } from '@/utils/logger';
import { getBackgroundScrimColor } from '@/utils/timerBackground';

type Props = StackScreenProps<HomeStackParamList, 'HomeMain'> & {
  onResetToOnboarding: () => void;
};

export function HomeScreen({ navigation, onResetToOnboarding }: Props) {
  const {
    isLoading,
    settings,
    progress,
    centerDisplay,
    passedBreakdown,
    remainingBreakdown,
    reload,
    updateSettings,
  } = useServiceTimer();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const [showStats, setShowStats] = useState(true);

  const theme = colors.light;
  const statCardMode = settings.statCardMode ?? DEFAULT_TIMER_SETTINGS.statCardMode;
  const hasPhotoBackground = Boolean(settings.backgroundImageUri);
  const foregroundColor = hasPhotoBackground ? '#F2F0EC' : theme.text.primary;

  const handleResetData = () => {
    Alert.alert(
      'Сброс данных',
      'Удалить все сохранённые данные и снова показать онбординг?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData();
              onResetToOnboarding();
            } catch (error) {
              logger.error('Ошибка сброса данных', error);
              Alert.alert('Ошибка', 'Не удалось сбросить данные');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScreenBackground themeMode="light" />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.text.primary} />
        </View>
      </View>
    );
  }

  const filledCount = progress?.filledSegments[settings.progressBarMode] ?? 0;
  const linearDisplay =
    progress && settings.timerType === 'linear'
      ? getLinearDisplayValues(
          settings.progressBarMode,
          progress,
          settings.percentDecimalPlaces,
          settings.centerDisplay,
        )
      : null;

  return (
    <View style={styles.root}>
      {settings.backgroundImageUri ? (
        <>
          <Image
            source={{ uri: settings.backgroundImageUri }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.backgroundScrim,
              { backgroundColor: getBackgroundScrimColor(settings.backgroundDim) },
            ]}
          />
        </>
      ) : (
        <ScreenBackground themeMode="light" />
      )}

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Pressable
              style={styles.iconButton}
              onPress={() => navigation.navigate('TimerSettings')}
              hitSlop={12}
            >
              <MaterialCommunityIcons name="brush" size={26} color={foregroundColor} />
            </Pressable>

            <Pressable
              style={styles.iconButton}
              onPress={() => setShowStats((prev) => !prev)}
              hitSlop={12}
            >
              <MaterialCommunityIcons
                name={showStats ? 'eye' : 'eye-off'}
                size={26}
                color={foregroundColor}
              />
            </Pressable>
          </View>

          <Pressable style={styles.devResetButton} onPress={handleResetData}>
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={hasPhotoBackground ? 'rgba(242, 240, 236, 0.72)' : theme.text.secondary}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {settings.timerType === 'circular' && centerDisplay && progress ? (
            <SegmentedCircularProgress
              mode={settings.progressBarMode}
              filledCount={filledCount}
              primaryValue={centerDisplay.primaryValue}
              secondaryValue={centerDisplay.secondaryValue}
              unitLabel={centerDisplay.unitLabel}
              photoBackground={hasPhotoBackground}
              centerDisplay={settings.centerDisplay}
              onCenterDisplayChange={(nextDisplay) =>
                updateSettings({ centerDisplay: nextDisplay })
              }
            />
          ) : null}

          {settings.timerType === 'linear' && linearDisplay && progress ? (
            <SegmentedLinearProgress
              mode={settings.progressBarMode}
              filledCount={filledCount}
              display={linearDisplay}
              centerDisplay={settings.centerDisplay}
              onCenterDisplayChange={(centerDisplay) => updateSettings({ centerDisplay })}
              photoBackground={hasPhotoBackground}
            />
          ) : null}

          {showStats && passedBreakdown && remainingBreakdown ? (
            <View style={styles.statsRow}>
              <TimerStatCard
                title="ПРОШЛО"
                display={getStatCardDisplay(passedBreakdown, statCardMode)}
                photoBackground={hasPhotoBackground}
              />
              <TimerStatCard
                title="ОСТАЛОСЬ"
                display={getStatCardDisplay(remainingBreakdown, statCardMode)}
                photoBackground={hasPhotoBackground}
              />
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
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    paddingBottom: 96,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devResetButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
