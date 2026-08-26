import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';

import { SettingsDropdown } from '@/components/common/SettingsDropdown';
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
  const theme = colors.light;

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
});
