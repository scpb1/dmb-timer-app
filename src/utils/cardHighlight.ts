import type { CardHighlightMode, DisplayEvent } from '@/types/events';
import type { DisplayHoliday } from '@/types/holidays';

export interface AccentCardStyle {
  rowAccent: string | null;
  badgeFill: string | undefined;
  glyphOnFill: boolean;
  glyphColor?: string;
}

export const CARD_HIGHLIGHT_MODE_OPTIONS: { value: CardHighlightMode; label: string }[] = [
  { value: 'row', label: 'Выделение строки' },
  { value: 'icon', label: 'Только иконка' },
];

export function resolveAccentCardStyle(
  mode: CardHighlightMode,
  color: string | undefined,
  defaultIconColor?: string,
): AccentCardStyle {
  if (mode === 'row') {
    const fill = color ?? defaultIconColor;
    if (!fill) {
      return {
        rowAccent: null,
        badgeFill: undefined,
        glyphOnFill: false,
      };
    }
    return {
      rowAccent: fill,
      badgeFill: fill,
      glyphOnFill: true,
    };
  }

  if (!color) {
    return {
      rowAccent: null,
      badgeFill: undefined,
      glyphOnFill: false,
    };
  }

  return {
    rowAccent: null,
    badgeFill: undefined,
    glyphOnFill: false,
    glyphColor: color,
  };
}

export function holidayHighlightMode(
  holiday: Pick<DisplayHoliday, 'highlightMode'>,
): CardHighlightMode {
  return holiday.highlightMode === 'row' ? 'row' : 'icon';
}

export function eventHighlightMode(
  event: Pick<DisplayEvent, 'highlightMode'>,
): CardHighlightMode {
  return event.highlightMode === 'row' ? 'row' : 'icon';
}

export function resolveCustomEventCardStyle(
  event: Pick<DisplayEvent, 'iconColor' | 'highlightMode'>,
  defaultIconColor?: string,
): AccentCardStyle {
  return resolveAccentCardStyle(eventHighlightMode(event), event.iconColor, defaultIconColor);
}

export function resolveHolidayCardStyle(
  holiday: Pick<DisplayHoliday, 'iconColor' | 'highlightMode'>,
  defaultIconColor?: string,
): AccentCardStyle {
  return resolveAccentCardStyle(holidayHighlightMode(holiday), holiday.iconColor, defaultIconColor);
}
