import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { SegmentedCircularProgress } from '@/components/timer/SegmentedCircularProgress';
import { TimerStatCard } from '@/components/timer/TimerStatCard';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { useServiceTimer } from '@/hooks/useServiceTimer';
import type { HomeStackParamList } from '@/types/navigation';
import { resetAllData } from '@/services/database';
import { colors } from '@/theme/colors';
import { logger } from '@/utils/logger';

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
  } = useServiceTimer();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const [showStats, setShowStats] = useState(true);

  const theme = colors.light;

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

  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />

      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Pressable
              style={styles.iconButton}
              onPress={() => navigation.navigate('TimerSettings')}
              hitSlop={12}
            >
              <MaterialCommunityIcons name="brush" size={26} color={theme.text.primary} />
            </Pressable>

            <Pressable
              style={styles.iconButton}
              onPress={() => setShowStats((prev) => !prev)}
              hitSlop={12}
            >
              <MaterialCommunityIcons
                name={showStats ? 'eye' : 'eye-off'}
                size={26}
                color={theme.text.primary}
              />
            </Pressable>
          </View>

          <Pressable style={styles.devResetButton} onPress={handleResetData}>
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={theme.text.secondary}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {centerDisplay && progress ? (
            <SegmentedCircularProgress
              mode={settings.progressBarMode}
              filledCount={filledCount}
              primaryValue={centerDisplay.primaryValue}
              secondaryValue={centerDisplay.secondaryValue}
              unitLabel={centerDisplay.unitLabel}
            />
          ) : null}

          {showStats && passedBreakdown && remainingBreakdown ? (
            <View style={styles.statsRow}>
              <TimerStatCard title="ПРОШЛО" breakdown={passedBreakdown} />
              <TimerStatCard title="ОСТАЛОСЬ" breakdown={remainingBreakdown} />
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
