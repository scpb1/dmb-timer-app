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
import { northTheme } from './north';
import { oliveTheme } from './olive';
import { parchmentTheme } from './parchment';
import { plumTheme } from './plum';
import { sageTheme } from './sage';
import { seaTheme } from './sea';
import { snowTheme } from './snow';
import { wineTheme } from './wine';
import { EXTRA_PALETTE_THEMES } from './extraPalettes';
import { softenAppTheme } from '@/theme/softenAppTheme';
import { COLOR_THEME_IDS, type AppColorTheme, type ColorThemeId } from '@/theme/tokens';

export const DEFAULT_LIGHT_THEME_ID = 'linen' satisfies ColorThemeId;
export const DEFAULT_DARK_THEME_ID = 'graphite' satisfies ColorThemeId;

const CORE_COLOR_THEME_BY_ID: Partial<Record<ColorThemeId, AppColorTheme>> = {
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
  north: northTheme,
  ember: emberTheme,
  plum: plumTheme,
  olive: oliveTheme,
};

const EXTRA_PALETTE_BY_ID: Partial<Record<ColorThemeId, AppColorTheme>> = Object.fromEntries(
  EXTRA_PALETTE_THEMES.map((theme) => [theme.id, theme]),
);

function requireTheme(id: ColorThemeId): AppColorTheme {
  const theme = CORE_COLOR_THEME_BY_ID[id] ?? EXTRA_PALETTE_BY_ID[id];
  if (!theme) {
    throw new Error(`Missing color theme: ${id}`);
  }
  return theme;
}

/** Все темы. Ключ обязан совпасть с `COLOR_THEME_IDS`. */
export const COLOR_THEME_BY_ID = Object.fromEntries(
  COLOR_THEME_IDS.map((id) => [id, requireTheme(id)]),
) as Record<ColorThemeId, AppColorTheme>;

export const COLOR_THEMES: AppColorTheme[] = COLOR_THEME_IDS.map((id) =>
  softenAppTheme(COLOR_THEME_BY_ID[id]),
);

export function isColorThemeId(value: string): value is ColorThemeId {
  return Object.prototype.hasOwnProperty.call(COLOR_THEME_BY_ID, value);
}

export function getColorTheme(id: string | null | undefined): AppColorTheme {
  if (id && isColorThemeId(id)) {
    return softenAppTheme(COLOR_THEME_BY_ID[id]);
  }
  return softenAppTheme(COLOR_THEME_BY_ID[DEFAULT_LIGHT_THEME_ID]);
}
