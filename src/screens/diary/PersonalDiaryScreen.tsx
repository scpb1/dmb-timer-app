import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';

import { DiaryEditor } from '@/components/diary/DiaryEditor';
import { DiaryLockScreen } from '@/screens/diary/DiaryLockScreen';
import { isDiaryLockEnabled } from '@/services/diaryLock';
import {
  touchDiarySession,
  unlockDiarySession,
  useDiarySessionUnlocked,
} from '@/services/diarySession';
import type { DiaryStackParamList } from '@/types/navigation';

interface PersonalDiaryScreenProps {
  navigation: StackNavigationProp<DiaryStackParamList, 'PersonalDiary'>;
  route: RouteProp<DiaryStackParamList, 'PersonalDiary'>;
}

export function PersonalDiaryScreen({ navigation, route }: PersonalDiaryScreenProps) {
  const date = route.params?.date ?? format(new Date(), 'yyyy-MM-dd');
  const [lockChecked, setLockChecked] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const sessionUnlocked = useDiarySessionUnlocked();

  useEffect(() => {
    void isDiaryLockEnabled().then((enabled) => {
      setNeedsUnlock(enabled);
      setLockChecked(true);
    });
  }, []);

  if (!lockChecked) {
    return null;
  }

  if (needsUnlock && !sessionUnlocked) {
    return (
      <DiaryLockScreen
        onUnlock={() => unlockDiarySession()}
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <View
      style={styles.editor}
      onStartShouldSetResponderCapture={() => {
        touchDiarySession();
        return false;
      }}
    >
      <DiaryEditor
        kind="personal"
        date={date}
        onDateChange={(nextDate) => navigation.setParams({ date: nextDate })}
      />
    </View>
  );
}

const styles = {
  editor: {
    flex: 1,
  },
} as const;
