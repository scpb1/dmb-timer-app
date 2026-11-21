import type { ColorScheme } from '@/theme/tokens';
import { withAlpha } from '@/utils/color';

/** На фото — лёгкая заливка трека, без «контура» */
const PHOTO_UNPASSED_FILL = 'rgba(242, 240, 236, 0.1)';

/** На светлых темах — secondary, чем меньше alpha, тем светлее трек */
const LIGHT_UNPASSED_ALPHA = 0.11;

export function progressFillColor(accent: string, photoBackground: boolean): string {
  return photoBackground ? '#F2F0EC' : accent;
}

/**
 * Непройденное: нейтральный «трек» (старый серый на льне), без обводки.
 * Любая тема — text.secondary @ 11 % (light) или 15 % (dark); фото — фикс. крем.
 */
export function timerVizUnpassedColor(
  overlayMuted: string,
  textSecondary: string,
  scheme: ColorScheme,
  photoBackground: boolean,
): string {
  if (photoBackground) {
    return PHOTO_UNPASSED_FILL;
  }
  const alpha = scheme === 'dark' ? 0.15 : LIGHT_UNPASSED_ALPHA;
  return withAlpha(textSecondary, alpha);
}


export function timerVizUnpassedBorder(
  overlayMuted: string,
  textSecondary: string,
  scheme: ColorScheme,
  photoBackground: boolean,
): string {
  return timerVizUnpassedColor(overlayMuted, textSecondary, scheme, photoBackground);
}

export function progressEmptyColor(
  overlayMuted: string,
  textSecondary: string,
  scheme: ColorScheme,
  photoBackground: boolean,
): string {
  return timerVizUnpassedColor(overlayMuted, textSecondary, scheme, photoBackground);
}
