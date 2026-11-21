import { startOfDay } from 'date-fns';

import type { DisplayHoliday } from '@/types/holidays';
import {
  normalizeProgressBarMode,
  type ProgressBarMode,
  type StatCardMode,
  type TimerCenterDisplay,
} from '@/types/timer';
import {
  DEFAULT_WIDGET_HOLIDAY,
  DEFAULT_WIDGET_STATS,
  DEFAULT_WIDGET_STUDIO,
  DEFAULT_WIDGET_TIMER,
  WIDGET_TIMER_KINDS,
  type WidgetFamily,
  type WidgetHolidayAppearance,
  type WidgetPreviewSize,
  type WidgetStatsAppearance,
  type WidgetStudioSettings,
  type WidgetSurfaceAppearance,
  type WidgetTimerAppearance,
} from '@/types/widgets';
import { getColorTheme } from '@/theme/themes';

function clampDim(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

const FAMILIES: WidgetFamily[] = ['timer', 'holiday', 'stats'];
const SIZES: WidgetPreviewSize[] = ['small', 'wide', 'tall'];
const STAT_MODES: StatCardMode[] = ['days', 'weeks', 'months'];
const CENTER: TimerCenterDisplay[] = ['remaining', 'elapsed'];
const BAR_MODES: ProgressBarMode[] = ['percent', 'days', 'weeks', 'months'];

function parseSurface(
  raw: Partial<WidgetSurfaceAppearance> | undefined,
  fallback: WidgetSurfaceAppearance,
): WidgetSurfaceAppearance {
  const legacyPhoto = (raw as { tone?: unknown } | undefined)?.tone === 'photo';
  const uri =
    typeof raw?.backgroundImageUri === 'string'
      ? raw.backgroundImageUri
      : legacyPhoto
        ? fallback.backgroundImageUri
        : null;

  return {
    backgroundImageUri: uri,
    backgroundDim: clampDim(raw?.backgroundDim, fallback.backgroundDim),
  };
}

function parseTimer(raw: Partial<WidgetTimerAppearance> | undefined): WidgetTimerAppearance {
  const base = DEFAULT_WIDGET_TIMER;
  const kind = pick(raw?.kind, WIDGET_TIMER_KINDS, base.kind);
  const progressBarMode = normalizeProgressBarMode(
    kind,
    pick(raw?.progressBarMode, BAR_MODES, base.progressBarMode),
  );
  const decimals = raw?.percentDecimalPlaces;
  const percentDecimalPlaces =
    typeof decimals === 'number' && decimals >= 0 && decimals <= 6
      ? Math.round(decimals)
      : base.percentDecimalPlaces;

  return {
    kind,
    progressBarMode,
    percentDecimalPlaces,
    centerDisplay: pick(raw?.centerDisplay, CENTER, base.centerDisplay),
    cellShape: pick(raw?.cellShape, ['circle', 'heart'], base.cellShape),
    ...parseSurface(raw, base),
  };
}

function parseHoliday(raw: Partial<WidgetHolidayAppearance> | undefined): WidgetHolidayAppearance {
  const base = DEFAULT_WIDGET_HOLIDAY;
  return {
    mode: pick(raw?.mode, ['nearest', 'pinned'], base.mode),
    pinnedHolidayId: typeof raw?.pinnedHolidayId === 'string' ? raw.pinnedHolidayId : null,
    ...parseSurface(raw, base),
  };
}

function parseStats(raw: Partial<WidgetStatsAppearance> | undefined): WidgetStatsAppearance {
  const base = DEFAULT_WIDGET_STATS;
  return {
    mode: pick(raw?.mode, STAT_MODES, base.mode),
    ...parseSurface(raw, base),
  };
}

export function parseWidgetStudioSettings(raw: string | null): WidgetStudioSettings {
  if (!raw) {
    return {
      ...DEFAULT_WIDGET_STUDIO,
      timer: { ...DEFAULT_WIDGET_TIMER },
      holiday: { ...DEFAULT_WIDGET_HOLIDAY },
      stats: { ...DEFAULT_WIDGET_STATS },
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WidgetStudioSettings>;
    return {
      family: pick(parsed.family, FAMILIES, DEFAULT_WIDGET_STUDIO.family),
      previewSize: pick(parsed.previewSize, SIZES, DEFAULT_WIDGET_STUDIO.previewSize),
      timer: parseTimer(parsed.timer),
      holiday: parseHoliday(parsed.holiday),
      stats: parseStats(parsed.stats),
    };
  } catch {
    return {
      ...DEFAULT_WIDGET_STUDIO,
      timer: { ...DEFAULT_WIDGET_TIMER },
      holiday: { ...DEFAULT_WIDGET_HOLIDAY },
      stats: { ...DEFAULT_WIDGET_STATS },
    };
  }
}

export function serializeWidgetStudioSettings(settings: WidgetStudioSettings): string {
  return JSON.stringify(settings);
}

export function widgetBackgroundUris(settings: WidgetStudioSettings): string[] {
  return [
    settings.timer.backgroundImageUri,
    settings.holiday.backgroundImageUri,
    settings.stats.backgroundImageUri,
  ].filter((uri): uri is string => Boolean(uri));
}

export function resolveWidgetHoliday(
  holidays: DisplayHoliday[],
  appearance: WidgetHolidayAppearance,
  now: Date = new Date(),
): DisplayHoliday | null {
  const upcoming = holidays
    .filter((holiday) => startOfDay(holiday.date) >= startOfDay(now))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (appearance.mode === 'pinned' && appearance.pinnedHolidayId) {
    const pinned = holidays.find((holiday) => holiday.id === appearance.pinnedHolidayId);
    if (pinned) {
      return pinned;
    }
  }

  return upcoming[0] ?? holidays[0] ?? null;
}

export function previewFrameSize(size: WidgetPreviewSize): { width: number; height: number } {
  if (size === 'wide') {
    return { width: 320, height: 168 };
  }
  if (size === 'tall') {
    return { width: 176, height: 300 };
  }
  return { width: 176, height: 176 };
}

export type WidgetHex = `#${string}`;
export type WidgetColor = WidgetHex | `rgba(${number}, ${number}, ${number}, ${number})`;

export interface NativeWidgetColors {
  background: WidgetColor;
  text: WidgetColor;
  muted: WidgetColor;
  accent: WidgetColor;
  overlayFill: WidgetColor;
  overlayBorder: WidgetColor;
  overlayMuted: WidgetColor;
}

function asWidgetColor(value: string, fallback: WidgetHex): WidgetColor {
  if (value.startsWith('#') && value.length >= 7) {
    return value.slice(0, 7) as WidgetHex;
  }
  const rgba = /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/.exec(value);
  if (rgba) {
    return `rgba(${Number(rgba[1])}, ${Number(rgba[2])}, ${Number(rgba[3])}, ${Number(rgba[4])})`;
  }
  return fallback;
}

export function nativeThemeColors(themeId: string | null | undefined): NativeWidgetColors {
  const colors = getColorTheme(themeId).colors;
  return {
    background: asWidgetColor(colors.background.start, '#FCF7DF'),
    text: asWidgetColor(colors.text.primary, '#3E3630'),
    muted: asWidgetColor(colors.text.secondary, '#A79A8A'),
    accent: asWidgetColor(colors.text.accent, '#E53935'),
    overlayFill: asWidgetColor(colors.overlay.fill, '#FFFFFF'),
    overlayBorder: asWidgetColor(colors.overlay.border, '#A79A8A'),
    overlayMuted: asWidgetColor(colors.overlay.muted, '#A79A8A'),
  };
}

