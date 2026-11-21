import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ColorThemePicker } from '@/components/common/ColorThemePicker';
import { ColorThemePreview } from '@/components/common/ColorThemePreview';
import type { HomeStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

type Props = StackScreenProps<HomeStackParamList, 'ColorThemes'>;

export function ColorThemeScreen({ navigation }: Props) {
  const theme = useAppTheme();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <Feather name="chevron-left" size={28} color={theme.text.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Тема приложения</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <ColorThemePreview />
          <ColorThemePicker />
        </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: 20,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
