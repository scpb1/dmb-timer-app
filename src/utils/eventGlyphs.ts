import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  parseDddMilestoneValue,
  parseDppMilestoneValue,
  parseMonthEventIndex,
  PREDEFINED_EVENT_IDS,
  type DisplayEvent,
} from '@/types/events';
import { PREDEFINED_HOLIDAY_IDS, type DisplayHoliday } from '@/types/holidays';

export type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type EventGlyph =
  | { type: 'icon'; name: MaterialIconName; color?: string }
  | { type: 'label'; text: string; color?: string };

const HOLIDAY_ICONS: Record<string, MaterialIconName> = {
  [PREDEFINED_HOLIDAY_IDS.NEW_YEAR]: 'pine-tree',
  [PREDEFINED_HOLIDAY_IDS.CHRISTMAS]: 'star-four-points',
  [PREDEFINED_HOLIDAY_IDS.OLD_NEW_YEAR]: 'snowflake',
  [PREDEFINED_HOLIDAY_IDS.EPIPHANY]: 'waves',
  [PREDEFINED_HOLIDAY_IDS.VALENTINE]: 'heart-outline',
  [PREDEFINED_HOLIDAY_IDS.DEFENDER_DAY]: 'shield-outline',
  [PREDEFINED_HOLIDAY_IDS.WOMENS_DAY]: 'flower-tulip',
  [PREDEFINED_HOLIDAY_IDS.VICTORY_DAY]: 'medal',
  [PREDEFINED_HOLIDAY_IDS.FAMILY_DAY]: 'ring',
  [PREDEFINED_HOLIDAY_IDS.KNOWLEDGE_DAY]: 'school',
};

export function getEventGlyph(event: DisplayEvent): EventGlyph {
  switch (event.id) {
    case PREDEFINED_EVENT_IDS.ENLISTMENT:
      return { type: 'icon', name: 'flag-outline' };
    case PREDEFINED_EVENT_IDS.EQUATOR:
      return { type: 'icon', name: 'circle-half-full' };
    case PREDEFINED_EVENT_IDS.QUARTER_PASSED:
      return { type: 'label', text: '1/4' };
    case PREDEFINED_EVENT_IDS.QUARTER_REMAINING:
      return { type: 'label', text: '1/4' };
    case PREDEFINED_EVENT_IDS.THIRD_PASSED:
      return { type: 'label', text: '1/3' };
    case PREDEFINED_EVENT_IDS.THIRD_REMAINING:
      return { type: 'label', text: '1/3' };
    case PREDEFINED_EVENT_IDS.TRAFFIC_RED:
      return { type: 'icon', name: 'circle', color: '#C44536' };
    case PREDEFINED_EVENT_IDS.TRAFFIC_YELLOW:
      return { type: 'icon', name: 'circle', color: '#E0A106' };
    case PREDEFINED_EVENT_IDS.TRAFFIC_GREEN:
      return { type: 'icon', name: 'circle', color: '#4C8C4A' };
    case PREDEFINED_EVENT_IDS.DEMOBILIZATION:
      return { type: 'icon', name: 'home-outline' };
    default:
      break;
  }

  const monthIndex = parseMonthEventIndex(event.id);
  if (monthIndex !== null) {
    const withinYear = ((monthIndex - 1) % 12) + 1;
    return { type: 'label', text: `${withinYear}/12` };
  }

  const dppValue = parseDppMilestoneValue(event.id);
  if (dppValue !== null) {
    return { type: 'label', text: String(dppValue) };
  }

  const dddValue = parseDddMilestoneValue(event.id);
  if (dddValue !== null) {
    return { type: 'label', text: String(dddValue) };
  }

  return { type: 'icon', name: 'calendar-outline' };
}

export function getHolidayGlyph(holiday: DisplayHoliday): EventGlyph {
  const iconName = HOLIDAY_ICONS[holiday.id];
  if (iconName) {
    return { type: 'icon', name: iconName };
  }

  return { type: 'icon', name: 'star-outline' };
}
