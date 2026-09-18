import { createStackNavigator } from '@react-navigation/stack';

import { DiaryHomeScreen } from '@/screens/diary/DiaryHomeScreen';
import { LetterDiaryScreen } from '@/screens/diary/LetterDiaryScreen';
import { LetterThemeScreen } from '@/screens/diary/LetterThemeScreen';
import { PersonalDiaryScreen } from '@/screens/diary/PersonalDiaryScreen';
import type { DiaryStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<DiaryStackParamList>();

export function DiaryStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DiaryHome"
      screenOptions={{ headerShown: false, animationEnabled: true }}
    >
      <Stack.Screen name="DiaryHome" component={DiaryHomeScreen} />
      <Stack.Screen name="PersonalDiary" component={PersonalDiaryScreen} />
      <Stack.Screen name="LetterTheme" component={LetterThemeScreen} />
      <Stack.Screen name="LetterEditor" component={LetterDiaryScreen} />
    </Stack.Navigator>
  );
}
