import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { getDiaryEntry } from '@/services/database';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { DiaryStackParamList } from '@/types/navigation';

interface DiaryHomeScreenProps {
  navigation: StackNavigationProp<DiaryStackParamList, 'DiaryHome'>;
}

function todayStamp(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Выбор между личным дневником и письмами */
export function DiaryHomeScreen({ navigation }: DiaryHomeScreenProps) {
  const openPersonal = () => {
    navigation.navigate('PersonalDiary', { date: todayStamp() });
  };

  const openLetters = async () => {
    const date = todayStamp();
    const existing = await getDiaryEntry('letter', date);
    if (existing?.themeId) {
      navigation.navigate('LetterEditor', { date, themeId: existing.themeId });
      return;
    }

    navigation.navigate('LetterTheme', { date });
  };

  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>Дневник</Text>
        <Text style={styles.subtitle}>Выбери, куда писать сегодня</Text>

        <Pressable
          style={styles.card}
          onPress={openPersonal}
          accessibilityRole="button"
          accessibilityLabel="Личный дневник"
        >
          <View style={styles.iconWrap}>
            <Feather name="book-open" size={26} color={colors.light.text.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Личный дневник</Text>
            <Text style={styles.cardHint}>Каждый день – новая страница</Text>
          </View>
          <Feather name="chevron-right" size={22} color={colors.light.text.secondary} />
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => void openLetters()}
          accessibilityRole="button"
          accessibilityLabel="Дневник девушки солдата"
        >
          <View style={styles.iconWrap}>
            <Feather name="heart" size={26} color={colors.light.text.accent} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Дневник девушки солдата</Text>
            <Text style={styles.cardHint}>Письма ему по теме дня</Text>
          </View>
          <Feather name="chevron-right" size={22} color={colors.light.text.secondary} />
        </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 96,
  },
  title: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 24,
    color: colors.light.text.primary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.secondary,
    marginTop: 6,
    marginBottom: 28,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    marginBottom: 14,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
  cardHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    color: colors.light.text.secondary,
    marginTop: 4,
  },
});
