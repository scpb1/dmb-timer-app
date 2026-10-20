import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { FEATURES } from '@/constants/features';
import type { MainTabParamList } from '@/types/navigation';
import { PlaceholderScreen } from '@/screens/common/PlaceholderScreen';
import { TrackersScreen } from '@/screens/trackers/TrackersScreen';
import { EventsScreen } from '@/screens/events/EventsScreen';
import { DiaryStackNavigator } from './DiaryStackNavigator';
import { HomeStackNavigator } from './HomeStackNavigator';
import { CustomTabBar } from './CustomTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

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
              message="Раздел ещё собираем. Если есть идеи, напишите нам в тгк @klvcva"
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
