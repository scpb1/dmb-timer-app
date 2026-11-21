import {
  PREDEFINED_EVENT_IDS,
  type DisplayEvent,
  type ServiceBoundaryDisplayMode,
} from '@/types/events';
import {
  resolveAccentCardStyle,
  resolveCustomEventCardStyle,
  type AccentCardStyle,
} from '@/utils/cardHighlight';

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

export type ServiceBoundaryCardStyle = AccentCardStyle;

/** Стиль карточки: строка — заливка; «только иконка» — цвет глифа. */
export function resolveServiceBoundaryCardStyle(
  event: Pick<DisplayEvent, 'id' | 'iconColor' | 'boundaryDisplay' | 'boundaryIconThemeDefault'>,
  defaultIconColor?: string,
): ServiceBoundaryCardStyle | null {
  if (!isServiceBoundaryEvent(event.id)) {
    return null;
  }

  return resolveAccentCardStyle(
    serviceBoundaryDisplayMode(event),
    resolveServiceBoundaryColor(event),
    defaultIconColor,
  );
}

/** Стиль карточки любого события: призыв/дембель или пользовательское/пресет. */
export function resolveEventCardStyle(
  event: Pick<
    DisplayEvent,
    'id' | 'iconColor' | 'highlightMode' | 'boundaryDisplay' | 'boundaryIconThemeDefault'
  >,
  defaultIconColor?: string,
): ServiceBoundaryCardStyle | null {
  if (isServiceBoundaryEvent(event.id)) {
    return resolveServiceBoundaryCardStyle(event, defaultIconColor);
  }
  return resolveCustomEventCardStyle(event, defaultIconColor);
}
