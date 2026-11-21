import { blendHex, softenHex } from '@/theme/softenAppTheme';
import { hexToHsv, hexToRgb, normalizeHex, withAlpha } from '@/utils/color';
import type { ColorScheme, ColorTokens } from './tokens';

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b);
}

function pickAccent(stripes: string[]): string {
  let best = stripes[0];
  let score = -1;
  for (const hex of stripes) {
    const hsv = hexToHsv(hex);
    if (!hsv) {
      continue;
    }
    const vivid = hsv.s * (0.35 + hsv.v * 0.65);
    if (vivid > score) {
      score = vivid;
      best = hex;
    }
  }
  return normalizeHex(best) ?? stripes[0];
}

/** Полосы макета сверху вниз → массив `stripes`. */
export function buildPaletteColorTokens(
  ...input: string[]
): { scheme: ColorScheme; colors: ColorTokens; swatch: string[] } {
  const raw = input.map((c) => normalizeHex(c) ?? c);
  const swatch = [...raw];
  const byLight = [...raw].sort((a, b) => relativeLuminance(b) - relativeLuminance(a));
  const lightest = byLight[0];
  const darkest = byLight[byLight.length - 1];
  const midLight = byLight[1] ?? lightest;
  const midDark = byLight[2] ?? darkest;

  const avgLuminance = raw.reduce((sum, hex) => sum + relativeLuminance(hex), 0) / raw.length;
  const scheme: ColorScheme =
    avgLuminance < 0.14 && relativeLuminance(lightest) < 0.32 ? 'dark' : 'light';

  const accent = softenHex(pickAccent(raw), { saturation: 0.58, lift: 0.04 });
  const accentNorm = normalizeHex(accent) ?? accent;

  const softDarkest = blendHex(darkest, lightest, scheme === 'light' ? 0.48 : 0.22);
  const softMid = blendHex(midDark, lightest, scheme === 'light' ? 0.38 : 0.18);

  const background =
    scheme === 'light'
      ? {
          start: lightest,
          mid: softMid,
          end: softDarkest,
          sheen: {
            start: blendHex(midLight, lightest, 0.25),
            startOpacity: 0.38,
            mid: lightest,
            midOpacity: 0,
            end: blendHex(midDark, lightest, 0.45),
            endOpacity: 0.28,
          },
        }
      : {
          start: blendHex(darkest, midLight, 0.15),
          mid: blendHex(midDark, midLight, 0.35),
          end: blendHex(midLight, lightest, 0.12),
          sheen: {
            start: midLight,
            startOpacity: 0.38,
            mid: darkest,
            midOpacity: 0,
            end: midDark,
            endOpacity: 0.28,
          },
        };

  const primary =
    scheme === 'light'
      ? softenHex(darkest, { saturation: 0.78, lift: 0.02 })
      : relativeLuminance(lightest) > 0.55
        ? lightest
        : '#EEF3FA';

  const secondary =
    scheme === 'light' ? withAlpha(primary, 0.55) : withAlpha(primary, 0.66);

  const inverse = background.start;

  const inputBorder = scheme === 'light' ? primary : withAlpha(primary, 0.5);
  const placeholder = withAlpha(primary, scheme === 'light' ? 0.38 : 0.34);

  const overlayBorder = scheme === 'light' ? withAlpha(softMid, 0.34) : withAlpha(primary, 0.18);
  const overlayFill = scheme === 'light' ? 'rgba(255, 255, 255, 0.52)' : withAlpha(midLight, 0.9);
  const overlayMuted = scheme === 'light' ? withAlpha(softMid, 0.32) : withAlpha(midLight, 0.5);

  const holidayFill = withAlpha(accentNorm, 0.36);
  const holidayBorder = withAlpha(accentNorm, 0.32);

  return {
    scheme,
    swatch,
    colors: {
      background,
      text: {
        primary,
        secondary,
        accent: accentNorm,
        inverse,
      },
      input: {
        border: inputBorder,
        placeholder,
      },
      overlay: {
        border: overlayBorder,
        fill: overlayFill,
        muted: overlayMuted,
      },
      holiday: {
        cardBackground: holidayFill,
        cardBorder: holidayBorder,
      },
    },
  };
}
