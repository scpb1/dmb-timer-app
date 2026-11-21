import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Feather } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { FEATURES } from '@/constants';
import { LetterBookExportModal } from '@/components/diary/LetterBookExportModal';
import { SandboxModeBanner } from '@/components/common/SandboxModeBanner';
import { TrackerCalendar, type DiaryDayMarks } from '@/components/trackers/TrackerCalendar';
import { useDatabaseProfile } from '@/hooks/useDatabaseProfile';
import { resolveLetterDestination, useDiaryCalendar } from '@/hooks/useDiary';
import { isDiaryLockEnabled } from '@/services/diaryLock';
import { useDiarySessionUnlocked } from '@/services/diarySession';
import { colors, useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { DiaryStackParamList } from '@/types/navigation';

interface DiaryHomeScreenProps {
  navigation: StackNavigationProp<DiaryStackParamList, 'DiaryHome'>;
}

function todayStamp(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function stampFromDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Выбор между личным дневником и письмами */
export function DiaryHomeScreen({ navigation }: DiaryHomeScreenProps) {
  const theme = useAppTheme();
  const [bookVisible, setBookVisible] = useState(false);
  const [lockEnabled, setLockEnabled] = useState<boolean | null>(null);
  const { marks: kindMarks } = useDiaryCalendar();
  const sessionUnlocked = useDiarySessionUnlocked();
  const databaseProfile = useDatabaseProfile();
  const personalVisible = lockEnabled === false || (lockEnabled === true && sessionUnlocked);

  useFocusEffect(
    useCallback(() => {
      void isDiaryLockEnabled()
        .then(setLockEnabled)
        .catch(() => setLockEnabled(false));
    }, []),
  );

  const openPersonal = (date = todayStamp()) => {
    navigation.navigate('PersonalDiary', { date });
  };

  const openLetters = async (date = todayStamp()) => {
    const destination = await resolveLetterDestination(date);
    if (destination.screen === 'LetterEditor') {
      navigation.navigate('LetterEditor', { date, themeId: destination.themeId });
      return;
    }

    navigation.navigate('LetterTheme', { date });
  };

  const handleDayPress = (date: Date) => {
    const stamp = stampFromDate(date);
    const label = format(date, 'd MMMM', { locale: ru });
    Alert.alert(label, 'Что открыть в этот день?', [
      { text: 'Личный дневник', onPress: () => openPersonal(stamp) },
      { text: 'Письмо', onPress: () => void openLetters(stamp) },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const visibleMarks = useMemo(() => {
    if (personalVisible) {
      return kindMarks;
    }
    const next: DiaryDayMarks = {};
    for (const [date, mark] of Object.entries(kindMarks)) {
      if (mark.letter) {
        next[date] = { letter: true };
      }
    }
    return next;
  }, [kindMarks, personalVisible]);

  const hasAnyMarks = useMemo(() => Object.keys(visibleMarks).length > 0, [visibleMarks]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader
          title="Дневник"
          right={
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Настройки"
            >
              <Feather name="settings" size={22} color={theme.text.primary} />
            </Pressable>
          }
        />
        {databaseProfile === 'sandbox' ? <SandboxModeBanner /> : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            {personalVisible
              ? 'Точки на календаре — дни с записями. Чёрная: личный дневник, красная: письмо.'
              : 'Красная точка — день с письмом. Даты личного дневника скрыты, пока не введён код.'}
          </Text>

          <TrackerCalendar kindMarks={visibleMarks} onDayPress={handleDayPress} />

          <View style={styles.legend}>
            {personalVisible ? (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendPersonal]} />
                <Text style={styles.legendPersonalText}>Личный дневник</Text>
              </View>
            ) : null}
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendLetter]} />
              <Text style={styles.legendLetterText}>Письмо</Text>
            </View>
            {hasAnyMarks ? null : (
              <Text style={styles.legendHint}>Пока пусто — напиши первую страницу</Text>
            )}
          </View>

          <Pressable
            style={styles.card}
            onPress={() => openPersonal()}
            accessibilityRole="button"
            accessibilityLabel="Личный дневник"
          >
            <View style={styles.iconWrap}>
              <Feather name="book-open" size={26} color={theme.text.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Личный дневник</Text>
              <Text style={styles.cardHint}>Каждый день – новая страница</Text>
            </View>
            <Feather name="chevron-right" size={22} color={theme.text.secondary} />
          </Pressable>

          <Pressable
            style={styles.card}
            onPress={() => void openLetters()}
            accessibilityRole="button"
            accessibilityLabel="Дневник девушки солдата"
          >
            <View style={styles.iconWrap}>
              <Feather name="heart" size={26} color={theme.text.accent} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, styles.cardTitleLetter]}>Дневник девушки солдата</Text>
              <Text style={styles.cardHint}>Письма ему по теме дня</Text>
            </View>
            <Feather name="chevron-right" size={22} color={theme.text.secondary} />
          </Pressable>

          {FEATURES.letterBookHomeEntry ? (
            <Pressable
              style={styles.card}
              onPress={() => setBookVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Книга писем"
            >
              <View style={styles.iconWrap}>
                <Feather name="book" size={26} color={theme.text.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Книга писем</Text>
                <Text style={styles.cardHint}>Собрать PDF для него — три макета на выбор</Text>
              </View>
              <Feather name="chevron-right" size={22} color={theme.text.secondary} />
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <LetterBookExportModal visible={bookVisible} onClose={() => setBookVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  subtitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.light.text.secondary,
    marginTop: 6,
    marginBottom: 16,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
    marginBottom: 22,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendPersonal: {
    backgroundColor: colors.light.text.primary,
  },
  legendLetter: {
    backgroundColor: colors.light.text.accent,
  },
  legendPersonalText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.primary,
  },
  legendLetterText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.accent,
  },
  legendHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    marginBottom: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 17,
    color: colors.light.text.primary,
  },
  cardTitleLetter: {
    color: colors.light.text.accent,
  },
  cardHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
    marginTop: 4,
  },
});
