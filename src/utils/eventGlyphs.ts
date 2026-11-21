import type { ComponentProps } from 'react';
import {
  Entypo,
  Feather,
  FontAwesome,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';

import {
  parseDddMilestoneValue,
  parseDppMilestoneValue,
  parseMonthEventIndex,
  PREDEFINED_EVENT_IDS,
  type DisplayEvent,
} from '@/types/events';
import {
  isServiceBoundaryEvent,
  resolveServiceBoundaryColor,
  resolveServiceBoundaryFormColor,
  serviceBoundaryDisplayMode,
} from '@/utils/serviceBoundaryEvents';
import { PREDEFINED_HOLIDAYS, type DisplayHoliday } from '@/types/holidays';
import { eventHighlightMode, holidayHighlightMode } from '@/utils/cardHighlight';

export type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type FeatherIconName = ComponentProps<typeof Feather>['name'];
export type FontAwesomeIconName = ComponentProps<typeof FontAwesome>['name'];
export type FontAwesome6IconName = ComponentProps<typeof FontAwesome6>['name'];
export type MaterialIconsName = ComponentProps<typeof MaterialIcons>['name'];
export type EntypoIconName = ComponentProps<typeof Entypo>['name'];

export const SPLIT_STAR_ICON_ID = 'split-star';

export type CatalogIconSet =
  | 'material'
  | 'feather'
  | 'fontawesome'
  | 'fontawesome6'
  | 'materialIcons'
  | 'entypo'
  | 'custom';

export type CatalogIconName =
  | MaterialIconName
  | typeof SPLIT_STAR_ICON_ID
  | 'heart-o'
  | 'person-military-rifle'
  | 'gun'
  | 'military-tech'
  | 'mail'
  | 'sun'
  | 'moon';

export type EventGlyph =
  | {
      type: 'icon';
      name: string;
      color?: string;
      set?: Exclude<CatalogIconSet, 'custom'>;
      size?: number;
      scale?: number;
    }
  | { type: 'custom'; id: typeof SPLIT_STAR_ICON_ID; color?: string; size?: number }
  | { type: 'label'; text: string; color?: string };

export interface EventIconOption {
  name: CatalogIconName;
  label: string;
  set?: CatalogIconSet;
  glyph?: string;
  scale?: number;
}

export const DEFAULT_EVENT_ICON: CatalogIconName = SPLIT_STAR_ICON_ID;
export const DEFAULT_HOLIDAY_ICON: CatalogIconName = 'star-outline';
export const MILESTONE_ICON: CatalogIconName = SPLIT_STAR_ICON_ID;

/**
 * Каталог иконок для событий и праздников.
 * Содержит прежние глифы карточек и набор для дней рождения, годовщин, встреч и ожидания.
 */
export const EVENT_ICON_CATALOG: EventIconOption[] = [
  { name: 'star', label: 'Звезда' },
  { name: 'star-outline', label: 'Звезда контур' },
  { name: SPLIT_STAR_ICON_ID, label: 'Звезда штамп' },
  { name: 'gun', label: 'Оружие', set: 'fontawesome6', scale: 0.7 },
  { name: 'person-military-rifle', label: 'Солдат', set: 'fontawesome6' },
  { name: 'tank', label: 'Танк' },
  { name: 'shield-outline', label: 'Щит' },
  { name: 'shield-star', label: 'Щит со звездой' },
  { name: 'military-tech', label: 'Медаль', set: 'materialIcons' },
  { name: 'trophy', label: 'Кубок' },
  { name: 'flag-variant', label: 'Флаг' },
  { name: 'home-outline', label: 'Дом' },
  { name: 'calendar-outline', label: 'Календарь' },
  { name: 'heart', label: 'Сердце', set: 'fontawesome', scale: 0.78 },
  { name: 'heart-o', label: 'Сердце контур', set: 'fontawesome', scale: 0.78 },
  { name: 'hand-heart', label: 'Рука и сердце' },
  { name: 'account-heart', label: 'Человек и сердце' },
  { name: 'ring', label: 'Кольцо' },
  { name: 'emoticon-kiss-outline', label: 'Поцелуй' },
  { name: 'calendar-heart', label: 'Календарь с сердцем' },
  { name: 'cake-variant', label: 'Торт' },
  { name: 'gift-outline', label: 'Подарок' },
  { name: 'balloon', label: 'Шарик' },
  { name: 'crown', label: 'Корона' },
  { name: 'candle', label: 'Свеча' },
  { name: 'pine-tree', label: 'Ёлка' },
  { name: 'airplane', label: 'Самолёт' },
  { name: 'train', label: 'Поезд' },
  { name: 'car', label: 'Машина' },
  { name: 'phone-outline', label: 'Телефон' },
  { name: 'email-outline', label: 'Письмо' },
  { name: 'mail', label: 'Конверт', set: 'entypo' },
  { name: 'map-marker-outline', label: 'Метка' },
  { name: 'camera-outline', label: 'Камера' },
  { name: 'music-note', label: 'Музыка' },
  { name: 'book-open-outline', label: 'Книга' },
  { name: 'school', label: 'Школа' },
  { name: 'briefcase-outline', label: 'Портфель' },
  { name: 'coffee', label: 'Кофе' },
  { name: 'infinity', label: 'Бесконечность' },
  { name: 'circle', label: 'Круг' },
  { name: 'circle-half-full', label: 'Половина' },
  { name: 'fire', label: 'Огонь' },
  { name: 'sun', label: 'Солнце', set: 'feather' },
  { name: 'moon', label: 'Луна', set: 'entypo' },
  { name: 'snowflake', label: 'Снежинка' },
  { name: 'flower-tulip', label: 'Тюльпан' },
  { name: 'flower', label: 'Цветок' },
  { name: 'sprout', label: 'Росток' },
  { name: 'leaf', label: 'Лист' },
  { name: 'butterfly', label: 'Бабочка' },
  { name: 'waves', label: 'Волны' },
  { name: 'paw', label: 'Лапка' },
  { name: 'baby-face-outline', label: 'Малыш' },
];

const CATALOG_BY_NAME = new Map(EVENT_ICON_CATALOG.map((item) => [item.name, item]));
const CATALOG_NAMES = new Set<string>(CATALOG_BY_NAME.keys());

const LEGACY_ICON_ALIASES: Record<string, CatalogIconName> = {
  'auto-fix': SPLIT_STAR_ICON_ID,
  'star-four-points': SPLIT_STAR_ICON_ID,
  'heart-multiple': SPLIT_STAR_ICON_ID,
  'weather-night': SPLIT_STAR_ICON_ID,
  'weather-sunny': 'sun',
  'heart-outline': 'heart-o',
  medal: 'military-tech',
  'moon-waning-crescent': 'moon',
  'home-heart': 'gun',
};

export function normalizeStoredIconName(name: string | undefined): CatalogIconName | undefined {
  if (typeof name !== 'string') {
    return undefined;
  }
  if (CATALOG_NAMES.has(name)) {
    return name as CatalogIconName;
  }
  return LEGACY_ICON_ALIASES[name];
}

export function migrateStoredIconName(icon: string | undefined): string | undefined {
  if (typeof icon !== 'string') {
    return icon;
  }
  return normalizeStoredIconName(icon) ?? icon;
}

export function isCatalogIcon(name: string | undefined): name is CatalogIconName {
  return normalizeStoredIconName(name) !== undefined;
}

export function resolveCatalogIcon(
  name: string | undefined,
  fallback: CatalogIconName,
): CatalogIconName {
  return normalizeStoredIconName(name) ?? fallback;
}

function applyIconColor(glyph: EventGlyph, iconColor?: string): EventGlyph {
  if (!iconColor) {
    return glyph;
  }
  return { ...glyph, color: iconColor };
}

function catalogIconToGlyph(name: CatalogIconName, color?: string): EventGlyph {
  if (name === SPLIT_STAR_ICON_ID) {
    return { type: 'custom', id: SPLIT_STAR_ICON_ID, color };
  }
  const option = CATALOG_BY_NAME.get(name);
  const glyphName = option?.glyph ?? name;
  const set = option?.set;
  const glyph: EventGlyph =
    set && set !== 'material' && set !== 'custom'
      ? { type: 'icon', name: glyphName, set, color }
      : { type: 'icon', name: glyphName, color };
  if (glyph.type === 'icon' && option?.scale) {
    return { ...glyph, scale: option.scale };
  }
  return glyph;
}

export function getCatalogGlyph(name: CatalogIconName, color?: string): EventGlyph {
  return catalogIconToGlyph(name, color);
}

function automaticEventGlyph(event: DisplayEvent): EventGlyph {
  switch (event.id) {
    case PREDEFINED_EVENT_IDS.QUARTER_PASSED:
    case PREDEFINED_EVENT_IDS.EQUATOR:
    case PREDEFINED_EVENT_IDS.QUARTER_REMAINING:
    case PREDEFINED_EVENT_IDS.THIRD_PASSED:
    case PREDEFINED_EVENT_IDS.THIRD_REMAINING:
      return catalogIconToGlyph(MILESTONE_ICON);
    case PREDEFINED_EVENT_IDS.ENLISTMENT:
      return catalogIconToGlyph('flag-variant');
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
    return catalogIconToGlyph(MILESTONE_ICON);
  }

  if (parseDppMilestoneValue(event.id) !== null || parseDddMilestoneValue(event.id) !== null) {
    return catalogIconToGlyph(MILESTONE_ICON);
  }

  return event.isCustom
    ? catalogIconToGlyph(DEFAULT_EVENT_ICON)
    : { type: 'icon', name: 'calendar-outline' };
}

/** Глиф по умолчанию, без пользовательской иконки. Нужен для пункта «Авто» в форме. */
export function getAutomaticEventGlyph(event: DisplayEvent): EventGlyph {
  return automaticEventGlyph(event);
}

/** Начальные icon/iconColor для формы события (в т.ч. светофор: круг + цвет). */
export function getEventFormIconDefaults(event: DisplayEvent): {
  icon?: string;
  iconColor?: string;
} {
  if (event.isCustom) {
    return {
      icon: normalizeStoredIconName(event.icon) ?? DEFAULT_EVENT_ICON,
      iconColor: event.iconColor,
    };
  }

  const storedIcon = normalizeStoredIconName(event.icon);
  if (storedIcon) {
    return { icon: storedIcon, iconColor: event.iconColor };
  }

  if (event.id === PREDEFINED_EVENT_IDS.ENLISTMENT) {
    return {
      icon: 'flag-variant',
      iconColor: resolveServiceBoundaryFormColor(event),
    };
  }
  if (event.id === PREDEFINED_EVENT_IDS.DEMOBILIZATION) {
    return {
      icon: 'home-outline',
      iconColor: resolveServiceBoundaryFormColor(event),
    };
  }

  const auto = automaticEventGlyph(event);
  if (auto.type === 'icon' && auto.set === 'feather') {
    return { icon: undefined, iconColor: auto.color ?? event.iconColor };
  }
  if (auto.type === 'icon') {
    return { icon: auto.name, iconColor: auto.color ?? event.iconColor };
  }
  if (auto.type === 'custom') {
    return { icon: auto.id, iconColor: auto.color ?? event.iconColor };
  }

  return { icon: undefined, iconColor: event.iconColor };
}

/** Ячейка «иконка по умолчанию» — только если автоглиф нельзя выбрать из каталога (Feather). */
export function eventFormUsesAutoIconOption(event: DisplayEvent): boolean {
  if (event.isCustom) {
    return false;
  }
  const auto = automaticEventGlyph(event);
  return auto.type === 'icon' && auto.set === 'feather';
}

/** Начальная иконка для формы праздника из пресета или сохранённого значения. */
export function getHolidayFormIconDefaults(holiday: DisplayHoliday): {
  icon?: string;
  iconColor?: string;
} {
  if (holiday.isCustom) {
    return {
      icon: normalizeStoredIconName(holiday.icon) ?? DEFAULT_HOLIDAY_ICON,
      iconColor: holiday.iconColor,
    };
  }

  const storedIcon = normalizeStoredIconName(holiday.icon);
  if (storedIcon) {
    return { icon: storedIcon, iconColor: holiday.iconColor };
  }

  const auto = getAutomaticHolidayGlyph(holiday);
  if (auto.type === 'custom') {
    return { icon: SPLIT_STAR_ICON_ID, iconColor: holiday.iconColor };
  }
  if (auto.type === 'label') {
    return { icon: undefined, iconColor: holiday.iconColor };
  }
  return { icon: auto.name, iconColor: holiday.iconColor };
}

export function getEventGlyph(event: DisplayEvent): EventGlyph {
  const normalizedIcon = normalizeStoredIconName(event.icon);
  let strokeColor = event.iconColor;
  if (isServiceBoundaryEvent(event.id)) {
    strokeColor =
      serviceBoundaryDisplayMode(event) === 'icon'
        ? resolveServiceBoundaryColor(event)
        : undefined;
  } else if (eventHighlightMode(event) === 'row') {
    strokeColor = undefined;
  }

  if (normalizedIcon) {
    return catalogIconToGlyph(normalizedIcon, strokeColor);
  }

  return applyIconColor(automaticEventGlyph(event), strokeColor);
}

export function getAutomaticHolidayGlyph(holiday: DisplayHoliday): EventGlyph {
  const template = PREDEFINED_HOLIDAYS.find((item) => item.id === holiday.id);
  const glyph = catalogIconToGlyph(
    resolveCatalogIcon(template?.defaultIcon, DEFAULT_HOLIDAY_ICON),
  );
  if (template?.iconSize && glyph.type === 'icon') {
    return { ...glyph, size: template.iconSize };
  }
  return glyph;
}

export function getHolidayGlyph(holiday: DisplayHoliday): EventGlyph {
  const strokeColor = holidayHighlightMode(holiday) === 'icon' ? holiday.iconColor : undefined;
  const normalizedIcon = normalizeStoredIconName(holiday.icon);
  if (normalizedIcon) {
    return catalogIconToGlyph(normalizedIcon, strokeColor);
  }

  return applyIconColor(getAutomaticHolidayGlyph(holiday), strokeColor);
}
