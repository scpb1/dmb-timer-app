import { graphiteTheme } from './themes/graphite';
import { linenTheme } from './themes/linen';
import type { ColorTokens } from './tokens';

/**
 * Совместимый доступ `colors.light` / `colors.dark`.
 * Новые темы — в `src/theme/themes/*`, брать через `getColorTheme(id)`.
 */
export const colors = {
  dark: graphiteTheme.colors,
  light: linenTheme.colors,
} as const satisfies { dark: ColorTokens; light: ColorTokens };

export type ThemeColors = typeof colors;
