import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';

import { DiaryEditor } from '@/components/diary/DiaryEditor';
import type { DiaryStackParamList } from '@/types/navigation';

interface PersonalDiaryScreenProps {
  navigation: StackNavigationProp<DiaryStackParamList, 'PersonalDiary'>;
  route: RouteProp<DiaryStackParamList, 'PersonalDiary'>;
}

export function PersonalDiaryScreen({ navigation, route }: PersonalDiaryScreenProps) {
  const date = route.params?.date ?? format(new Date(), 'yyyy-MM-dd');

  return (
    <DiaryEditor
      kind="personal"
      date={date}
      onDateChange={(nextDate) => navigation.setParams({ date: nextDate })}
    />
  );
}
