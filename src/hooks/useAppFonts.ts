import { useEffect } from 'react';
import { useFonts } from 'expo-font';

import { logger } from '@/utils/logger';

/** Загружает шрифт Spell. Положите Spell.ttf в assets/fonts/ */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Spell: require('../../assets/fonts/Spell.ttf'),
  });

  useEffect(() => {
    if (error) {
      logger.error(
        'Не удалось загрузить шрифт Spell. Скопируйте Spell.ttf в assets/fonts/',
        error,
      );
    }
  }, [error]);

  return loaded;
}
