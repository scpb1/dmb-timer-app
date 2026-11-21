import { COLOR_THEME_BY_ID } from '@/theme/themes';
import { softenAppTheme } from '@/theme/softenAppTheme';
import { hexToRgb } from '@/utils/color';

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
}

describe('theme contrast boost', () => {
  const boosted = ['trema', 'tropical', 'pool', 'violetMist', 'nectar', 'sprite', 'ciel'] as const;
  const strong = ['pool', 'violetMist', 'nectar', 'ciel'] as const;

  it.each(boosted)('%s — основной текст темнее фона', (id) => {
    const theme = softenAppTheme(COLOR_THEME_BY_ID[id]);
    const bg = luminance(theme.colors.background.start);
    const primary = luminance(theme.colors.text.primary);
    expect(primary).toBeLessThan(bg - 0.12);
  });

  it.each(strong)('%s — акцент не бледный', (id) => {
    const theme = softenAppTheme(COLOR_THEME_BY_ID[id]);
    expect(luminance(theme.colors.text.accent)).toBeLessThan(0.48);
  });

  it('caramel — акцент прогресса темнее сырого оранжевого', () => {
    const raw = COLOR_THEME_BY_ID.caramel.colors.text.accent;
    const theme = softenAppTheme(COLOR_THEME_BY_ID.caramel);
    expect(luminance(theme.colors.text.accent)).toBeLessThan(luminance(raw) + 0.02);
  });
});
