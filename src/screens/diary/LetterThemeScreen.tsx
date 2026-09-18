import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { AnimatedButton } from '@/components/common/AnimatedButton';
import { pickPreferredTheme, pickRandomTheme, useLetterThemes } from '@/hooks/useDiary';
import { getDiaryEntry } from '@/services/database';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { DIARY_READY_BUTTON_DELAY_MS, DIARY_THEME_REVEAL_MS } from '@/types/diary';
import type { LetterTheme } from '@/types/diary';
import type { DiaryStackParamList } from '@/types/navigation';

interface LetterThemeScreenProps {
  navigation: StackNavigationProp<DiaryStackParamList, 'LetterTheme'>;
  route: RouteProp<DiaryStackParamList, 'LetterTheme'>;
}

export function LetterThemeScreen({ navigation, route }: LetterThemeScreenProps) {
  const date = route.params?.date ?? format(new Date(), 'yyyy-MM-dd');
  const { isLoading, unusedThemes, reload } = useLetterThemes(date);
  const [theme, setTheme] = useState<LetterTheme | null>(null);
  const [revealed, setRevealed] = useState('');
  const [readyVisible, setReadyVisible] = useState(false);
  const [runId, setRunId] = useState(0);
  const [hasExisting, setHasExisting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void reload();
  }, [reload, date]);

  useEffect(() => {
    let active = true;
    getDiaryEntry('letter', date).then((entry) => {
      if (active) {
        setHasExisting(Boolean(entry?.themeId));
      }
    });
    return () => {
      active = false;
    };
  }, [date]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setTheme((current) => {
      if (current && unusedThemes.some((item) => item.id === current.id)) {
        return current;
      }
      return pickPreferredTheme(unusedThemes) ?? current;
    });
  }, [isLoading, unusedThemes]);

  const characters = useMemo(() => Array.from(theme?.title ?? ''), [theme?.title]);

  useEffect(() => {
    if (!theme) {
      setRevealed('');
      setReadyVisible(false);
      return;
    }

    setRevealed('');
    setReadyVisible(false);

    const readyTimer = setTimeout(() => setReadyVisible(true), DIARY_READY_BUTTON_DELAY_MS);
    const step = Math.max(18, DIARY_THEME_REVEAL_MS / Math.max(characters.length, 1));
    let index = 0;

    intervalRef.current = setInterval(() => {
      index += 1;
      setRevealed(characters.slice(0, index).join(''));
      if (index >= characters.length && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, step);

    return () => {
      clearTimeout(readyTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [theme, runId, characters]);

  const rerollTheme = () => {
    const next = pickRandomTheme(unusedThemes, theme?.id);
    if (next) {
      setTheme(next);
    }
    setRunId((value) => value + 1);
  };

  const openEditor = (themeId: string) => {
    navigation.replace('LetterEditor', {
      date,
      themeId,
      startFresh: true,
    });
  };

  const openExisting = async () => {
    const existing = await getDiaryEntry('letter', date);
    if (existing?.themeId) {
      navigation.replace('LetterEditor', { date, themeId: existing.themeId });
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <Feather name="chevron-left" size={26} color={colors.light.text.primary} />
          </Pressable>
          {unusedThemes.length > 0 ? (
            <Pressable
              onPress={rerollTheme}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Другая тема"
            >
              <Feather name="shuffle" size={20} color={colors.light.text.primary} />
            </Pressable>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.light.text.primary} />
          </View>
        ) : unusedThemes.length === 0 && !theme ? (
          <View style={styles.center}>
            <Text style={styles.heading}>Ты уже написала письма по всем темам</Text>
            {hasExisting ? (
              <AnimatedButton label="Открыть сегодняшнее письмо" onPress={() => void openExisting()} />
            ) : (
              <Text style={styles.emptyHint}>Можно открыть прошлые письма через дату в дневнике.</Text>
            )}
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={styles.heading}>Твоя тема на сегодня:</Text>
            <Text style={styles.themeText}>«{revealed}»</Text>

            {readyVisible && theme ? (
              <Animated.View entering={FadeIn.duration(500)} style={styles.readyWrap}>
                <AnimatedButton label="Я готова" onPress={() => openEditor(theme.id)} />
              </Animated.View>
            ) : (
              <View style={styles.readyPlaceholder} />
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  heading: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 22,
    color: colors.light.text.primary,
    textAlign: 'center',
    marginBottom: 18,
  },
  themeText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.light.text.primary,
    textAlign: 'center',
    minHeight: 72,
  },
  readyWrap: {
    width: '100%',
    marginTop: 28,
  },
  readyPlaceholder: {
    height: 76,
    marginTop: 28,
  },
  emptyHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    color: colors.light.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
});
