import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';

import { ColorThemePicker } from '@/components/common/ColorThemePicker';
import { ColorThemePreview } from '@/components/common/ColorThemePreview';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import type { HomeStackParamList } from '@/types/navigation';
import { useAppTheme, useColorTheme } from '@/theme';
import { typography } from '@/theme/typography';

type Props = StackScreenProps<HomeStackParamList, 'ColorThemes'>;

export function ColorThemeScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { theme: activeTheme } = useColorTheme();

  return (
    <View style={styles.root}>
      <ScreenBackground />

      <SafeAreaView style={styles.container} edges={['top']}>
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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.previewLabel, { color: theme.text.secondary }]}>
            Сейчас: {activeTheme.name}
          </Text>
          <ColorThemePreview />

          <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
            Нажмите на палитру — фон и плашки обновятся сразу, в том числе в примере выше.
          </Text>

          <ColorThemePicker />
        </ScrollView>
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
    paddingBottom: 96,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  previewLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    marginBottom: 8,
  },
  sectionHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14,
    marginBottom: 4,
  },
});
