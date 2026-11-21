import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';

/** Падение вкладки возвращает её к начальному экрану и не перезапускает всё приложение. */
export function TabErrorBoundary({ children }: { children: ReactNode }) {
  const [generation, setGeneration] = useState(0);

  return (
    <AppErrorBoundary actionLabel="Назад" onReset={() => setGeneration((value) => value + 1)}>
      <View key={generation} style={styles.fill}>
        {children}
      </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
