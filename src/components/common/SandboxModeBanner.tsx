import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';

/** Полоска, когда открыта тестовая база, а не боевые данные */
export function SandboxModeBanner() {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: `${theme.text.accent}1F`,
          borderColor: `${theme.text.accent}47`,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.text.accent }]}>
        Тестовая база · основная не трогается
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  text: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    textAlign: 'center',
  },
});
