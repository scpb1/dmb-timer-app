export const HOLIDAY_NAME_MAX_LENGTH = 50;

export interface HolidayOverride {
  name?: string;
  month?: number;
  day?: number;
  icon?: string;
}

export interface CustomHolidayRecord {
  id: string;
  name: string;
  month: number;
  day: number;
  icon?: string;
}

export interface HolidaysStorage {
  deletedIds: string[];
  overrides: Record<string, HolidayOverride>;
  customHolidays: CustomHolidayRecord[];
}

export interface DisplayHoliday {
  id: string;
  name: string;
  month: number;
  day: number;
  date: Date;
  icon?: string;
  isCustom: boolean;
  isPast: boolean;
}

export const DEFAULT_HOLIDAYS_STORAGE: HolidaysStorage = {
  deletedIds: [],
  overrides: {},
  customHolidays: [],
};

export const PREDEFINED_HOLIDAY_IDS = {
  NEW_YEAR: 'predefined-holiday-new-year',
  VALENTINE: 'predefined-holiday-valentine',
  DEFENDER_DAY: 'predefined-holiday-defender-day',
  SPRING: 'predefined-holiday-spring',
  WOMENS_DAY: 'predefined-holiday-womens-day',
  VICTORY_DAY: 'predefined-holiday-victory-day',
  SUMMER: 'predefined-holiday-summer',
  FAMILY_DAY: 'predefined-holiday-family-day',
  AUTUMN: 'predefined-holiday-autumn',
  WINTER: 'predefined-holiday-winter',
} as const;

/** Винительный падеж для темы письма: «Как я встречала зиму 2026». */
export const SEASON_HOLIDAY_ACCUSATIVE: Record<string, string> = {
  [PREDEFINED_HOLIDAY_IDS.SPRING]: 'весну',
  [PREDEFINED_HOLIDAY_IDS.SUMMER]: 'лето',
  [PREDEFINED_HOLIDAY_IDS.AUTUMN]: 'осень',
  [PREDEFINED_HOLIDAY_IDS.WINTER]: 'зиму',
};

/** Старые пресеты: темы уже написанных писем по id всё ещё резолвятся. */
export const LEGACY_HOLIDAY_NAMES: Record<string, string> = {
  'predefined-holiday-christmas': 'Рождество',
  'predefined-holiday-old-new-year': 'Старый Новый год',
  'predefined-holiday-epiphany': 'Крещение',
  'predefined-holiday-knowledge-day': '1 сентября',
};

export interface PredefinedHolidayTemplate {
  id: string;
  defaultName: string;
  month: number;
  day: number;
  defaultIcon: string;
  iconSize?: number;
}

export const PREDEFINED_HOLIDAYS: PredefinedHolidayTemplate[] = [
  {
    id: PREDEFINED_HOLIDAY_IDS.NEW_YEAR,
    defaultName: 'Новый год',
    month: 1,
    day: 1,
    defaultIcon: 'pine-tree',
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.VALENTINE,
    defaultName: 'День святого Валентина',
    month: 2,
    day: 14,
    defaultIcon: 'emoticon-kiss-outline',
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.DEFENDER_DAY,
    defaultName: '23 февраля',
    month: 2,
    day: 23,
    defaultIcon: 'shield-star',
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.SPRING,
    defaultName: 'Весна',
    month: 3,
    day: 1,
    defaultIcon: 'sprout',
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.WOMENS_DAY,
    defaultName: '8 марта',
    month: 3,
    day: 8,
    defaultIcon: 'flower-tulip',
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.VICTORY_DAY,
    defaultName: 'День Победы',
    month: 5,
    day: 9,
    defaultIcon: 'medal',
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.SUMMER,
    defaultName: 'Лето',
    month: 6,
    day: 1,
    defaultIcon: 'weather-sunny',
    iconSize: 34,
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.FAMILY_DAY,
    defaultName: 'День семьи, любви и верности',
    month: 7,
    day: 8,
    defaultIcon: 'ring',
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.AUTUMN,
    defaultName: 'Осень',
    month: 9,
    day: 1,
    defaultIcon: 'leaf',
  },
  {
    id: PREDEFINED_HOLIDAY_IDS.WINTER,
    defaultName: 'Зима',
    month: 12,
    day: 1,
    defaultIcon: 'snowflake',
  },
];

export const HOLIDAY_THEME_ID_PREFIX = 'holiday:';
