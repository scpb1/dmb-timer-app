import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';

import { SettingsDropdown } from '@/components/common/SettingsDropdown';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import type { HomeStackParamList } from '@/types/navigation';
import {
  PROGRESS_BAR_MODE_LABELS,
  TIMER_TYPE_LABELS,
  type ProgressBarMode,
  type TimerType,
} from '@/types/timer';
import { useServiceTimer } from '@/hooks/useServiceTimer';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

type Props = StackScreenProps<HomeStackParamList, 'TimerSettings'>;

const TIMER_TYPE_OPTIONS = (Object.entries(TIMER_TYPE_LABELS) as [TimerType, string][]).map(
  ([value, label]) => ({ value, label }),
);

const PROGRESS_MODE_OPTIONS = (
  Object.entries(PROGRESS_BAR_MODE_LABELS) as [ProgressBarMode, string][]
).map(([value, label]) => ({ value, label }));

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((value) => ({
  value,
  label: String(value),
}));

export function TimerSettingsScreen({ navigation }: Props) {
  const { settings, updateSettings } = useServiceTimer();
  const theme = colors.light;

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
            onChange={(timerType) => updateSettings({ timerType })}
          />

          <SettingsDropdown
            label="Режим прогресс-бара"
            value={settings.progressBarMode}
            options={PROGRESS_MODE_OPTIONS}
            onChange={(progressBarMode) => updateSettings({ progressBarMode })}
          />

          {settings.progressBarMode === 'percent' ? (
            <SettingsDropdown
              label="Знаков после запятой"
              value={settings.percentDecimalPlaces}
              options={DECIMAL_OPTIONS}
              onChange={(percentDecimalPlaces) => updateSettings({ percentDecimalPlaces })}
            />
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
