import { hexToRgb, hsvToHex, hexToHsv, normalizeHex, withAlpha } from '@/utils/color';
import type { AppColorTheme, ColorScheme, ColorThemeId, ColorTokens } from './tokens';

type ContrastLevel = 'normal' | 'boost' | 'strong';

/** Базовое усиление текста. */
const TEXT_CONTRAST_BOOST_IDS = new Set<ColorThemeId>([
  'trema',
  'tropical',
  'pool',
  'violetMist',
  'nectar',
  'sprite',
  'ciel',
]);

/** Дополнительно плотнее: Бассейн, Ирис, Нектар, Циан. */
const TEXT_CONTRAST_STRONG_IDS = new Set<ColorThemeId>(['pool', 'violetMist', 'nectar', 'ciel']);

/** Акцент прогресса (пройденные ячейки и полосы). */
const PROGRESS_ACCENT_DEEPEN: Partial<Record<ColorThemeId, { drop: number; saturation: number }>> = {
  caramel: { drop: 0.14, saturation: 1.14 },
};

function contrastLevelForTheme(id: ColorThemeId): ContrastLevel {
  if (TEXT_CONTRAST_STRONG_IDS.has(id)) {
    return 'strong';
  }
  if (TEXT_CONTRAST_BOOST_IDS.has(id)) {
    return 'boost';
  }
  return 'normal';
}

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

export function deepenHex(hex: string, valueDrop = 0.16, saturationScale = 1.1): string {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return hex;
  }
  const hsv = hexToHsv(normalized);
  if (!hsv) {
    return hex;
  }
  const v = Math.max(0.14, hsv.v - valueDrop);
  const s = Math.min(1, hsv.s * saturationScale);
  return hsvToHex(hsv.h, s, v);
}

function readableAccent(accent: string, primary: string, level: ContrastLevel): string {
  if (!accent.startsWith('#')) {
    return accent;
  }
  const threshold = level === 'strong' ? 0.36 : 0.4;
  const blendTowardPrimary = level === 'strong' ? 0.68 : 0.62;
  if (relativeLuminance(accent) > threshold) {
    return blendHex(accent, primary, blendTowardPrimary);
  }
  return level === 'strong' ? deepenHex(accent, 0.06, 1.08) : accent;
}

export function blendHex(a: string, b: string, towardB: number): string {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  if (!from || !to) {
    return a;
  }
  const t = Math.min(1, Math.max(0, towardB));
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const bCh = Math.round(from.b + (to.b - from.b) * t);
  return `#${[r, g, bCh].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function softenHex(
  hex: string,
  options: { saturation?: number; lift?: number } = {},
): string {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return hex;
  }
  const hsv = hexToHsv(normalized);
  if (!hsv) {
    return hex;
  }
  const saturation = options.saturation ?? 0.68;
  const lift = options.lift ?? 0.1;
  const s = hsv.s * saturation;
  const v = Math.min(1, hsv.v + lift * (1 - hsv.v));
  return hsvToHex(hsv.h, s, v);
}

function softenMaybeHex(value: string, saturation?: number): string {
  if (value.startsWith('#')) {
    return softenHex(value, { saturation });
  }
  return value;
}

function softenBackground(
  background: ColorTokens['background'],
  scheme: ColorScheme,
  contrastLevel: ContrastLevel,
) {
  const start = softenHex(background.start);
  const mid = softenHex(background.mid);
  let end = softenHex(background.end);

  if (scheme === 'light') {
    const endBlend =
      contrastLevel === 'strong' ? 0.26 : contrastLevel === 'boost' ? 0.34 : 0.58;
    const midBlend =
      contrastLevel === 'strong' ? 0.16 : contrastLevel === 'boost' ? 0.22 : 0.42;
    end = blendHex(end, start, endBlend);
    const midLifted = blendHex(mid, start, midBlend);
    return {
      start,
      mid: midLifted,
      end,
      sheen: {
        start: softenHex(background.sheen.start),
        startOpacity: Math.min(0.42, background.sheen.startOpacity),
        mid: softenHex(background.sheen.mid),
        midOpacity: background.sheen.midOpacity,
        end: blendHex(softenHex(background.sheen.end), start, 0.35),
        endOpacity: Math.min(0.32, background.sheen.endOpacity),
      },
    };
  }

  return {
    start: softenHex(background.start, { lift: 0.14 }),
    mid: softenHex(background.mid, { lift: 0.12 }),
    end: softenHex(background.end, { lift: 0.1 }),
    sheen: {
      start: softenHex(background.sheen.start, { lift: 0.1 }),
      startOpacity: background.sheen.startOpacity * 0.92,
      mid: softenHex(background.sheen.mid, { lift: 0.12 }),
      midOpacity: background.sheen.midOpacity,
      end: softenHex(background.sheen.end, { lift: 0.1 }),
      endOpacity: background.sheen.endOpacity * 0.92,
    },
  };
}

export function softenColorTokens(
  colors: ColorTokens,
  scheme: ColorScheme,
  options: { contrastLevel?: ContrastLevel } = {},
): ColorTokens {
  const contrastLevel = options.contrastLevel ?? 'normal';
  const contrastOn = contrastLevel !== 'normal';
  const primarySat = contrastLevel === 'strong' ? 0.86 : contrastLevel === 'boost' ? 0.82 : 0.75;
  const primarySoft = softenMaybeHex(colors.text.primary, primarySat);
  const primaryDrop = contrastLevel === 'strong' ? 0.15 : contrastLevel === 'boost' ? 0.1 : 0;
  const primary =
    contrastOn && scheme === 'light' ? deepenHex(primarySoft, primaryDrop, 1.08) : primarySoft;
  const accentBase = softenMaybeHex(
    colors.text.accent,
    contrastLevel === 'strong' ? 0.78 : contrastLevel === 'boost' ? 0.72 : 0.62,
  );
  let accent =
    contrastOn && scheme === 'light'
      ? readableAccent(accentBase, primary, contrastLevel)
      : accentBase;

  const secondaryAlpha =
    contrastLevel === 'strong' ? 0.72 : contrastLevel === 'boost' ? 0.68 : 0.55;

  return {
    background: softenBackground(colors.background, scheme, contrastLevel),
    text: {
      primary,
      secondary: colors.text.secondary.startsWith('#')
        ? contrastOn && scheme === 'light'
          ? deepenHex(
              softenMaybeHex(colors.text.secondary, 0.78),
              contrastLevel === 'strong' ? 0.1 : 0.06,
              1.06,
            )
          : softenMaybeHex(colors.text.secondary, 0.72)
        : withAlpha(primary, scheme === 'light' ? secondaryAlpha : 0.64),
      accent,
      inverse: softenMaybeHex(colors.text.inverse),
    },
    input: {
      border:
        colors.input.border.startsWith('#')
          ? contrastOn && scheme === 'light'
            ? primary
            : softenMaybeHex(colors.input.border, 0.78)
          : colors.input.border,
      placeholder: withAlpha(
        primary,
        scheme === 'light'
          ? contrastLevel === 'strong'
            ? 0.48
            : contrastLevel === 'boost'
              ? 0.45
              : 0.38
          : 0.34,
      ),
    },
    overlay: {
      border: colors.overlay.border,
      fill: colors.overlay.fill,
      muted: colors.overlay.muted,
    },
    holiday: {
      cardBackground: withAlpha(accent, 0.38),
      cardBorder: withAlpha(accent, 0.34),
    },
  };
}

export function softenSwatchColors(swatch: readonly string[]): string[] {
  return swatch.map((hex) => softenHex(hex, { saturation: 0.72, lift: 0.06 }));
}

/** Чуть приглушает любую тему и осветляет градиент фона. */
export function softenAppTheme(theme: AppColorTheme): AppColorTheme {
  const contrastLevel = contrastLevelForTheme(theme.id);
  let colors = softenColorTokens(theme.colors, theme.scheme, { contrastLevel });
  const progressDeepen = PROGRESS_ACCENT_DEEPEN[theme.id];
  if (progressDeepen && colors.text.accent.startsWith('#')) {
    colors = {
      ...colors,
      text: {
        ...colors.text,
        accent: deepenHex(
          colors.text.accent,
          progressDeepen.drop,
          progressDeepen.saturation,
        ),
      },
    };
  }
  return {
    ...theme,
    colors,
  };
}
