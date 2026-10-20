/** Стабильные роли цвета. Компоненты красятся токенами, не hex. */
export const COLOR_THEME_IDS = [
  'linen',
  'parchment',
  'blush',
  'sage',
  'fog',
  'honey',
  'lilac',
  'milk',
  'clay',
  'sea',
  'snow',
  'meadow',
  'graphite',
  'night',
  'wine',
  'forest',
  'ink',
  'ember',
  'plum',
  'olive',
] as const;

export type ColorThemeId = (typeof COLOR_THEME_IDS)[number];

export type ColorScheme = 'light' | 'dark';

export interface GradientSheen {
  start: string;
  startOpacity: number;
  mid: string;
  midOpacity: number;
  end: string;
  endOpacity: number;
}

/**
 * Семантическая палитра одной темы.
 * Новый токен добавляется сюда — TypeScript потребует его во всех файлах тем.
 */
export interface ColorTokens {
  background: {
    start: string;
    mid: string;
    end: string;
    sheen: GradientSheen;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
    inverse: string;
  };
  input: {
    border: string;
    placeholder: string;
  };
  overlay: {
    border: string;
    fill: string;
    muted: string;
  };
  holiday: {
    cardBackground: string;
    cardBorder: string;
  };
}

export interface AppColorTheme {
  id: ColorThemeId;
  name: string;
  scheme: ColorScheme;
  colors: ColorTokens;
}

export function defineTheme<const T extends AppColorTheme>(theme: T): T {
  return theme;
}
