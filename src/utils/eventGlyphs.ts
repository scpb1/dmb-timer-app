import type { ComponentProps } from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  parseDddMilestoneValue,
  parseDppMilestoneValue,
  parseMonthEventIndex,
  PREDEFINED_EVENT_IDS,
  type DisplayEvent,
} from '@/types/events';
import { PREDEFINED_HOLIDAYS, type DisplayHoliday } from '@/types/holidays';

export type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type EventGlyph =
  | { type: 'icon'; name: MaterialIconName; color?: string; set?: 'material'; size?: number }
  | { type: 'icon'; name: FeatherIconName; color?: string; set: 'feather'; size?: number }
  | { type: 'label'; text: string; color?: string };

export interface EventIconOption {
  name: MaterialIconName;
  label: string;
}

export const DEFAULT_EVENT_ICON: MaterialIconName = 'star';
export const DEFAULT_HOLIDAY_ICON: MaterialIconName = 'star-outline';
export const MILESTONE_ICON: MaterialIconName = 'star';

/**
 * Каталог иконок для событий и праздников.
 * Содержит прежние глифы карточек и набор для дней рождения, годовщин, встреч и ожидания.
 */
export const EVENT_ICON_CATALOG: EventIconOption[] = [
  { name: 'star', label: 'Звезда' },
  { name: 'star-outline', label: 'Звезда контур' },
  { name: 'star-four-points', label: 'Искра' },
  { name: 'auto-fix', label: 'Волшебство' },
  { name: 'heart', label: 'Сердце' },
  { name: 'heart-outline', label: 'Сердце контур' },
  { name: 'heart-multiple', label: 'Два сердца' },
  { name: 'hand-heart', label: 'Рука и сердце' },
  { name: 'account-heart', label: 'Человек и сердце' },
  { name: 'ring', label: 'Кольцо' },
  { name: 'emoticon-kiss-outline', label: 'Поцелуй' },
  { name: 'home-heart', label: 'Дом с сердцем' },
  { name: 'home-outline', label: 'Дом' },
  { name: 'flag-variant', label: 'Флаг' },
  { name: 'calendar-outline', label: 'Календарь' },
  { name: 'calendar-heart', label: 'Календарь с сердцем' },
  { name: 'pine-tree', label: 'Ёлка' },
  { name: 'snowflake', label: 'Снежинка' },
  { name: 'weather-sunny', label: 'Солнце' },
  { name: 'weather-night', label: 'Ночь' },
  { name: 'moon-waning-crescent', label: 'Луна' },
  { name: 'flower-tulip', label: 'Тюльпан' },
  { name: 'flower', label: 'Цветок' },
  { name: 'sprout', label: 'Росток' },
  { name: 'leaf', label: 'Лист' },
  { name: 'butterfly', label: 'Бабочка' },
  { name: 'waves', label: 'Волны' },
  { name: 'cake-variant', label: 'Торт' },
  { name: 'gift-outline', label: 'Подарок' },
  { name: 'balloon', label: 'Шарик' },
  { name: 'crown', label: 'Корона' },
  { name: 'candle', label: 'Свеча' },
  { name: 'shield-outline', label: 'Щит' },
  { name: 'shield-star', label: 'Щит со звездой' },
  { name: 'medal', label: 'Медаль' },
  { name: 'trophy', label: 'Кубок' },
  { name: 'school', label: 'Школа' },
  { name: 'briefcase-outline', label: 'Портфель' },
  { name: 'airplane', label: 'Самолёт' },
  { name: 'train', label: 'Поезд' },
  { name: 'car', label: 'Машина' },
  { name: 'map-marker-outline', label: 'Метка' },
  { name: 'phone-outline', label: 'Телефон' },
  { name: 'email-outline', label: 'Письмо' },
  { name: 'camera-outline', label: 'Камера' },
  { name: 'music-note', label: 'Музыка' },
  { name: 'book-open-outline', label: 'Книга' },
  { name: 'coffee', label: 'Кофе' },
  { name: 'paw', label: 'Лапка' },
  { name: 'baby-face-outline', label: 'Малыш' },
  { name: 'infinity', label: 'Бесконечность' },
  { name: 'circle', label: 'Круг' },
  { name: 'circle-half-full', label: 'Половина' },
  { name: 'fire', label: 'Огонь' },
];

const CATALOG_NAMES = new Set<string>(EVENT_ICON_CATALOG.map((item) => item.name));

export function isCatalogIcon(name: string | undefined): name is MaterialIconName {
  return typeof name === 'string' && CATALOG_NAMES.has(name);
}

export function resolveCatalogIcon(
  name: string | undefined,
  fallback: MaterialIconName,
): MaterialIconName {
  return isCatalogIcon(name) ? name : fallback;
}

function fractionGlyph(event: DisplayEvent): EventGlyph | null {
  switch (event.id) {
    case PREDEFINED_EVENT_IDS.QUARTER_PASSED:
      return { type: 'label', text: '1/4' };
    case PREDEFINED_EVENT_IDS.EQUATOR:
      return { type: 'label', text: '1/2' };
    case PREDEFINED_EVENT_IDS.QUARTER_REMAINING:
      return { type: 'label', text: '3/4' };
    case PREDEFINED_EVENT_IDS.THIRD_PASSED:
      return { type: 'label', text: '1/3' };
    case PREDEFINED_EVENT_IDS.THIRD_REMAINING:
      return { type: 'label', text: '2/3' };
    default:
      return null;
  }
}

function automaticEventGlyph(event: DisplayEvent): EventGlyph {
  const fraction = fractionGlyph(event);
  if (fraction) {
    return fraction;
  }

  switch (event.id) {
    case PREDEFINED_EVENT_IDS.ENLISTMENT:
      return { type: 'icon', name: 'flag', set: 'feather', size: 22 };
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

  if (parseMonthEventIndex(event.id) !== null) {
    return { type: 'icon', name: MILESTONE_ICON };
  }

  if (parseDppMilestoneValue(event.id) !== null || parseDddMilestoneValue(event.id) !== null) {
    return { type: 'icon', name: MILESTONE_ICON };
  }

  return { type: 'icon', name: event.isCustom ? DEFAULT_EVENT_ICON : 'calendar-outline' };
}

/** Глиф по умолчанию, без пользовательской иконки. Нужен для пункта «Авто» в форме. */
export function getAutomaticEventGlyph(event: DisplayEvent): EventGlyph {
  return automaticEventGlyph(event);
}

export function getEventGlyph(event: DisplayEvent): EventGlyph {
  if (isCatalogIcon(event.icon)) {
    return { type: 'icon', name: event.icon };
  }

  return automaticEventGlyph(event);
}

export function getAutomaticHolidayGlyph(holiday: DisplayHoliday): EventGlyph {
  const template = PREDEFINED_HOLIDAYS.find((item) => item.id === holiday.id);
  return {
    type: 'icon',
    name: resolveCatalogIcon(template?.defaultIcon, DEFAULT_HOLIDAY_ICON),
    size: template?.iconSize,
  };
}

export function getHolidayGlyph(holiday: DisplayHoliday): EventGlyph {
  if (isCatalogIcon(holiday.icon)) {
    return { type: 'icon', name: holiday.icon };
  }

  return getAutomaticHolidayGlyph(holiday);
}
