import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

interface PlaceholderScreenProps {
  title: string;
  eyebrow?: string;
  message?: string;
}

export function PlaceholderScreen({ title, eyebrow, message }: PlaceholderScreenProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title={title} />
        {eyebrow || message ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.overlay.fill,
                borderColor: theme.overlay.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.overlay.muted,
                },
              ]}
            >
              <Feather name="coffee" size={28} color={theme.text.primary} />
            </View>
            {eyebrow ? (
              <Text style={[styles.eyebrow, { color: theme.text.primary }]}>{eyebrow}</Text>
            ) : null}
            {message ? (
              <Text style={[styles.message, { color: theme.text.secondary }]}>{message}</Text>
            ) : null}
          </View>
        ) : null}
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
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  card: {
    marginTop: 28,
    padding: 24,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 18,
    textAlign: 'center',
  },
  message: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
