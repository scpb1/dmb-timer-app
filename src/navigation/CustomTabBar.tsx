import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FEATURES } from '@/constants/features';
import { useAppTheme } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';
import {
  getTimerPhotoBackgroundActive,
  subscribeTimerPhotoBackground,
} from '@/utils/timerBackground';

type TabName = keyof MainTabParamList;

const TAB_CONFIG: Record<TabName, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  Shop: { icon: 'shopping-bag', label: 'Магазин' },
  Events: { icon: 'flag', label: 'События' },
  Home: { icon: 'clock', label: 'Главная' },
  Diary: { icon: 'book', label: 'Дневник' },
  Trackers: { icon: 'calendar', label: 'Трекеры' },
};

const HIDDEN_TAB_ROUTES = new Set([
  'PersonalDiary',
  'LetterTheme',
  'LetterEditor',
  'Settings',
]);

const PHOTO_ICON = '#F2F0EC';
const PHOTO_ICON_MUTED = 'rgba(242, 240, 236, 0.55)';

function isMainTabVisible(tabName: TabName): boolean {
  if (tabName === 'Shop' && !FEATURES.showShopTab) {
    return false;
  }
  if (tabName === 'Trackers' && !FEATURES.showTrackersTab) {
    return false;
  }
  return true;
}

/** Нижняя панель в стиле карточек: светлая полупрозрачная */
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index];
  const nestedName = getFocusedRouteNameFromRoute(currentRoute) ?? currentRoute.name;
  const [hasPhotoBackground, setHasPhotoBackground] = useState(getTimerPhotoBackgroundActive);

  useEffect(() => subscribeTimerPhotoBackground(setHasPhotoBackground), []);

  if (HIDDEN_TAB_ROUTES.has(nestedName)) {
    return <View />;
  }

  const isTimerScreen = currentRoute.name === 'Home' && nestedName !== 'TimerSettings';
  const photoStyle = isTimerScreen && hasPhotoBackground;

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.overlay.fill,
            borderColor: theme.overlay.border,
          },
          photoStyle && styles.barPhoto,
        ]}
      >
        {state.routes.filter((route) => isMainTabVisible(route.name as TabName)).map((route) => {
          const tabName = route.name as TabName;
          const config = TAB_CONFIG[tabName];
          const isFocused = state.routes[state.index].key === route.key;
          const isHome = tabName === 'Home';

          const iconColor = photoStyle
            ? isFocused
              ? PHOTO_ICON
              : PHOTO_ICON_MUTED
            : isFocused
              ? isHome
                ? theme.text.accent
                : theme.text.primary
              : theme.text.secondary;

          const indicatorColor = photoStyle
            ? PHOTO_ICON
            : isHome
              ? theme.text.accent
              : theme.text.primary;

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
    left: 16,
    right: 16,
    bottom: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.28)',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
  },
  barPhoto: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(242, 240, 236, 0.38)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  indicator: {
    width: 26,
    height: 2,
    borderRadius: 1,
  },
});
