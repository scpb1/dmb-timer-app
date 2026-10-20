import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';

import { CONFIG_KEYS } from '@/types/config';
import { getConfig, setConfig } from '@/services/database';
import { logger } from '@/utils/logger';
import { DEFAULT_LIGHT_THEME_ID, getColorTheme, isColorThemeId } from './themes';
import type { AppColorTheme, ColorThemeId, ColorTokens } from './tokens';

interface ColorThemeContextValue {
  theme: AppColorTheme;
  themeId: ColorThemeId;
  colors: ColorTokens;
  setColorTheme: (id: ColorThemeId) => Promise<void>;
}

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

const fallbackTheme = getColorTheme(DEFAULT_LIGHT_THEME_ID);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ColorThemeId>(DEFAULT_LIGHT_THEME_ID);

  useEffect(() => {
    void getConfig(CONFIG_KEYS.COLOR_THEME_ID)
      .then((raw) => {
        if (raw && isColorThemeId(raw)) {
          setThemeId(raw);
        }
      })
      .catch((error) => {
        logger.error('Не удалось загрузить цветовую тему', error);
      });
  }, []);

  const setColorTheme = useCallback(async (id: ColorThemeId) => {
    setThemeId(id);
    try {
      await setConfig(CONFIG_KEYS.COLOR_THEME_ID, id);
    } catch (error) {
      logger.error('Не удалось сохранить цветовую тему', error);
    }
  }, []);

  const theme = getColorTheme(themeId);
  const value = useMemo(
    () => ({
      theme,
      themeId,
      colors: theme.colors,
      setColorTheme,
    }),
    [theme, themeId, setColorTheme],
  );

  return (
    <ColorThemeContext.Provider value={value}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme(): ColorThemeContextValue {
  const context = useContext(ColorThemeContext);
  if (!context) {
    return {
      theme: fallbackTheme,
      themeId: fallbackTheme.id,
      colors: fallbackTheme.colors,
      setColorTheme: async () => undefined,
    };
  }
  return context;
}

export function useAppTheme(): ColorTokens {
  return useColorTheme().colors;
}
