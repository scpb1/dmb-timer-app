export const EVENT_NAME_MAX_LENGTH = 50;

export type EventDateFormat = 'ddd' | 'dpp' | 'date';

/** Призыв / дембель: заливка всей строки или только плашки иконки. */
export type ServiceBoundaryDisplayMode = 'row' | 'icon';

export interface EventOverride {
  name?: string;
  dateFormat?: EventDateFormat;
  dddValue?: number;
  dppValue?: number;
  dateValue?: string;
  icon?: string;
  iconColor?: string;
  boundaryDisplay?: ServiceBoundaryDisplayMode;
  /** Сброс заливки на цвет иконки из темы (крестик в форме). */
  boundaryIconThemeDefault?: boolean;
}

export interface CustomEventRecord {
  id: string;
  name: string;
  dateFormat: EventDateFormat;
  dddValue?: number;
  dppValue?: number;
  dateValue?: string;
  icon?: string;
  iconColor?: string;
}

export interface EventsStorage {
  deletedIds: string[];
  overrides: Record<string, EventOverride>;
  customEvents: CustomEventRecord[];
  /** Id пресетов для армейского чеклиста; при отсутствии — все шаблоны на текущем сроке */
  defaultListEventIds?: string[];
}

export interface DisplayEvent {
  id: string;
  name: string;
  date: Date;
  dateFormat: EventDateFormat;
  dddValue?: number;
  dppValue?: number;
  dateValue?: string;
  icon?: string;
  iconColor?: string;
  boundaryDisplay?: ServiceBoundaryDisplayMode;
  boundaryIconThemeDefault?: boolean;
  isCustom: boolean;
  isPast: boolean;
}

export const DEFAULT_EVENTS_STORAGE: EventsStorage = {
  deletedIds: [],
  overrides: {},
  customEvents: [],
};

export const PREDEFINED_EVENT_IDS = {
  ENLISTMENT: 'predefined-enlistment',
  EQUATOR: 'predefined-equator',
  QUARTER_PASSED: 'predefined-quarter-passed',
  QUARTER_REMAINING: 'predefined-quarter-remaining',
  THIRD_PASSED: 'predefined-third-passed',
  THIRD_REMAINING: 'predefined-third-remaining',
  TRAFFIC_RED: 'predefined-traffic-red',
  TRAFFIC_YELLOW: 'predefined-traffic-yellow',
  TRAFFIC_GREEN: 'predefined-traffic-green',
  DEMOBILIZATION: 'predefined-demobilization',
} as const;

export function monthEventId(index: number): string {
  return `predefined-month-${index}`;
}

export function dddMilestoneEventId(daysLeft: number): string {
  return `predefined-ddd-${daysLeft}`;
}

export function dppMilestoneEventId(daysPassed: number): string {
  return `predefined-dpp-${daysPassed}`;
}

export function parseMonthEventIndex(id: string): number | null {
  const match = /^predefined-month-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

export function parseDddMilestoneValue(id: string): number | null {
  const match = /^predefined-ddd-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

export function parseDppMilestoneValue(id: string): number | null {
  const match = /^predefined-dpp-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}
