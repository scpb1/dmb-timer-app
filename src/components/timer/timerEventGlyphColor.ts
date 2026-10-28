import type { EventGlyph } from '@/utils/eventGlyphs';

/** Цвет иконки события на таймере с фото-фоном, если свой цвет не задан. */
export const TIMER_PHOTO_GLYPH_DEFAULT = '#F2F0EC';

/**
 * Перекрытие цвета для EventGlyphBadge на таймере: свой iconColor сохраняется;
 * без него — тема (undefined) или белый на фото.
 */
export function timerEventGlyphColorOverride(
  glyph: EventGlyph,
  photoBackground: boolean,
): string | undefined {
  if (glyph.color) {
    return undefined;
  }
  if (photoBackground) {
    return TIMER_PHOTO_GLYPH_DEFAULT;
  }
  return undefined;
}
