import { useEffect } from 'react';
import { useFonts } from 'expo-font';

import { logger } from '@/utils/logger';

/** Загружает шрифты из assets/fonts/ */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    'dmb-timer-sans': require('../../assets/fonts/dmb-timer-sans.ttf'),
    'dmb-timer-sans-Light': require('../../assets/fonts/dmb-timer-sans-Light.ttf'),
    'dmb-timer-sans-Bold': require('../../assets/fonts/dmb-timer-sans-Bold.ttf'),
    'BlackOpsOne-Regular': require('../../assets/fonts/BlackOpsOne-Regular.otf'),
  });

  useEffect(() => {
    if (error) {
      logger.error('Не удалось загрузить шрифты из assets/fonts/', error);
    }
  }, [error]);

  return loaded;
}
