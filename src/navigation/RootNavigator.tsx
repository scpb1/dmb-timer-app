import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import type { RootStackParamList } from '@/types/navigation';
import { CONFIG_KEYS } from '@/types/config';
import { getConfig, initDatabase } from '@/services/database';
import { isOnboardingCompleted } from '@/hooks/useOnboarding';
import { getNotificationsApi } from '@/services/notifications/nativeNotifications';
import { rescheduleAppNotifications } from '@/services/holidayNotifications';
import { rescheduleParcelNotifications } from '@/utils/parcelNotifications';
import { registerAppReloadHandler } from '@/appSession';
import { logger } from '@/utils/logger';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { DEFAULT_LIGHT_THEME_ID, isColorThemeId, ThemeProvider } from '@/theme';
import type { ColorThemeId } from '@/theme';
import { colors } from '@/theme/colors';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

type BootState =
  | { status: 'loading' }
  | { status: 'ready'; showOnboarding: boolean; colorThemeId: ColorThemeId };

export function RootNavigator() {
  const [boot, setBoot] = useState<BootState>({ status: 'loading' });
  const [session, setSession] = useState(0);

  useEffect(() => {
    async function bootstrap() {
      let showOnboarding = true;
      let colorThemeId: ColorThemeId = DEFAULT_LIGHT_THEME_ID;
      try {
        getNotificationsApi();
        await initDatabase();
        const completed = await isOnboardingCompleted();
        showOnboarding = !completed;
        if (completed) {
          void rescheduleAppNotifications();
          void rescheduleParcelNotifications();
        }
        try {
          const rawThemeId = await getConfig(CONFIG_KEYS.COLOR_THEME_ID);
          if (rawThemeId && isColorThemeId(rawThemeId)) {
            colorThemeId = rawThemeId;
          }
        } catch (error) {
          logger.error('Не удалось загрузить цветовую тему', error);
        }
      } catch (error) {
        logger.error('Ошибка инициализации приложения', error);
      } finally {
        setBoot({ status: 'ready', showOnboarding, colorThemeId });
      }
    }

    void bootstrap();
  }, [session]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void rescheduleAppNotifications();
        void rescheduleParcelNotifications();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    registerAppReloadHandler(async () => {
      setBoot({ status: 'loading' });
      setSession((current) => current + 1);
    });
    return () => registerAppReloadHandler(null);
  }, []);

  if (boot.status !== 'ready') {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f5f5f7" />
      </View>
    );
  }

  return (
    <ThemeProvider initialThemeId={boot.colorThemeId}>
      <NavigationContainer key={session}>
        <Stack.Navigator
          initialRouteName={boot.showOnboarding ? 'Onboarding' : 'Main'}
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
