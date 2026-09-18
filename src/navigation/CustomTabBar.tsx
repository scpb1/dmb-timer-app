import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { colors } from '@/theme/colors';
import type { MainTabParamList } from '@/types/navigation';

type TabName = keyof MainTabParamList;

const TAB_CONFIG: Record<TabName, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  Shop: { icon: 'shopping-bag', label: 'Магазин' },
  Events: { icon: 'flag', label: 'События' },
  Home: { icon: 'clock', label: 'Главная' },
  Diary: { icon: 'book', label: 'Дневник' },
  Trackers: { icon: 'calendar', label: 'Трекеры' },
};

const HIDDEN_TAB_ROUTES = new Set(['PersonalDiary', 'LetterTheme', 'LetterEditor']);

/** Нижняя панель: минималистичные иконки + полоска активной вкладки */
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index];
  const nestedName = getFocusedRouteNameFromRoute(currentRoute) ?? currentRoute.name;
  if (HIDDEN_TAB_ROUTES.has(nestedName)) {
    return <View />;
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const tabName = route.name as TabName;
          const config = TAB_CONFIG[tabName];
          const isFocused = state.index === index;
          const isHome = tabName === 'Home';

          const iconColor = isFocused
            ? isHome
              ? colors.light.text.accent
              : colors.light.text.primary
            : colors.light.text.secondary;

          const indicatorColor = isHome ? colors.light.text.accent : colors.light.text.primary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={config.label}
            >
              <Feather name={config.icon} size={22} color={iconColor} />
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: isFocused ? indicatorColor : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: colors.light.background.start,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 154, 138, 0.4)',
    paddingTop: 16,
    paddingBottom: 52,
    marginBottom: -36,
    marginHorizontal: -14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  indicator: {
    width: 26,
    height: 2,
    borderRadius: 1,
  },
});
