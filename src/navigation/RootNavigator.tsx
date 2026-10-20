import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import type { RootStackParamList } from '@/types/navigation';
import { initDatabase } from '@/services/database';
import { isOnboardingCompleted } from '@/hooks/useOnboarding';
import { rescheduleAppNotifications } from '@/services/holidayNotifications';
import { registerAppReloadHandler } from '@/appSession';
import { logger } from '@/utils/logger';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { ThemeProvider } from '@/theme';
import { colors } from '@/theme/colors';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [session, setSession] = useState(0);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        const completed = await isOnboardingCompleted();
        setShowOnboarding(!completed);
        if (completed) {
          void rescheduleAppNotifications();
        }
      } catch (error) {
        logger.error('Ошибка инициализации приложения', error);
      } finally {
        setIsReady(true);
      }
    }

    void bootstrap();
  }, [session]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void rescheduleAppNotifications();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    registerAppReloadHandler(async () => {
      setIsReady(false);
      setSession((current) => current + 1);
    });
    return () => registerAppReloadHandler(null);
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f5f5f7" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer key={session}>
        <Stack.Navigator
          initialRouteName={showOnboarding ? 'Onboarding' : 'Main'}
          screenOptions={{ headerShown: false, animationEnabled: true }}
        >
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={() => props.navigation.replace('Main')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Main">
            {(props) => (
              <MainTabNavigator
                onResetToOnboarding={() =>
                  props.navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] })
                }
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.background.start,
  },
});
