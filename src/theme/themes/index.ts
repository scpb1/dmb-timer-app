import { blushTheme } from './blush';
import { clayTheme } from './clay';
import { emberTheme } from './ember';
import { fogTheme } from './fog';
import { forestTheme } from './forest';
import { graphiteTheme } from './graphite';
import { honeyTheme } from './honey';
import { inkTheme } from './ink';
import { lilacTheme } from './lilac';
import { linenTheme } from './linen';
import { meadowTheme } from './meadow';
import { milkTheme } from './milk';
import { nightTheme } from './night';
import { oliveTheme } from './olive';
import { parchmentTheme } from './parchment';
import { plumTheme } from './plum';
import { sageTheme } from './sage';
import { seaTheme } from './sea';
import { snowTheme } from './snow';
import { wineTheme } from './wine';
import { COLOR_THEME_IDS, type AppColorTheme, type ColorThemeId } from '@/theme/tokens';

export const DEFAULT_LIGHT_THEME_ID = 'linen' satisfies ColorThemeId;
export const DEFAULT_DARK_THEME_ID = 'graphite' satisfies ColorThemeId;

/** Все 20 тем. Ключ обязан совпасть с `COLOR_THEME_IDS`. */
export const COLOR_THEME_BY_ID: Record<ColorThemeId, AppColorTheme> = {
  linen: linenTheme,
  parchment: parchmentTheme,
  blush: blushTheme,
  sage: sageTheme,
  fog: fogTheme,
  honey: honeyTheme,
  lilac: lilacTheme,
  milk: milkTheme,
  clay: clayTheme,
  sea: seaTheme,
  snow: snowTheme,
  meadow: meadowTheme,
  graphite: graphiteTheme,
  night: nightTheme,
  wine: wineTheme,
  forest: forestTheme,
  ink: inkTheme,
  ember: emberTheme,
  plum: plumTheme,
  olive: oliveTheme,
};

export const COLOR_THEMES: AppColorTheme[] = COLOR_THEME_IDS.map(
  (id) => COLOR_THEME_BY_ID[id],
);

export function isColorThemeId(value: string): value is ColorThemeId {
  return Object.prototype.hasOwnProperty.call(COLOR_THEME_BY_ID, value);
}

export function getColorTheme(id: string | null | undefined): AppColorTheme {
  if (id && isColorThemeId(id)) {
    return COLOR_THEME_BY_ID[id];
  }
  return COLOR_THEME_BY_ID[DEFAULT_LIGHT_THEME_ID];
}
