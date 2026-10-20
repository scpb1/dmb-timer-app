import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface ScreenHeaderProps {
  title: string;
  right?: ReactNode;
}

/** Жирный заголовок вкладки на одном уровне с дневником */
export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    minHeight: 52,
  },
  title: {
    flex: 1,
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 24,
  },
  right: {
    marginLeft: 8,
  },
});
