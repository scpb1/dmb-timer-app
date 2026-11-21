import { EXTRA_PALETTE_THEMES } from '@/theme/themes/extraPalettes';
import { COLOR_THEME_IDS } from '@/theme/tokens';

describe('buildFourColorTheme', () => {
  it('генерирует 17 дополнительных палитр', () => {
    expect(EXTRA_PALETTE_THEMES).toHaveLength(17);
  });

  it('новые id присутствуют в каталоге', () => {
    for (const theme of EXTRA_PALETTE_THEMES) {
      expect(COLOR_THEME_IDS).toContain(theme.id);
      expect(theme.colors.text.accent).toMatch(/^#/);
    }
  });
});
