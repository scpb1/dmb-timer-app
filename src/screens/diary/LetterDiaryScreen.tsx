import { Alert, Pressable, StyleSheet } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';

import { DiaryEditor } from '@/components/diary/DiaryEditor';
import { useLetterThemes } from '@/hooks/useDiary';
import { getDiaryEntry } from '@/services/database';
import { colors } from '@/theme/colors';
import type { DiaryStackParamList } from '@/types/navigation';

interface LetterDiaryScreenProps {
  navigation: StackNavigationProp<DiaryStackParamList, 'LetterEditor'>;
  route: RouteProp<DiaryStackParamList, 'LetterEditor'>;
}

export function LetterDiaryScreen({ navigation, route }: LetterDiaryScreenProps) {
  const { date, themeId, startFresh } = route.params;
  const { resolveTitle } = useLetterThemes(date);
  const themeTitle = resolveTitle(themeId);

  const changeTheme = () => {
    Alert.alert('Точно поменять?', 'Ваши изменения не сохранятся.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Поменять',
        style: 'destructive',
        onPress: () => navigation.replace('LetterTheme', { date }),
      },
    ]);
  };

  const handleDateChange = async (nextDate: string) => {
    if (nextDate === date) {
      return;
    }

    const existing = await getDiaryEntry('letter', nextDate);
    if (existing?.themeId) {
      navigation.replace('LetterEditor', { date: nextDate, themeId: existing.themeId });
      return;
    }

    navigation.replace('LetterTheme', { date: nextDate });
  };

  return (
    <DiaryEditor
      kind="letter"
      date={date}
      themeId={themeId}
      themeTitle={themeTitle}
      startFresh={startFresh}
      onDateChange={(nextDate) => void handleDateChange(nextDate)}
      extraHeaderAction={
        <Pressable
          onPress={changeTheme}
          style={styles.shuffle}
          accessibilityRole="button"
          accessibilityLabel="Поменять тему"
        >
          <Feather name="shuffle" size={18} color={colors.light.text.primary} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  shuffle: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
  },
});
