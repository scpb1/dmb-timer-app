import { createStackNavigator } from '@react-navigation/stack';

import type { HomeStackParamList } from '@/types/navigation';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { TimerSettingsScreen } from '@/screens/home/TimerSettingsScreen';

const Stack = createStackNavigator<HomeStackParamList>();

interface HomeStackNavigatorProps {
  onResetToOnboarding: () => void;
}

export function HomeStackNavigator({ onResetToOnboarding }: HomeStackNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName="HomeMain"
      screenOptions={{ headerShown: false, animationEnabled: true }}
    >
      <Stack.Screen name="HomeMain">
        {(props) => (
          <HomeScreen
            {...props}
            onResetToOnboarding={onResetToOnboarding}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="TimerSettings" component={TimerSettingsScreen} />
    </Stack.Navigator>
  );
}
