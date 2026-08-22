import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import type { RootStackParamList } from '@/types/navigation';
import { initDatabase } from '@/services/database';
import { isOnboardingCompleted } from '@/hooks/useOnboarding';
import { logger } from '@/utils/logger';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { colors } from '@/theme/colors';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        const completed = await isOnboardingCompleted();
        setShowOnboarding(!completed);
      } catch (error) {
        logger.error('Ошибка инициализации приложения', error);
      } finally {
        setIsReady(true);
      }
    }

    bootstrap();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f5f5f7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
