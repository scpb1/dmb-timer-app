import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FEATURES } from '@/constants';
import { useAppTheme, useColorTheme } from '@/theme';
import { typography } from '@/theme/typography';
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
  Widgets: { icon: 'smartphone', label: 'Виджеты' },
  Parcels: { icon: 'package', label: 'Посылки' },
  Support: { icon: 'heart', label: 'Опора' },
};

const MORE_ROUTES = new Set<TabName>(['Diary', 'Trackers', 'Widgets', 'Shop', 'Parcels', 'Support']);

const MORE_ITEMS: { name: TabName; title: string; hint: string }[] = [
  {
    name: 'Parcels',
    title: 'Посылки и передачки',
    hint: 'Что ушло и что ещё собираешь',
  },
  {
    name: 'Widgets',
    title: 'Виджеты',
    hint: 'Таймер на рабочем столе',
  },
  {
    name: 'Trackers',
    title: 'Трекеры',
    hint: 'Звонки, встречи и календарь',
  },
  {
    name: 'Diary',
    title: 'Дневник',
    hint: 'Своя страница и письмо ему',
  },
  {
    name: 'Support',
    title: 'Опора',
    hint: 'Когда тяжело и неясно, что делать',
  },
];

const HIDDEN_TAB_ROUTES = new Set([
  'PersonalDiary',
  'LetterTheme',
  'LetterEditor',
  'Settings',
  'TimerSettings',
  'TimerPhoto',
  'ColorThemes',
]);

const PHOTO_ICON = '#F2F0EC';
const PHOTO_ICON_MUTED = 'rgba(242, 240, 236, 0.55)';

/** Нижняя панель: события, главная и три полоски «Ещё». */
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const { theme: colorTheme } = useColorTheme();
  const insets = useSafeAreaInsets();
  const sheetBackground =
    colorTheme.scheme === 'light' ? 'rgba(255, 255, 255, 0.94)' : theme.overlay.fill;
  const currentRoute = state.routes[state.index];
  const nestedName = getFocusedRouteNameFromRoute(currentRoute) ?? currentRoute.name;
  const [hasPhotoBackground, setHasPhotoBackground] = useState(getTimerPhotoBackgroundActive);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => subscribeTimerPhotoBackground(setHasPhotoBackground), []);

  if (HIDDEN_TAB_ROUTES.has(nestedName)) {
    return null;
  }

  const currentTab = currentRoute.name as TabName;
  const isTimerScreen = currentRoute.name === 'Home' && !HIDDEN_TAB_ROUTES.has(nestedName);
  const photoStyle = isTimerScreen && hasPhotoBackground;
  const moreActive = MORE_ROUTES.has(currentTab);

  const barTabs: { name: 'Events' | 'Home'; routeKey: string }[] = [];
  for (const route of state.routes) {
    if (route.name === 'Events' || route.name === 'Home') {
      barTabs.push({ name: route.name, routeKey: route.key });
    }
  }

  const iconFor = (focused: boolean, isHome: boolean) => {
    if (photoStyle) {
      return focused ? PHOTO_ICON : PHOTO_ICON_MUTED;
    }
    if (!focused) {
      return theme.text.secondary;
    }
    return isHome ? theme.text.accent : theme.text.primary;
  };

  const indicatorFor = (focused: boolean, isHome: boolean) => {
    if (!focused) {
      return 'transparent';
    }
    if (photoStyle) {
      return PHOTO_ICON;
    }
    return isHome ? theme.text.accent : theme.text.primary;
  };

  const goToTab = (name: TabName) => {
    const route = state.routes.find((item) => item.name === name);
    if (!route) {
      return;
    }
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (state.routes[state.index].key !== route.key && !event.defaultPrevented) {
      navigation.navigate(name as never);
    }
  };

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
        {barTabs.map((tab) => {
          const focused = currentTab === tab.name;
          const isHome = tab.name === 'Home';
          const color = iconFor(focused, isHome);
          return (
            <Pressable
              key={tab.routeKey}
              style={styles.tab}
              onPress={() => {
                setMoreOpen(false);
                goToTab(tab.name);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={TAB_CONFIG[tab.name].label}
            >
              <Feather name={TAB_CONFIG[tab.name].icon} size={22} color={color} />
              <View style={[styles.indicator, { backgroundColor: indicatorFor(focused, isHome) }]} />
            </Pressable>
          );
        })}

        <Pressable
          style={styles.tab}
          onPress={() => setMoreOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ selected: moreActive, expanded: moreOpen }}
          accessibilityLabel="Ещё"
          accessibilityHint="Посылки, виджеты, трекеры, дневник и опора"
        >
          <Feather name="menu" size={22} color={iconFor(moreActive, false)} />
          <View style={[styles.indicator, { backgroundColor: indicatorFor(moreActive, false) }]} />
        </Pressable>
      </View>

      <Modal visible={moreOpen} transparent animationType="fade" onRequestClose={() => setMoreOpen(false)}>
        <View style={styles.sheetRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMoreOpen(false)} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: sheetBackground,
                borderColor: theme.overlay.border,
                marginBottom: Math.max(insets.bottom, 10) + 72,
              },
            ]}
          >
            {MORE_ITEMS.filter((item) => FEATURES.showTrackersTab || item.name !== 'Trackers').map((item, index, visibleItems) => (
              <Pressable
                key={item.name}
                style={[
                  styles.sheetRow,
                  index < visibleItems.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.overlay.border,
                  },
                ]}
                onPress={() => {
                  setMoreOpen(false);
                  goToTab(item.name);
                }}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <Feather name={TAB_CONFIG[item.name].icon} size={20} color={theme.text.primary} />
                <View style={styles.sheetRowText}>
                  <Text style={[styles.sheetRowTitle, { color: theme.text.primary }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.sheetRowHint, { color: theme.text.secondary }]}>
                    {item.hint}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
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
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  sheet: {
    marginHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetRowText: {
    flex: 1,
  },
  sheetRowTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
  },
  sheetRowHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    marginTop: 2,
  },
});
