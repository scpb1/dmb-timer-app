import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <View style={styles.root}>
      <ScreenBackground themeMode="light" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>{title}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 96,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 24,
    color: colors.light.text.primary,
    textAlign: 'center',
  },
});
