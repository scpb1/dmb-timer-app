import { Linking, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { FEATURES, TELEGRAM_CHANNEL_TITLE, TELEGRAM_CHANNEL_URL } from '@/constants';
import { useAppTheme } from '@/theme';
import { typography } from '@/theme/typography';
import type { MainTabParamList } from '@/types/navigation';
import { PlaceholderScreen } from '@/screens/common/PlaceholderScreen';
import { TrackersScreen } from '@/screens/trackers/TrackersScreen';
import { EventsScreen } from '@/screens/events/EventsScreen';
import { DiaryStackNavigator } from './DiaryStackNavigator';
import { HomeStackNavigator } from './HomeStackNavigator';
import { CustomTabBar } from './CustomTabBar';

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
    <Tab.Navigator
      initialRouteName="Home"
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
      <Tab.Screen name="Shop">
        {() => (
          <PlaceholderScreen
            title="Магазин"
            eyebrow="В разработке"
            message="Раздел ещё собираем. Открыты для сотрудничества — если хотите, чтобы здесь были Ваши товары, относящиеся к службе, напишите нам."
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Events" component={EventsScreen} />
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
      <Tab.Screen name="Trackers" component={TrackersScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
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
