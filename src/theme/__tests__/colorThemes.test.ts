import { colors } from '@/theme/colors';
import {
  COLOR_THEMES,
  COLOR_THEME_BY_ID,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
  getColorTheme,
  isColorThemeId,
} from '@/theme/themes';
import { COLOR_THEME_IDS } from '@/theme/tokens';

describe('color themes', () => {
  it('ровно 20 тем с уникальными id', () => {
    expect(COLOR_THEMES).toHaveLength(20);
    expect(new Set(COLOR_THEMES.map((theme) => theme.id)).size).toBe(20);
  });

  it('каталог совпадает со списком id и с id внутри файла', () => {
    expect(COLOR_THEME_IDS).toHaveLength(20);
    for (const id of COLOR_THEME_IDS) {
      expect(COLOR_THEME_BY_ID[id].id).toBe(id);
    }
  });

  it('светлая и тёмная совместимые палитры берутся из дефолтных тем', () => {
    expect(colors.light).toBe(COLOR_THEME_BY_ID[DEFAULT_LIGHT_THEME_ID].colors);
    expect(colors.dark).toBe(COLOR_THEME_BY_ID[DEFAULT_DARK_THEME_ID].colors);
    expect(COLOR_THEME_BY_ID.linen.scheme).toBe('light');
    expect(COLOR_THEME_BY_ID.graphite.scheme).toBe('dark');
  });

  it('неизвестный id падает в светлую тему', () => {
    expect(isColorThemeId('linen')).toBe(true);
    expect(isColorThemeId('missing')).toBe(false);
    expect(getColorTheme('missing').id).toBe(DEFAULT_LIGHT_THEME_ID);
    expect(getColorTheme(undefined).id).toBe(DEFAULT_LIGHT_THEME_ID);
  });

  it('у каждой темы заполнены семантические токены', () => {
    for (const theme of COLOR_THEMES) {
      expect(theme.colors.background.start).toMatch(/^#/);
      expect(theme.colors.background.mid).toMatch(/^#/);
      expect(theme.colors.background.end).toMatch(/^#/);
      expect(theme.colors.text.primary).toBeTruthy();
      expect(theme.colors.text.secondary).toBeTruthy();
      expect(theme.colors.text.accent).toBeTruthy();
      expect(theme.colors.text.inverse).toBeTruthy();
      expect(theme.colors.input.border).toBeTruthy();
      expect(theme.colors.input.placeholder).toBeTruthy();
      expect(theme.colors.overlay.border).toBeTruthy();
      expect(theme.colors.overlay.fill).toBeTruthy();
      expect(theme.colors.overlay.muted).toBeTruthy();
      expect(theme.colors.holiday.cardBackground).toBeTruthy();
      expect(theme.colors.holiday.cardBorder).toBeTruthy();
    }
  });
});
