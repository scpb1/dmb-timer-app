import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { MainTabParamList } from '@/types/navigation';
import { PlaceholderScreen } from '@/screens/common/PlaceholderScreen';
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
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Shop">
        {() => <PlaceholderScreen title="Магазин" />}
      </Tab.Screen>
      <Tab.Screen name="Events">
        {() => <PlaceholderScreen title="События" />}
      </Tab.Screen>
      <Tab.Screen name="Home">
        {() => <HomeStackNavigator onResetToOnboarding={onResetToOnboarding} />}
      </Tab.Screen>
      <Tab.Screen name="Diary">
        {() => <PlaceholderScreen title="Дневник" />}
      </Tab.Screen>
      <Tab.Screen name="Trackers">
        {() => <PlaceholderScreen title="Трекеры" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
