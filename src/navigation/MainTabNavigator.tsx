import { Linking, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ScreenBackground } from '@/components/common/ScreenBackground';
import { FEATURES, TELEGRAM_CHANNEL_TITLE, TELEGRAM_CHANNEL_URL } from '@/constants';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { MainTabParamList } from '@/types/navigation';
import { PlaceholderScreen } from '@/screens/common/PlaceholderScreen';
import { TrackersScreen } from '@/screens/trackers/TrackersScreen';
import { EventsScreen } from '@/screens/events/EventsScreen';
import { WidgetsScreen } from '@/screens/widgets/WidgetsScreen';
import { ParcelsScreen } from '@/screens/parcels/ParcelsScreen';
import { SupportScreen } from '@/screens/support/SupportScreen';
import { DiaryStackNavigator } from './DiaryStackNavigator';
import { HomeStackNavigator } from './HomeStackNavigator';
import { CustomTabBar } from './CustomTabBar';
import { TabErrorBoundary } from './TabErrorBoundary';

const Tab = createBottomTabNavigator<MainTabParamList>();

function DiaryPlaceholderMessage() {
  const theme = useAppTheme();

  return (
    <Text style={[styles.diaryMessage, { color: theme.text.secondary }]}>
      Раздел ещё собираем. Если есть идеи, напишите нам в тгк{' '}
      <Text
        style={[styles.diaryLink, { color: theme.text.accent }]}
        onPress={() => void Linking.openURL(TELEGRAM_CHANNEL_URL)}
        accessibilityRole="link"
        accessibilityLabel={`Telegram-канал ${TELEGRAM_CHANNEL_TITLE}`}
      >
        {TELEGRAM_CHANNEL_TITLE}
      </Text>
    </Text>
  );
}

interface MainTabNavigatorProps {
  onResetToOnboarding: () => void;
}

export function MainTabNavigator({ onResetToOnboarding }: MainTabNavigatorProps) {
  return (
    <View style={styles.shell}>
      <ScreenBackground />
      <Tab.Navigator
        initialRouteName="Home"
        backBehavior="history"
        tabBar={(props) => <CustomTabBar {...props} />}
        sceneContainerStyle={{ backgroundColor: 'transparent' }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      >
        <Tab.Screen name="Events">
          {() => (
            <TabErrorBoundary>
              <EventsScreen />
            </TabErrorBoundary>
          )}
        </Tab.Screen>
        <Tab.Screen name="Home">
          {() => <HomeStackNavigator onResetToOnboarding={onResetToOnboarding} />}
        </Tab.Screen>
        <Tab.Screen name="Diary">
          {() =>
            FEATURES.diaryPlaceholder ? (
              <PlaceholderScreen
                title="Дневник"
                eyebrow="В разработке"
                message={<DiaryPlaceholderMessage />}
              />
            ) : (
              <DiaryStackNavigator />
            )
          }
        </Tab.Screen>
        <Tab.Screen name="Parcels">
          {() => (
            <TabErrorBoundary>
              <ParcelsScreen />
            </TabErrorBoundary>
          )}
        </Tab.Screen>
        <Tab.Screen name="Support">
          {() => (
            <TabErrorBoundary>
              <SupportScreen />
            </TabErrorBoundary>
          )}
        </Tab.Screen>
        {FEATURES.showTrackersTab ? (
          <Tab.Screen name="Trackers">
            {() => (
              <TabErrorBoundary>
                <TrackersScreen />
              </TabErrorBoundary>
            )}
          </Tab.Screen>
        ) : null}
        <Tab.Screen name="Widgets">
          {() => (
            <TabErrorBoundary>
              <WidgetsScreen />
            </TabErrorBoundary>
          )}
        </Tab.Screen>
        {FEATURES.showShopTab ? (
          <Tab.Screen name="Shop">
            {() => (
              <PlaceholderScreen
                title="Магазин"
                eyebrow="В разработке"
                message="Раздел ещё собираем. Открыты для сотрудничества — если хотите, чтобы здесь были Ваши товары, относящиеся к службе, напишите нам."
              />
            )}
          </Tab.Screen>
        ) : null}
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  diaryMessage: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  diaryLink: {
    fontFamily: typography.fontFamily.sansBold,
    textDecorationLine: 'underline',
  },
});
