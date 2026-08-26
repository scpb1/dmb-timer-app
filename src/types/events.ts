export const EVENT_NAME_MAX_LENGTH = 50;

export type EventDateFormat = 'ddd' | 'dpp' | 'date';

export interface EventOverride {
  name?: string;
  dateFormat?: EventDateFormat;
  dddValue?: number;
  dppValue?: number;
  dateValue?: string;
}

export interface CustomEventRecord {
  id: string;
  name: string;
  dateFormat: EventDateFormat;
  dddValue?: number;
  dppValue?: number;
  dateValue?: string;
}

export interface EventsStorage {
  deletedIds: string[];
  overrides: Record<string, EventOverride>;
  customEvents: CustomEventRecord[];
}

export interface DisplayEvent {
  id: string;
  name: string;
  date: Date;
  dateFormat: EventDateFormat;
  dddValue?: number;
  dppValue?: number;
  dateValue?: string;
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
