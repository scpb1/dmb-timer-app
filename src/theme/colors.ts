import { DEFAULT_DARK_THEME_ID, DEFAULT_LIGHT_THEME_ID, getColorTheme } from './themes';
import type { ColorTokens } from './tokens';

/**
 * Совместимый доступ `colors.light` / `colors.dark`.
 * Совпадает с `getColorTheme` (включая soften), чтобы фолбэки не расходились с экраном.
 */
export const colors = {
  dark: getColorTheme(DEFAULT_DARK_THEME_ID).colors,
  light: getColorTheme(DEFAULT_LIGHT_THEME_ID).colors,
} as const satisfies { dark: ColorTokens; light: ColorTokens };

export type ThemeColors = typeof colors;
