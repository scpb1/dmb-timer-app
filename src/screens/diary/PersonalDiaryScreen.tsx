import { useEffect, useState } from 'react';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';

import { DiaryEditor } from '@/components/diary/DiaryEditor';
import { DiaryLockScreen } from '@/screens/diary/DiaryLockScreen';
import { isDiaryLockEnabled } from '@/services/diaryLock';
import type { DiaryStackParamList } from '@/types/navigation';

interface PersonalDiaryScreenProps {
  navigation: StackNavigationProp<DiaryStackParamList, 'PersonalDiary'>;
  route: RouteProp<DiaryStackParamList, 'PersonalDiary'>;
}

export function PersonalDiaryScreen({ navigation, route }: PersonalDiaryScreenProps) {
  const date = route.params?.date ?? format(new Date(), 'yyyy-MM-dd');
  const [lockChecked, setLockChecked] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    void isDiaryLockEnabled().then((enabled) => {
      setNeedsUnlock(enabled);
      setLockChecked(true);
    });
  }, []);

  if (!lockChecked) {
    return null;
  }

  if (needsUnlock && !unlocked) {
    return (
      <DiaryLockScreen
        onUnlock={() => setUnlocked(true)}
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <DiaryEditor
      kind="personal"
      date={date}
      onDateChange={(nextDate) => navigation.setParams({ date: nextDate })}
    />
  );
}
