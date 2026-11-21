import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLOR_THEME_IDS, COLOR_THEMES, useAppTheme, useColorTheme } from '@/theme';
import type { AppColorTheme } from '@/theme/tokens';
import { typography } from '@/theme/typography';

/** Темы до блока «Палитры»: их показываем. Новые палитры в списке скрыты. */
const VISIBLE_THEME_COUNT = 21;

function ThemeSwatchGrid({
  items,
  themeId,
  onSelect,
}: {
  items: AppColorTheme[];
  themeId: string;
  onSelect: (id: AppColorTheme['id']) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const selected = item.id === themeId;
        return (
          <Pressable
            key={item.id}
            style={styles.cell}
            onPress={() => void onSelect(item.id)}
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
              <View style={[styles.swatchDot, { backgroundColor: item.colors.text.accent }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Сетка тем: однотонный фон и точка акцента. */
export function ColorThemePicker() {
  const theme = useAppTheme();
  const { themeId, setColorTheme } = useColorTheme();

  const byId = new Map(COLOR_THEMES.map((t) => [t.id, t] as const));
  const visibleThemes = COLOR_THEME_IDS.slice(0, VISIBLE_THEME_COUNT)
    .map((id) => byId.get(id))
    .filter((t): t is AppColorTheme => t != null);
  const lightThemes = visibleThemes.filter((item) => item.scheme === 'light');
  const darkThemes = visibleThemes.filter((item) => item.scheme === 'dark');

  return (
    <View style={styles.wrap}>
      <Text style={[styles.groupTitle, { color: theme.text.secondary }]}>Светлые</Text>
      <ThemeSwatchGrid items={lightThemes} themeId={themeId} onSelect={setColorTheme} />

      <Text style={[styles.groupTitle, { color: theme.text.secondary }]}>Тёмные</Text>
      <ThemeSwatchGrid items={darkThemes} themeId={themeId} onSelect={setColorTheme} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
    marginTop: 8,
  },
  groupTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  cell: {
    width: '33.333%',
    alignItems: 'center',
    paddingHorizontal: 3,
    marginBottom: 10,
  },
  swatch: {
    width: '100%',
    aspectRatio: 1.75,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  swatchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
