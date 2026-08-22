import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { differenceInCalendarDays, parseISO } from 'date-fns';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { CONFIG_KEYS } from '@/types/config';
import { getConfig, resetAllData } from '@/services/database';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { logger } from '@/utils/logger';

interface HomeScreenProps {
  onResetToOnboarding: () => void;
}

export function HomeScreen({ onResetToOnboarding }: HomeScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [daysPassed, setDaysPassed] = useState(0);
  const [daysLeft, setDaysLeft] = useState(0);

  const theme = colors.light;

  useEffect(() => {
    async function loadProfile() {
      try {
        const [name, partner, passed, left] = await Promise.all([
          getConfig(CONFIG_KEYS.USER_NAME),
          getConfig(CONFIG_KEYS.PARTNER_NAME),
          getConfig(CONFIG_KEYS.DAYS_PASSED),
          getConfig(CONFIG_KEYS.DAYS_LEFT),
        ]);

        setUserName(name ?? '');
        setPartnerName(partner ?? '');

        if (passed && left) {
          setDaysPassed(Number(passed));
          setDaysLeft(Number(left));
        } else {
          const [enlistment, demobilization] = await Promise.all([
            getConfig(CONFIG_KEYS.ENLISTMENT_DATE),
            getConfig(CONFIG_KEYS.DEMOBILIZATION_DATE),
          ]);

          if (enlistment && demobilization) {
            const start = parseISO(enlistment);
            const end = parseISO(demobilization);
            const today = new Date();

            setDaysPassed(Math.max(0, differenceInCalendarDays(today, start)));
            setDaysLeft(Math.max(0, differenceInCalendarDays(end, today)));
          }
        }
      } catch (error) {
        logger.error('Ошибка загрузки профиля на главном экране', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

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
            setIsResetting(true);
            try {
              await resetAllData();
              onResetToOnboarding();
            } catch (error) {
              logger.error('Ошибка сброса данных', error);
              Alert.alert('Ошибка', 'Не удалось сбросить данные');
            } finally {
              setIsResetting(false);
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

  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />

      <SafeAreaView style={styles.container} edges={['top']}>
        <Pressable
          style={styles.devResetButton}
          onPress={handleResetData}
          disabled={isResetting}
        >
          <Text style={styles.devResetText}>
            {isResetting ? '…' : '⟲ сброс (тест)'}
          </Text>
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.greeting}>
            {userName ? `Привет, ${userName}` : 'Привет, дорогая'}
          </Text>

          {partnerName ? (
            <Text style={styles.subtitle}>Ждём {partnerName} домой</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{daysPassed}</Text>
              <Text style={styles.statLabel}>дней прошло</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{daysLeft}</Text>
              <Text style={styles.statLabel}>дней осталось</Text>
            </View>
          </View>

          <Text style={styles.hint}>
            Главный экран с таймером будет реализован в UC-02
          </Text>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 96,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  devResetButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.5)',
  },
  devResetText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 13,
    color: colors.light.text.secondary,
  },
  greeting: {
    fontFamily: typography.fontFamily.primary,
    color: colors.light.text.primary,
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.primary,
    color: colors.light.text.secondary,
    fontSize: 18,
    marginBottom: 32,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  statValue: {
    fontFamily: typography.fontFamily.primary,
    color: colors.light.text.primary,
    fontSize: 32,
  },
  statLabel: {
    fontFamily: typography.fontFamily.primary,
    color: colors.light.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  hint: {
    fontFamily: typography.fontFamily.primary,
    color: colors.light.text.secondary,
    fontSize: 14,
    marginTop: 32,
    textAlign: 'center',
  },
});
