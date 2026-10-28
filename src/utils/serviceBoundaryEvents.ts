import {
  PREDEFINED_EVENT_IDS,
  type DisplayEvent,
  type ServiceBoundaryDisplayMode,
} from '@/types/events';

export const ENLISTMENT_ACCENT = '#BB322E';
export const DEMOBILIZATION_ACCENT = '#3D7A44';
export const BOUNDARY_GLYPH_ON_FILL = '#FFFFFF';

export function isServiceBoundaryEvent(eventId: string): boolean {
  return (
    eventId === PREDEFINED_EVENT_IDS.ENLISTMENT ||
    eventId === PREDEFINED_EVENT_IDS.DEMOBILIZATION
  );
}

export function serviceBoundaryDisplayMode(
  event: Pick<DisplayEvent, 'boundaryDisplay'>,
): ServiceBoundaryDisplayMode {
  return event.boundaryDisplay === 'icon' ? 'icon' : 'row';
}

export function serviceBoundaryDefaultAccent(eventId: string): string {
  return eventId === PREDEFINED_EVENT_IDS.ENLISTMENT ? ENLISTMENT_ACCENT : DEMOBILIZATION_ACCENT;
}

export type ServiceBoundaryColorSource = Pick<
  DisplayEvent,
  'id' | 'iconColor' | 'boundaryIconThemeDefault'
>;

/** Активный цвет призыва / дембеля: пресет, свой hex или «как в теме» после сброса. */
export function resolveServiceBoundaryColor(
  event: ServiceBoundaryColorSource,
): string | undefined {
  if (!isServiceBoundaryEvent(event.id)) {
    return undefined;
  }
  if (event.boundaryIconThemeDefault) {
    return undefined;
  }
  if (event.iconColor) {
    return event.iconColor;
  }
  return serviceBoundaryDefaultAccent(event.id);
}

/** Значение для поля цвета в форме (пресет уже подставлен в hex). */
export function resolveServiceBoundaryFormColor(
  event: ServiceBoundaryColorSource,
): string | undefined {
  return resolveServiceBoundaryColor(event);
}

export interface ServiceBoundaryCardStyle {
  rowAccent: string | null;
  badgeFill: string | undefined;
  glyphOnFill: boolean;
  glyphColor?: string;
}

/** Стиль карточки: строка — заливка; «по умолчанию» — цвет иконки. */
export function resolveServiceBoundaryCardStyle(
  event: Pick<DisplayEvent, 'id' | 'iconColor' | 'boundaryDisplay' | 'boundaryIconThemeDefault'>,
): ServiceBoundaryCardStyle | null {
  if (!isServiceBoundaryEvent(event.id)) {
    return null;
  }

  const mode = serviceBoundaryDisplayMode(event);
  const color = resolveServiceBoundaryColor(event);

  if (mode === 'row') {
    if (!color) {
      return {
        rowAccent: null,
        badgeFill: undefined,
        glyphOnFill: false,
      };
    }
    return {
      rowAccent: color,
      badgeFill: color,
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
