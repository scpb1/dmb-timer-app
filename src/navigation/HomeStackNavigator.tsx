import { createStackNavigator } from '@react-navigation/stack';

import { TabErrorBoundary } from '@/navigation/TabErrorBoundary';

import type { HomeStackParamList } from '@/types/navigation';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { ColorThemeScreen } from '@/screens/home/ColorThemeScreen';
import { TimerPhotoScreen } from '@/screens/home/TimerPhotoScreen';
import { TimerSettingsScreen } from '@/screens/home/TimerSettingsScreen';

const Stack = createStackNavigator<HomeStackParamList>();

interface HomeStackNavigatorProps {
  onResetToOnboarding: () => void;
}

export function HomeStackNavigator({ onResetToOnboarding }: HomeStackNavigatorProps) {
  return (
    <TabErrorBoundary>
    <Stack.Navigator
      initialRouteName="HomeMain"
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: 'transparent' },
      }}
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
      <Stack.Screen name="TimerPhoto" component={TimerPhotoScreen} />
      <Stack.Screen name="ColorThemes" component={ColorThemeScreen} />
    </Stack.Navigator>
    </TabErrorBoundary>
  );
}
