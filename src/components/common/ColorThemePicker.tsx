import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLOR_THEMES, useAppTheme, useColorTheme } from '@/theme';
import { typography } from '@/theme/typography';

/** Сетка из 20 цветовых тем: свотч + имя, выбранная с обводкой акцента. */
export function ColorThemePicker() {
  const theme = useAppTheme();
  const { themeId, setColorTheme } = useColorTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {COLOR_THEMES.map((item) => {
          const selected = item.id === themeId;
          return (
            <Pressable
              key={item.id}
              style={styles.cell}
              onPress={() => void setColorTheme(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={item.name}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: item.colors.background.mid,
                    borderColor: selected ? theme.text.accent : item.colors.overlay.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.accentDot, { backgroundColor: item.colors.text.accent }]} />
              </View>
              <Text
                style={[
                  styles.name,
                  { color: selected ? theme.text.primary : theme.text.secondary },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  cell: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  swatch: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 64,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDot: {
    width: 10,
    height: 10,
    borderRadius: 4,
  },
  name: {
    marginTop: 6,
    fontFamily: typography.fontFamily.sans,
    fontSize: 11,
    textAlign: 'center',
  },
});
